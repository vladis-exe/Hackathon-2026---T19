import { useEffect, useRef } from "react";

export function WebRTCPlayer({ cameraId }: { cameraId?: string }) {
    const videoRef = useRef<HTMLVideoElement>(null);

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

    return (
        <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="absolute inset-0 h-full w-full object-cover"
        />
    );
}
