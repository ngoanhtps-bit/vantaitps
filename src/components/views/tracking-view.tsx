"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { LogisticsMap, type MapMarker, type MapRoute } from "@/components/logistics-map";
import { StatusBadge } from "@/components/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Truck, MapPin, Package, Navigation, Clock, AlertTriangle,
  RefreshCw, Radio, Warehouse as WarehouseIcon, ArrowRight, Phone,
} from "lucide-react";
import { formatRelativeTime, formatDateTime, initials } from "@/lib/format";
import { SHIPMENT_STATUS_META } from "@/lib/constants";
import { avatarColorClass } from "@/components/avatar-color";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";

type TrackingData = {
  live: Array<{
    id: string; trackingNumber: string; status: string; progress: number;
    currentLat: number | null; currentLng: number | null;
    originCity: string; destinationCity: string; originAddress: string; destinationAddress: string;
    priority: string; serviceType: string; estimatedDelivery: string | null;
    driver: { id: string; name: string; avatarColor: string; phone: string } | null;
    vehicle: { id: string; plateNumber: string; model: string; type: string } | null;
    sender: { name: string }; receiver: { name: string };
  }>;
  warehouses: Array<{
    id: string; name: string; code: string; city: string; lat: number | null; lng: number | null;
    status: string; used: number; capacity: number;
  }>;
  delayed: Array<{
    id: string; trackingNumber: string; originCity: string; destinationCity: string; estimatedDelivery: string | null;
  }>;
  count: number;
};

