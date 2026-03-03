import { useParams, useNavigate } from "react-router-dom";
import { useCameras } from "@/hooks/useCameras";
import { FocusAreaSelector } from "@/components/FocusAreaSelector";
import { WebRTCPlayer } from "@/components/WebRTCPlayer";
import { BandwidthSparkline } from "@/components/BandwidthSparkline";
import { StatusBadge } from "@/components/StatusBadge";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft, MapPin, Clock, Zap, Monitor, Film,
  AlertTriangle, Eye, Circle, Scan, CircleDashed,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function CameraDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { cameras, toggleSmartFocus, setFocusArea, setStreamingMode } = useCameras();

  const camera = cameras.find((c) => c.id === id);

  if (!camera) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Camera not found</p>
          <Button variant="outline" onClick={() => navigate("/")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const mbps = (camera.bandwidthKbps / 1000).toFixed(1);
  const hasSignalingUrl = !!camera.signalingUrl && camera.signalingUrl.trim().length > 0;
  const signalingLooksLegacy = hasSignalingUrl && camera.signalingUrl?.includes(":8080");

  const handleToggle = () => {
    toggleSmartFocus(camera.id);
    toast(
      camera.smartFocusEnabled
        ? `Smart Focus disabled for ${camera.name}`
        : `Smart Focus enabled for ${camera.name}`,
      { duration: 2000 }
    );
  };

  return (
    <div className="min-h-screen bg-background gradient-mesh">
      {/* Top bar */}
      <header className="glass sticky top-0 z-50 border-b border-border">
        <div className="container mx-auto flex items-center gap-4 px-4 py-3 md:px-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
            className="shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-base font-semibold">{camera.name}</h1>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" />
              {camera.location}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge
              variant={camera.online ? "online" : "offline"}
              label={camera.online ? "Online" : "Offline"}
            />
            {camera.qodActive && <StatusBadge variant="active" label="QoD" />}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 md:px-6">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left: Video + Focus Area - takes 2 cols */}
          <div className="lg:col-span-2 space-y-4">
            {/* Video with focus area selector */}
            <div className="overflow-hidden rounded-xl border border-border bg-card">
              <div className="relative">
                <FocusAreaSelector
                  className="w-full"
                  streamUrl={undefined}
                  liveFeedNode={camera.online && hasSignalingUrl ? <WebRTCPlayer
                    cameraId={camera.id}
                    signalingUrl={camera.signalingUrl}
                    streamingMode={camera.streamingMode}
                    smartFocusEnabled={camera.smartFocusEnabled}
                    focusArea={camera.focusArea}
                  /> : undefined}
                  focusArea={camera.focusArea}
                  onFocusAreaChange={(area) => setFocusArea(camera.id, area)}
                  disabled={!camera.online || camera.streamingMode !== "HYBRID"}
                />
                {camera.online && !hasSignalingUrl && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="rounded-md border border-white/10 bg-black/60 px-3 py-2 text-[10px] uppercase tracking-wider text-white/80">
                      No signaling URL set (expected `http://&lt;device-ip&gt;:8888`)
                    </div>
                  </div>
                )}
                {camera.online && hasSignalingUrl && signalingLooksLegacy && (
                  <div className="absolute bottom-3 left-3 rounded-md bg-amber-500/10 border border-amber-500/30 px-2 py-1 text-[10px] text-amber-200 backdrop-blur-sm uppercase tracking-wider">
                    Signaling URL looks legacy (`:8080`) — WebRTC uses `:8888`
                  </div>
                )}
                {/* Overlay badges */}
                <div className="absolute left-3 top-3 flex gap-2">
                  {/* Removed StatusBadge for Mode */}
                </div>
                {/* Mode Selector Buttons */}
                <div className="absolute right-3 top-3 flex gap-2">
                  <div className="flex items-center gap-1 rounded-lg bg-background/60 p-1 backdrop-blur-md border border-border/40">
                    <ModeButton
                      active={camera.streamingMode === "LOW"}
                      onClick={() => setStreamingMode(camera.id, "LOW")}
                      icon={<CircleDashed className="h-4 w-4" />}
                      tooltip="LOW"
                    />
                    <ModeButton
                      active={camera.streamingMode === "HIGH"}
                      onClick={() => setStreamingMode(camera.id, "HIGH")}
                      icon={<Circle className="h-4 w-4" />}
                      tooltip="HIGH"
                    />
                    <ModeButton
                      active={camera.streamingMode === "VISION"}
                      onClick={() => setStreamingMode(camera.id, "VISION")}
                      icon={<Eye className="h-4 w-4" />}
                      tooltip="VISION"
                    />
                    <ModeButton
                      active={camera.streamingMode === "HYBRID"}
                      onClick={() => setStreamingMode(camera.id, "HYBRID")}
                      icon={<Scan className="h-4 w-4" />}
                      tooltip="HYBRID"
                    />
                  </div>
                </div>

                {camera.streamingMode === "HYBRID" && camera.focusArea && (
                  <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-md bg-primary/10 border border-primary/30 px-3 py-1.5 text-[10px] text-primary backdrop-blur-md animate-in fade-in slide-in-from-bottom-1 uppercase tracking-wider font-medium">
                    <Scan className="h-3 w-3" />
                    <span>Focus area active</span>
                  </div>
                )}
                {camera.online && (
                  <div className="absolute bottom-3 right-3 flex items-center gap-1 rounded-md bg-card/80 px-2 py-1 backdrop-blur-sm">
                    <Eye className="h-3 w-3 text-primary" />
                    <span className="text-[10px] text-primary font-medium">LIVE</span>
                  </div>
                )}
              </div>
            </div>

            {/* Smart Focus Toggle bar */}
            <div className="flex flex-col gap-4 rounded-lg border border-border bg-card p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-lg",
                    camera.smartFocusEnabled ? "bg-primary/10" : "bg-secondary"
                  )}>
                    <Eye className={cn("h-4 w-4", camera.smartFocusEnabled ? "text-primary" : "text-muted-foreground")} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">QoD Simulation</p>
                    <p className="text-xs text-muted-foreground">
                      {camera.smartFocusEnabled ? "AI is optimizing bandwidth" : "Raw stream, no optimization"}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={camera.smartFocusEnabled}
                  onCheckedChange={handleToggle}
                  disabled={!camera.online}
                />
              </div>
            </div>

          </div>

          {/* Right: Stats + Events */}
          <div className="space-y-4">
            {/* Stats */}
            <div className="rounded-lg border border-border bg-card p-4">
              <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Stream Stats
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <StatItem icon={<Zap className="h-4 w-4" />} label="Bitrate" value={`${mbps} Mbps`} />
                <StatItem icon={<Clock className="h-4 w-4" />} label="Latency" value={`${camera.latencyMs}ms`} />
                <StatItem icon={<Monitor className="h-4 w-4" />} label="Resolution" value={camera.resolution} />
                <StatItem icon={<Film className="h-4 w-4" />} label="FPS" value={`${camera.fps}`} />
                <StatItem icon={<AlertTriangle className="h-4 w-4" />} label="Pkt Loss" value={`${camera.packetLoss}%`} />
                <StatItem icon={<MapPin className="h-4 w-4" />} label="Location" value={camera.location} />
              </div>
            </div>

            {/* Bandwidth history sparkline */}
            <div className="rounded-lg border border-border bg-card p-4">
              <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Bandwidth History
              </h3>
              <BandwidthSparkline data={camera.bandwidthHistory} width={300} height={50} />
            </div>

            <Separator className="bg-border" />

            {/* Events */}
            <div className="rounded-lg border border-border bg-card p-4">
              <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Recent Events
              </h3>
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {camera.events.map((event, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 rounded-md px-2 py-1.5 text-xs hover:bg-secondary/50"
                  >
                    <span className="text-data text-muted-foreground whitespace-nowrap">{event.timestamp}</span>
                    <span className="text-secondary-foreground">{event.message}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
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

function ModeButton({
  active,
  onClick,
  icon,
  tooltip
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  tooltip: string
}) {
  return (
    <Button
      variant={active ? "default" : "ghost"}
      size="icon"
      className={cn(
        "h-8 w-8 rounded-md transition-all",
        active ? "shadow-sm scale-105" : "text-muted-foreground hover:text-foreground"
      )}
      onClick={onClick}
      title={tooltip}
    >
      {icon}
    </Button>
  );
}
