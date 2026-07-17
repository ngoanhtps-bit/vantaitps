"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { KpiCard, EmptyState } from "@/components/kpi-card";
import { StatusBadge } from "@/components/status-badge";
import { LogisticsMap, type MapMarker } from "@/components/logistics-map";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Warehouse, Search, X, ArrowRight, MapPin, Phone, User,
  Package, Boxes, AlertTriangle, CheckCircle2, Gauge,
} from "lucide-react";
import {
  WAREHOUSE_STATUSES, VIETNAM_CITIES,
} from "@/lib/constants";
import {
  formatNumber, formatVolume, formatRelativeTime, formatDate,
} from "@/lib/format";
import { cn } from "@/lib/utils";

// ---------- Types ----------
type Warehouse = {
  id: string;
  name: string;
  code: string;
  address: string;
  city: string;
  country: string;
  capacity: number;
  used: number;
  manager: string | null;
  phone: string | null;
  status: string;
  lat: number | null;
  lng: number | null;
  createdAt: string;
  _count: { shipmentsOrigin: number; shipmentsDestination: number };
};

function capacityColorClass(pct: number): string {
  if (pct >= 90) return "[&>div]:bg-rose-500";
  if (pct >= 70) return "[&>div]:bg-amber-500";
  return "[&>div]:bg-emerald-500";
}

function capacityTextColorClass(pct: number): string {
  if (pct >= 90) return "text-rose-600 dark:text-rose-400";
  if (pct >= 70) return "text-amber-600 dark:text-amber-400";
  return "text-emerald-600 dark:text-emerald-400";
}

