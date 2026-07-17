"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { KpiCard } from "@/components/kpi-card";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  BarChart, Bar, PieChart, Pie, Cell,
} from "recharts";
import {
  DollarSign, Clock, TrendingUp, CheckCircle2, Truck, Download,
  Activity, Boxes, Package, Star,
} from "lucide-react";
import {
  formatCurrency, formatNumber, formatCompact, initials,
} from "@/lib/format";
import { SHIPMENT_STATUS_META } from "@/lib/constants";
import { avatarColorClass } from "@/components/avatar-color";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// ---------- Types (mirrors GET /api/dashboard) ----------
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

const VEHICLE_TYPE_COLORS: Record<string, string> = {
  truck: "#10b981",
  van: "#0ea5e9",
  motorbike: "#f59e0b",
  container: "#8b5cf6",
};

const VEHICLE_STATUS_COLORS: Record<string, string> = {
  active: "#10b981",
  maintenance: "#f97316",
  retired: "#94a3b8",
};

// ---------- Component ----------
export function AnalyticsView() {
  const { data, isLoading } = useQuery<DashboardData>({
    queryKey: ["dashboard"],
    queryFn: () => api.get("/api/dashboard"),
    refetchInterval: 30000,
  });

  if (isLoading || !data) {
    return <AnalyticsSkeleton />;
  }

  const { totals, statusCounts, revenue, dailyVolume, cityThroughput, vehicleStatus, vehicleTypeBreakdown, topDrivers } = data;

  const totalShipments = totals.shipments || 0;
  const avgValue = totals.delivered > 0 ? revenue.total / totals.delivered : 0;
  const onTimeRate = totalShipments > 0
    ? Math.round((totals.delivered / totalShipments) * 100)
    : 0;

  const statusPieData = Object.entries(statusCounts)
    .map(([k, v]) => ({
      name: SHIPMENT_STATUS_META[k as keyof typeof SHIPMENT_STATUS_META]?.label ?? k,
      value: v,
      key: k,
    }))
    .filter((d) => d.value > 0);

  const vehicleTypeData = vehicleTypeBreakdown.map((v) => ({
    name: v.type.charAt(0).toUpperCase() + v.type.slice(1),
    value: v._count,
    key: v.type,
  }));

  const vehicleStatusData = vehicleStatus.map((v) => ({
    name: v.status.charAt(0).toUpperCase() + v.status.slice(1),
    value: v._count,
    key: v.status,
  }));

  const exportCsv = () => {
    try {
      const header = "date,total,delivered,revenue";
      const rows = dailyVolume.map((d) =>
        `${d.date},${d.total},${d.delivered},${d.revenue.toFixed(2)}`
      );
      const csv = [header, ...rows].join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `analytics-daily-volume-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("Đã xuất CSV");
    } catch {
      toast.error("Xuất CSV thất bại");
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Tổng quan phân tích</h2>
          <p className="text-xs text-muted-foreground">
            14 ngày qua · cập nhật mỗi 30 giây
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1.5">
            <Activity className="h-3 w-3 text-emerald-500" /> Trực tiếp
          </Badge>
          <Button variant="outline" size="sm" onClick={exportCsv} className="gap-1.5">
            <Download className="h-3.5 w-3.5" /> Xuất CSV
          </Button>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <KpiCard
          title="Tổng doanh thu"
          value={formatCurrency(revenue.total)}
          icon={DollarSign}
          accent="emerald"
          trend={15.3}
          trendLabel="đã giao"
          footer={`${formatCurrency(revenue.pending)} chờ xử lý`}
        />
        <KpiCard
          title="Doanh thu chờ"
          value={formatCurrency(revenue.pending)}
          icon={Clock}
          accent="amber"
          footer="Trong quy trình"
        />
        <KpiCard
          title="Giá trị đơn hàng TB"
          value={formatCurrency(avgValue)}
          icon={TrendingUp}
          accent="sky"
          footer={`${formatNumber(totals.delivered)} đã giao`}
        />
        <KpiCard
          title="Tỷ lệ đúng hạn"
          value={`${onTimeRate}%`}
          icon={CheckCircle2}
          accent="violet"
          trend={2.1}
          trendLabel="mức dịch vụ"
          footer={`${totals.delayed} trễ hạn`}
        />
        <KpiCard
          title="Đơn hàng đang hoạt động"
          value={formatNumber(totals.activeShipments)}
          icon={Truck}
          accent="teal"
          footer={`${totals.inTransit} đang vận chuyển`}
        />
      </div>

      {/* Revenue trend */}
      <Card>
        <CardHeader className="flex flex-row items-start justify-between space-y-0">
          <div>
            <CardTitle className="text-base">Xu hướng doanh thu</CardTitle>
            <CardDescription className="text-xs">
              Doanh thu đã giao theo ngày · 14 ngày qua
            </CardDescription>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="h-2 w-2 rounded-full bg-emerald-500" /> Doanh thu
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={dailyVolume} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="g-revenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.9 0 0)" className="dark:opacity-30" vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={(d) => new Date(d).toLocaleDateString("vi-VN", { day: "numeric", month: "short" })}
                tick={{ fontSize: 10, fill: "oklch(0.5 0 0)" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "oklch(0.5 0 0)" }}
                axisLine={false}
                tickLine={false}
                width={56}
                tickFormatter={(v) => formatCompact(v as number)}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: 8, border: "1px solid oklch(0.9 0 0)", fontSize: 12,
                  background: "oklch(1 0 0)",
                }}
                labelFormatter={(d) => new Date(d as string).toLocaleDateString("vi-VN", { weekday: "short", day: "numeric", month: "short" })}
                formatter={(v: number) => [formatCurrency(v), "Doanh thu"]}
              />
              <Area type="monotone" dataKey="revenue" name="Doanh thu" stroke="#10b981" strokeWidth={2} fill="url(#g-revenue)" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Volume + status distribution */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-start justify-between space-y-0">
            <div>
              <CardTitle className="text-base">Khối lượng đơn hàng</CardTitle>
              <CardDescription className="text-xs">Đã tạo so với đã giao · 14 ngày qua</CardDescription>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500" /> Đã tạo
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-sky-500" /> Đã giao
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={dailyVolume} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.9 0 0)" className="dark:opacity-30" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickFormatter={(d) => new Date(d).toLocaleDateString("vi-VN", { day: "numeric", month: "short" })}
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
                  cursor={{ fill: "oklch(0.95 0 0)" }}
                  labelFormatter={(d) => new Date(d as string).toLocaleDateString("vi-VN", { weekday: "short", day: "numeric", month: "short" })}
                />
                <Bar dataKey="total" name="Đã tạo" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} barSize={14} />
                <Bar dataKey="delivered" name="Đã giao" stackId="a" fill="#0ea5e9" radius={[3, 3, 0, 0]} barSize={14} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Phân bố trạng thái</CardTitle>
            <CardDescription className="text-xs">Trạng thái đơn hàng hiện tại</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={statusPieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={42}
                  outerRadius={72}
                  paddingAngle={2}
                >
                  {statusPieData.map((entry) => (
                    <Cell key={entry.key} fill={STATUS_COLORS[entry.key] || "#94a3b8"} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12, border: "1px solid oklch(0.9 0 0)" }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-2 grid grid-cols-2 gap-1.5">
              {statusPieData.slice(0, 8).map((p) => (
                <div key={p.key} className="flex items-center gap-1.5 text-[11px]">
                  <span className="h-2 w-2 rounded-full" style={{ background: STATUS_COLORS[p.key] }} />
                  <span className="text-muted-foreground truncate">{p.name}</span>
                  <span className="ml-auto font-medium tabular-nums">{p.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* City throughput + vehicle breakdowns */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Thành phố xuất phát hàng đầu</CardTitle>
            <CardDescription className="text-xs">Theo khối lượng đơn hàng</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={cityThroughput} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.9 0 0)" className="dark:opacity-30" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: "oklch(0.5 0 0)" }} axisLine={false} tickLine={false} />
                <YAxis
                  type="category"
                  dataKey="originCity"
                  tick={{ fontSize: 10, fill: "oklch(0.5 0 0)" }}
                  axisLine={false}
                  tickLine={false}
                  width={90}
                />
                <Tooltip
                  contentStyle={{ borderRadius: 8, fontSize: 12, border: "1px solid oklch(0.9 0 0)" }}
                  cursor={{ fill: "oklch(0.95 0 0)" }}
                  formatter={(v: number) => [`${v} đơn hàng`, "Khối lượng"]}
                />
                <Bar dataKey="_count" name="Đơn hàng" fill="#10b981" radius={[0, 4, 4, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Cơ cấu loại phương tiện</CardTitle>
            <CardDescription className="text-xs">Thành phần đội xe</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={vehicleTypeData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={38}
                  outerRadius={68}
                  paddingAngle={2}
                >
                  {vehicleTypeData.map((entry) => (
                    <Cell key={entry.key} fill={VEHICLE_TYPE_COLORS[entry.key] || "#94a3b8"} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12, border: "1px solid oklch(0.9 0 0)" }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-2 grid grid-cols-2 gap-1.5">
              {vehicleTypeData.map((p) => (
                <div key={p.key} className="flex items-center gap-1.5 text-[11px]">
                  <span className="h-2 w-2 rounded-full" style={{ background: VEHICLE_TYPE_COLORS[p.key] || "#94a3b8" }} />
                  <span className="text-muted-foreground truncate">{p.name}</span>
                  <span className="ml-auto font-medium tabular-nums">{p.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Vehicle status + top performers */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Boxes className="h-4 w-4 text-violet-500" /> Trạng thái phương tiện
            </CardTitle>
            <CardDescription className="text-xs">Tình trạng đội xe</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={vehicleStatusData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.9 0 0)" className="dark:opacity-30" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10, fill: "oklch(0.5 0 0)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis tick={{ fontSize: 10, fill: "oklch(0.5 0 0)" }} axisLine={false} tickLine={false} width={28} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, fontSize: 12, border: "1px solid oklch(0.9 0 0)" }}
                  cursor={{ fill: "oklch(0.95 0 0)" }}
                  formatter={(v: number) => [`${v} phương tiện`, "Số lượng"]}
                />
                <Bar dataKey="value" name="Phương tiện" radius={[4, 4, 0, 0]} barSize={48}>
                  {vehicleStatusData.map((entry) => (
                    <Cell key={entry.key} fill={VEHICLE_STATUS_COLORS[entry.key] || "#94a3b8"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-2 grid grid-cols-3 gap-1.5">
              {vehicleStatusData.map((p) => (
                <div key={p.key} className="flex flex-col items-center text-[11px]">
                  <span className="h-2 w-2 rounded-full" style={{ background: VEHICLE_STATUS_COLORS[p.key] || "#94a3b8" }} />
                  <span className="mt-0.5 text-muted-foreground truncate">{p.name}</span>
                  <span className="font-medium tabular-nums">{p.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Star className="h-4 w-4 text-amber-500" /> Người thực hiện xuất sắc
              </CardTitle>
              <CardDescription className="text-xs">Tài xế theo tổng số lần giao</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {topDrivers.length === 0 ? (
                <div className="p-6 text-center text-xs text-muted-foreground">
                  Chưa có dữ liệu tài xế
                </div>
              ) : (
                topDrivers.map((d, i) => (
                  <div key={d.id} className="flex items-center gap-3 px-4 py-3">
                    <span className={cn(
                      "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                      i === 0 ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                        : i === 1 ? "bg-slate-400/15 text-slate-600 dark:text-slate-300"
                        : i === 2 ? "bg-orange-500/15 text-orange-600 dark:text-orange-400"
                        : "bg-muted text-muted-foreground"
                    )}>
                      {i + 1}
                    </span>
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className={cn("text-xs font-semibold text-white", avatarColorClass(d.avatarColor))}>
                        {initials(d.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{d.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {d.vehicle ? `${d.vehicle.plateNumber} · ${d.vehicle.model}` : "Chưa gán"}
                      </p>
                    </div>
                    <div className="hidden text-right sm:block">
                      <p className="text-xs font-semibold tabular-nums">{formatNumber(d.totalDeliveries)}</p>
                      <p className="text-[10px] text-muted-foreground">lần giao</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold tabular-nums">★ {d.rating.toFixed(1)}</p>
                      <p className="text-[10px] text-muted-foreground">{formatCompact(d.totalDistance)} km</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary footer stats */}
      <Card>
        <CardContent className="grid grid-cols-2 gap-4 p-5 sm:grid-cols-4">
          <SummaryStat icon={Package} label="Tổng đơn hàng" value={formatNumber(totalShipments)} />
          <SummaryStat icon={Boxes} label="Đội xe & Tài xế" value={`${totals.vehicles}/${totals.drivers}`} sub="phương tiện / tài xế" />
          <SummaryStat icon={Truck} label="Đang vận chuyển" value={formatNumber(totals.inTransit)} sub="đơn hàng đang di chuyển" />
          <SummaryStat icon={CheckCircle2} label="Đã giao" value={formatNumber(totals.delivered)} sub={`${onTimeRate}% đúng hạn`} />
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryStat({
  icon: Icon, label, value, sub,
}: {
  icon: React.ElementType; label: string; value: string; sub?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-lg font-bold tabular-nums">{value}</p>
        {sub && <p className="text-[10px] text-muted-foreground">{sub}</p>}
      </div>
    </div>
  );
}

function AnalyticsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-8 w-32" />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
      </div>
      <Skeleton className="h-72 rounded-xl" />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Skeleton className="h-72 rounded-xl lg:col-span-2" />
        <Skeleton className="h-72 rounded-xl" />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Skeleton className="h-64 rounded-xl lg:col-span-2" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-64 rounded-xl lg:col-span-2" />
      </div>
    </div>
  );
}
