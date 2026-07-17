"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { KpiCard, EmptyState } from "@/components/kpi-card";
import { StatusBadge } from "@/components/status-badge";
import { LogisticsMap } from "@/components/logistics-map";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Package, Truck, Users, DollarSign, TrendingUp, AlertTriangle,
  MapPin, ArrowRight, Activity, Clock, CheckCircle2, Boxes,
  Plus, BarChart3,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  BarChart, Bar, PieChart, Pie, Cell, Legend,
} from "recharts";
import { useAppStore } from "@/lib/store";
import { useSettingsStore } from "@/lib/settings-store";
import {
  formatCurrency, formatNumber, formatRelativeTime, formatCompact, initials,
} from "@/lib/format";
import { SHIPMENT_STATUS_META } from "@/lib/constants";
import { avatarColorClass } from "@/components/avatar-color";
import { cn } from "@/lib/utils";

type DashboardData = {
  totals: {
    shipments: number; activeShipments: number; drivers: number; vehicles: number;
    customers: number; warehouses: number; delivered: number; delayed: number; inTransit: number;
  };
  statusCounts: Record<string, number>;
  revenue: { total: number; pending: number };
  recentShipments: Array<{
    id: string; trackingNumber: string; status: string; priority: string; cost: number;
    originCity: string; destinationCity: string; createdAt: string;
    sender: { name: string }; receiver: { name: string };
    driver: { name: string; avatarColor: string } | null;
  }>;
  topDrivers: Array<{
    id: string; name: string; avatarColor: string; totalDeliveries: number;
    rating: number; totalDistance: number; status: string;
    vehicle: { plateNumber: string; model: string } | null;
  }>;
  dailyVolume: Array<{ date: string; total: number; delivered: number; revenue: number }>;
  liveShipments: Array<{
    id: string; trackingNumber: string; status: string; progress: number;
    currentLat: number | null; currentLng: number | null;
    originCity: string; destinationCity: string;
  }>;
  cityThroughput: Array<{ originCity: string; _count: number }>;
  vehicleStatus: Array<{ status: string; _count: number }>;
  vehicleTypeBreakdown: Array<{ type: string; _count: number }>;
  warehouses: Array<{
    id: string; name: string; city: string; capacity: number; used: number; status: string;
  }>;
};

const STATUS_COLORS: Record<string, string> = {
  pending: "#94a3b8",
  picked_up: "#0ea5e9",
  in_transit: "#f59e0b",
  out_for_delivery: "#8b5cf6",
  delivered: "#10b981",
  delayed: "#f97316",
  cancelled: "#f43f5e",
  returned: "#ef4444",
};

