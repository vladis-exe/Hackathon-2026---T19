import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { Camera, FocusArea, StreamingMode } from "@/types/camera";
import {
    fetchCameras as fetchCamerasFromApi,
    toggleSmartFocus as toggleSmartFocusApi,
    setFocusArea as setFocusAreaApi,
    clearFocusArea as clearFocusAreaApi,
    setStreamingMode as setStreamingModeApi
} from "@/services/api";

interface CamerasContextType {
    cameras: Camera[];
    dataSource: "api" | "mock" | "loading";
    totalBandwidthKbps: number;
    onlineCount: number;
    toggleSmartFocus: (cameraId: string) => void;
    setFocusArea: (cameraId: string, area: FocusArea | undefined) => void;
    setStreamingMode: (cameraId: string, mode: StreamingMode) => void;
    reportBandwidth: (cameraId: string, kbps: number) => void;
}

const CamerasContext = createContext<CamerasContextType | undefined>(undefined);

const MOCK_CAMERAS: Camera[] = [
    {
        id: "cam-1",
        name: "Drone 1",
        location: "Berlin, DE",
        bandwidthKbps: 1800,
        originalBandwidthKbps: 2600,
        bandwidthHistory: [1200, 1400, 1600, 1500, 1800, 1700, 1800],
        originalBandwidthHistory: [2400, 2500, 2600, 2550, 2700, 2600, 2600],
        qodActive: true,
        smartFocusEnabled: true,
        online: true,
        latencyMs: 23,
        resolution: "1920×1080",
        fps: 30,
        packetLoss: 0.1,
        events: [
            { timestamp: "12:01", message: "Smart Focus enabled" },
            { timestamp: "12:03", message: "QoD requested (HIGH)" },
            { timestamp: "12:05", message: "Object detected: person" },
        ],
        focusArea: { x: 25, y: 20, width: 50, height: 60 },
        signalingUrl: "http://10.35.218.9:8888",
        streamingMode: "LOW",
    }
];

export const CamerasProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [cameras, setCameras] = useState<Camera[]>([]);
    const [dataSource, setDataSource] = useState<"api" | "mock" | "loading">("loading");

    // Track reported bandwidths separately to avoid frequent re-renders of the whole list
    // but we eventually need to merge it into the camera objects for the UI.
    const bandwidthReports = useRef<Record<string, number>>({});

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const apiCameras = await fetchCamerasFromApi();
                if (!cancelled) {
                    setCameras(apiCameras);
                    setDataSource("api");
                }
            } catch (err) {
                console.warn("Failed to load cameras, using mock data:", err);
                if (!cancelled) {
                    setCameras(MOCK_CAMERAS);
                    setDataSource("mock");
                }
            }
        })();
        return () => { cancelled = true; };
    }, []);

    // Periodic history update (every 3s)
    useEffect(() => {
        const interval = setInterval(() => {
            setCameras((prev) =>
                prev.map((cam) => {
                    if (!cam.online) return cam;

                    // Use reported bandwidth if available, otherwise simulate a small fluctuation
                    const currentBw = bandwidthReports.current[cam.id] ?? cam.bandwidthKbps;
                    const reported = bandwidthReports.current[cam.id] !== undefined;

                    let newBw = currentBw;
                    if (!reported) {
                        const delta = (Math.random() - 0.5) * 100;
                        newBw = Math.max(100, Math.round(currentBw + delta));
                    }

                    // Simulate original bandwidth as well
                    const origDelta = (Math.random() - 0.5) * 100;
                    const newOrigBw = Math.max(newBw, Math.round(cam.originalBandwidthKbps + origDelta));

                    return {
                        ...cam,
                        bandwidthKbps: newBw,
                        originalBandwidthKbps: newOrigBw,
                        bandwidthHistory: [...cam.bandwidthHistory.slice(1), newBw],
                        originalBandwidthHistory: [...cam.originalBandwidthHistory.slice(1), newOrigBw],
                        latencyMs: Math.max(1, cam.latencyMs + Math.round((Math.random() - 0.5) * 5)),
                    };
                })
            );
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    const reportBandwidth = useCallback((cameraId: string, kbps: number) => {
        bandwidthReports.current[cameraId] = kbps;
        // We update the camera object immediately for the "current" display
        setCameras(prev => prev.map(c => c.id === cameraId ? { ...c, bandwidthKbps: kbps } : c));
    }, []);

    const toggleSmartFocus = useCallback((cameraId: string) => {
        setCameras((prev) =>
            prev.map((cam) => {
                if (cam.id !== cameraId) return cam;
                const enabled = !cam.smartFocusEnabled;
                toggleSmartFocusApi(cameraId, enabled).catch(console.error);
                return {
                    ...cam,
                    smartFocusEnabled: enabled,
                    events: [...cam.events, {
                        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                        message: enabled ? "Smart Focus enabled" : "Smart Focus disabled",
                    }],
                };
            })
        );
    }, []);

    const setFocusArea = useCallback((cameraId: string, area: FocusArea | undefined) => {
        setCameras((prev) =>
            prev.map((cam) => {
                if (cam.id !== cameraId) return cam;
                if (area) setFocusAreaApi(cameraId, area).catch(console.error);
                else clearFocusAreaApi(cameraId).catch(console.error);
                return {
                    ...cam,
                    focusArea: area,
                    events: [...cam.events, {
                        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                        message: area ? "Focus area updated" : "Focus area cleared",
                    }]
                };
            })
        );
    }, []);

    const setStreamingMode = useCallback((cameraId: string, mode: StreamingMode) => {
        setCameras((prev) =>
            prev.map((cam) => {
                if (cam.id !== cameraId) return cam;
                setStreamingModeApi(cameraId, mode).catch(console.error);
                return {
                    ...cam,
                    streamingMode: mode,
                    events: [...cam.events, {
                        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                        message: `Mode changed to ${mode}`,
                    }]
                };
            })
        );
    }, []);

    const totalBandwidthKbps = cameras.reduce((sum, c) => sum + (c.online ? c.bandwidthKbps : 0), 0);
    const onlineCount = cameras.filter((c) => c.online).length;

    return (
        <CamerasContext.Provider value={{
            cameras, dataSource, totalBandwidthKbps, onlineCount,
            toggleSmartFocus, setFocusArea, setStreamingMode, reportBandwidth
        }}>
            {children}
        </CamerasContext.Provider>
    );
};

export const useCamerasContext = () => {
    const context = useContext(CamerasContext);
    if (!context) throw new Error("useCamerasContext must be used within a CamerasProvider");
    return context;
};
