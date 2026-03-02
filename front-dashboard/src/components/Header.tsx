import { Wifi, WifiOff, Activity } from "lucide-react";

interface HeaderProps {
  totalBandwidthKbps: number;
  onlineCount: number;
  totalCount: number;
}

export function Header({ totalBandwidthKbps, onlineCount, totalCount }: HeaderProps) {
  const isConnected = onlineCount > 0;
  const totalMbps = (totalBandwidthKbps / 1000).toFixed(1);

  return (
    <header className="glass sticky top-0 z-50 border-b border-border">
      <div className="container mx-auto flex items-center justify-between px-4 py-3 md:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <Activity className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h1 className="text-base font-semibold leading-tight">Smart Focus Streaming</h1>
            <p className="text-xs text-muted-foreground">{onlineCount}/{totalCount} cameras online</p>
          </div>
        </div>

        <div className="flex items-center gap-4 md:gap-6">
          <div className="hidden items-center gap-2 md:flex">
            <span className="text-xs text-muted-foreground">Total bandwidth</span>
            <span className="text-data font-semibold text-foreground">{totalMbps} Mbps</span>
          </div>

          <div className="flex items-center gap-2">
            {isConnected ? (
              <>
                <Wifi className="h-4 w-4 text-success" />
                <span className="text-xs text-success">Connected</span>
              </>
            ) : (
              <>
                <WifiOff className="h-4 w-4 text-destructive" />
                <span className="text-xs text-destructive">Offline</span>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
