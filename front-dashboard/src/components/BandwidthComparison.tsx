import { cn } from "@/lib/utils";
import { TrendingDown } from "lucide-react";

interface BandwidthComparisonProps {
  currentKbps: number;
  originalKbps: number;
  currentHistory: number[];
  originalHistory: number[];
  smartFocusEnabled: boolean;
}

export function BandwidthComparison({
  currentKbps,
  originalKbps,
  currentHistory,
  originalHistory,
  smartFocusEnabled,
}: BandwidthComparisonProps) {
  const savedKbps = smartFocusEnabled ? originalKbps - currentKbps : 0;
  const savedPercent = smartFocusEnabled && originalKbps > 0
    ? Math.round((savedKbps / originalKbps) * 100)
    : 0;

  const maxVal = Math.max(...originalHistory, ...currentHistory, 1);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Bandwidth Comparison
        </h4>
        {smartFocusEnabled && savedPercent > 0 && (
          <div className="flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5">
            <TrendingDown className="h-3 w-3 text-success" />
            <span className="text-data text-[10px] text-success font-semibold">
              {savedPercent}% saved
            </span>
          </div>
        )}
      </div>

      {/* Comparison bars */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <span className="w-16 text-[10px] text-muted-foreground uppercase">Original</span>
          <div className="relative h-4 flex-1 overflow-hidden rounded-full bg-secondary">
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-muted-foreground/30 transition-all duration-500"
              style={{ width: `${(originalKbps / maxVal) * 100}%` }}
            />
          </div>
          <span className="text-data w-20 text-right text-xs text-muted-foreground">
            {(originalKbps / 1000).toFixed(1)} Mbps
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="w-16 text-[10px] text-primary uppercase font-medium">Optimized</span>
          <div className="relative h-4 flex-1 overflow-hidden rounded-full bg-secondary">
            <div
              className={cn(
                "absolute inset-y-0 left-0 rounded-full transition-all duration-500",
                smartFocusEnabled ? "bg-primary/60" : "bg-muted-foreground/30"
              )}
              style={{ width: `${(currentKbps / maxVal) * 100}%` }}
            />
          </div>
          <span className="text-data w-20 text-right text-xs text-foreground font-semibold">
            {(currentKbps / 1000).toFixed(1)} Mbps
          </span>
        </div>
      </div>

      {/* Sparkline comparison chart */}
      <div className="rounded-lg bg-secondary/50 p-3">
        <svg viewBox="0 0 300 80" className="w-full" preserveAspectRatio="none">
          {/* Original bandwidth line */}
          <polyline
            fill="none"
            stroke="hsl(var(--muted-foreground))"
            strokeWidth="1.5"
            strokeDasharray="4 2"
            opacity="0.4"
            points={originalHistory
              .map((v, i) => `${(i / (originalHistory.length - 1)) * 300},${80 - (v / maxVal) * 70}`)
              .join(" ")}
          />
          {/* Current bandwidth line */}
          <polyline
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="2"
            points={currentHistory
              .map((v, i) => `${(i / (currentHistory.length - 1)) * 300},${80 - (v / maxVal) * 70}`)
              .join(" ")}
          />
          {/* Savings area fill */}
          {smartFocusEnabled && (
            <polygon
              fill="hsl(var(--success))"
              opacity="0.1"
              points={[
                ...originalHistory.map(
                  (v, i) => `${(i / (originalHistory.length - 1)) * 300},${80 - (v / maxVal) * 70}`
                ),
                ...currentHistory
                  .map(
                    (v, i) => `${(i / (currentHistory.length - 1)) * 300},${80 - (v / maxVal) * 70}`
                  )
                  .reverse(),
              ].join(" ")}
            />
          )}
        </svg>
        <div className="mt-2 flex items-center gap-4 text-[10px] text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="h-0.5 w-4 rounded bg-muted-foreground/40" style={{ borderTop: "1px dashed" }} />
            Original
          </div>
          <div className="flex items-center gap-1">
            <div className="h-0.5 w-4 rounded bg-primary" />
            Optimized
          </div>
          {smartFocusEnabled && (
            <div className="flex items-center gap-1">
              <div className="h-2 w-4 rounded bg-success/20" />
              Savings
            </div>
          )}
        </div>
      </div>

      {!smartFocusEnabled && (
        <p className="text-[10px] text-muted-foreground italic">
          Enable Smart Focus to see bandwidth savings
        </p>
      )}
    </div>
  );
}
