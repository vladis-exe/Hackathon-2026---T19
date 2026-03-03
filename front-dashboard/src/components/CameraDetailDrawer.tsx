import { Camera } from "@/types/camera";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { BandwidthSparkline } from "./BandwidthSparkline";
import { StatusBadge } from "./StatusBadge";
import { Separator } from "@/components/ui/separator";
import { MapPin, Clock, Zap, Monitor, Film, AlertTriangle, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { WebRTCPlayer } from "./WebRTCPlayer";

interface CameraDetailDrawerProps {
  camera: Camera | null;
  open: boolean;
  onClose: () => void;
}

export function CameraDetailDrawer({ camera, open, onClose }: CameraDetailDrawerProps) {
  if (!camera) return null;

  const mbps = (camera.bandwidthKbps / 1000).toFixed(1);

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-full overflow-y-auto border-border bg-card sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 text-foreground">
            {camera.name}
            <StatusBadge variant={camera.online ? "online" : "offline"} label={camera.online ? "Online" : "Offline"} />
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Large Preview */}
          <div className="aspect-video overflow-hidden rounded-lg bg-secondary">
            <div
              className={cn(
                "flex h-full w-full items-center justify-center",
                camera.online ? "bg-gradient-to-br from-secondary to-muted" : "bg-muted/50"
              )}
            >
              {camera.online && camera.signalingUrl ? (
                <div className="flex h-full w-full overflow-hidden relative items-center justify-center">
                  <WebRTCPlayer
                    cameraId={camera.id}
                    signalingUrl={camera.signalingUrl}
                    streamingMode={camera.streamingMode}
                    smartFocusEnabled={camera.smartFocusEnabled}
                    focusArea={camera.focusArea}
                  />
                </div>
              ) : camera.online ? (
                <span className="text-sm text-muted-foreground/60">No signaling URL</span>
              ) : (
                <span className="text-sm text-muted-foreground/40">CAMERA OFFLINE</span>
              )}
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            <StatItem icon={<Zap className="h-4 w-4" />} label="Bitrate" value={`${mbps} Mbps`} />
            <StatItem icon={<Clock className="h-4 w-4" />} label="Latency" value={`${camera.latencyMs}ms`} />
            <StatItem icon={<Monitor className="h-4 w-4" />} label="Resolution" value={camera.resolution} />
            <StatItem icon={<Film className="h-4 w-4" />} label="FPS" value={`${camera.fps}`} />
            <StatItem icon={<AlertTriangle className="h-4 w-4" />} label="Packet Loss" value={`${camera.packetLoss}%`} />
            <StatItem icon={<MapPin className="h-4 w-4" />} label="Location" value={camera.location} />
          </div>

          {/* Bandwidth Chart */}
          <div>
            <h4 className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">Bandwidth History</h4>
            <div className="rounded-lg bg-secondary/50 p-3">
              <BandwidthSparkline data={camera.bandwidthHistory} width={340} height={60} />
            </div>
          </div>

          <Separator className="bg-border" />

          {/* Event Log */}
          <div>
            <h4 className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">Recent Events</h4>
            <div className="space-y-1">
              {camera.events.map((event, i) => (
                <div key={i} className="flex items-start gap-2 rounded-md px-2 py-1.5 text-xs hover:bg-secondary/50">
                  <span className="text-data text-muted-foreground whitespace-nowrap">{event.timestamp}</span>
                  <span className="text-secondary-foreground">{event.message}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function StatItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg bg-secondary/50 p-3">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        {icon}
        <span className="text-[10px] uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-data mt-1 font-semibold text-foreground">{value}</p>
    </div>
  );
}