// ---------- Component ----------
export function WarehousesView() {
  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState("all");
  const [city, setCity] = React.useState("all");
  const [selectedId, setSelectedId] = React.useState<string | null>(null);

  const debouncedSearch = useDebounce(search, 350);

  const queryKey = React.useMemo(
    () => ["warehouses", { debouncedSearch, status, city }] as const,
    [debouncedSearch, status, city]
  );

  const { data, isLoading } = useQuery<{ items: Warehouse[] }>({
    queryKey,
    queryFn: () => {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set("q", debouncedSearch);
      if (status !== "all") params.set("status", status);
      if (city !== "all") params.set("city", city);
      return api.get(`/api/warehouses?${params.toString()}`);
    },
  });

  const warehouses = data?.items ?? [];

  const stats = React.useMemo(() => {
    const total = warehouses.length;
    const operational = warehouses.filter((w) => w.status === "operational").length;
    const atCapacity = warehouses.filter((w) => w.status === "full").length;
    const totalCapacity = warehouses.reduce((s, w) => s + (w.capacity || 0), 0);
    const totalUsed = warehouses.reduce((s, w) => s + (w.used || 0), 0);
    return { total, operational, atCapacity, totalCapacity, totalUsed };
  }, [warehouses]);

  const selected = React.useMemo(
    () => warehouses.find((w) => w.id === selectedId) ?? null,
    [warehouses, selectedId]
  );

  const mapMarkers: MapMarker[] = React.useMemo(() => {
    return warehouses.map((w) => ({
      id: w.id,
      type: "warehouse" as const,
      city: w.city,
      lat: w.lat ?? undefined,
      lng: w.lng ?? undefined,
      label: w.name,
    }));
  }, [warehouses]);

  const hasFilters = search !== "" || status !== "all" || city !== "all";
  const resetFilters = () => { setSearch(""); setStatus("all"); setCity("all"); };

  return (
    <div className="space-y-4">
      {/* KPI row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiCard
          title="Total Warehouses"
          value={formatNumber(stats.total)}
          icon={Warehouse}
          accent="sky"
          footer="Across network"
        />
        <KpiCard
          title="Operational"
          value={formatNumber(stats.operational)}
          icon={CheckCircle2}
          accent="emerald"
          footer="Active and running"
        />
        <KpiCard
          title="At Capacity"
          value={formatNumber(stats.atCapacity)}
          icon={AlertTriangle}
          accent="rose"
          footer="Need attention"
        />
        <KpiCard
          title="Total Capacity"
          value={formatVolume(stats.totalCapacity)}
          icon={Boxes}
          accent="violet"
          footer={`${formatVolume(stats.totalUsed)} used`}
        />
      </div>

      {/* Map */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <MapPin className="h-4 w-4 text-sky-500" /> Warehouse Network
            </CardTitle>
            <CardDescription className="text-xs">
              {stats.total} locations · {stats.operational} operational
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-[320px] w-full rounded-xl" />
          ) : (
            <LogisticsMap
              markers={mapMarkers}
              height={320}
              showLabels
              onMarkerClick={(m) => setSelectedId(m.id)}
            />
          )}
        </CardContent>
      </Card>

      {/* Filter bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search name, code, address, manager…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  {WAREHOUSE_STATUSES.map((s) => (
                    <SelectItem key={s} value={s} className="capitalize">{s.replace(/_/g, " ")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={city} onValueChange={setCity}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="City" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All cities</SelectItem>
                  {VIETNAM_CITIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {hasFilters && (
                <Button variant="ghost" size="sm" onClick={resetFilters} className="gap-1 text-xs">
                  <X className="h-3.5 w-3.5" /> Clear
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cards grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-72 rounded-xl" />
          ))}
        </div>
      ) : warehouses.length === 0 ? (
        <EmptyState
          icon={Warehouse}
          title="No warehouses found"
          description="Try adjusting filters or add a new warehouse to your network."
          action={<Button size="sm" variant="outline" onClick={resetFilters}>Reset filters</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {warehouses.map((w) => (
            <WarehouseCard
              key={w.id}
              warehouse={w}
              onView={() => setSelectedId(w.id)}
            />
          ))}
        </div>
      )}

      {/* Detail drawer */}
      <Sheet
        open={!!selectedId}
        onOpenChange={(o) => { if (!o) setSelectedId(null); }}
      >
        <SheetContent side="right" className="w-full gap-0 p-0 sm:max-w-lg">
          <SheetHeader className="border-b p-4">
            <SheetTitle>Warehouse details</SheetTitle>
            <SheetDescription>Full facility info, capacity, and location.</SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto">
            {selected ? (
              <WarehouseDetailContent warehouse={selected} />
            ) : (
              <div className="space-y-3 p-4">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-32 w-full" />
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

// ---------- Warehouse card ----------
function WarehouseCard({ warehouse, onView }: { warehouse: Warehouse; onView: () => void }) {
  const pct = warehouse.capacity > 0
    ? Math.min(100, Math.round((warehouse.used / warehouse.capacity) * 100))
    : 0;
  const handled = (warehouse._count?.shipmentsOrigin ?? 0) + (warehouse._count?.shipmentsDestination ?? 0);

  return (
    <Card className="h-full py-0">
      <CardContent className="flex h-full flex-col gap-3 p-4">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-500/10 text-sky-600 ring-1 ring-sky-500/20 dark:text-sky-400">
            <Warehouse className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold leading-tight">{warehouse.name}</p>
            <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">{warehouse.code}</p>
            <div className="mt-1.5"><StatusBadge status={warehouse.status} kind="warehouse" /></div>
          </div>
        </div>

        {/* Location */}
        <div className="space-y-1.5 text-sm">
          <div className="flex items-start gap-2 text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            <span className="line-clamp-2 text-xs">{warehouse.address}, {warehouse.city}</span>
          </div>
          {warehouse.manager && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <User className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate text-xs">{warehouse.manager}</span>
            </div>
          )}
          {warehouse.phone && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate font-mono text-xs">{warehouse.phone}</span>
            </div>
          )}
        </div>

        {/* Capacity */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Capacity</span>
            <span className={cn("font-semibold tabular-nums", capacityTextColorClass(pct))}>{pct}%</span>
          </div>
          <Progress value={pct} className={cn("h-2", capacityColorClass(pct))} />
          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
            <span>{formatVolume(warehouse.used)} used</span>
            <span>{formatVolume(warehouse.capacity)} total</span>
          </div>
        </div>

        {/* Shipments handled */}
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg bg-muted/40 p-2 text-center">
            <p className="text-[10px] text-muted-foreground">As origin</p>
            <p className="text-sm font-bold tabular-nums">{warehouse._count?.shipmentsOrigin ?? 0}</p>
          </div>
          <div className="rounded-lg bg-muted/40 p-2 text-center">
            <p className="text-[10px] text-muted-foreground">As destination</p>
            <p className="text-sm font-bold tabular-nums">{warehouse._count?.shipmentsDestination ?? 0}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          <Package className="h-3 w-3" />
          <span>{formatNumber(handled)} shipments handled</span>
        </div>

        <Button variant="outline" size="sm" className="mt-auto w-full gap-1.5" onClick={onView}>
          View details <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </CardContent>
    </Card>
  );
}

// ---------- Detail content ----------
function DetailRow({
  icon: Icon, label, value, mono,
}: {
  icon: React.ElementType; label: string; value: string; mono?: boolean;
}) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      <span className="w-28 shrink-0 text-xs text-muted-foreground">{label}</span>
      <span className={cn("min-w-0 flex-1 truncate font-medium", mono && "font-mono text-xs")}>{value || "—"}</span>
    </div>
  );
}

