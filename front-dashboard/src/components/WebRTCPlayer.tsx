import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

export function WebRTCPlayer({ cameraId }: { cameraId?: string }) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const [isDrawing, setIsDrawing] = useState(false);
    const [startPos, setStartPos] = useState({ x: 0, y: 0 });
    const [currentPos, setCurrentPos] = useState({ x: 0, y: 0 });

    useEffect(() => {
        let stream: MediaStream | null = null;
        let pc1: RTCPeerConnection | null = null;
        let pc2: RTCPeerConnection | null = null;

        const startStream = async () => {
            try {
                stream = await navigator.mediaDevices.getUserMedia({ video: true });

                // Loopback WebRTC Connection
                pc1 = new RTCPeerConnection();
                pc2 = new RTCPeerConnection();

                pc1.onicecandidate = (e) => e.candidate && pc2?.addIceCandidate(e.candidate);
                pc2.onicecandidate = (e) => e.candidate && pc1?.addIceCandidate(e.candidate);

                pc2.ontrack = (e) => {
                    if (videoRef.current && !videoRef.current.srcObject) {
                        videoRef.current.srcObject = e.streams[0];
                    }
                };

                stream.getTracks().forEach((track) => pc1?.addTrack(track, stream!));

                const offer = await pc1.createOffer();
                await pc1.setLocalDescription(offer);
                await pc2.setRemoteDescription(offer);

                const answer = await pc2.createAnswer();
                await pc2.setLocalDescription(answer);
                await pc1.setRemoteDescription(answer);
            } catch (err) {
                console.error("Error accessing WebRTC stream", err);
            }
        };

        startStream();

        return () => {
            if (stream) {
                stream.getTracks().forEach((track) => track.stop());
            }
            pc1?.close();
            pc2?.close();
        };
    }, [cameraId]);

    const handleMouseDown = (e: React.MouseEvent) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        setStartPos({ x, y });
        setCurrentPos({ x, y });
        setIsDrawing(true);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDrawing || !containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        setCurrentPos({ x, y });
    };

    const handleMouseUp = async () => {
        if (!isDrawing) return;
        setIsDrawing(false);

        if (!cameraId || !containerRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;

        // Create 4 points of the rectangle, normalized to 0-1 relative to the container size
        const x1 = Math.min(startPos.x, currentPos.x) / width;
        const y1 = Math.min(startPos.y, currentPos.y) / height;
        const x2 = Math.max(startPos.x, currentPos.x) / width;
        const y2 = Math.max(startPos.y, currentPos.y) / height;

        // Ignore if the drawn area is too small (e.g. just a click)
        if (Math.abs(x2 - x1) < 0.01 || Math.abs(y2 - y1) < 0.01) return;

        // Rectangle defined by 4 points
        const request = {
            xmin: Math.min(x1, x2),
            xmax: Math.max(x1, x2),
            ymin: Math.min(y1, y2),
            ymax: Math.max(y1, y2),
        }

        try {
            const res = await fetch(`/api/dashboard/cameras/${cameraId}/set_area`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(request)
            });
            if (!res.ok) {
                throw new Error(`Failed with status: ${res.status}`);
            }
            toast.success("Area updated successfully");
        } catch (err) {
            console.error("Failed to set area", err);
            toast.error("Failed to update camera area");
        }
    };

    const handleMouseLeave = () => {
        if (isDrawing) {
            setIsDrawing(false);
        }
    };

    return (
        <div
            ref={containerRef}
            className="absolute inset-0 h-full w-full cursor-crosshair"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
        >
            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="absolute inset-0 h-full w-full object-cover pointer-events-none"
            />
            {isDrawing && (
                <div
                    className="absolute border-2 border-primary bg-primary/20 pointer-events-none"
                    style={{
                        left: Math.min(startPos.x, currentPos.x),
                        top: Math.min(startPos.y, currentPos.y),
                        width: Math.abs(currentPos.x - startPos.x),
                        height: Math.abs(currentPos.y - startPos.y),
                    }}
                />
            )}
        </div>
    );
}
