import { Camera } from "@/types/camera";
import { BandwidthSparkline } from "./BandwidthSparkline";
import { StatusBadge } from "./StatusBadge";
import { Switch } from "@/components/ui/switch";
import { MapPin, Clock, Zap, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface CameraCardProps {
  camera: Camera;
  onToggleSmartFocus: (id: string) => void;
  onSelect: (camera: Camera) => void;
}

export function CameraCard({ camera, onToggleSmartFocus, onSelect }: CameraCardProps) {
  const mbps = (camera.bandwidthKbps / 1000).toFixed(1);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "group relative rounded-lg border border-border bg-card transition-all duration-300 hover:border-primary/40 hover:shadow-lg",
        camera.smartFocusEnabled && camera.online && "border-primary/30 animate-pulse-glow"
      )}
    >
      {/* Video preview — not clickable so focus-area selection can be used here without opening full view */}
      <div className="relative aspect-video overflow-hidden rounded-t-lg bg-secondary cursor-default">
        <div
          className={cn(
            "flex h-full w-full items-center justify-center",
            camera.online
              ? "bg-gradient-to-br from-secondary to-muted"
              : "bg-muted/50"
          )}
        >
          {camera.online ? (
            <div className="flex flex-col items-center justify-center gap-1">
              <span className="text-xs text-muted-foreground/70 uppercase tracking-widest">Preview</span>
              <span className="text-[10px] text-muted-foreground/60">
                Open camera to view live feed
              </span>
            </div>
          ) : (
            <span className="text-xs text-muted-foreground/40">OFFLINE</span>
          )}
        </div>

        {/* Overlay badges */}
        <div className="absolute left-2 top-2 flex gap-1.5 z-10">
          <StatusBadge variant={camera.online ? "online" : "offline"} label={camera.online ? "Online" : "Offline"} />
        </div>
        {camera.online && camera.signalingUrl && (
          <div className="absolute bottom-2 left-2 z-10">
            <StatusBadge variant="active" label="WebRTC" />
          </div>
        )}
        {camera.smartFocusEnabled && (
          <div className="absolute right-2 top-2 z-10">
            <StatusBadge variant="active" label="AI Focus" />
          </div>
        )}
      </div>

      {/* Card body — click here to open full view (area outside video) */}
      <div
        className="space-y-3 p-3 cursor-pointer"
        onClick={() => onSelect(camera)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && onSelect(camera)}
        aria-label={`Open ${camera.name} details`}
      >
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-sm font-semibold">{camera.name}</h3>
            <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" />
              {camera.location}
            </div>
          </div>
          <StatusBadge
            variant={camera.qodActive ? "active" : "inactive"}
            label={camera.qodActive ? "QoD" : "No QoD"}
          />
        </div>

        {/* Stats Row */}
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Zap className="h-3 w-3" />
            <span className="text-data text-foreground">{mbps} Mbps</span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span className="text-data text-foreground">{camera.latencyMs}ms</span>
          </div>
        </div>

        {/* Sparkline */}
        <BandwidthSparkline data={camera.bandwidthHistory} />

        {/* Smart Focus Toggle */}
        <div
          className="flex items-center justify-between rounded-md bg-secondary/50 px-3 py-2"
          onClick={(e) => e.stopPropagation()}
        >
          <span className="text-xs font-medium">Smart Focus</span>
          <Switch
            checked={camera.smartFocusEnabled}
            onCheckedChange={() => onToggleSmartFocus(camera.id)}
            disabled={!camera.online}
            aria-label={`Toggle Smart Focus for ${camera.name}`}
          />
        </div>
      </div>
    </motion.div>
  );
}
