"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { KpiCard } from "@/components/kpi-card";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar, PieChart, Pie, Cell,
} from "recharts";
import {
  FileBarChart, Download, DollarSign, Package, Clock, TrendingUp,
  Users, Truck, MapPin, Calendar, FileSpreadsheet, FileText, ChevronRight,
} from "lucide-react";
import {
  formatCurrency, formatNumber, formatDate, formatCompact,
} from "@/lib/format";
import { SHIPMENT_STATUS_META, SERVICE_META } from "@/lib/constants";
import { cn } from "@/lib/utils";

type ReportData = {
  range: string;
  since: string;
  until: string;
  summary: {
    totalShipments: number;
    shipmentsInPeriod: number;
    totalRevenue: number;
    pendingRevenue: number;
    avgDeliveryHours: number;
    invoiceRevenue: number;
    outstandingInvoices: number;
  };
  statusBreakdown: { status: string; count: number }[];
  topCustomers: { senderId: string; _count: number; customer: { name: string; company: string | null; city: string } | null }[];
  topDrivers: { driverId: string | null; _count: number; driver: { name: string; avatarColor: string; rating: number; totalDeliveries: number } | null }[];
  topRoutes: { originCity: string; destinationCity: string; count: number }[];
  revenueByService: { serviceType: string; count: number; revenue: number }[];
  dailyVolume: { date: string; total: number; delivered: number; revenue: number }[];
  shipments: Array<{
    id: string; trackingNumber: string; status: string; priority: string;
    serviceType: string; cost: number; weightKg: number; distanceKm: number;
    originCity: string; destinationCity: string; createdAt: string;
    sender: { name: string };
  }>;
};

const STATUS_COLORS: Record<string, string> = {
  pending: "#94a3b8", picked_up: "#0ea5e9", in_transit: "#f59e0b",
  out_for_delivery: "#8b5cf6", delivered: "#10b981", delayed: "#f97316",
  cancelled: "#f43f5e", returned: "#ef4444",
};

const SERVICE_COLORS = ["#10b981", "#0ea5e9", "#f59e0b", "#8b5cf6", "#f43f5e"];

