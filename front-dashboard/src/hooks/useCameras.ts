import { useState, useEffect, useCallback } from "react";
import { Camera, FocusArea, StreamingMode } from "@/types/camera";
import { fetchCameras as fetchCamerasFromApi, toggleSmartFocus as toggleSmartFocusApi, setFocusArea as setFocusAreaApi, clearFocusArea as clearFocusAreaApi, setStreamingMode as setStreamingModeApi } from "@/services/api";

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
    signalingUrl: "http://10.35.218.9:8888", // Default Android dev IP
    streamingMode: "LOW",
  },
  {
    id: "cam-2",
    name: "Stage Cam 2",
    location: "Munich, DE",
    bandwidthKbps: 2400,
    originalBandwidthKbps: 3200,
    bandwidthHistory: [2000, 2200, 2100, 2300, 2500, 2400, 2400],
    originalBandwidthHistory: [3000, 3100, 3200, 3150, 3300, 3200, 3200],
    qodActive: true,
    smartFocusEnabled: false,
    streamingMode: "HIGH",
    online: true,
    latencyMs: 15,
    resolution: "3840×2160",
    fps: 60,
    packetLoss: 0.02,
    events: [
      { timestamp: "11:55", message: "Stream started" },
      { timestamp: "12:00", message: "Resolution upgraded to 4K" },
    ],
  },
  {
    id: "cam-3",
    name: "Lobby Cam",
    location: "Frankfurt, DE",
    bandwidthKbps: 950,
    originalBandwidthKbps: 1400,
    bandwidthHistory: [800, 850, 900, 920, 950, 940, 950],
    originalBandwidthHistory: [1300, 1350, 1400, 1380, 1420, 1400, 1400],
    qodActive: false,
    smartFocusEnabled: false,
    streamingMode: "LOW",
    online: true,
    latencyMs: 8,
    resolution: "1280×720",
    fps: 24,
    packetLoss: 0.5,
    events: [
      { timestamp: "11:30", message: "Stream started" },
    ],
  },
  {
    id: "cam-4",
    name: "Rooftop Cam",
    location: "Hamburg, DE",
    bandwidthKbps: 0,
    originalBandwidthKbps: 0,
    bandwidthHistory: [1100, 1000, 900, 500, 200, 0, 0],
    originalBandwidthHistory: [1600, 1500, 1400, 800, 300, 0, 0],
    qodActive: false,
    smartFocusEnabled: false,
    streamingMode: "LOW",
    online: false,
    latencyMs: 0,
    resolution: "1920×1080",
    fps: 0,
    packetLoss: 100,
    events: [
      { timestamp: "10:45", message: "Stream started" },
      { timestamp: "11:20", message: "Connection lost" },
    ],
  },
  {
    id: "cam-5",
    name: "Parking Lot",
    location: "Cologne, DE",
    bandwidthKbps: 1200,
    originalBandwidthKbps: 1900,
    bandwidthHistory: [1000, 1100, 1150, 1200, 1180, 1220, 1200],
    originalBandwidthHistory: [1800, 1850, 1900, 1880, 1920, 1900, 1900],
    qodActive: true,
    smartFocusEnabled: true,
    online: true,
    latencyMs: 31,
    resolution: "1920×1080",
    fps: 30,
    packetLoss: 0.3,
    events: [
      { timestamp: "12:10", message: "Smart Focus enabled" },
      { timestamp: "12:12", message: "Object detected: vehicle" },
    ],
    focusArea: { x: 10, y: 30, width: 80, height: 50 },
    streamingMode: "HYBRID",
    signalingUrl: "http://10.35.218.9:8888",
  },
  {
    id: "cam-6",
    name: "Entrance Gate",
    location: "Stuttgart, DE",
    bandwidthKbps: 1500,
    originalBandwidthKbps: 2100,
    bandwidthHistory: [1300, 1350, 1400, 1450, 1500, 1480, 1500],
    originalBandwidthHistory: [2000, 2050, 2100, 2080, 2150, 2100, 2100],
    qodActive: false,
    smartFocusEnabled: false,
    online: true,
    latencyMs: 12,
    resolution: "1920×1080",
    fps: 30,
    packetLoss: 0.15,
    events: [
      { timestamp: "11:00", message: "Stream started" },
    ],
    streamingMode: "VISION",
  },
];

