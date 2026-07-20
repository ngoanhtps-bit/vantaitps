"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

// City coordinates - mapped into SVG viewport (0-100)
// Adjusted to match the new Vietnam map shape
export const CITY_COORDS: Record<string, { lat: number; lng: number; x: number; y: number }> = {
  "TP. Hồ Chí Minh": { lat: 10.7626, lng: 106.6601, x: 62, y: 82 },
  "Hà Nội": { lat: 21.0285, lng: 105.8342, x: 55, y: 16 },
  "Đà Nẵng": { lat: 16.0544, lng: 108.2022, x: 64, y: 48 },
  "Hải Phòng": { lat: 20.8449, lng: 106.6881, x: 62, y: 13 },
  "Cần Thơ": { lat: 10.0452, lng: 105.7469, x: 48, y: 88 },
  "Nha Trang": { lat: 12.2388, lng: 109.1967, x: 70, y: 62 },
  "Huế": { lat: 16.4637, lng: 107.5909, x: 60, y: 44 },
  "Vũng Tàu": { lat: 10.9877, lng: 107.0819, x: 70, y: 80 },
  "Bắc Ninh": { lat: 21.061, lng: 106.0548, x: 57, y: 15 },
  "Bình Dương": { lat: 11.1572, lng: 106.5235, x: 58, y: 82 },
  "Đồng Nai": { lat: 10.9458, lng: 106.8443, x: 66, y: 80 },
  "Hải Dương": { lat: 20.6076, lng: 106.3783, x: 59, y: 17 },
};

// Vietnam map path - S-shaped, more realistic
// Based on actual geographic outline, simplified for SVG
const VN_PATH = `
M52 5
L54 6 L55 8 L56 10 L57 12
C58 12, 60 11, 62 12
L63 13 L64 14 L63 15 L62 15
L61 16 L60 17 L59 18 L58 18
L57 19 L56 20 L55 21 L55 23
L54 25 L53 27 L52 28 L51 30
C50 31, 50 33, 51 34
L52 35 L53 36 L54 37 L55 38
L56 39 L57 40 L58 42 L59 43
L60 44 L61 45 L62 47 L63 48
L64 49 L65 50 L66 52 L67 53
L68 55 L69 56 L70 58 L70 60
L71 62 L72 64 L72 66
L73 68 L73 70 L74 72 L74 74
L73 76 L72 78 L71 79 L70 80
L69 81 L68 82 L67 83 L66 84
L64 85 L62 86 L60 87 L58 88
L56 89 L54 90 L52 91 L50 91
L48 90 L46 89 L44 88 L43 86
L42 84 L41 82 L40 80
L39 78 L39 76 L38 74 L38 72
L37 70 L37 68 L36 66 L36 64
L35 62 L35 60 L34 58 L34 56
L33 54 L33 52 L32 50 L32 48
L31 46 L31 44 L30 42 L30 40
L29 38 L29 36 L28 34 L28 32
L27 30 L27 28 L26 26 L26 24
L25 22 L26 20 L27 19 L28 18
L29 17 L30 16 L31 15 L32 14
L33 13 L34 12 L35 11 L36 10
L37 9 L38 8 L40 7 L42 6
L44 5 L46 4 L48 4 L50 4
L52 5
Z
`;

// Simplified province boundaries (decorative)
const PROVINCE_LINES = `
M55 15 L57 20 L58 25
M53 30 L55 35 L57 40
M59 45 L61 50 L63 55
M66 60 L68 65 L70 70
M48 85 L52 83 L56 80
`;

export type MapMarker = {
  id: string;
  type: "live" | "warehouse" | "delayed";
  label?: string;
  x?: number;
  y?: number;
  lat?: number;
  lng?: number;
  city?: string;
  progress?: number;
  color?: string;
};

export type MapRoute = {
  id: string;
  fromCity: string;
  toCity: string;
  progress?: number;
  status?: string;
};

