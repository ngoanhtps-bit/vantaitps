"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { StatusBadge } from "@/components/status-badge";
import { KpiCard, EmptyState } from "@/components/kpi-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import {
  Truck, Bike, Container, Search, Plus, Fuel, Wrench, Gauge,
  CalendarClock, X, ArrowRight, User, AlertTriangle,
} from "lucide-react";
import {
  VEHICLE_STATUSES, VEHICLE_STATUS_META, VEHICLE_TYPES,
} from "@/lib/constants";
import {
  formatNumber, formatWeight, formatDistance, formatRelativeTime, formatDate, initials,
} from "@/lib/format";
import { toast } from "sonner";
import { avatarColorClass } from "@/components/avatar-color";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/store";

// Static color map (NO dynamic class names — Tailwind purges them)
const VEHICLE_COLOR_MAP: Record<string, { bg: string; text: string }> = {
  slate: { bg: "bg-slate-500/10", text: "text-slate-600 dark:text-slate-300" },
  red: { bg: "bg-red-500/10", text: "text-red-600 dark:text-red-400" },
  blue: { bg: "bg-blue-500/10", text: "text-blue-600 dark:text-blue-400" },
  white: { bg: "bg-slate-200/70 dark:bg-slate-200/10", text: "text-slate-700 dark:text-slate-200" },
  black: { bg: "bg-slate-800/10 dark:bg-slate-200/10", text: "text-slate-800 dark:text-slate-200" },
  green: { bg: "bg-emerald-500/10", text: "text-emerald-600 dark:text-emerald-400" },
  yellow: { bg: "bg-amber-500/10", text: "text-amber-600 dark:text-amber-400" },
  orange: { bg: "bg-orange-500/10", text: "text-orange-600 dark:text-orange-400" },
  silver: { bg: "bg-slate-300/40 dark:bg-slate-400/20", text: "text-slate-600 dark:text-slate-300" },
  gray: { bg: "bg-slate-400/20", text: "text-slate-600 dark:text-slate-300" },
};

const VEHICLE_TYPE_ICON: Record<string, React.ElementType> = {
  truck: Truck,
  van: Truck,
  motorbike: Bike,
  container: Container,
};

const VEHICLE_COLORS_LIST = Object.keys(VEHICLE_COLOR_MAP);
const FUEL_TYPES = ["diesel", "petrol", "electric"] as const;

function vehicleColorMeta(color: string) {
  return VEHICLE_COLOR_MAP[color] || VEHICLE_COLOR_MAP.slate;
}

function vehicleTypeIcon(type: string): React.ElementType {
  return VEHICLE_TYPE_ICON[type] || Truck;
}

function fuelColorClass(level: number): string {
  if (level > 50) return "[&>div]:bg-emerald-500";
  if (level > 25) return "[&>div]:bg-amber-500";
  return "[&>div]:bg-rose-500";
}

type VehicleDriver = { id: string; name: string; avatarColor: string; status: string };

type Vehicle = {
  id: string;
  plateNumber: string;
  model: string;
  brand: string;
  type: string;
  capacityKg: number;
  fuelType: string;
  fuelLevel: number;
  mileage: number;
  status: string;
  lastMaintenance: string | null;
  nextMaintenance: string | null;
  color: string;
  createdAt: string;
  driver: VehicleDriver | null;
  _count: { shipments: number };
};

type VehicleShipment = {
  id: string;
  trackingNumber: string;
  status: string;
  originCity: string;
  destinationCity: string;
  createdAt: string;
};

type VehicleDetail = Vehicle & {
  shipments: VehicleShipment[];
};

