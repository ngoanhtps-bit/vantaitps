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
import {
  Truck, UserCheck, Package, Star, Search, Plus, Mail, Phone,
  CreditCard, CalendarClock, CalendarDays, Navigation, X, ArrowRight, Users,
} from "lucide-react";
import {
  DRIVER_STATUSES, DRIVER_STATUS_META, AVATAR_COLORS,
  type DriverStatus,
} from "@/lib/constants";
import {
  formatNumber, formatDistance, formatRelativeTime, formatDate, initials,
} from "@/lib/format";
import { toast } from "sonner";
import { avatarColorClass } from "@/components/avatar-color";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/store";

type DriverVehicle = { id: string; plateNumber: string; model: string; type: string };

type Driver = {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  licenseNumber: string;
  licenseExpiry: string | null;
  status: string;
  rating: number;
  totalDeliveries: number;
  totalDistance: number;
  hireDate: string | null;
  avatarColor: string;
  createdAt: string;
  vehicle: DriverVehicle | null;
  _count: { shipments: number };
};

type DriverShipment = {
  id: string;
  trackingNumber: string;
  status: string;
  originCity: string;
  destinationCity: string;
  createdAt: string;
  cost: number;
};

type DriverDetail = Driver & {
  shipments: DriverShipment[];
};

