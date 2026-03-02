export interface CameraEvent {
  timestamp: string;
  message: string;
}

export interface FocusArea {
  x: number; // percentage 0-100
  y: number;
  width: number;
  height: number;
}

export interface Camera {
  id: string;
  name: string;
  location: string;
  bandwidthKbps: number;
  originalBandwidthKbps: number; // bandwidth without smart focus
  bandwidthHistory: number[];
  originalBandwidthHistory: number[];
  qodActive: boolean;
  smartFocusEnabled: boolean;
  online: boolean;
  latencyMs: number;
  resolution: string;
  fps: number;
  packetLoss: number;
  events: CameraEvent[];
  focusArea?: FocusArea;
  streamUrl?: string;
}