export function DashboardView() {
  const { setView, setSelectedShipmentId } = useAppStore();
  const dashboardRefresh = useSettingsStore((s) => s.dashboardRefreshInterval);
  const showHeroBanner = useSettingsStore((s) => s.showHeroBanner);
  const { data, isLoading } = useQuery<DashboardData>({
    queryKey: ["dashboard"],
    queryFn: () => api.get("/api/dashboard"),
    refetchInterval: Number(dashboardRefresh) || false,
  });

  if (isLoading || !data) {
    return <DashboardSkeleton />;
  }

  const { totals, statusCounts, revenue, recentShipments, topDrivers, dailyVolume, liveShipments, cityThroughput, vehicleStatus } = data;
  const onTimeRate = totals.shipments > 0 ? Math.round((totals.delivered / totals.shipments) * 100) : 0;

  const mapMarkers = [
    ...liveShipments.map((s) => ({
      id: s.id,
      type: "live" as const,
      lat: s.currentLat ?? undefined,
      lng: s.currentLng ?? undefined,
      label: s.trackingNumber,
    })),
    ...data.warehouses.map((w) => ({
      id: w.id,
      type: "warehouse" as const,
      city: w.city,
      label: w.name,
    })),
  ];

  const mapRoutes = liveShipments.slice(0, 8).map((s) => ({
    id: s.id,
    fromCity: s.originCity,
    toCity: s.destinationCity,
    progress: s.progress,
    status: s.status,
  }));

  const pieData = Object.entries(statusCounts).map(([k, v]) => ({ name: SHIPMENT_STATUS_META[k as keyof typeof SHIPMENT_STATUS_META]?.label ?? k, value: v, key: k }));

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const today = now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  return (
    <div className="space-y-5">
      {/* Hero banner */}
      {showHeroBanner && (
      <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 p-6 text-white shadow-lg shadow-emerald-500/20 sm:p-7">
        {/* decorative shapes */}
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-20 right-32 h-48 w-48 rounded-full bg-cyan-300/20 blur-2xl" />
        <div className="pointer-events-none absolute right-10 top-8 hidden h-32 w-32 opacity-10 sm:block">
          <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="3">
            <path d="M20 70 L20 40 L50 20 L80 40 L80 70 M20 70 L80 70 M35 70 L35 50 L65 50 L65 70" />
            <circle cx="30" cy="78" r="6" />
            <circle cx="70" cy="78" r="6" />
          </svg>
        </div>

        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider backdrop-blur-sm">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-white" />
                </span>
                Live · {totals.activeShipments} active
              </span>
              <span className="text-[11px] font-medium text-emerald-50/80">{today}</span>
            </div>
            <h2 className="text-xl font-bold tracking-tight sm:text-2xl">{greeting}, Ops Team 👋</h2>
            <p className="mt-1 max-w-lg text-sm text-emerald-50/90">
              You have <span className="font-semibold text-white">{totals.inTransit}</span> shipments in transit,{" "}
              <span className="font-semibold text-white">{totals.delayed}</span> delayed, and{" "}
              <span className="font-semibold text-white">{formatCurrency(revenue.total)}</span> delivered revenue.
            </p>
          </div>

          {/* quick stats tiles */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <HeroStat label="Delivered" value={formatNumber(totals.delivered)} icon={CheckCircle2} />
            <HeroStat label="In Transit" value={formatNumber(totals.inTransit)} icon={Truck} />
            <HeroStat label="Delayed" value={formatNumber(totals.delayed)} icon={AlertTriangle} alert={totals.delayed > 0} />
          </div>
        </div>

        {/* quick actions */}
        <div className="relative mt-5 flex flex-wrap gap-2">
          <button
            onClick={() => { setView("shipments"); window.dispatchEvent(new CustomEvent("open-new-shipment")); }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-white/15 px-3 py-1.5 text-xs font-medium backdrop-blur-sm transition-colors hover:bg-white/25"
          >
            <Plus className="h-3.5 w-3.5" /> New Shipment
          </button>
          <button
            onClick={() => setView("tracking")}
            className="inline-flex items-center gap-1.5 rounded-lg bg-white/15 px-3 py-1.5 text-xs font-medium backdrop-blur-sm transition-colors hover:bg-white/25"
          >
            <MapPin className="h-3.5 w-3.5" /> Live Tracking
          </button>
          <button
            onClick={() => setView("analytics")}
            className="inline-flex items-center gap-1.5 rounded-lg bg-white/15 px-3 py-1.5 text-xs font-medium backdrop-blur-sm transition-colors hover:bg-white/25"
          >
            <BarChart3 className="h-3.5 w-3.5" /> View Analytics
          </button>
        </div>
      </div>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        <KpiCard
          title="Total Shipments"
          value={formatNumber(totals.shipments)}
          icon={Package}
          accent="emerald"
          trend={12.5}
          trendLabel="vs last month"
          footer={`${totals.activeShipments} active now`}
        />
        <KpiCard
          title="Active Deliveries"
          value={formatNumber(totals.inTransit)}
          icon={Truck}
          accent="amber"
          trend={8.2}
          trendLabel="in transit"
          footer={`${totals.delayed} delayed`}
        />
        <KpiCard
          title="Revenue (delivered)"
          value={formatCurrency(revenue.total)}
          icon={DollarSign}
          accent="teal"
          trend={15.3}
          trendLabel="vs last month"
          footer={`${formatCurrency(revenue.pending)} pending`}
        />
        <KpiCard
          title="On-time Rate"
          value={`${onTimeRate}%`}
          icon={CheckCircle2}
          accent="sky"
          trend={2.1}
          trendLabel="service level"
          footer={`${totals.delivered} delivered`}
        />
        <KpiCard
          title="Fleet & Drivers"
          value={`${totals.vehicles}/${totals.drivers}`}
          icon={Boxes}
          accent="violet"
          footer="vehicles / drivers"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Volume area chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-start justify-between space-y-0">
            <div>
              <CardTitle className="text-base">Shipment Volume</CardTitle>
              <CardDescription className="text-xs">Daily shipments & deliveries · last 14 days</CardDescription>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500" /> Created
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-sky-500" /> Delivered
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={dailyVolume} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="g-created" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="g-delivered" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.9 0 0)" className="dark:opacity-30" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickFormatter={(d) => new Date(d).toLocaleDateString("en-US", { day: "numeric", month: "short" })}
                  tick={{ fontSize: 10, fill: "oklch(0.5 0 0)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis tick={{ fontSize: 10, fill: "oklch(0.5 0 0)" }} axisLine={false} tickLine={false} width={28} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 8, border: "1px solid oklch(0.9 0 0)", fontSize: 12,
                    background: "oklch(1 0 0)",
                  }}
                  labelFormatter={(d) => new Date(d as string).toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short" })}
                />
                <Area type="monotone" dataKey="total" name="Created" stroke="#10b981" strokeWidth={2} fill="url(#g-created)" />
                <Area type="monotone" dataKey="delivered" name="Delivered" stroke="#0ea5e9" strokeWidth={2} fill="url(#g-delivered)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Status pie */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Status Distribution</CardTitle>
            <CardDescription className="text-xs">Current shipment statuses</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={48}
                  outerRadius={80}
                  paddingAngle={2}
                >
                  {pieData.map((entry) => (
                    <Cell key={entry.key} fill={STATUS_COLORS[entry.key] || "#94a3b8"} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12, border: "1px solid oklch(0.9 0 0)" }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-2 grid grid-cols-2 gap-1.5">
              {pieData.slice(0, 8).map((p) => (
                <div key={p.key} className="flex items-center gap-1.5 text-[11px]">
                  <span className="h-2 w-2 rounded-full" style={{ background: STATUS_COLORS[p.key] }} />
                  <span className="text-muted-foreground">{p.name}</span>
                  <span className="ml-auto font-medium tabular-nums">{p.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Live map + alerts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                Live Fleet Tracking
              </CardTitle>
              <CardDescription className="text-xs">{liveShipments.length} shipments currently in motion</CardDescription>
            </div>
            <Button variant="ghost" size="sm" className="gap-1 text-xs" onClick={() => setView("tracking")}>
              View full map <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </CardHeader>
          <CardContent>
            <LogisticsMap markers={mapMarkers} routes={mapRoutes} height={300} showLabels />
          </CardContent>
        </Card>

        {/* Alerts + city throughput */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <AlertTriangle className="h-4 w-4 text-orange-500" />
                Needs Attention
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pt-0">
              <div className="flex items-center justify-between rounded-lg bg-orange-50 dark:bg-orange-950/30 px-3 py-2">
                <span className="text-sm">Delayed shipments</span>
                <span className="text-lg font-bold text-orange-600 dark:text-orange-400">{totals.delayed}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-sky-50 dark:bg-sky-950/30 px-3 py-2">
                <span className="text-sm">In transit</span>
                <span className="text-lg font-bold text-sky-600 dark:text-sky-400">{statusCounts.in_transit || 0}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-violet-50 dark:bg-violet-950/30 px-3 py-2">
                <span className="text-sm">Out for delivery</span>
                <span className="text-lg font-bold text-violet-600 dark:text-violet-400">{statusCounts.out_for_delivery || 0}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-rose-50 dark:bg-rose-950/30 px-3 py-2">
                <span className="text-sm">Cancelled / Returned</span>
                <span className="text-lg font-bold text-rose-600 dark:text-rose-400">{(statusCounts.cancelled || 0) + (statusCounts.returned || 0)}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Top Origin Cities</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={cityThroughput} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="originCity" tick={{ fontSize: 10, fill: "oklch(0.5 0 0)" }} axisLine={false} tickLine={false} width={70} />
                  <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12, border: "1px solid oklch(0.9 0 0)" }} cursor={{ fill: "oklch(0.95 0 0)" }} />
                  <Bar dataKey="_count" name="Shipments" fill="#10b981" radius={[0, 4, 4, 0]} barSize={14} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent shipments + top drivers */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-base">Recent Shipments</CardTitle>
              <CardDescription className="text-xs">Latest 8 shipments</CardDescription>
            </div>
            <Button variant="ghost" size="sm" className="gap-1 text-xs" onClick={() => setView("shipments")}>
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {recentShipments.map((s) => (
                <button
                  key={s.id}
                  onClick={() => { setSelectedShipmentId(s.id); setView("shipments"); }}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <Package className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-mono text-xs font-semibold">{s.trackingNumber}</span>
                    </div>
                    <p className="truncate text-xs text-muted-foreground">
                      {s.originCity} → {s.destinationCity}
                    </p>
                  </div>
                  <div className="hidden text-right sm:block">
                    <p className="text-xs font-medium tabular-nums">{formatCurrency(s.cost)}</p>
                    <p className="text-[10px] text-muted-foreground">{formatRelativeTime(s.createdAt)}</p>
                  </div>
                  <StatusBadge status={s.status} kind="shipment" />
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-base">Top Drivers</CardTitle>
              <CardDescription className="text-xs">By total deliveries</CardDescription>
            </div>
            <Button variant="ghost" size="sm" className="gap-1 text-xs" onClick={() => setView("drivers")}>
              All <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {topDrivers.map((d, i) => (
              <div key={d.id} className="flex items-center gap-3">
                <span className="w-4 text-center text-xs font-bold text-muted-foreground">{i + 1}</span>
                <Avatar className="h-9 w-9">
                  <AvatarFallback className={cn("text-xs font-semibold text-white", avatarColorClass(d.avatarColor))}>
                    {initials(d.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{d.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {d.vehicle ? `${d.vehicle.plateNumber} · ` : ""}{formatNumber(d.totalDeliveries)} deliveries
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold tabular-nums">★ {d.rating.toFixed(1)}</p>
                  <p className="text-[10px] text-muted-foreground">{formatCompact(d.totalDistance)} km</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-5">
      <Skeleton className="h-40 rounded-2xl" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Skeleton className="h-72 rounded-xl lg:col-span-2" />
        <Skeleton className="h-72 rounded-xl" />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Skeleton className="h-80 rounded-xl lg:col-span-2" />
        <Skeleton className="h-80 rounded-xl" />
      </div>
    </div>
  );
}

function HeroStat({ label, value, icon: Icon, alert }: { label: string; value: string; icon: React.ElementType; alert?: boolean }) {
  return (
    <div className={`rounded-xl border border-white/20 bg-white/10 px-3 py-2.5 backdrop-blur-sm ${alert ? "ring-1 ring-amber-300/50" : ""}`}>
      <div className="flex items-center gap-1.5 text-emerald-50/80">
        <Icon className="h-3 w-3" />
        <span className="text-[10px] font-medium uppercase tracking-wider">{label}</span>
      </div>
      <p className={`mt-1 text-lg font-bold tabular-nums ${alert ? "text-amber-200" : "text-white"}`}>{value}</p>
    </div>
  );
}
