import { Camera } from "@/types/camera";

// Placeholder API functions — replace with real backend calls later

export async function fetchCameras(): Promise<Camera[]> {
  // TODO: Replace with actual API call
  return [];
}

export async function toggleSmartFocus(
  cameraId: string,
  enabled: boolean
): Promise<{ success: boolean }> {
  // TODO: Replace with actual API call
  console.log(`[API] toggleSmartFocus: ${cameraId} → ${enabled}`);
  return { success: true };
}

export async function requestQod(
  cameraId: string,
  level: "LOW" | "MEDIUM" | "HIGH"
): Promise<{ success: boolean }> {
  // TODO: Replace with actual API call
  console.log(`[API] requestQod: ${cameraId} → ${level}`);
  return { success: true };
}