export function ReportsView() {
  const [range, setRange] = React.useState("30d");

  const { data, isLoading } = useQuery<ReportData>({
    queryKey: ["reports", range],
    queryFn: () => api.get(`/api/reports?range=${range}`),
  });

  const exportCSV = () => {
    if (!data) return;
    const rows = [
      ["Mã vận đơn", "Trạng thái", "Ưu tiên", "Dịch vụ", "Điểm đi", "Điểm đến", "Người gửi", "Trọng lượng (kg)", "Khoảng cách (km)", "Chi phí", "Ngày tạo"],
      ...data.shipments.map((s) => [
        s.trackingNumber, s.status, s.priority, s.serviceType,
        s.originCity, s.destinationCity, s.sender.name,
        String(s.weightKg), String(s.distanceKm), String(s.cost),
        new Date(s.createdAt).toISOString(),
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `logistics-report-${range}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportSummary = () => {
    if (!data) return;
    const lines = [
      "LOGISTICS APP V2 — BÁO CÁO VẬN HÀNH",
      `Kỳ: ${formatDate(data.since)} đến ${formatDate(data.until)}`,
      `Ngày tạo: ${new Date().toLocaleString()}`,
      "",
      "=== TÓM TẮT ===",
      `Tổng đơn hàng (tất cả thời gian): ${data.summary.totalShipments}`,
      `Đơn hàng trong kỳ: ${data.summary.shipmentsInPeriod}`,
      `Tổng doanh thu (đã giao): ${formatCurrency(data.summary.totalRevenue)}`,
      `Doanh thu chờ xử lý: ${formatCurrency(data.summary.pendingRevenue)}`,
      `Thời gian giao TB: ${data.summary.avgDeliveryHours} giờ`,
      `Doanh thu hóa đơn (đã thanh toán): ${formatCurrency(data.summary.invoiceRevenue)}`,
      `Hóa đơn chưa thanh toán: ${formatCurrency(data.summary.outstandingInvoices)}`,
      "",
      "=== PHÂN BỐ TRẠNG THÁI ===",
      ...data.statusBreakdown.map((s) => `  ${s.status}: ${s.count}`),
      "",
      "=== KHÁCH HÀNG HÀNG ĐẦU ===",
      ...data.topCustomers.slice(0, 5).map((c, i) => `  ${i + 1}. ${c.customer?.name || "Không xác định"} — ${c._count} đơn hàng`),
      "",
      "=== TÀI XẾ HÀNG ĐẦU ===",
      ...data.topDrivers.slice(0, 5).map((d, i) => `  ${i + 1}. ${d.driver?.name || "Chưa gán tài xế"} — ${d._count} đơn hàng`),
      "",
      "=== TUYẾN ĐƯỜNG HÀNG ĐẦU ===",
      ...data.topRoutes.slice(0, 5).map((r, i) => `  ${i + 1}. ${r.originCity} → ${r.destinationCity} — ${r.count} đơn hàng`),
      "",
      "=== DOANH THU THEO DỊCH VỤ ===",
      ...data.revenueByService.map((s) => `  ${s.serviceType}: ${s.count} đơn hàng, ${formatCurrency(s.revenue)}`),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `logistics-summary-${range}-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading || !data) {
    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-9 w-40" />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
        </div>
        <Skeleton className="h-80 rounded-xl" />
        <Skeleton className="h-80 rounded-xl" />
      </div>
    );
  }

  const { summary, statusBreakdown, topCustomers, topDrivers, topRoutes, revenueByService, dailyVolume } = data;
  const rangeLabel = range === "7d" ? "7 ngày qua" : range === "30d" ? "30 ngày qua" : range === "90d" ? "90 ngày qua" : "Từ đầu năm";

  return (
    <div className="space-y-5">
      {/* Header with range selector + export */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Select value={range} onValueChange={setRange}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 ngày qua</SelectItem>
              <SelectItem value="30d">30 ngày qua</SelectItem>
              <SelectItem value="90d">90 ngày qua</SelectItem>
              <SelectItem value="ytd">Từ đầu năm</SelectItem>
            </SelectContent>
          </Select>
          <Badge variant="outline" className="gap-1.5">
            <Calendar className="h-3 w-3" /> {rangeLabel}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportSummary} className="gap-1.5">
            <FileText className="h-4 w-4" /> Tóm tắt
          </Button>
          <Button size="sm" onClick={exportCSV} className="gap-1.5">
            <FileSpreadsheet className="h-4 w-4" /> Xuất CSV
          </Button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <KpiCard title="Đơn hàng trong kỳ" value={formatNumber(summary.shipmentsInPeriod)} icon={Package} accent="emerald" footer={`${summary.totalShipments} tất cả thời gian`} />
        <KpiCard title="Doanh thu (đã giao)" value={formatCurrency(summary.totalRevenue)} icon={DollarSign} accent="teal" trend={12.5} trendLabel="so với trước" footer={`${formatCurrency(summary.pendingRevenue)} chờ xử lý`} />
        <KpiCard title="Thời gian giao TB" value={`${summary.avgDeliveryHours}h`} icon={Clock} accent="sky" footer="lấy hàng → giao hàng" />
        <KpiCard title="Doanh thu hóa đơn" value={formatCurrency(summary.invoiceRevenue)} icon={TrendingUp} accent="violet" footer={`${formatCurrency(summary.outstandingInvoices)} chưa thanh toán`} />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Daily volume area chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Xu hướng đơn hàng & doanh thu</CardTitle>
            <CardDescription className="text-xs">Khối lượng và doanh thu theo ngày trong {rangeLabel.toLowerCase()}</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={dailyVolume} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="g-vol" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="g-rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
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
                <YAxis yAxisId="left" tick={{ fontSize: 10, fill: "oklch(0.5 0 0)" }} axisLine={false} tickLine={false} width={28} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: "oklch(0.5 0 0)" }} axisLine={false} tickLine={false} width={40} tickFormatter={(v) => `$${formatCompact(v)}`} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid oklch(0.9 0 0)", fontSize: 12 }} />
                <Area yAxisId="left" type="monotone" dataKey="total" name="Đơn hàng" stroke="#10b981" strokeWidth={2} fill="url(#g-vol)" />
                <Area yAxisId="right" type="monotone" dataKey="revenue" name="Doanh thu" stroke="#0ea5e9" strokeWidth={2} fill="url(#g-rev)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Status distribution pie */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Phân bố trạng thái</CardTitle>
            <CardDescription className="text-xs">Trạng thái đơn hàng trong kỳ</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={statusBreakdown} dataKey="count" nameKey="status" cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={2}>
                  {statusBreakdown.map((entry) => (
                    <Cell key={entry.status} fill={STATUS_COLORS[entry.status] || "#94a3b8"} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12, border: "1px solid oklch(0.9 0 0)" }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-2 grid grid-cols-2 gap-1.5">
              {statusBreakdown.map((s) => (
                <div key={s.status} className="flex items-center gap-1.5 text-[11px]">
                  <span className="h-2 w-2 rounded-full" style={{ background: STATUS_COLORS[s.status] }} />
                  <span className="text-muted-foreground">{SHIPMENT_STATUS_META[s.status as keyof typeof SHIPMENT_STATUS_META]?.label ?? s.status}</span>
                  <span className="ml-auto font-medium tabular-nums">{s.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue by service + top routes */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Doanh thu theo loại dịch vụ</CardTitle>
            <CardDescription className="text-xs">Số đơn hàng và doanh thu theo dịch vụ</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={revenueByService} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.9 0 0)" className="dark:opacity-30" vertical={false} />
                <XAxis dataKey="serviceType" tick={{ fontSize: 10, fill: "oklch(0.5 0 0)" }} axisLine={false} tickLine={false} tickFormatter={(v) => SERVICE_META[v as keyof typeof SERVICE_META]?.label ?? v} />
                <YAxis tick={{ fontSize: 10, fill: "oklch(0.5 0 0)" }} axisLine={false} tickLine={false} width={40} tickFormatter={(v) => `$${formatCompact(v)}`} />
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12, border: "1px solid oklch(0.9 0 0)" }} cursor={{ fill: "oklch(0.95 0 0)" }} />
                <Bar dataKey="revenue" name="Doanh thu" fill="#10b981" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-3 space-y-1.5">
              {revenueByService.map((s, i) => (
                <div key={s.serviceType} className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full" style={{ background: SERVICE_COLORS[i % SERVICE_COLORS.length] }} />
                    <span className="font-medium">{SERVICE_META[s.serviceType as keyof typeof SERVICE_META]?.label ?? s.serviceType}</span>
                  </span>
                  <span className="text-muted-foreground">{s.count} đơn hàng · <span className="font-semibold text-foreground">{formatCurrency(s.revenue)}</span></span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tuyến đường hàng đầu</CardTitle>
            <CardDescription className="text-xs">Cặp điểm đi → điểm đến đông nhất</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {topRoutes.map((r, i) => (
                <div key={`${r.originCity}-${r.destinationCity}`} className="flex items-center gap-3 px-4 py-2.5">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">{i + 1}</span>
                  <div className="flex min-w-0 flex-1 items-center gap-1.5 text-sm">
                    <span className="truncate font-medium">{r.originCity}</span>
                    <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground" />
                    <span className="truncate font-medium">{r.destinationCity}</span>
                  </div>
                  <span className="shrink-0 text-xs font-semibold tabular-nums">{r.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top customers + top drivers */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><Users className="h-4 w-4 text-emerald-500" /> Khách hàng hàng đầu</CardTitle>
            <CardDescription className="text-xs">Theo khối lượng đơn hàng trong kỳ</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {topCustomers.slice(0, 8).map((c, i) => (
                <div key={c.senderId} className="flex items-center gap-3 px-4 py-2.5">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-muted-foreground">{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{c.customer?.name || "Không xác định"}</p>
                    <p className="truncate text-xs text-muted-foreground">{c.customer?.company || c.customer?.city || "—"}</p>
                  </div>
                  <span className="shrink-0 text-xs font-semibold tabular-nums">{c._count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><Truck className="h-4 w-4 text-sky-500" /> Tài xế hàng đầu</CardTitle>
            <CardDescription className="text-xs">Theo số đơn hàng trong kỳ</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {topDrivers.slice(0, 8).map((d, i) => (
                <div key={d.driverId || i} className="flex items-center gap-3 px-4 py-2.5">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-muted-foreground">{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{d.driver?.name || "Chưa gán tài xế"}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {d.driver ? `★ ${d.driver.rating.toFixed(1)} · ${formatNumber(d.driver.totalDeliveries)} tổng` : "Chưa gán tài xế"}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs font-semibold tabular-nums">{d._count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent shipments table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><Package className="h-4 w-4 text-emerald-500" /> Đơn hàng trong kỳ</CardTitle>
          <CardDescription className="text-xs">Mới nhất {data.shipments.length} đơn hàng — có thể xuất CSV</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-96 overflow-y-auto custom-scroll">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40 sticky top-0">
                  <TableHead className="min-w-[130px]">Mã vận đơn</TableHead>
                  <TableHead className="min-w-[160px]">Tuyến đường</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="hidden md:table-cell">Dịch vụ</TableHead>
                  <TableHead className="text-right">Chi phí</TableHead>
                  <TableHead className="hidden sm:table-cell">Ngày</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.shipments.slice(0, 20).map((s) => {
                  const meta = SHIPMENT_STATUS_META[s.status as keyof typeof SHIPMENT_STATUS_META];
                  return (
                    <TableRow key={s.id} className="hover:bg-muted/50">
                      <TableCell className="font-mono text-xs font-semibold">{s.trackingNumber}</TableCell>
                      <TableCell>
                        <span className="text-xs">{s.originCity} → {s.destinationCity}</span>
                      </TableCell>
                      <TableCell>
                        <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium", meta?.badge)}>
                          <span className={cn("h-1 w-1 rounded-full", meta?.dot)} />
                          {meta?.label}
                        </span>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-xs">{SERVICE_META[s.serviceType as keyof typeof SERVICE_META]?.label ?? s.serviceType}</TableCell>
                      <TableCell className="text-right text-xs font-semibold tabular-nums">{formatCurrency(s.cost)}</TableCell>
                      <TableCell className="hidden sm:table-cell text-xs text-muted-foreground">{formatDate(s.createdAt)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
