import { useState, useRef, useCallback } from "react";
import { FocusArea } from "@/types/camera";
import { cn } from "@/lib/utils";

interface FocusAreaSelectorProps {
  focusArea?: FocusArea;
  onFocusAreaChange: (area: FocusArea | undefined) => void;
  disabled?: boolean;
  className?: string;
  /** Video URL for the live feed. Ignored when liveFeedNode is provided. */
  streamUrl?: string | null;
  /** When provided, renders this as the live feed (e.g. WebRTC player) instead of streamUrl. */
  liveFeedNode?: React.ReactNode;
}

export function FocusAreaSelector({
  focusArea,
  onFocusAreaChange,
  disabled,
  className,
  streamUrl,
  liveFeedNode,
}: FocusAreaSelectorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [drawing, setDrawing] = useState(false);
  const [drawingArea, setDrawingArea] = useState<FocusArea | undefined>();

  const getRelativePos = useCallback((e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    };
  }, []);

  const startPosRef = useRef({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    if (disabled) return;
    e.preventDefault();
    const pos = getRelativePos(e);
    startPosRef.current = pos;
    setDrawing(true);
    setDrawingArea(undefined);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!drawing) return;
    const pos = getRelativePos(e);
    const start = startPosRef.current;
    setDrawingArea({
      x: Math.min(start.x, pos.x),
      y: Math.min(start.y, pos.y),
      width: Math.abs(pos.x - start.x),
      height: Math.abs(pos.y - start.y),
    });
  };

  const handleMouseUp = () => {
    if (!drawing) return;
    setDrawing(false);
    if (drawingArea && drawingArea.width > 2 && drawingArea.height > 2) {
      onFocusAreaChange(drawingArea);
    }
    setDrawingArea(undefined);
  };

  // Only show the rectangle while actively drawing
  const displayArea = drawing ? drawingArea : undefined;

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative cursor-crosshair select-none overflow-hidden aspect-[4/3]",
        disabled && "cursor-default",
        className
      )}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={() => drawing && handleMouseUp()}
    >
      {/* Live video or placeholder */}
      {liveFeedNode ? (
        <div className="absolute inset-0 pointer-events-none">
          {liveFeedNode}
        </div>
      ) : streamUrl ? (
        <video
          className="absolute inset-0 h-full w-full object-cover"
          src={streamUrl}
          autoPlay
          muted
          loop
          playsInline
        />
      ) : (
        <>
          <div className="absolute inset-0 bg-gradient-to-br from-secondary to-muted" />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs text-muted-foreground/40 uppercase tracking-widest">Live Feed</span>
          </div>
        </>
      )}

      {/* Grid overlay (subtle; more visible on hover when video present) */}
      <div className={cn("absolute inset-0", (streamUrl || liveFeedNode) ? "opacity-0 hover:opacity-10 transition-opacity" : "opacity-10")}>
        <svg className="h-full w-full">
          <defs>
            <pattern id="grid-focus" width="10%" height="10%" patternUnits="objectBoundingBox">
              <path d="M 100 0 L 0 0 0 100" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-muted-foreground" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid-focus)" />
        </svg>
      </div>

      {/* Focus area rectangle — only visible while drawing; disappears on release, reappears on next drag */}
      {displayArea && (
        <>
          <div className="absolute inset-0 bg-background/60" />
          <div
            className="absolute border-2 border-primary bg-transparent shadow-[0_0_20px_hsl(174_72%_50%/0.3)]"
            style={{
              left: `${displayArea.x}%`,
              top: `${displayArea.y}%`,
              width: `${displayArea.width}%`,
              height: `${displayArea.height}%`,
            }}
          >
            <div className="absolute -left-1 -top-1 h-2 w-2 rounded-full bg-primary" />
            <div className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-primary" />
            <div className="absolute -bottom-1 -left-1 h-2 w-2 rounded-full bg-primary" />
            <div className="absolute -bottom-1 -right-1 h-2 w-2 rounded-full bg-primary" />
            <div className="absolute -top-6 left-0">
              <span className="text-data text-[10px] text-primary">
                FOCUS ZONE ({Math.round(displayArea.width)}% × {Math.round(displayArea.height)}%)
              </span>
            </div>
          </div>
        </>
      )}

      {/* Instructions */}
      {!focusArea && !drawing && !disabled && (
        <div className="absolute bottom-2 left-2 rounded-md bg-card/80 px-2 py-1 text-[10px] text-muted-foreground backdrop-blur-sm">
          Click & drag to select focus area
        </div>
      )}
    </div>
  );
}