export function DriversView() {
  const qc = useQueryClient();
  const { setSelectedShipmentId, setView } = useAppStore();
  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState("all");
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [createOpen, setCreateOpen] = React.useState(false);

  const debouncedSearch = useDebounce(search, 350);

  const queryKey = React.useMemo(
    () => ["drivers", { debouncedSearch, status }] as const,
    [debouncedSearch, status]
  );

  const { data, isLoading } = useQuery<{ items: Driver[] }>({
    queryKey,
    queryFn: () => {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set("q", debouncedSearch);
      if (status !== "all") params.set("status", status);
      return api.get(`/api/drivers?${params.toString()}`);
    },
  });

  const { data: detail, isLoading: detailLoading } = useQuery<DriverDetail>({
    queryKey: ["driver", selectedId],
    queryFn: () => api.get(`/api/drivers/${selectedId}`),
    enabled: !!selectedId,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: DriverStatus }) =>
      api.patch(`/api/drivers/${id}`, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["drivers"] });
      qc.invalidateQueries({ queryKey: ["driver", selectedId] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Driver status updated");
    },
    onError: (e: Error) => toast.error(e.message || "Failed to update status"),
  });

  const createMutation = useMutation({
    mutationFn: (body: Record<string, unknown>) => api.post("/api/drivers", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["drivers"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Driver created successfully");
      setCreateOpen(false);
    },
    onError: (e: Error) => toast.error(e.message || "Failed to create driver"),
  });

  const drivers = data?.items ?? [];

  const stats = React.useMemo(() => {
    const total = drivers.length;
    const available = drivers.filter((d) => d.status === "available").length;
    const onDelivery = drivers.filter((d) => d.status === "on_delivery").length;
    const avgRating = total > 0
      ? drivers.reduce((s, d) => s + (d.rating || 0), 0) / total
      : 0;
    return { total, available, onDelivery, avgRating };
  }, [drivers]);

  const hasFilters = search !== "" || status !== "all";
  const resetFilters = () => { setSearch(""); setStatus("all"); };

  return (
    <div className="space-y-4">
      {/* KPI row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiCard
          title="Total Drivers"
          value={formatNumber(stats.total)}
          icon={Truck}
          accent="emerald"
          footer={`${stats.available} available now`}
        />
        <KpiCard
          title="Available Now"
          value={formatNumber(stats.available)}
          icon={UserCheck}
          accent="sky"
          footer="Ready for assignment"
        />
        <KpiCard
          title="On Delivery"
          value={formatNumber(stats.onDelivery)}
          icon={Package}
          accent="amber"
          footer="Currently active"
        />
        <KpiCard
          title="Avg Rating"
          value={stats.avgRating.toFixed(1)}
          icon={Star}
          accent="violet"
          footer="Across all drivers"
        />
      </div>

      {/* Filter bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search name, phone, license #…"
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
                  {DRIVER_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>{DRIVER_STATUS_META[s].label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {hasFilters && (
                <Button variant="ghost" size="sm" onClick={resetFilters} className="gap-1 text-xs">
                  <X className="h-3.5 w-3.5" /> Clear
                </Button>
              )}
              <Button size="sm" onClick={() => setCreateOpen(true)} className="gap-1.5">
                <Plus className="h-4 w-4" /> Add Driver
              </Button>
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
      ) : drivers.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No drivers found"
          description="Try adjusting filters or add a new driver to your team."
          action={<Button size="sm" variant="outline" onClick={resetFilters}>Reset filters</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {drivers.map((d) => (
            <DriverCard key={d.id} driver={d} onView={() => setSelectedId(d.id)} />
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
            <SheetTitle>Driver details</SheetTitle>
            <SheetDescription>Full profile, stats, and recent shipments.</SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto">
            {detailLoading || !detail ? (
              <div className="space-y-3 p-4">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-32 w-full" />
              </div>
            ) : (
              <DriverDetailContent
                driver={detail}
                onStatusChange={(s) =>
                  updateStatusMutation.mutate({ id: detail.id, status: s })
                }
                updating={updateStatusMutation.isPending}
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
      <CreateDriverDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSubmit={(body) => createMutation.mutate(body)}
        submitting={createMutation.isPending}
      />
    </div>
  );
}

function DriverCard({ driver, onView }: { driver: Driver; onView: () => void }) {
  return (
    <Card className="h-full py-0">
      <CardContent className="flex h-full flex-col gap-3 p-4">
        {/* Header */}
        <div className="flex items-start gap-3">
          <Avatar className="h-12 w-12">
            <AvatarFallback className={cn("text-sm font-semibold text-white", avatarColorClass(driver.avatarColor))}>
              {initials(driver.name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold leading-tight">{driver.name}</p>
            <div className="mt-1.5"><StatusBadge status={driver.status} kind="driver" /></div>
          </div>
        </div>

        {/* Contact */}
        <div className="space-y-1.5 text-sm">
          {driver.email && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Mail className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{driver.email}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-muted-foreground">
            <Phone className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{driver.phone}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <CreditCard className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate font-mono text-xs">{driver.licenseNumber}</span>
          </div>
          {driver.licenseExpiry && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <CalendarClock className="h-3.5 w-3.5 shrink-0" />
              <span className="text-xs">Expires {formatDate(driver.licenseExpiry)}</span>
            </div>
          )}
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2 rounded-lg bg-muted/40 p-3">
          <Stat label="Deliveries" value={formatNumber(driver.totalDeliveries)} icon={Package} />
          <Stat label="Distance" value={formatDistance(driver.totalDistance)} icon={Navigation} />
          <Stat label="Rating" value={driver.rating.toFixed(1)} icon={Star} />
        </div>

        {/* Vehicle */}
        <div className="flex items-center gap-2 rounded-lg border p-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400">
            <Truck className="h-4 w-4" />
          </div>
          {driver.vehicle ? (
            <div className="min-w-0 flex-1">
              <p className="truncate font-mono text-xs font-semibold">{driver.vehicle.plateNumber}</p>
              <p className="truncate text-[10px] text-muted-foreground capitalize">{driver.vehicle.model} · {driver.vehicle.type}</p>
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

function Stat({ label, value, icon: Icon }: { label: string; value: string; icon: React.ElementType }) {
  return (
    <div className="text-center">
      <Icon className="mx-auto h-3.5 w-3.5 text-muted-foreground" />
      <p className="mt-1 text-sm font-semibold tabular-nums">{value}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}

function DetailRow({
  icon: Icon, label, value, mono,
}: {
  icon: React.ElementType; label: string; value: string; mono?: boolean;
}) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      <span className="w-28 shrink-0 text-xs text-muted-foreground">{label}</span>
      <span className={cn("min-w-0 flex-1 truncate font-medium", mono && "font-mono text-xs")}>{value}</span>
    </div>
  );
}

function DriverDetailContent({
  driver,
  onStatusChange,
  updating,
  onShipmentClick,
}: {
  driver: DriverDetail;
  onStatusChange: (s: DriverStatus) => void;
  updating: boolean;
  onShipmentClick: (id: string) => void;
}) {
  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Profile header */}
      <div className="flex items-start gap-3">
        <Avatar className="h-16 w-16">
          <AvatarFallback className={cn("text-lg font-semibold text-white", avatarColorClass(driver.avatarColor))}>
            {initials(driver.name)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-lg font-semibold">{driver.name}</h3>
          <div className="mt-1.5"><StatusBadge status={driver.status} kind="driver" /></div>
          <p className="mt-1 text-xs text-muted-foreground">
            Joined {driver.hireDate ? formatDate(driver.hireDate) : "—"}
          </p>
        </div>
      </div>

      {/* Contact */}
      <div className="grid grid-cols-1 gap-2">
        {driver.email && (
          <DetailRow icon={Mail} label="Email" value={driver.email} />
        )}
        <DetailRow icon={Phone} label="Phone" value={driver.phone} />
        <DetailRow icon={CreditCard} label="License #" value={driver.licenseNumber} mono />
        <DetailRow
          icon={CalendarClock}
          label="License expires"
          value={driver.licenseExpiry ? formatDate(driver.licenseExpiry) : "—"}
        />
        <DetailRow
          icon={CalendarDays}
          label="Hire date"
          value={driver.hireDate ? formatDate(driver.hireDate) : "—"}
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 rounded-lg bg-muted/40 p-3">
        <Stat label="Deliveries" value={formatNumber(driver.totalDeliveries)} icon={Package} />
        <Stat label="Distance" value={formatDistance(driver.totalDistance)} icon={Navigation} />
        <Stat label="Rating" value={driver.rating.toFixed(1)} icon={Star} />
      </div>

      {/* Vehicle */}
      <div>
        <p className="mb-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">Assigned vehicle</p>
        <div className="flex items-center gap-2 rounded-lg border p-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400">
            <Truck className="h-4 w-4" />
          </div>
          {driver.vehicle ? (
            <div className="min-w-0 flex-1">
              <p className="truncate font-mono text-sm font-semibold">{driver.vehicle.plateNumber}</p>
              <p className="truncate text-xs text-muted-foreground capitalize">{driver.vehicle.model} · {driver.vehicle.type}</p>
            </div>
          ) : (
            <p className="flex-1 text-sm text-muted-foreground">Unassigned</p>
          )}
        </div>
      </div>

      {/* Status change control */}
      <div>
        <p className="mb-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">Change status</p>
        <Select
          value={driver.status}
          onValueChange={(v) => onStatusChange(v as DriverStatus)}
          disabled={updating}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            {DRIVER_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>{DRIVER_STATUS_META[s].label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Recent shipments */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Recent shipments</p>
          <Badge variant="secondary" className="text-[10px]">{driver._count.shipments} total</Badge>
        </div>
        {driver.shipments.length === 0 ? (
          <p className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">
            No shipments yet
          </p>
        ) : (
          <div className="space-y-1.5">
            {driver.shipments.map((s) => (
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

function CreateDriverDialog({
  open, onOpenChange, onSubmit, submitting,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSubmit: (body: Record<string, unknown>) => void;
  submitting: boolean;
}) {
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [licenseNumber, setLicenseNumber] = React.useState("");
  const [licenseExpiry, setLicenseExpiry] = React.useState("");
  const [avatarColor, setAvatarColor] = React.useState("emerald");

  React.useEffect(() => {
    if (!open) {
      setName(""); setEmail(""); setPhone("");
      setLicenseNumber(""); setLicenseExpiry(""); setAvatarColor("emerald");
    }
  }, [open]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !licenseNumber) {
      toast.error("Name, phone and license number are required");
      return;
    }
    onSubmit({
      name,
      email: email || undefined,
      phone,
      licenseNumber,
      licenseExpiry: licenseExpiry || null,
      avatarColor,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add new driver</DialogTitle>
          <DialogDescription>
            Create a new driver profile. They will start with &ldquo;Available&rdquo; status.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="d-name">Full name *</Label>
            <Input id="d-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nguyen Van A" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="d-email">Email</Label>
              <Input id="d-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="a@company.com" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="d-phone">Phone *</Label>
              <Input id="d-phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+84 90x xxx xxx" required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="d-license">License # *</Label>
              <Input id="d-license" value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} placeholder="DL-00001234" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="d-expiry">License expiry</Label>
              <Input id="d-expiry" type="date" value={licenseExpiry} onChange={(e) => setLicenseExpiry(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="d-color">Avatar color</Label>
            <Select value={avatarColor} onValueChange={setAvatarColor}>
              <SelectTrigger id="d-color" className="w-full">
                <SelectValue placeholder="Pick a color" />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(AVATAR_COLORS).map((c) => (
                  <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Creating…" : "Create driver"}
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