export type CamerasDataSource = "api" | "mock" | "loading";

export function useCameras() {
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [dataSource, setDataSource] = useState<CamerasDataSource>("loading");

  // On mount, load cameras from backend; use mock only when the request fails.
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
        console.warn("Failed to load cameras from backend, using mock data instead:", err);
        if (!cancelled) {
          setCameras(MOCK_CAMERAS);
          setDataSource("mock");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Simulate bandwidth fluctuation
  useEffect(() => {
    const interval = setInterval(() => {
      setCameras((prev) =>
        prev.map((cam) => {
          if (!cam.online) return cam;
          const delta = (Math.random() - 0.5) * 200;
          const origDelta = (Math.random() - 0.5) * 200;
          const newBw = Math.max(100, Math.round(cam.bandwidthKbps + delta));
          const newOrigBw = Math.max(100, Math.round(cam.originalBandwidthKbps + origDelta));
          const newHistory = [...cam.bandwidthHistory.slice(1), newBw];
          const newOrigHistory = [...cam.originalBandwidthHistory.slice(1), newOrigBw];
          const newLatency = Math.max(1, cam.latencyMs + Math.round((Math.random() - 0.5) * 5));
          return {
            ...cam,
            bandwidthKbps: newBw,
            originalBandwidthKbps: newOrigBw,
            bandwidthHistory: newHistory,
            originalBandwidthHistory: newOrigHistory,
            latencyMs: newLatency,
          };
        })
      );
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const toggleSmartFocus = useCallback((cameraId: string) => {
    setCameras((prev) =>
      prev.map((cam) => {
        if (cam.id !== cameraId) return cam;
        const enabled = !cam.smartFocusEnabled;
        const newEvent = {
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          message: enabled ? "Smart Focus enabled" : "Smart Focus disabled",
        };
        // Fire-and-forget backend update; UI remains optimistic.
        toggleSmartFocusApi(cameraId, enabled).catch((err) =>
          console.warn("Failed to toggle smart focus in backend:", err)
        );
        return {
          ...cam,
          smartFocusEnabled: enabled,
          events: [...cam.events, newEvent],
        };
      })
    );
  }, []);

  const setFocusArea = useCallback((cameraId: string, area: FocusArea | undefined) => {
    setCameras((prev) =>
      prev.map((cam) => {
        if (cam.id !== cameraId) return cam;
        const newEvent = {
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          message: area ? "Focus area updated" : "Focus area cleared",
        };
        if (area) {
          setFocusAreaApi(cameraId, area).catch((err) =>
            console.warn("Failed to persist focus area:", err)
          );
        } else {
          clearFocusAreaApi(cameraId).catch((err) =>
            console.warn("Failed to clear focus area:", err)
          );
        }
        return { ...cam, focusArea: area, events: [...cam.events, newEvent] };
      })
    );
  }, []);

  const setStreamingMode = useCallback((cameraId: string, mode: StreamingMode) => {
    setCameras((prev) =>
      prev.map((cam) => {
        if (cam.id !== cameraId) return cam;
        const newEvent = {
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          message: `Mode changed to ${mode}`,
        };
        setStreamingModeApi(cameraId, mode).catch((err) =>
          console.warn("Failed to set streaming mode in backend:", err)
        );
        return { ...cam, streamingMode: mode, events: [...cam.events, newEvent] };
      })
    );
  }, []);

  const totalBandwidthKbps = cameras.reduce((sum, c) => sum + c.bandwidthKbps, 0);
  const onlineCount = cameras.filter((c) => c.online).length;

  return { cameras, toggleSmartFocus, setFocusArea, setStreamingMode, totalBandwidthKbps, onlineCount, dataSource };
}