export function VehiclesView() {
  const qc = useQueryClient();
  const { setSelectedShipmentId, setView } = useAppStore();
  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState("all");
  const [type, setType] = React.useState("all");
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [createOpen, setCreateOpen] = React.useState(false);

  const debouncedSearch = useDebounce(search, 350);

  const queryKey = React.useMemo(
    () => ["vehicles", { debouncedSearch, status, type }] as const,
    [debouncedSearch, status, type]
  );

  const { data, isLoading } = useQuery<{ items: Vehicle[] }>({
    queryKey,
    queryFn: () => {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set("q", debouncedSearch);
      if (status !== "all") params.set("status", status);
      if (type !== "all") params.set("type", type);
      return api.get(`/api/vehicles?${params.toString()}`);
    },
  });

  const { data: detail, isLoading: detailLoading } = useQuery<VehicleDetail>({
    queryKey: ["vehicle", selectedId],
    queryFn: () => api.get(`/api/vehicles/${selectedId}`),
    enabled: !!selectedId,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Record<string, unknown> }) =>
      api.patch(`/api/vehicles/${id}`, body),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["vehicles"] });
      qc.invalidateQueries({ queryKey: ["vehicle", vars.id] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Vehicle updated");
    },
    onError: (e: Error) => toast.error(e.message || "Failed to update vehicle"),
  });

  const createMutation = useMutation({
    mutationFn: (body: Record<string, unknown>) => api.post("/api/vehicles", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vehicles"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Vehicle added to fleet");
      setCreateOpen(false);
    },
    onError: (e: Error) => toast.error(e.message || "Failed to add vehicle"),
  });

  const vehicles = data?.items ?? [];

  const stats = React.useMemo(() => {
    const total = vehicles.length;
    const active = vehicles.filter((v) => v.status === "active").length;
    const maintenance = vehicles.filter((v) => v.status === "maintenance").length;
    const totalCapacity = vehicles.reduce((s, v) => s + (v.capacityKg || 0), 0);
    return { total, active, maintenance, totalCapacity };
  }, [vehicles]);

  const hasFilters = search !== "" || status !== "all" || type !== "all";
  const resetFilters = () => { setSearch(""); setStatus("all"); setType("all"); };

  return (
    <div className="space-y-4">
      {/* KPI row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiCard
          title="Total Vehicles"
          value={formatNumber(stats.total)}
          icon={Truck}
          accent="emerald"
          footer="In fleet"
        />
        <KpiCard
          title="Active"
          value={formatNumber(stats.active)}
          icon={Truck}
          accent="sky"
          footer="On the road"
        />
        <KpiCard
          title="In Maintenance"
          value={formatNumber(stats.maintenance)}
          icon={Wrench}
          accent="orange"
          footer="Being serviced"
        />
        <KpiCard
          title="Total Capacity"
          value={formatWeight(stats.totalCapacity)}
          icon={Gauge}
          accent="violet"
          footer="Combined payload"
        />
      </div>

      {/* Filter bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search plate, model, brand…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  {VEHICLE_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>{VEHICLE_STATUS_META[s].label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  {VEHICLE_TYPES.map((t) => (
                    <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {hasFilters && (
                <Button variant="ghost" size="sm" onClick={resetFilters} className="gap-1 text-xs">
                  <X className="h-3.5 w-3.5" /> Clear
                </Button>
              )}
              <Button size="sm" onClick={() => setCreateOpen(true)} className="gap-1.5">
                <Plus className="h-4 w-4" /> Add Vehicle
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cards grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-80 rounded-xl" />
          ))}
        </div>
      ) : vehicles.length === 0 ? (
        <EmptyState
          icon={Truck}
          title="No vehicles found"
          description="Try adjusting filters or add a new vehicle to your fleet."
          action={<Button size="sm" variant="outline" onClick={resetFilters}>Reset filters</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {vehicles.map((v) => (
            <VehicleCard key={v.id} vehicle={v} onView={() => setSelectedId(v.id)} />
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
            <SheetTitle>Vehicle details</SheetTitle>
            <SheetDescription>Full specs, maintenance, and recent shipments.</SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto">
            {detailLoading || !detail ? (
              <div className="space-y-3 p-4">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-32 w-full" />
              </div>
            ) : (
              <VehicleDetailContent
                vehicle={detail}
                onUpdate={(body) => updateMutation.mutate({ id: detail.id, body })}
                updating={updateMutation.isPending}
                onShipmentClick={(id) => {
                  setSelectedShipmentId(id);
                  setSelectedId(null);
                  setView("shipments");
                }}
              />
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Create dialog */}
      <CreateVehicleDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSubmit={(body) => createMutation.mutate(body)}
        submitting={createMutation.isPending}
      />
    </div>
  );
}