function resolveXY(m: { city?: string; x?: number; y?: number; lat?: number; lng?: number }) {
  if (m.x !== undefined && m.y !== undefined) return { x: m.x, y: m.y };
  if (m.city && CITY_COORDS[m.city]) return { x: CITY_COORDS[m.city].x, y: CITY_COORDS[m.city].y };
  if (m.lat !== undefined && m.lng !== undefined) {
    const x = ((m.lng - 102) / (111 - 102)) * 100;
    const y = ((24 - m.lat) / (24 - 8)) * 100;
    return { x: Math.max(5, Math.min(95, x)), y: Math.max(5, Math.min(95, y)) };
  }
  return { x: 50, y: 50 };
}

export function LogisticsMap({
  markers = [],
  routes = [],
  className,
  showLabels = true,
  height = 380,
  onMarkerClick,
}: {
  markers?: MapMarker[];
  routes?: MapRoute[];
  className?: string;
  showLabels?: boolean;
  height?: number;
  onMarkerClick?: (m: MapMarker) => void;
}) {
  const liveCount = markers.filter((m) => m.type === "live").length;
  const warehouseCount = markers.filter((m) => m.type === "warehouse").length;

  return (
    <div
      className={cn("relative w-full overflow-hidden rounded-xl border bg-gradient-to-br from-sky-50 via-emerald-50/30 to-teal-50 dark:from-slate-900 dark:via-slate-900 dark:to-emerald-950/20", className)}
      style={{ height }}
    >
      <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" className="absolute inset-0 h-full w-full">
        <defs>
          {/* Grid pattern */}
          <pattern id="map-grid" width="5" height="5" patternUnits="userSpaceOnUse">
            <path d="M 5 0 L 0 0 0 5" fill="none" stroke="currentColor" strokeWidth="0.12" className="text-slate-200 dark:text-slate-700" />
          </pattern>

          {/* Vietnam land gradient */}
          <linearGradient id="vn-land-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.15" />
            <stop offset="50%" stopColor="#14b8a6" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.08" />
          </linearGradient>

          {/* Vietnam border glow */}
          <filter id="vn-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="0.8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Shadow for markers */}
          <filter id="marker-shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="0.3" stdDeviation="0.4" floodOpacity="0.4" />
          </filter>
        </defs>

        {/* Background grid */}
        <rect width="100" height="100" fill="url(#map-grid)" />

        {/* Vietnam landmass - detailed shape */}
        <path
          d={VN_PATH}
          fill="url(#vn-land-grad)"
          stroke="#10b981"
          strokeWidth="0.35"
          filter="url(#vn-glow)"
          className="opacity-70"
        />

        {/* Province lines (decorative, subtle) */}
        <path
          d={PROVINCE_LINES}
          fill="none"
          stroke="#10b981"
          strokeWidth="0.15"
          strokeDasharray="0.8 0.8"
          className="opacity-30"
        />

        {/* Routes */}
        {routes.map((r) => {
          const from = CITY_COORDS[r.fromCity];
          const to = CITY_COORDS[r.toCity];
          if (!from || !to) return null;
          const midX = (from.x + to.x) / 2;
          const midY = (from.y + to.y) / 2 - Math.abs(to.x - from.x) * 0.2 - 3;
          const progress = r.progress ?? 50;
          const t = progress / 100;
          const dotX = (1 - t) * (1 - t) * from.x + 2 * (1 - t) * t * midX + t * t * to.x;
          const dotY = (1 - t) * (1 - t) * from.y + 2 * (1 - t) * t * midY + t * t * to.y;
          const color =
            r.status === "delayed" ? "#f97316" :
            r.status === "out_for_delivery" ? "#8b5cf6" :
            r.status === "delivered" ? "#10b981" :
            "#0ea5e9";
          return (
            <g key={r.id}>
              {/* Route line */}
              <path
                d={`M ${from.x} ${from.y} Q ${midX} ${midY} ${to.x} ${to.y}`}
                fill="none"
                stroke={color}
                strokeWidth="0.6"
                strokeDasharray="2 1.5"
                className="opacity-50"
              />
              {/* Glow halo */}
              <circle cx={dotX} cy={dotY} r="3" fill={color} opacity="0.2" />
              {/* Moving dot */}
              <circle cx={dotX} cy={dotY} r="1.8" fill={color} filter="url(#marker-shadow)">
                <animate attributeName="r" values="1.8;2.4;1.8" dur="2s" repeatCount="indefinite" />
              </circle>
            </g>
          );
        })}

        {/* Markers */}
        {markers.map((m) => {
          const { x, y } = resolveXY(m);
          const color =
            m.type === "warehouse" ? "#0284c7" :
            m.type === "delayed" ? "#f97316" :
            "#10b981";
          return (
            <g key={m.id} className="cursor-pointer" onClick={() => onMarkerClick?.(m)}>
              {m.type === "live" && (
                <>
                  {/* Pulsing ring */}
                  <circle cx={x} cy={y} r="3.5" fill={color} opacity="0.15">
                    <animate attributeName="r" values="3.5;7;3.5" dur="2.5s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.4;0;0.4" dur="2.5s" repeatCount="indefinite" />
                  </circle>
                  {/* Inner dot */}
                  <circle cx={x} cy={y} r="2.2" fill={color} stroke="white" strokeWidth="0.5" filter="url(#marker-shadow)" />
                </>
              )}
              {m.type === "warehouse" && (
                <rect
                  x={x - 1.8}
                  y={y - 1.8}
                  width="3.6"
                  height="3.6"
                  rx="0.5"
                  transform={`rotate(45 ${x} ${y})`}
                  fill={color}
                  stroke="white"
                  strokeWidth="0.4"
                  filter="url(#marker-shadow)"
                />
              )}
              {m.type === "delayed" && (
                <>
                  <circle cx={x} cy={y} r="2.5" fill={color} opacity="0.2">
                    <animate attributeName="r" values="2.5;4;2.5" dur="1.5s" repeatCount="indefinite" />
                  </circle>
                  <circle cx={x} cy={y} r="1.6" fill={color} stroke="white" strokeWidth="0.4" filter="url(#marker-shadow)" />
                </>
              )}
            </g>
          );
        })}

        {/* City labels */}
        {showLabels &&
          Object.entries(CITY_COORDS).map(([city, c]) => {
            // Only show main cities (first 8)
            const mainCities = ["TP. Hồ Chí Minh", "Hà Nội", "Đà Nẵng", "Hải Phòng", "Cần Thơ", "Nha Trang", "Huế", "Vũng Tàu"];
            if (!mainCities.includes(city)) return null;
            const shortName = city === "TP. Hồ Chí Minh" ? "TP.HCM" : city === "Hải Phòng" ? "H. Phòng" : city;
            return (
              <text
                key={city}
                x={c.x}
                y={c.y - 4}
                fontSize="2"
                textAnchor="middle"
                className="fill-slate-600 dark:fill-slate-300 font-semibold"
                style={{ paintOrder: "stroke", stroke: "white", strokeWidth: "0.4" }}
              >
                {shortName}
              </text>
            );
          })}
      </svg>

      {/* Scale / ratio indicator */}
      <div className="absolute right-3 top-3 rounded-lg border border-border/50 bg-background/80 px-3 py-1.5 text-[11px] font-medium shadow-sm backdrop-blur-md">
        <span className="text-emerald-600 dark:text-emerald-400">{liveCount} trực tuyến</span>
        <span className="mx-1.5 text-muted-foreground/60">·</span>
        <span className="text-sky-600 dark:text-sky-400">{warehouseCount} kho</span>
      </div>

      {/* Legend */}
      <div className="absolute bottom-3 left-3 flex min-w-[140px] flex-col gap-2 rounded-xl border border-border/50 bg-background/80 p-3 text-[11px] shadow-sm backdrop-blur-md">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Chú giải</span>
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-3 w-3 items-center justify-center">
            <span className="absolute inline-flex h-3 w-3 animate-ping rounded-full bg-emerald-500 opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          <span className="font-medium">Đơn hàng trực tuyến</span>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="h-2.5 w-2.5 rotate-45 rounded-[2px] bg-sky-600" />
          <span className="font-medium">Kho hàng</span>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-3 w-3 items-center justify-center">
            <span className="absolute inline-flex h-3 w-3 animate-ping rounded-full bg-orange-500 opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-orange-500" />
          </span>
          <span className="font-medium">Trễ hạn</span>
        </div>
      </div>
    </div>
  );
}