function WarehouseDetailContent({ warehouse }: { warehouse: Warehouse }) {
  const pct = warehouse.capacity > 0
    ? Math.min(100, Math.round((warehouse.used / warehouse.capacity) * 100))
    : 0;
  const handled = (warehouse._count?.shipmentsOrigin ?? 0) + (warehouse._count?.shipmentsDestination ?? 0);

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-sky-500/10 text-sky-600 ring-1 ring-sky-500/20 dark:text-sky-400">
          <Warehouse className="h-7 w-7" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-lg font-semibold">{warehouse.name}</h3>
          <p className="font-mono text-xs text-muted-foreground">{warehouse.code}</p>
          <div className="mt-1.5"><StatusBadge status={warehouse.status} kind="warehouse" /></div>
          <p className="mt-1 text-xs text-muted-foreground">
            Created {formatDate(warehouse.createdAt)}
          </p>
        </div>
      </div>

      {/* Capacity panel */}
      <div className="rounded-lg border p-3">
        <div className="mb-2 flex items-center justify-between">
          <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <Gauge className="h-3.5 w-3.5" /> Capacity Usage
          </p>
          <span className={cn("text-sm font-bold tabular-nums", capacityTextColorClass(pct))}>{pct}%</span>
        </div>
        <Progress value={pct} className={cn("h-2.5", capacityColorClass(pct))} />
        <div className="mt-2 grid grid-cols-3 gap-2 text-center text-xs">
          <div>
            <p className="text-[10px] text-muted-foreground">Used</p>
            <p className="font-semibold tabular-nums">{formatVolume(warehouse.used)}</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground">Capacity</p>
            <p className="font-semibold tabular-nums">{formatVolume(warehouse.capacity)}</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground">Free</p>
            <p className="font-semibold tabular-nums">{formatVolume(Math.max(0, warehouse.capacity - warehouse.used))}</p>
          </div>
        </div>
      </div>

      {/* Info rows */}
      <div className="grid grid-cols-1 gap-2">
        <DetailRow icon={MapPin} label="Address" value={warehouse.address} />
        <DetailRow icon={MapPin} label="City" value={[warehouse.city, warehouse.country].filter(Boolean).join(", ")} />
        {warehouse.manager && <DetailRow icon={User} label="Manager" value={warehouse.manager} />}
        {warehouse.phone && <DetailRow icon={Phone} label="Phone" value={warehouse.phone} mono />}
        {warehouse.lat !== null && warehouse.lng !== null && (
          <DetailRow icon={MapPin} label="Coordinates" value={`${warehouse.lat.toFixed(4)}, ${warehouse.lng.toFixed(4)}`} mono />
        )}
      </div>

      {/* Shipments stats */}
      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">Shipments Activity</p>
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-lg bg-emerald-500/10 p-3 text-center">
            <p className="text-[10px] text-emerald-700 dark:text-emerald-300">Origin</p>
            <p className="mt-0.5 text-xl font-bold tabular-nums text-emerald-700 dark:text-emerald-300">
              {warehouse._count?.shipmentsOrigin ?? 0}
            </p>
          </div>
          <div className="rounded-lg bg-sky-500/10 p-3 text-center">
            <p className="text-[10px] text-sky-700 dark:text-sky-300">Destination</p>
            <p className="mt-0.5 text-xl font-bold tabular-nums text-sky-700 dark:text-sky-300">
              {warehouse._count?.shipmentsDestination ?? 0}
            </p>
          </div>
          <div className="rounded-lg bg-violet-500/10 p-3 text-center">
            <p className="text-[10px] text-violet-700 dark:text-violet-300">Total</p>
            <p className="mt-0.5 text-xl font-bold tabular-nums text-violet-700 dark:text-violet-300">
              {handled}
            </p>
          </div>
        </div>
      </div>

      {/* Map */}
      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">Location</p>
        <LogisticsMap
          markers={[{
            id: warehouse.id,
            type: "warehouse",
            city: warehouse.city,
            lat: warehouse.lat ?? undefined,
            lng: warehouse.lng ?? undefined,
            label: warehouse.name,
          }]}
          height={220}
          showLabels
        />
      </div>
    </div>
  );
}

// ---------- hook ----------
function useDebounce<T>(value: T, delay: number): T {
  const [v, setV] = React.useState(value);
  React.useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}
