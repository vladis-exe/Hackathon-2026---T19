import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { FocusArea, StreamingMode } from "@/types/camera";

interface WebRTCPlayerProps {
    cameraId?: string;
    signalingUrl?: string;
    smartFocusEnabled?: boolean;
    streamingMode?: StreamingMode;
    focusArea?: FocusArea;
}

export function WebRTCPlayer({ cameraId, signalingUrl, streamingMode, focusArea }: WebRTCPlayerProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const vContextRef = useRef<HTMLVideoElement>(null);
    const vSourceRef = useRef<HTMLVideoElement>(null);
    const dataChannelRef = useRef<RTCDataChannel | null>(null);

    const [hasContext, setHasContext] = useState(false);
    const [hasSource, setHasSource] = useState(false);
    const [connectionState, setConnectionState] = useState<string>("init");
    const [iceState, setIceState] = useState<string>("new");

    useEffect(() => {
        if (!signalingUrl) return;

        let pc: RTCPeerConnection | null = null;
        let isActive = true;

        const startStream = async () => {
            try {
                console.log("[WebRTC] Creating PeerConnection...");
                pc = new RTCPeerConnection({
                    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
                    iceTransportPolicy: "all"
                });

                setConnectionState("negotiating");

                const dataChannel = pc.createDataChannel("commands");
                dataChannel.onopen = () => {
                    console.log("[WebRTC] DataChannel Open!");
                    dataChannelRef.current = dataChannel;
                    sendCurrentConfig(dataChannel);
                };

                pc.addTransceiver('video', { direction: 'recvonly' });
                pc.addTransceiver('video', { direction: 'recvonly' });

                pc.ontrack = (e) => {
                    const track = e.track;
                    const id = track.id.toLowerCase();
                    console.log(`[WebRTC] Track Received: ID=${track.id}, Kind=${track.kind}, ReadyState=${track.readyState}`);

                    const stream = new MediaStream([track]);

                    // Robust Identification via ID or assignment order
                    let target: HTMLVideoElement | null = null;
                    if (id.includes("context")) {
                        target = vContextRef.current;
                    } else if (id.includes("source") || id.includes("high")) {
                        target = vSourceRef.current;
                    } else {
                        // Fallback: First available
                        if (!vContextRef.current?.srcObject) target = vContextRef.current;
                        else if (!vSourceRef.current?.srcObject) target = vSourceRef.current;
                    }

                    if (target) {
                        target.srcObject = stream;
                        if (target === vContextRef.current) setHasContext(true);
                        if (target === vSourceRef.current) setHasSource(true);
                        target.play().catch(pErr => console.warn("[WebRTC] Playback deferred:", pErr));
                    }
                };

                pc.oniceconnectionstatechange = () => {
                    const state = pc?.iceConnectionState || "unknown";
                    console.log("[WebRTC] ICE Connection State:", state);
                    setIceState(state);
                    if (state === "connected" || state === "completed") {
                        toast.success("Media Link Secure");
                    } else if (state === "failed") {
                        toast.error("Media connection failed. Try reloading.");
                    }
                };

                pc.onconnectionstatechange = () => {
                    console.log("[WebRTC] Peer Connection State:", pc?.connectionState);
                    setConnectionState(pc?.connectionState || "unknown");
                };

                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);

                // Wait up to 1s for ICE candidates to be gathered into the SDP
                console.log("[WebRTC] Gathering candidates...");
                await new Promise<void>((resolve) => {
                    if (pc!.iceGatheringState === 'complete') resolve();
                    else {
                        const check = () => { if (pc!.iceGatheringState === 'complete') { pc!.removeEventListener('icegatheringstatechange', check); resolve(); } };
                        pc!.addEventListener('icegatheringstatechange', check);
                        setTimeout(resolve, 1500);
                    }
                });

                const sdpOffer = pc.localDescription?.sdp;
                console.log("[WebRTC] Sending Offer (Length:", sdpOffer?.length, ")");

                const res = await fetch(`/api/dashboard/cameras/${cameraId}/sdp-offer`, {
                    method: 'POST',
                    body: sdpOffer,
                    headers: { 'Content-Type': 'text/plain' }
                });

                if (!res.ok) throw new Error(`Signaling Proxy Error: ${res.status}`);
                const sdpAnswer = await res.text();

                console.log("[WebRTC] Received Answer (Length:", sdpAnswer.length, ")");
                console.log("[WebRTC] Answer snippet:", sdpAnswer.substring(0, 100));

                if (!isActive) return;
                await pc.setRemoteDescription(new RTCSessionDescription({ type: 'answer', sdp: sdpAnswer }));
                console.log("[WebRTC] Handshake Complete");

            } catch (err) {
                console.error("[WebRTC] Setup Failure:", err);
                setConnectionState("error");
            }
        };

        startStream();

        return () => {
            isActive = false;
            dataChannelRef.current = null;
            if (pc) pc.close();
        };
    }, [signalingUrl, cameraId]);

    // Compositor
    useEffect(() => {
        let frameId: number;

        // Hidden canvases for mask generation
        const maskCanvas = document.createElement("canvas");
        const blurCanvas = document.createElement("canvas");
        maskCanvas.width = 1280;
        maskCanvas.height = 720;
        blurCanvas.width = 1280;
        blurCanvas.height = 720;

        const composite = () => {
            const canvas = canvasRef.current;
            const ctx = canvas?.getContext("2d", { alpha: false });
            if (!canvas || !ctx || !vContextRef.current || !vSourceRef.current) return;

            const v1 = vContextRef.current;
            const v2 = vSourceRef.current;

            // Identification: Source is usually High-Res (> 800px), Context is low-res
            let contextFeed = v1.videoWidth > 0 && v1.videoWidth < 800 ? v1 : (v2.videoWidth > 0 && v2.videoWidth < 800 ? v2 : null);
            let sourceFeed = v1.videoWidth >= 800 ? v1 : (v2.videoWidth >= 800 ? v2 : null);

            // Fallback if widths not loaded yet: assume v1=context, v2=source
            if (!contextFeed && !sourceFeed) {
                contextFeed = v1;
                sourceFeed = v2;
            } else if (!contextFeed) {
                contextFeed = sourceFeed === v1 ? v2 : v1;
            } else if (!sourceFeed) {
                sourceFeed = contextFeed === v1 ? v2 : v1;
            }

            // Clear Background
            ctx.fillStyle = "#000";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Draw Base Layer (low-res context)
            if (contextFeed && contextFeed.videoWidth > 0) {
                ctx.drawImage(contextFeed, 0, 0, canvas.width, canvas.height);
            }

            // High-Res Overlay with Feathering
            // - In HIGH mode: full-frame high-res replaces context.
            // - In VISION / HYBRID: behave like Python webrtc_receiver.py and
            //   alpha-blend non-black high-res regions over the low-res context.
            if (sourceFeed && sourceFeed.videoWidth > 0 && streamingMode !== "LOW") {
                if (streamingMode === "HIGH") {
                    ctx.drawImage(sourceFeed, 0, 0, canvas.width, canvas.height);
                } else {
                    const mCtx = maskCanvas.getContext("2d");
                    const bCtx = blurCanvas.getContext("2d");

                    if (mCtx && bCtx) {
                        // 1. Create Threshold Mask (brightness > ~18, like OpenCV code)
                        mCtx.clearRect(0, 0, maskCanvas.width, maskCanvas.height);
                        mCtx.drawImage(sourceFeed, 0, 0, maskCanvas.width, maskCanvas.height);
                        const frame = mCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height);
                        const data = frame.data;
                        // Hard binary mask (like bin_mask in Python)
                        for (let i = 0; i < data.length; i += 4) {
                            const r = data[i];
                            const g = data[i + 1];
                            const b = data[i + 2];
                            // Luma approximation (0–255), same threshold ~18
                            const gray = (r * 299 + g * 587 + b * 114) / 1000;
                            if (gray > 18) {
                                // Inside ROI: solid white, full alpha
                                data[i] = 255;
                                data[i + 1] = 255;
                                data[i + 2] = 255;
                                data[i + 3] = 255;
                            } else {
                                // Outside ROI: fully transparent
                                data[i + 3] = 0;
                            }
                        }
                        mCtx.putImageData(frame, 0, 0);

                        // 2. Feather the mask using Blur (match ~31px kernel in Python)
                        bCtx.clearRect(0, 0, blurCanvas.width, blurCanvas.height);
                        bCtx.filter = "blur(31px)";
                        bCtx.drawImage(maskCanvas, 0, 0);
                        bCtx.filter = "none";

                        // 3b. Cut off blur bleeding into the black background (bitwise_and with hard mask)
                        // This mirrors: feathered_alpha = cv2.bitwise_and(feathered_alpha, bin_mask)
                        const blurred = bCtx.getImageData(0, 0, blurCanvas.width, blurCanvas.height);
                        const blurData = blurred.data;
                        for (let i = 0; i < blurData.length; i += 4) {
                            const hardAlpha = data[i + 3];
                            let a = blurData[i + 3];
                            if (hardAlpha === 0) {
                                // Outside original ROI, force alpha to 0 to avoid shadows.
                                blurData[i + 3] = 0;
                            } else if (a > 0) {
                                // Soften the transition using a simple gamma curve so edges are smoother
                                const t = a / 255;
                                const softened = Math.sqrt(t); // gamma 0.5
                                blurData[i + 3] = Math.max(0, Math.min(255, softened * 255));
                            }
                        }
                        bCtx.putImageData(blurred, 0, 0);

                        // 4. Draw Source through the Feathered Mask
                        ctx.save();
                        const tempCanvas = document.createElement("canvas");
                        tempCanvas.width = canvas.width;
                        tempCanvas.height = canvas.height;
                        const tCtx = tempCanvas.getContext("2d");
                        if (tCtx) {
                            tCtx.drawImage(sourceFeed, 0, 0, canvas.width, canvas.height);
                            tCtx.globalCompositeOperation = "destination-in";
                            tCtx.drawImage(blurCanvas, 0, 0, canvas.width, canvas.height);
                            ctx.drawImage(tempCanvas, 0, 0);
                        }
                        ctx.restore();
                    }
                }
            }

            // Stats Logging
            if (Date.now() % 3000 < 20) {
                console.log(`[Compositor] Mode: ${streamingMode}, S1: ${v1.videoWidth}x${v1.videoHeight}, S2: ${v2.videoWidth}x${v2.videoHeight}`);
            }

            frameId = requestAnimationFrame(composite);
        };
        frameId = requestAnimationFrame(composite);
        return () => cancelAnimationFrame(frameId);
    }, [streamingMode]);

    const sendCurrentConfig = (dc: RTCDataChannel) => {
        if (dc.readyState !== "open") return;
        // Android StreamerManager expects hybrid_rect in 0–100 percentage space.
        const cmd = {
            mode: streamingMode,
            hybrid_rect: streamingMode === "HYBRID" && focusArea ? {
                x1: focusArea.x,
                y1: focusArea.y,
                x2: focusArea.x + focusArea.width,
                y2: focusArea.y + focusArea.height,
            } : undefined,
        };
        dc.send(JSON.stringify(cmd));
        console.log("[WebRTC] Sent command via DataChannel:", cmd);
    };

    useEffect(() => {
        if (dataChannelRef.current) sendCurrentConfig(dataChannelRef.current);
    }, [streamingMode, focusArea]);

    return (
        <div className="absolute inset-0 h-full w-full bg-black overflow-hidden flex items-center justify-center">
            {/* Hidden Video Elements (Required for Track Handling - DO NOT USE display:none) */}
            <div className="absolute opacity-0 pointer-events-none" style={{ width: 1, height: 1, overflow: 'hidden' }}>
                <video ref={vContextRef} autoPlay muted playsInline onLoadedMetadata={() => console.log("[WebRTC] S1 Metadata Loaded")} />
                <video ref={vSourceRef} autoPlay muted playsInline onLoadedMetadata={() => console.log("[WebRTC] S2 Metadata Loaded")} />
            </div>

            <canvas
                ref={canvasRef}
                width={1280}
                height={720}
                className="max-h-full max-w-full object-contain shadow-2xl transition-opacity duration-300"
                style={{ opacity: (hasContext || hasSource) ? 1 : 0 }}
            />

            {(!hasContext && !hasSource) && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/90 backdrop-blur-sm">
                    <div className="relative h-12 w-12 mb-4">
                        <div className="absolute inset-0 border-2 border-primary/20 rounded-full"></div>
                        <div className="absolute inset-0 border-t-2 border-primary rounded-full animate-spin"></div>
                    </div>
                    <div className="text-center space-y-1">
                        <p className="text-[10px] text-white font-semibold uppercase tracking-[0.3em]">Negotiating Handshake</p>
                        <p className="text-[9px] text-zinc-500 uppercase">PC: {connectionState} | ICE: {iceState}</p>
                    </div>
                </div>
            )}
        </div>
    );
}
