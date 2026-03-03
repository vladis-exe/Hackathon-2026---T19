import { Camera } from "@/types/camera";

// --- Backend integration helpers ---
// The backend is exposed at /api/* via Vite proxy (see vite.config.ts).
// When running in browser, fetch("/api/...") goes to same origin; Vite proxies to target in vite.config.

const API_BASE = typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE != null
  ? String(import.meta.env.VITE_API_BASE).replace(/\/$/, "")
  : "";

// Backend returns MongoDB docs with _id; FastAPI may serialize as id in some setups.
type BackendCamera = {
  _id?: string;
  id?: string;
  name?: string;
  phoneNumber: string;
  highResolution: boolean;
  webrtcStream?: string | null;
  location?: {
    latitude?: number | null;
    longitude?: number | null;
    description?: string | null;
  } | null;
  focusArea?: { x: number; y: number; width: number; height: number } | null;
  signalingUrl?: string | null;
  streamingMode?: string | null;
};

function normalizeSignalingUrl(raw: string | null | undefined): string | undefined {
  if (!raw) return undefined;
  let s = String(raw).trim();
  if (!s) return undefined;
  if (!s.includes("://")) s = `http://${s}`;
  try {
    const u = new URL(s);
    // Default to WebRTC signaling port; rewrite legacy 8080.
    const port = u.port ? Number(u.port) : undefined;
    if (!port) u.port = "8888";
    else if (port === 8080) u.port = "8888";
    return u.toString().replace(/\/$/, "");
  } catch {
    // If parsing fails, return the raw string (best effort).
    return s;
  }
}

function mapBackendCameraToUi(cam: BackendCamera, index: number): Camera {
  const camId = cam._id ?? cam.id ?? `unknown-${index}`;
  const baseName = cam.name || `Camera ${index + 1}`;
  const location = cam.location?.description || "Unknown location";

  // For now, derive some synthetic metrics so the UI looks alive.
  const bandwidthKbps = 1500 + Math.round(Math.random() * 800);
  const originalBandwidthKbps = bandwidthKbps + 600;
  const historyLength = 7;
  const bandwidthHistory = Array.from({ length: historyLength }, (_, i) =>
    Math.max(500, bandwidthKbps + (i - historyLength / 2) * 50)
  );
  const originalBandwidthHistory = bandwidthHistory.map((v) => v + 500);

  return {
    id: camId,
    name: baseName,
    location,
    bandwidthKbps,
    originalBandwidthKbps,
    bandwidthHistory,
    originalBandwidthHistory,
    qodActive: cam.highResolution,
    smartFocusEnabled: cam.highResolution,
    streamingMode: (cam.streamingMode as any) || "LOW",
    online: true,
    latencyMs: 20 + Math.round(Math.random() * 15),
    resolution: "1920×1080",
    fps: 30,
    packetLoss: 0.3,
    events: [
      { timestamp: "now", message: "Camera registered from backend" },
      ...(cam.highResolution ? [{ timestamp: "now", message: "High resolution enabled" }] : []),
    ],
    // Real stream is shown via WebRTC (liveFeedNode); no test video default.
    streamUrl: undefined,
    signalingUrl: normalizeSignalingUrl(cam.signalingUrl),
    focusArea: cam.focusArea ?? undefined,
  };
}

export async function fetchCameras(): Promise<Camera[]> {
  const url = `${API_BASE}/api/dashboard/cameras`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch cameras: ${res.status} ${res.statusText}`);
  }
  let data: unknown;
  try {
    data = await res.json();
  } catch {
    throw new Error("Invalid JSON from /api/dashboard/cameras");
  }
  if (!Array.isArray(data)) {
    throw new Error("Backend did not return an array of cameras");
  }
  return (data as BackendCamera[]).map((cam, i) => mapBackendCameraToUi(cam, i));
}

export async function toggleSmartFocus(
  cameraId: string,
  enabled: boolean
): Promise<{ success: boolean }> {
  const res = await fetch(`/api/dashboard/cameras/${encodeURIComponent(cameraId)}/set_highres/${enabled}`, {
    method: "POST",
  });
  if (!res.ok) {
    throw new Error(`Failed to toggle smart focus: ${res.status}`);
  }
  return { success: true };
}

export async function setStreamingMode(
  cameraId: string,
  mode: string
): Promise<{ success: boolean }> {
  const res = await fetch(`/api/dashboard/cameras/${encodeURIComponent(cameraId)}/set_mode/${mode}`, {
    method: "POST",
  });
  if (!res.ok) {
    throw new Error(`Failed to set streaming mode: ${res.status}`);
  }
  return { success: true };
}

export async function requestQod(
  cameraId: string,
  level: "LOW" | "MEDIUM" | "HIGH"
): Promise<{ success: boolean }> {
  // Placeholder: will later call a dedicated QoD endpoint.
  console.log(`[API] requestQod (stub): ${cameraId} → ${level}`);
  return { success: true };
}

export async function setFocusArea(
  cameraId: string,
  area: { x: number; y: number; width: number; height: number }
): Promise<void> {
  const res = await fetch(`${API_BASE}/api/dashboard/cameras/${encodeURIComponent(cameraId)}/focus-area`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(area),
  });
  if (!res.ok) throw new Error(`Failed to set focus area: ${res.status}`);
}

export async function clearFocusArea(cameraId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/dashboard/cameras/${encodeURIComponent(cameraId)}/focus-area`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error(`Failed to clear focus area: ${res.status}`);
}