function SpecItem({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div>
      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      <p className="mt-1 text-sm font-semibold tabular-nums">{value}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}

function VehicleCard({ vehicle, onView }: { vehicle: Vehicle; onView: () => void }) {
  const Icon = vehicleTypeIcon(vehicle.type);
  const color = vehicleColorMeta(vehicle.color);
  const maintenanceOverdue = vehicle.nextMaintenance
    ? new Date(vehicle.nextMaintenance).getTime() < Date.now()
    : false;

  return (
    <Card className="h-full py-0">
      <CardContent className="flex h-full flex-col gap-3 p-4">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl ring-1 ring-inset", color.bg, color.text)}>
            <Icon className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-mono text-base font-bold tracking-tight">{vehicle.plateNumber}</p>
            <p className="truncate text-xs text-muted-foreground capitalize">{vehicle.model} · {vehicle.brand}</p>
          </div>
          <StatusBadge status={vehicle.status} kind="vehicle" />
        </div>

        {/* Type & fuel badges */}
        <div className="flex flex-wrap gap-1.5">
          <Badge variant="secondary" className="capitalize">{vehicle.type}</Badge>
          <Badge variant="outline" className="capitalize">{vehicle.fuelType}</Badge>
        </div>

        {/* Specs */}
        <div className="grid grid-cols-2 gap-2 rounded-lg bg-muted/40 p-3">
          <SpecItem icon={Gauge} label="Capacity" value={formatWeight(vehicle.capacityKg)} />
          <SpecItem icon={Container} label="Mileage" value={formatDistance(vehicle.mileage)} />
        </div>

        {/* Fuel */}
        <div>
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="flex items-center gap-1 text-muted-foreground">
              <Fuel className="h-3 w-3" /> Fuel
            </span>
            <span className="font-semibold tabular-nums">{vehicle.fuelLevel}%</span>
          </div>
          <Progress value={vehicle.fuelLevel} className={cn("h-1.5", fuelColorClass(vehicle.fuelLevel))} />
        </div>

        {/* Maintenance */}
        <div className={cn(
          "flex items-center gap-2 rounded-lg border p-2.5",
          maintenanceOverdue && "border-rose-200 bg-rose-50 dark:border-rose-900 dark:bg-rose-950/30"
        )}>
          <Wrench className={cn("h-3.5 w-3.5 shrink-0", maintenanceOverdue ? "text-rose-500" : "text-muted-foreground")} />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium">
              {vehicle.nextMaintenance ? `Next: ${formatRelativeTime(vehicle.nextMaintenance)}` : "No scheduled maintenance"}
            </p>
            {maintenanceOverdue && (
              <p className="flex items-center gap-1 text-[10px] font-medium text-rose-600 dark:text-rose-400">
                <AlertTriangle className="h-2.5 w-2.5" /> Overdue — service required
              </p>
            )}
          </div>
        </div>

        {/* Driver */}
        <div className="flex items-center gap-2 rounded-lg border p-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <User className="h-4 w-4" />
          </div>
          {vehicle.driver ? (
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarFallback className={cn("text-[10px] font-semibold text-white", avatarColorClass(vehicle.driver.avatarColor))}>
                  {initials(vehicle.driver.name)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate text-xs font-medium">{vehicle.driver.name}</p>
                <p className="text-[10px] text-muted-foreground">Assigned driver</p>
              </div>
            </div>
          ) : (
            <p className="flex-1 text-xs text-muted-foreground">Unassigned</p>
          )}
        </div>

        <Button variant="outline" size="sm" className="mt-auto w-full gap-1.5" onClick={onView}>
          View details <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </CardContent>
    </Card>
  );
}

function VehicleDetailContent({
  vehicle,
  onUpdate,
  updating,
  onShipmentClick,
}: {
  vehicle: VehicleDetail;
  onUpdate: (body: Record<string, unknown>) => void;
  updating: boolean;
  onShipmentClick: (id: string) => void;
}) {
  const [fuelLevel, setFuelLevel] = React.useState(vehicle.fuelLevel);

  React.useEffect(() => {
    setFuelLevel(vehicle.fuelLevel);
  }, [vehicle.fuelLevel]);

  const Icon = vehicleTypeIcon(vehicle.type);
  const color = vehicleColorMeta(vehicle.color);
  const maintenanceOverdue = vehicle.nextMaintenance
    ? new Date(vehicle.nextMaintenance).getTime() < Date.now()
    : false;

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className={cn("flex h-14 w-14 items-center justify-center rounded-xl ring-1 ring-inset", color.bg, color.text)}>
          <Icon className="h-7 w-7" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-mono text-lg font-bold tracking-tight">{vehicle.plateNumber}</h3>
          <p className="text-xs text-muted-foreground capitalize">{vehicle.brand} · {vehicle.model}</p>
          <div className="mt-1.5"><StatusBadge status={vehicle.status} kind="vehicle" /></div>
        </div>
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-1.5">
        <Badge variant="secondary" className="capitalize">{vehicle.type}</Badge>
        <Badge variant="outline" className="capitalize">{vehicle.fuelType} fuel</Badge>
        <Badge variant="outline" className="capitalize">{vehicle.color}</Badge>
      </div>

      {/* Specs */}
      <div className="grid grid-cols-2 gap-2 rounded-lg bg-muted/40 p-3">
        <SpecItem icon={Gauge} label="Capacity" value={formatWeight(vehicle.capacityKg)} />
        <SpecItem icon={Container} label="Mileage" value={formatDistance(vehicle.mileage)} />
      </div>

      {/* Maintenance */}
      <div>
        <p className="mb-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">Maintenance</p>
        <div className={cn(
          "space-y-1.5 rounded-lg border p-3",
          maintenanceOverdue && "border-rose-200 bg-rose-50 dark:border-rose-900 dark:bg-rose-950/30"
        )}>
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Wrench className="h-3 w-3" /> Last service
            </span>
            <span className="font-medium">
              {vehicle.lastMaintenance ? formatDate(vehicle.lastMaintenance) : "—"}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <CalendarClock className="h-3 w-3" /> Next service
            </span>
            <span className={cn("font-medium", maintenanceOverdue && "text-rose-600 dark:text-rose-400")}>
              {vehicle.nextMaintenance ? formatDate(vehicle.nextMaintenance) : "—"}
            </span>
          </div>
          {maintenanceOverdue && (
            <p className="flex items-center gap-1 text-[11px] font-medium text-rose-600 dark:text-rose-400">
              <AlertTriangle className="h-3 w-3" /> Maintenance overdue — please service this vehicle
            </p>
          )}
        </div>
      </div>

      {/* Driver */}
      <div>
        <p className="mb-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">Assigned driver</p>
        {vehicle.driver ? (
          <div className="flex items-center gap-2 rounded-lg border p-2.5">
            <Avatar className="h-9 w-9">
              <AvatarFallback className={cn("text-xs font-semibold text-white", avatarColorClass(vehicle.driver.avatarColor))}>
                {initials(vehicle.driver.name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{vehicle.driver.name}</p>
              <div className="mt-0.5"><StatusBadge status={vehicle.driver.status} kind="driver" /></div>
            </div>
          </div>
        ) : (
          <p className="rounded-lg border border-dashed p-3 text-center text-xs text-muted-foreground">
            No driver assigned
          </p>
        )}
      </div>

      {/* Status control */}
      <div>
        <p className="mb-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">Update status</p>
        <Select
          value={vehicle.status}
          onValueChange={(v) => onUpdate({ status: v })}
          disabled={updating}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            {VEHICLE_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>{VEHICLE_STATUS_META[s].label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Fuel control */}
      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Fuel level</p>
          <span className="text-xs font-semibold tabular-nums">{fuelLevel}%</span>
        </div>
        <Progress value={fuelLevel} className={cn("h-2", fuelColorClass(fuelLevel))} />
        <Slider
          className="mt-3"
          value={[fuelLevel]}
          max={100}
          step={1}
          onValueChange={(v) => setFuelLevel(v[0])}
          onValueCommit={(v) => onUpdate({ fuelLevel: v[0] })}
          disabled={updating}
        />
        <p className="mt-1 text-[10px] text-muted-foreground">Drag to adjust — releases to update.</p>
      </div>

      {/* Recent shipments */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Recent shipments</p>
          <Badge variant="secondary" className="text-[10px]">{vehicle._count.shipments} total</Badge>
        </div>
        {vehicle.shipments.length === 0 ? (
          <p className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">
            No shipments yet
          </p>
        ) : (
          <div className="space-y-1.5">
            {vehicle.shipments.map((s) => (
              <button
                key={s.id}
                onClick={() => onShipmentClick(s.id)}
                className="flex w-full items-center gap-2 rounded-lg border p-2.5 text-left transition-colors hover:bg-muted/50"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-mono text-xs font-semibold">{s.trackingNumber}</p>
                  <p className="truncate text-[10px] text-muted-foreground">
                    {s.originCity} → {s.destinationCity}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <StatusBadge status={s.status} kind="shipment" />
                  <span className="text-[10px] text-muted-foreground">{formatRelativeTime(s.createdAt)}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CreateVehicleDialog({
  open, onOpenChange, onSubmit, submitting,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSubmit: (body: Record<string, unknown>) => void;
  submitting: boolean;
}) {
  const [plateNumber, setPlateNumber] = React.useState("");
  const [model, setModel] = React.useState("");
  const [brand, setBrand] = React.useState("");
  const [type, setType] = React.useState<string>("truck");
  const [capacityKg, setCapacityKg] = React.useState("");
  const [fuelType, setFuelType] = React.useState<string>("diesel");
  const [color, setColor] = React.useState<string>("slate");

  React.useEffect(() => {
    if (!open) {
      setPlateNumber(""); setModel(""); setBrand("");
      setType("truck"); setCapacityKg(""); setFuelType("diesel"); setColor("slate");
    }
  }, [open]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!plateNumber || !model || !brand) {
      toast.error("Plate number, model and brand are required");
      return;
    }
    onSubmit({
      plateNumber,
      model,
      brand,
      type,
      capacityKg: capacityKg ? Number(capacityKg) : 0,
      fuelType,
      color,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add new vehicle</DialogTitle>
          <DialogDescription>
            Register a new vehicle in the fleet. It will start with &ldquo;Active&rdquo; status.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="v-plate">Plate number *</Label>
            <Input
              id="v-plate"
              value={plateNumber}
              onChange={(e) => setPlateNumber(e.target.value.toUpperCase())}
              placeholder="51A-12345"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="v-model">Model *</Label>
              <Input id="v-model" value={model} onChange={(e) => setModel(e.target.value)} placeholder="Actros" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="v-brand">Brand *</Label>
              <Input id="v-brand" value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="Mercedes-Benz" required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="v-type">Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger id="v-type" className="w-full">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  {VEHICLE_TYPES.map((t) => (
                    <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="v-cap">Capacity (kg)</Label>
              <Input
                id="v-cap"
                type="number"
                min={0}
                value={capacityKg}
                onChange={(e) => setCapacityKg(e.target.value)}
                placeholder="5000"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="v-fuel">Fuel type</Label>
              <Select value={fuelType} onValueChange={setFuelType}>
                <SelectTrigger id="v-fuel" className="w-full">
                  <SelectValue placeholder="Fuel" />
                </SelectTrigger>
                <SelectContent>
                  {FUEL_TYPES.map((f) => (
                    <SelectItem key={f} value={f} className="capitalize">{f}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="v-color">Color</Label>
              <Select value={color} onValueChange={setColor}>
                <SelectTrigger id="v-color" className="w-full">
                  <SelectValue placeholder="Color" />
                </SelectTrigger>
                <SelectContent>
                  {VEHICLE_COLORS_LIST.map((c) => (
                    <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Adding…" : "Add vehicle"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
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
