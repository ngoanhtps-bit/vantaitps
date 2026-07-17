"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { KpiCard } from "@/components/kpi-card";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Route as RouteIcon, Search, MapPin, Truck, Clock, Navigation, Play,
  CheckCircle2, XCircle, Package, Weight, Box, Phone, ArrowRight,
  CircleDot, Flag, Plus, Minus, ChevronDown, ChevronUp, Gauge,
} from "lucide-react";
import {
  ROUTE_STATUSES, ROUTE_STATUS_META, type RouteStatus,
} from "@/lib/constants";
import {
  formatNumber, formatDistance, formatWeight, formatRelativeTime,
  formatDateTime, initials,
} from "@/lib/format";
import { avatarColorClass } from "@/components/avatar-color";
import { useAppStore } from "@/lib/store";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type RouteStop = {
  id: string;
  trackingNumber: string;
  status: string;
  priority: string;
  originCity: string;
  destinationCity: string;
  originAddress: string;
  destinationAddress: string;
  progress: number;
  weightKg: number;
  pieces: number;
  receiver: { name: string; phone: string; address: string; city: string };
  sender: { name: string; city: string };
  estimatedDelivery: string | null;
};

type RouteItem = {
  id: string;
  name: string;
  driverId: string | null;
  vehicleId: string | null;
  status: string;
  stopsCount: number;
  distanceKm: number;
  durationMin: number;
  startedAt: string | null;
  endedAt: string | null;
  createdAt: string;
  updatedAt: string;
  driver: { id: string; name: string; avatarColor: string; status: string; phone: string } | null;
  vehicle: { id: string; plateNumber: string; model: string; type: string } | null;
  stops: RouteStop[];
  totalWeight: number;
  totalPieces: number;
};

export function RoutesView() {
  const qc = useQueryClient();
  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState("all");
  const [expandedId, setExpandedId] = React.useState<string | null>(null);
  const [detailId, setDetailId] = React.useState<string | null>(null);

  const debouncedSearch = useDebounce(search, 350);

  const { data, isLoading } = useQuery({
    queryKey: ["routes", { debouncedSearch, status }],
    queryFn: () => {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set("q", debouncedSearch);
      if (status !== "all") params.set("status", status);
      return api.get<{ items: RouteItem[] }>(`/api/routes?${params}`);
    },
  });

  const updateRoute = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Record<string, unknown> }) =>
      api.patch(`/api/routes/${id}`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["routes"] });
      toast.success("Đã cập nhật tuyến");
    },
    onError: (e: Error) => toast.error("Cập nhật thất bại", { description: e.message }),
  });

  const routes = data?.items ?? [];

  // KPIs
  const total = routes.length;
  const active = routes.filter((r) => r.status === "active").length;
  const planned = routes.filter((r) => r.status === "planned").length;
  const completed = routes.filter((r) => r.status === "completed").length;
  const totalDistance = routes.reduce((sum, r) => sum + r.distanceKm, 0);

  return (
    <div className="space-y-4">
      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <KpiCard title="Tổng tuyến" value={formatNumber(total)} icon={RouteIcon} accent="emerald" />
        <KpiCard title="Đang chạy" value={formatNumber(active)} icon={Play} accent="emerald" />
        <KpiCard title="Đã lên kế hoạch" value={formatNumber(planned)} icon={Clock} accent="sky" />
        <KpiCard title="Hoàn thành" value={formatNumber(completed)} icon={CheckCircle2} accent="teal" />
        <KpiCard title="Tổng quãng đường" value={formatDistance(totalDistance)} icon={Navigation} accent="violet" />
      </div>

      {/* Filter bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Tìm tên tuyến, tài xế, phương tiện…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-full sm:w-[160px]"><SelectValue placeholder="Trạng thái" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                {ROUTE_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>{ROUTE_STATUS_META[s].label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Route cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
        </div>
      ) : routes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 p-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <RouteIcon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium">Không tìm thấy tuyến</p>
              <p className="text-xs text-muted-foreground">Thử điều chỉnh bộ lọc.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {routes.map((route) => (
            <RouteCard
              key={route.id}
              route={route}
              expanded={expandedId === route.id}
              onToggle={() => setExpandedId(expandedId === route.id ? null : route.id)}
              onViewDetails={() => setDetailId(route.id)}
              onUpdate={(body) => updateRoute.mutate({ id: route.id, body })}
              updating={updateRoute.isPending}
            />
          ))}
        </div>
      )}

      {/* Detail drawer */}
      <RouteDetailDrawer
        routeId={detailId}
        open={!!detailId}
        onOpenChange={(o) => { if (!o) setDetailId(null); }}
      />
    </div>
  );
}