export function TrackingView() {
  const { data, isLoading, refetch, isFetching, dataUpdatedAt } = useQuery<TrackingData>({
    queryKey: ["tracking"],
    queryFn: () => api.get("/api/tracking"),
    refetchInterval: 15000,
  });
  const { setSelectedShipmentId, setView } = useAppStore();
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = React.useState<number | null>(dataUpdatedAt ?? null);

  React.useEffect(() => {
    if (dataUpdatedAt) setLastUpdated(dataUpdatedAt);
  }, [dataUpdatedAt]);

  const selected = data?.live.find((s) => s.id === selectedId) || null;

  const markers: MapMarker[] = React.useMemo(() => {
    if (!data) return [];
    return [
      ...data.live.map((s) => ({
        id: s.id,
        type: "live" as const,
        lat: s.currentLat ?? undefined,
        lng: s.currentLng ?? undefined,
      })),
      ...data.warehouses.map((w) => ({
        id: w.id,
        type: "warehouse" as const,
        city: w.city,
        label: w.name,
      })),
    ];
  }, [data]);

  const routes: MapRoute[] = React.useMemo(() => {
    if (!data) return [];
    return data.live.map((s) => ({
      id: s.id,
      fromCity: s.originCity,
      toCity: s.destinationCity,
      progress: s.progress,
      status: s.status,
    }));
  }, [data]);

  return (
    <div className="space-y-4">
      {/* Header strip */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
          </span>
          <p className="text-sm">
            <span className="font-semibold">{data?.count ?? "—"}</span>
            <span className="text-muted-foreground"> shipments live · </span>
            <span className="text-muted-foreground">auto-refresh 15s</span>
            {lastUpdated && (
              <span className="ml-1 text-muted-foreground/70">· updated {formatRelativeTime(new Date(lastUpdated))}</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1.5 border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-400">
            <Radio className="h-3 w-3" /> {isFetching ? "Syncing…" : "Real-time"}
          </Badge>
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching} className="gap-1.5">
            <RefreshCw className={cn("h-3.5 w-3.5", isFetching && "animate-spin")} /> Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Map */}
        <Card className="lg:col-span-2">
          <CardContent className="p-3">
            {isLoading ? (
              <Skeleton className="h-[480px] w-full rounded-xl" />
            ) : (
              <LogisticsMap
                markers={markers}
                routes={routes}
                height={480}
                onMarkerClick={(m) => m.type === "live" && setSelectedId(m.id)}
              />
            )}
          </CardContent>
        </Card>

        {/* Side panel */}
        <div className="space-y-4">
          {/* Selected shipment detail */}
          {selected ? (
            <Card>
              <CardContent className="p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-emerald-500" />
                    <span className="font-mono text-sm font-semibold">{selected.trackingNumber}</span>
                  </div>
                  <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => setSelectedId(null)}>
                    ✕
                  </Button>
                </div>
                <div className="mb-3"><StatusBadge status={selected.status} kind="shipment" /></div>

                <div className="mb-3 flex items-center gap-2 text-sm">
                  <span className="font-medium">{selected.originCity}</span>
                  <Navigation className="h-3.5 w-3.5 text-emerald-500" />
                  <span className="font-medium">{selected.destinationCity}</span>
                </div>

                <div className="mb-3">
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-semibold tabular-nums">{selected.progress}%</span>
                  </div>
                  <Progress value={selected.progress} className="h-2" />
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-lg bg-muted/40 p-2">
                    <p className="text-muted-foreground">Sender</p>
                    <p className="font-medium truncate">{selected.sender.name}</p>
                  </div>
                  <div className="rounded-lg bg-muted/40 p-2">
                    <p className="text-muted-foreground">Receiver</p>
                    <p className="font-medium truncate">{selected.receiver.name}</p>
                  </div>
                </div>

                {selected.driver && (
                  <div className="mt-3 flex items-center gap-2 rounded-lg border p-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className={cn("text-[10px] font-semibold text-white", avatarColorClass(selected.driver.avatarColor))}>
                        {initials(selected.driver.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium truncate">{selected.driver.name}</p>
                      <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Phone className="h-2.5 w-2.5" /> {selected.driver.phone}
                      </p>
                    </div>
                  </div>
                )}

                {selected.vehicle && (
                  <div className="mt-2 flex items-center gap-2 rounded-lg border p-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400">
                      <Truck className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-medium">{selected.vehicle.plateNumber}</p>
                      <p className="text-[10px] text-muted-foreground capitalize">{selected.vehicle.model} · {selected.vehicle.type}</p>
                    </div>
                  </div>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3 w-full gap-1.5"
                  onClick={() => { setSelectedShipmentId(selected.id); setView("shipments"); }}
                >
                  Open full details <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center gap-2 p-6 text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <MapPin className="h-5 w-5" />
                </div>
                <p className="text-sm font-medium">Select a shipment</p>
                <p className="text-xs text-muted-foreground">Click any marker on the map to see live details.</p>
              </CardContent>
            </Card>
          )}

          {/* Live shipments list */}
          <Card>
            <CardContent className="p-0">
              <div className="border-b px-4 py-3">
                <h3 className="flex items-center gap-2 text-sm font-semibold">
                  <Truck className="h-4 w-4 text-emerald-500" /> Active Fleet
                </h3>
                <p className="text-xs text-muted-foreground">{data?.live.length ?? 0} shipments in motion</p>
              </div>
              <div className="max-h-72 overflow-y-auto custom-scroll divide-y">
                {isLoading ? (
                  Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 m-2" />)
                ) : (
                  data?.live.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setSelectedId(s.id)}
                      className={cn(
                        "flex w-full items-center gap-2 px-4 py-2.5 text-left transition-colors hover:bg-muted/50",
                        selectedId === s.id && "bg-emerald-50 dark:bg-emerald-950/30"
                      )}
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                        <Package className="h-3.5 w-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-mono text-xs font-semibold">{s.trackingNumber}</p>
                        <p className="truncate text-[10px] text-muted-foreground">
                          {s.originCity} → {s.destinationCity}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-semibold tabular-nums">{s.progress}%</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Delayed alerts */}
          {data && data.delayed.length > 0 && (
            <Card className="border-orange-200 dark:border-orange-900">
              <CardContent className="p-0">
                <div className="border-b border-orange-200 px-4 py-3 dark:border-orange-900">
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-orange-700 dark:text-orange-400">
                    <AlertTriangle className="h-4 w-4" /> Delayed Shipments
                  </h3>
                  <p className="text-xs text-muted-foreground">{data.delayed.length} need attention</p>
                </div>
                <div className="max-h-48 overflow-y-auto custom-scroll divide-y">
                  {data.delayed.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => { setSelectedShipmentId(s.id); setView("shipments"); }}
                      className="flex w-full items-center gap-2 px-4 py-2 text-left hover:bg-orange-50 dark:hover:bg-orange-950/20"
                    >
                      <Clock className="h-3.5 w-3.5 shrink-0 text-orange-500" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-mono text-xs">{s.trackingNumber}</p>
                        <p className="truncate text-[10px] text-muted-foreground">{s.originCity} → {s.destinationCity}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Warehouses strip */}
      {data && (
        <Card>
          <CardContent className="p-4">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <WarehouseIcon className="h-4 w-4 text-sky-500" /> Warehouse Network
            </h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
              {data.warehouses.map((w) => {
                const pct = w.capacity > 0 ? Math.round((w.used / w.capacity) * 100) : 0;
                return (
                  <div key={w.id} className="rounded-lg border p-2.5">
                    <p className="truncate text-xs font-medium">{w.city}</p>
                    <p className="mb-1.5 text-[10px] text-muted-foreground">{w.code}</p>
                    <Progress value={pct} className={cn("h-1.5", pct > 90 ? "[&>div]:bg-rose-500" : pct > 70 ? "[&>div]:bg-amber-500" : "[&>div]:bg-emerald-500")} />
                    <p className="mt-1 text-[10px] text-muted-foreground">{pct}% used</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
