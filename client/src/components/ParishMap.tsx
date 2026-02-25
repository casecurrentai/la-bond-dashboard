import { cn } from "@/lib/utils";

interface ParishData {
  parish: string;
  count: number;
  totalBond: number;
}

interface ParishMapProps {
  data: ParishData[];
  selectedParish: string | null;
  onParishClick: (parish: string | null) => void;
}

// Simplified SVG paths for the 3 pilot parishes positioned in Louisiana
const PARISH_PATHS: Record<string, { d: string; label: string; cx: number; cy: number }> = {
  "St. Mary": {
    d: "M 180 280 L 220 270 L 260 275 L 270 300 L 250 320 L 210 325 L 185 310 Z",
    label: "St. Mary",
    cx: 225,
    cy: 295,
  },
  Allen: {
    d: "M 120 180 L 170 175 L 180 200 L 175 230 L 130 235 L 115 210 Z",
    label: "Allen",
    cx: 148,
    cy: 205,
  },
  Evangeline: {
    d: "M 150 130 L 195 125 L 205 155 L 200 180 L 155 185 L 140 160 Z",
    label: "Evangeline",
    cx: 172,
    cy: 155,
  },
};

function getHeatColor(count: number, maxCount: number): string {
  if (count === 0) return "oklch(0.93 0.01 85)";
  const intensity = Math.min(count / Math.max(maxCount, 1), 1);
  // Interpolate from gold to terracotta
  if (intensity < 0.5) {
    return `oklch(${0.75 - intensity * 0.3} ${0.10 + intensity * 0.08} 85)`;
  }
  return `oklch(${0.60 - (intensity - 0.5) * 0.2} ${0.12 + (intensity - 0.5) * 0.06} 40)`;
}

export default function ParishMap({ data, selectedParish, onParishClick }: ParishMapProps) {
  const maxCount = Math.max(...data.map((d) => d.count), 1);

  return (
    <div className="relative">
      <svg
        viewBox="0 0 400 400"
        className="w-full h-auto max-h-[320px]"
        style={{ filter: "drop-shadow(0 2px 8px oklch(0.35 0.06 160 / 0.1))" }}
      >
        {/* Background Louisiana outline (simplified) */}
        <path
          d="M 50 50 L 350 40 L 360 120 L 340 180 L 350 250 L 320 300 L 300 350 L 250 370 L 200 360 L 150 370 L 100 340 L 70 280 L 60 200 L 50 120 Z"
          fill="oklch(0.93 0.015 85)"
          stroke="oklch(0.80 0.03 85)"
          strokeWidth="1.5"
          opacity="0.5"
        />

        {/* Decorative contour lines */}
        <path
          d="M 80 100 Q 200 80 320 100"
          fill="none"
          stroke="oklch(0.85 0.02 85)"
          strokeWidth="0.5"
          strokeDasharray="4 4"
        />
        <path
          d="M 70 200 Q 200 180 340 200"
          fill="none"
          stroke="oklch(0.85 0.02 85)"
          strokeWidth="0.5"
          strokeDasharray="4 4"
        />
        <path
          d="M 80 300 Q 200 280 320 300"
          fill="none"
          stroke="oklch(0.85 0.02 85)"
          strokeWidth="0.5"
          strokeDasharray="4 4"
        />

        {/* Parish shapes */}
        {Object.entries(PARISH_PATHS).map(([parish, path]) => {
          const parishData = data.find((d) => d.parish === parish);
          const count = parishData?.count ?? 0;
          const isSelected = selectedParish === parish;
          const fillColor = getHeatColor(count, maxCount);

          return (
            <g key={parish} className="cursor-pointer" onClick={() => onParishClick(isSelected ? null : parish)}>
              <path
                d={path.d}
                fill={fillColor}
                stroke={isSelected ? "oklch(0.35 0.06 160)" : "oklch(0.70 0.03 85)"}
                strokeWidth={isSelected ? 3 : 1.5}
                className="transition-all duration-300 hover:opacity-80"
              />
              <text
                x={path.cx}
                y={path.cy - 8}
                textAnchor="middle"
                className="text-[9px] font-semibold fill-foreground pointer-events-none"
                style={{ fontFamily: "DM Sans" }}
              >
                {path.label}
              </text>
              <text
                x={path.cx}
                y={path.cy + 6}
                textAnchor="middle"
                className="text-[8px] fill-muted-foreground pointer-events-none"
                style={{ fontFamily: "JetBrains Mono" }}
              >
                {count} bookings
              </text>
            </g>
          );
        })}

        {/* Map title */}
        <text x="200" y="385" textAnchor="middle" className="text-[10px] fill-muted-foreground" style={{ fontFamily: "DM Sans" }}>
          Click a parish to filter data
        </text>
      </svg>
    </div>
  );
}