function RouteCard({
  route, expanded, onToggle, onViewDetails, onUpdate, updating,
}: {
  route: RouteItem;
  expanded: boolean;
  onToggle: () => void;
  onViewDetails: () => void;
  onUpdate: (body: Record<string, unknown>) => void;
  updating: boolean;
}) {
  const statusMeta = ROUTE_STATUS_META[route.status as RouteStatus] ?? ROUTE_STATUS_META.planned;
  const stops = route.stops;
  const completedStops = stops.filter((s) => s.status === "delivered").length;
  const progressPct = stops.length > 0 ? Math.round((completedStops / stops.length) * 100) : 0;

  return (
    <Card className="group overflow-hidden transition-all hover:shadow-md">
      <CardContent className="p-0">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b p-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <RouteIcon className="h-4 w-4 shrink-0 text-emerald-500" />
              <h3 className="truncate text-sm font-semibold">{route.name}</h3>
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium", statusMeta.badge)}>
                <span className={cn("h-1.5 w-1.5 rounded-full", statusMeta.dot, route.status === "active" && "animate-pulse")} />
                {statusMeta.label}
              </span>
              <span className="text-xs text-muted-foreground">
                {formatRelativeTime(route.createdAt)}
              </span>
            </div>
          </div>
          <div className="flex shrink-0 gap-1">
            {route.status === "planned" && (
              <Button size="sm" variant="outline" className="h-7 gap-1 px-2 text-xs" disabled={updating}
                onClick={() => onUpdate({ status: "active", startedAt: new Date().toISOString() })}>
                <Play className="h-3 w-3" /> Bắt đầu
              </Button>
            )}
            {route.status === "active" && (
              <Button size="sm" variant="outline" className="h-7 gap-1 px-2 text-xs text-emerald-600" disabled={updating}
                onClick={() => onUpdate({ status: "completed", endedAt: new Date().toISOString() })}>
                <CheckCircle2 className="h-3 w-3" /> Hoàn thành
              </Button>
            )}
            {(route.status === "planned" || route.status === "active") && (
              <Button size="sm" variant="ghost" className="h-7 gap-1 px-2 text-xs text-rose-600" disabled={updating}
                onClick={() => onUpdate({ status: "cancelled" })}>
                <XCircle className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-4 gap-px bg-border">
          <StatTile icon={MapPin} label="Trạm dừng" value={String(route.stopsCount || stops.length)} />
          <StatTile icon={Navigation} label="Quãng đường" value={formatDistance(route.distanceKm)} />
          <StatTile icon={Clock} label="Thời gian" value={`${Math.floor(route.durationMin / 60)}h ${route.durationMin % 60}m`} />
          <StatTile icon={Weight} label="Hàng hóa" value={formatWeight(route.totalWeight)} />
        </div>

        {/* Driver / Vehicle */}
        <div className="grid grid-cols-2 gap-px border-t bg-border">
          <div className="flex items-center gap-2 bg-card p-3">
            {route.driver ? (
              <>
                <Avatar className="h-8 w-8">
                  <AvatarFallback className={cn("text-[10px] font-semibold text-white", avatarColorClass(route.driver.avatarColor))}>
                    {initials(route.driver.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium">{route.driver.name}</p>
                  <p className="text-[10px] text-muted-foreground capitalize">{route.driver.status.replace("_", " ")}</p>
                </div>
              </>
            ) : (
              <p className="text-xs text-muted-foreground">Chưa gán tài xế</p>
            )}
          </div>
          <div className="flex items-center gap-2 bg-card p-3">
            {route.vehicle ? (
              <>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400">
                  <Truck className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="truncate font-mono text-xs font-medium">{route.vehicle.plateNumber}</p>
                  <p className="truncate text-[10px] text-muted-foreground">{route.vehicle.model}</p>
                </div>
              </>
            ) : (
              <p className="text-xs text-muted-foreground">Chưa gán phương tiện</p>
            )}
          </div>
        </div>

        {/* Progress bar for active routes */}
        {route.status === "active" && stops.length > 0 && (
          <div className="border-t px-4 py-3">
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="flex items-center gap-1 text-muted-foreground">
                <Gauge className="h-3 w-3" /> Tiến độ tuyến
              </span>
              <span className="font-semibold tabular-nums">{completedStops}/{stops.length} trạm dừng · {progressPct}%</span>
            </div>
            <Progress value={progressPct} className="h-1.5" />
          </div>
        )}

        {/* Expandable stops list */}
        {stops.length > 0 && (
          <div className="border-t">
            <button
              onClick={onToggle}
              className="flex w-full items-center justify-between px-4 py-2.5 text-xs font-medium transition-colors hover:bg-muted/50"
            >
              <span className="flex items-center gap-1.5">
                <CircleDot className="h-3.5 w-3.5 text-muted-foreground" />
                {stops.length} trạm dừng
              </span>
              <span className="flex items-center gap-1 text-muted-foreground">
                {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                {expanded ? "Ẩn" : "Hiển thị"} trạm dừng
              </span>
            </button>
            {expanded && (
              <div className="border-t bg-muted/20 px-4 py-3">
                <div className="relative space-y-2 border-l-2 border-muted pl-4">
                  {stops.map((stop, i) => (
                    <div key={stop.id} className="relative">
                      <span className={cn(
                        "absolute -left-[21px] top-1.5 h-3 w-3 rounded-full border-2 border-background",
                        stop.status === "delivered" ? "bg-emerald-500" :
                        stop.status === "in_transit" || stop.status === "out_for_delivery" ? "bg-amber-500 animate-pulse" :
                        "bg-slate-400"
                      )} />
                      <div className="flex items-center justify-between gap-2">
                        <span className="flex items-center gap-1.5 text-xs font-medium">
                          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-muted text-[9px] font-bold text-muted-foreground">{i + 1}</span>
                          <span className="font-mono">{stop.trackingNumber}</span>
                        </span>
                        <span className="text-[10px] text-muted-foreground">{stop.destinationCity}</span>
                      </div>
                      <p className="ml-5 truncate text-[10px] text-muted-foreground">
                        → {stop.receiver.name} · {formatWeight(stop.weightKg)}
                      </p>
                    </div>
                  ))}
                </div>
                <Button size="sm" variant="ghost" className="mt-3 w-full gap-1 text-xs" onClick={onViewDetails}>
                  Xem chi tiết đầy đủ <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </div>
        )}

        {stops.length === 0 && (
          <div className="border-t px-4 py-3">
            <Button size="sm" variant="ghost" className="w-full gap-1 text-xs" onClick={onViewDetails}>
              Xem chi tiết <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function StatTile({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="bg-card p-3 text-center">
      <Icon className="mx-auto mb-1 h-3.5 w-3.5 text-muted-foreground" />
      <p className="text-xs font-semibold tabular-nums">{value}</p>
      <p className="text-[9px] uppercase tracking-wider text-muted-foreground">{label}</p>
    </div>
  );
}

function RouteDetailDrawer({
  routeId, open, onOpenChange,
}: {
  routeId: string | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const { data: route, isLoading } = useQuery({
    queryKey: ["route", routeId],
    queryFn: () => api.get<RouteItem>(`/api/routes/${routeId}`),
    enabled: !!routeId && open,
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto custom-scroll p-0">
        <SheetHeader className="border-b px-5 py-4">
          <SheetDescription className="sr-only">Chi tiết tuyến</SheetDescription>
          <SheetTitle className="flex items-center gap-2 text-base">
            {route ? (
              <>
                <RouteIcon className="h-5 w-5 text-emerald-500" />
                <span className="truncate">{route.name}</span>
              </>
            ) : "Đang tải…"}
          </SheetTitle>
        </SheetHeader>

        {isLoading || !route ? (
          <div className="space-y-3 p-5">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        ) : (
          <RouteDetailContent route={route} />
        )}
      </SheetContent>
    </Sheet>
  );
}

function RouteDetailContent({ route }: { route: RouteItem }) {
  const statusMeta = ROUTE_STATUS_META[route.status as RouteStatus] ?? ROUTE_STATUS_META.planned;
  const stops = route.stops;

  return (
    <div className="space-y-5 p-5">
      {/* Status + timing */}
      <div className="flex items-center gap-2">
        <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium", statusMeta.badge)}>
          <span className={cn("h-1.5 w-1.5 rounded-full", statusMeta.dot, route.status === "active" && "animate-pulse")} />
          {statusMeta.label}
        </span>
        {route.startedAt && (
          <span className="text-xs text-muted-foreground">Bắt đầu {formatDateTime(route.startedAt)}</span>
        )}
        {route.endedAt && (
          <span className="text-xs text-muted-foreground">· Kết thúc {formatDateTime(route.endedAt)}</span>
        )}
      </div>

      {/* Route stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg border p-3 text-center">
          <MapPin className="mx-auto mb-1 h-4 w-4 text-emerald-500" />
          <p className="text-sm font-bold">{route.stopsCount || stops.length}</p>
          <p className="text-[10px] text-muted-foreground">Trạm dừng</p>
        </div>
        <div className="rounded-lg border p-3 text-center">
          <Navigation className="mx-auto mb-1 h-4 w-4 text-sky-500" />
          <p className="text-sm font-bold">{formatDistance(route.distanceKm)}</p>
          <p className="text-[10px] text-muted-foreground">Quãng đường</p>
        </div>
        <div className="rounded-lg border p-3 text-center">
          <Clock className="mx-auto mb-1 h-4 w-4 text-amber-500" />
          <p className="text-sm font-bold">{Math.floor(route.durationMin / 60)}h {route.durationMin % 60}m</p>
          <p className="text-[10px] text-muted-foreground">Thời gian</p>
        </div>
        <div className="rounded-lg border p-3 text-center">
          <Weight className="mx-auto mb-1 h-4 w-4 text-violet-500" />
          <p className="text-sm font-bold">{formatWeight(route.totalWeight)}</p>
          <p className="text-[10px] text-muted-foreground">Hàng hóa</p>
        </div>
      </div>

      {/* Driver & Vehicle */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-lg border p-3">
          <p className="mb-2 text-[10px] uppercase tracking-wider text-muted-foreground">Tài xế được gán</p>
          {route.driver ? (
            <div className="flex items-center gap-2">
              <Avatar className="h-9 w-9">
                <AvatarFallback className={cn("text-xs font-semibold text-white", avatarColorClass(route.driver.avatarColor))}>
                  {initials(route.driver.name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">{route.driver.name}</p>
                <p className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Phone className="h-2.5 w-2.5" /> {route.driver.phone}
                </p>
              </div>
            </div>
          ) : <p className="text-xs text-muted-foreground">Chưa gán</p>}
        </div>
        <div className="rounded-lg border p-3">
          <p className="mb-2 text-[10px] uppercase tracking-wider text-muted-foreground">Phương tiện</p>
          {route.vehicle ? (
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400">
                <Truck className="h-4 w-4" />
              </div>
              <div>
                <p className="font-mono text-sm font-medium">{route.vehicle.plateNumber}</p>
                <p className="text-[10px] text-muted-foreground capitalize">{route.vehicle.model} · {route.vehicle.type}</p>
              </div>
            </div>
          ) : <p className="text-xs text-muted-foreground">Chưa gán</p>}
        </div>
      </div>

      {/* Stops timeline */}
      {stops.length > 0 ? (
        <div>
          <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <Flag className="h-4 w-4 text-muted-foreground" /> Thứ tự giao hàng ({stops.length} trạm dừng)
          </h4>
          <div className="relative space-y-3 border-l-2 border-muted pl-5">
            {stops.map((stop, i) => {
              const isDone = stop.status === "delivered";
              const isActive = stop.status === "in_transit" || stop.status === "out_for_delivery";
              return (
                <div key={stop.id} className="relative">
                  <span className={cn(
                    "absolute -left-[26px] top-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-background text-[9px] font-bold text-white",
                    isDone ? "bg-emerald-500" : isActive ? "bg-amber-500 animate-pulse" : "bg-slate-400"
                  )}>
                    {isDone ? "✓" : i + 1}
                  </span>
                  <div className="rounded-lg border p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-semibold">{stop.trackingNumber}</span>
                      <span className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium",
                        isDone ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" :
                        isActive ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300" :
                        "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                      )}>
                        {stop.status.replace(/_/g, " ")}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center gap-1.5 text-xs">
                      <MapPin className="h-3 w-3 text-muted-foreground" />
                      <span className="font-medium">{stop.destinationCity}</span>
                      <span className="text-muted-foreground">· {stop.destinationAddress}</span>
                    </div>
                    <div className="mt-1 flex items-center gap-1.5 text-[10px] text-muted-foreground">
                      <Package className="h-3 w-3" /> {stop.receiver.name}
                      <span className="text-muted-foreground/50">·</span>
                      <Phone className="h-2.5 w-2.5" /> {stop.receiver.phone}
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-0.5"><Weight className="h-2.5 w-2.5" /> {formatWeight(stop.weightKg)}</span>
                      <span className="flex items-center gap-0.5"><Box className="h-2.5 w-2.5" /> {stop.pieces} kiện</span>
                      {stop.estimatedDelivery && (
                        <span className="flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" /> {formatRelativeTime(stop.estimatedDelivery)}</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed p-6 text-center">
          <Package className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
          <p className="text-sm font-medium">Không có trạm dừng nào</p>
          <p className="text-xs text-muted-foreground">Tuyến này chưa có đơn hàng nào được gán cho tài xế.</p>
        </div>
      )}
    </div>
  );
}

function useDebounce<T>(value: T, delay: number): T {
  const [v, setV] = React.useState(value);
  React.useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}
