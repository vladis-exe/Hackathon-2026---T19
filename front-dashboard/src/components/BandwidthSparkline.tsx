interface BandwidthSparklineProps {
  data: number[];
  width?: number;
  height?: number;
}

export function BandwidthSparkline({ data, width = 120, height = 32 }: BandwidthSparklineProps) {
  if (data.length < 2) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const points = data
    .map((val, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((val - min) / range) * (height - 4) - 2;
      return `${x},${y}`;
    })
    .join(" ");

  const areaPoints = `0,${height} ${points} ${width},${height}`;

  return (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id="sparkGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="hsl(174 72% 50%)" stopOpacity="0.3" />
          <stop offset="100%" stopColor="hsl(174 72% 50%)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill="url(#sparkGradient)" />
      <polyline
        points={points}
        fill="none"
        stroke="hsl(174 72% 50%)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
