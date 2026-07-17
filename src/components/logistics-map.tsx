"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Truck, Warehouse, Package } from "lucide-react";

// City coordinates (lat/lng) for Vietnam — mapped into a 0-100 SVG viewport
export const CITY_COORDS: Record<string, { lat: number; lng: number; x: number; y: number }> = {
  "Ho Chi Minh City": { lat: 10.7626, lng: 106.6601, x: 60, y: 88 },
  Hanoi: { lat: 21.0285, lng: 105.8342, x: 58, y: 18 },
  "Da Nang": { lat: 16.0544, lng: 108.2022, x: 55, y: 55 },
  "Hai Phong": { lat: 20.8449, lng: 106.6881, x: 66, y: 20 },
  "Can Tho": { lat: 10.0452, lng: 105.7469, x: 48, y: 92 },
  "Nha Trang": { lat: 12.2388, lng: 109.1967, x: 66, y: 70 },
  Hue: { lat: 16.4637, lng: 107.5909, x: 52, y: 52 },
  "Vung Tau": { lat: 10.9877, lng: 107.0819, x: 68, y: 86 },
};

// approximate Vietnam landmass path (stylized)
const VN_PATH =
  "M50 8 C54 8 56 11 57 15 L59 17 C62 16 64 18 66 20 L67 22 C70 21 71 24 70 27 L68 30 C70 33 71 37 69 40 L66 42 C68 45 69 49 67 52 L64 55 C66 58 67 62 65 65 L62 68 C64 71 65 75 63 78 L60 81 C62 84 62 88 60 91 L57 94 C54 95 51 94 49 92 L47 95 C44 95 41 93 40 90 L38 87 C36 84 36 80 38 77 L40 74 C37 71 36 67 38 64 L40 61 C37 58 36 54 38 51 L41 48 C38 45 37 41 39 38 L42 35 C40 32 39 28 41 25 L44 22 C42 19 43 15 46 13 L48 10 C49 9 49 8 50 8 Z";

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
  // fallback: map lat/lng roughly into viewport
  if (m.lat !== undefined && m.lng !== undefined) {
    const x = ((m.lng - 102) / (110 - 102)) * 100;
    const y = ((23 - m.lat) / (23 - 8)) * 100;
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
      className={cn("relative w-full overflow-hidden rounded-xl border bg-gradient-to-br from-sky-50 via-emerald-50/40 to-teal-50 dark:from-slate-900 dark:via-slate-900 dark:to-emerald-950/30", className)}
      style={{ height }}
    >
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
        {/* grid */}
        <defs>
          <pattern id="map-grid" width="5" height="5" patternUnits="userSpaceOnUse">
            <path d="M 5 0 L 0 0 0 5" fill="none" stroke="currentColor" strokeWidth="0.15" className="text-slate-300/80 dark:text-slate-600" />
          </pattern>
          <linearGradient id="vn-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="oklch(0.85 0.15 160)" stopOpacity="0.25" />
            <stop offset="100%" stopColor="oklch(0.7 0.18 200)" stopOpacity="0.15" />
          </linearGradient>
        </defs>
        <rect width="100" height="100" fill="url(#map-grid)" />

        {/* Vietnam landmass */}
        <path
          d={VN_PATH}
          fill="url(#vn-grad)"
          stroke="oklch(0.5 0.15 160)"
          strokeWidth="0.4"
          className="opacity-60"
        />

        {/* routes */}
        {routes.map((r) => {
          const from = CITY_COORDS[r.fromCity];
          const to = CITY_COORDS[r.toCity];
          if (!from || !to) return null;
          const midX = (from.x + to.x) / 2;
          const midY = (from.y + to.y) / 2 - Math.abs(to.x - from.x) * 0.25 - 4;
          const progress = r.progress ?? 50;
          // moving dot position along quadratic curve
          const t = progress / 100;
          const dotX = (1 - t) * (1 - t) * from.x + 2 * (1 - t) * t * midX + t * t * to.x;
          const dotY = (1 - t) * (1 - t) * from.y + 2 * (1 - t) * t * midY + t * t * to.y;
          const color =
            r.status === "delayed" ? "oklch(0.65 0.2 30)" :
            r.status === "out_for_delivery" ? "oklch(0.6 0.2 300)" :
            "oklch(0.6 0.18 180)";
          return (
            <g key={r.id}>
              <path
                d={`M ${from.x} ${from.y} Q ${midX} ${midY} ${to.x} ${to.y}`}
                fill="none"
                stroke={color}
                strokeWidth="0.5"
                strokeDasharray="1.5 1.5"
                className="opacity-60"
              />
              {/* glow halo behind moving dot */}
              <circle cx={dotX} cy={dotY} r="2.8" fill={color} opacity="0.25" />
              <circle cx={dotX} cy={dotY} r="1.6" fill={color}>
                <animate attributeName="r" values="1.6;2;1.6" dur="2s" repeatCount="indefinite" />
              </circle>
            </g>
          );
        })}

        {/* markers */}
        {markers.map((m) => {
          const { x, y } = resolveXY(m);
          const color =
            m.type === "warehouse" ? "oklch(0.55 0.18 260)" :
            m.type === "delayed" ? "oklch(0.65 0.22 30)" :
            "oklch(0.6 0.19 160)";
          return (
            <g key={m.id} className="cursor-pointer" onClick={() => onMarkerClick?.(m)}>
              {m.type === "live" && (
                <>
                  <circle cx={x} cy={y} r="3" fill={color} opacity="0.3">
                    <animate attributeName="r" values="3;6.5;3" dur="2.5s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.5;0;0.5" dur="2.5s" repeatCount="indefinite" />
                  </circle>
                  <circle cx={x} cy={y} r="2.2" fill={color} stroke="white" strokeWidth="0.4" />
                </>
              )}
              {m.type === "warehouse" && (
                <rect
                  x={x - 2}
                  y={y - 2}
                  width="4"
                  height="4"
                  rx="0.6"
                  transform={`rotate(45 ${x} ${y})`}
                  fill={color}
                  stroke="white"
                  strokeWidth="0.4"
                />
              )}
              {m.type === "delayed" && (
                <circle cx={x} cy={y} r="1.6" fill={color} stroke="white" strokeWidth="0.4" />
              )}
            </g>
          );
        })}

        {/* city labels */}
        {showLabels &&
          Object.entries(CITY_COORDS).map(([city, c]) => (
            <text
              key={city}
              x={c.x}
              y={c.y - 3}
              fontSize="1.6"
              textAnchor="middle"
              className="fill-slate-500 dark:fill-slate-400 font-medium"
            >
              {city.length > 14 ? city.split(" ")[0] : city}
            </text>
          ))}
      </svg>

      {/* Scale / ratio indicator */}
      <div className="absolute right-3 top-3 rounded-lg border border-border/50 bg-background/70 px-3 py-1.5 text-[11px] font-medium shadow-sm backdrop-blur-md">
        <span className="text-emerald-600 dark:text-emerald-400">{liveCount} live</span>
        <span className="mx-1.5 text-muted-foreground/60">·</span>
        <span className="text-sky-600 dark:text-sky-400">{warehouseCount} warehouses</span>
      </div>

      {/* Legend */}
      <div className="absolute bottom-3 left-3 flex min-w-[140px] flex-col gap-2 rounded-xl border border-border/50 bg-background/70 p-3 text-[11px] shadow-sm backdrop-blur-md">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Legend</span>
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-3 w-3 items-center justify-center">
            <span className="absolute inline-flex h-3 w-3 animate-ping rounded-full bg-emerald-500 opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          <span className="font-medium">Live shipment</span>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="h-2.5 w-2.5 rotate-45 rounded-[2px] bg-sky-600" />
          <span className="font-medium">Warehouse</span>
        </div>
        <div className="flex items-center gap-2.5">
          <svg width="11" height="11" viewBox="0 0 10 10" className="text-orange-500">
            <polygon points="5,0.5 9.5,9 0.5,9" fill="currentColor" />
          </svg>
          <span className="font-medium">Delayed</span>
        </div>
      </div>
    </div>
  );
}
