"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { StatusBadge, PriorityBadge } from "@/components/status-badge";
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
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Package, Search, Plus, Filter, Download, ArrowRight, MapPin, Truck,
  User, Calendar, DollarSign, Weight, Box, ChevronLeft, ChevronRight,
  X, Clock, CheckCircle2, AlertTriangle, PackageCheck, XCircle, RotateCcw,
  Pencil, Trash2,
} from "lucide-react";
import {
  SHIPMENT_STATUSES, SHIPMENT_STATUS_META, PRIORITIES, PRIORITY_META,
  SERVICE_TYPES, SERVICE_META, VIETNAM_CITIES,
} from "@/lib/constants";
import {
  formatCurrency, formatRelativeTime, formatDateTime, formatWeight, initials,
} from "@/lib/format";
import { useAppStore } from "@/lib/store";
import { toast } from "sonner";
import { avatarColorClass } from "@/components/avatar-color";
import { cn } from "@/lib/utils";

type ShipmentListItem = {
  id: string;
  trackingNumber: string;
  status: string;
  priority: string;
  serviceType: string;
  originCity: string;
  destinationCity: string;
  originAddress: string;
  destinationAddress: string;
  distanceKm: number;
  weightKg: number;
  pieces: number;
  cost: number;
  createdAt: string;
  estimatedDelivery: string | null;
  progress: number;
  sender: { id: string; name: string; city: string };
  receiver: { id: string; name: string; city: string };
  driver: { id: string; name: string; avatarColor: string; status: string } | null;
  vehicle: { id: string; plateNumber: string; model: string; type: string } | null;
};

type ShipmentDetail = ShipmentListItem & {
  volumeM3: number;
  description: string | null;
  notes: string | null;
  insurance: number;
  currency: string;
  pickedUpAt: string | null;
  deliveredAt: string | null;
  currentLat: number | null;
  currentLng: number | null;
  originWarehouse: { id: string; name: string; city: string } | null;
  destinationWarehouse: { id: string; name: string; city: string } | null;
  trackingEvents: Array<{
    id: string; status: string; location: string | null; note: string | null;
    lat: number | null; lng: number | null; timestamp: string;
  }>;
};

const SERVICE_ICON: Record<string, React.ElementType> = {
  standard: Package, express: Truck, same_day: Clock, freight: Box, cold_chain: PackageCheck,
};

export function ShipmentsView() {
  const qc = useQueryClient();
  const { selectedShipmentId, setSelectedShipmentId, shipmentsFilter, setShipmentsFilter } = useAppStore();

  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState(shipmentsFilter || "all");
  const [priority, setPriority] = React.useState("all");
  const [service, setService] = React.useState("all");
  const [city, setCity] = React.useState("all");
  const [page, setPage] = React.useState(1);
  const [pageSize] = React.useState(12);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [detailOpen, setDetailOpen] = React.useState(false);
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());

  // React to external "open-new-shipment" event
  React.useEffect(() => {
    const handler = () => setCreateOpen(true);
    window.addEventListener("open-new-shipment", handler);
    return () => window.removeEventListener("open-new-shipment", handler);
  }, []);

  // Open detail when a shipment is selected
  React.useEffect(() => {
    if (selectedShipmentId) setDetailOpen(true);
    else setDetailOpen(false);
  }, [selectedShipmentId]);

  // Reset filter state when shipmentsFilter changes externally
  React.useEffect(() => {
    if (shipmentsFilter) {
      setStatus(shipmentsFilter);
      setShipmentsFilter(null);
      setPage(1);
    }
  }, [shipmentsFilter, setShipmentsFilter]);

  const debouncedSearch = useDebounce(search, 350);

  const queryKey = React.useMemo(
    () => ["shipments", { debouncedSearch, status, priority, service, city, page, pageSize }],
    [debouncedSearch, status, priority, service, city, page, pageSize]
  );

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () => {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
      });
      if (debouncedSearch) params.set("q", debouncedSearch);
      if (status !== "all") params.set("status", status);
      if (priority !== "all") params.set("priority", priority);
      if (service !== "all") params.set("service", service);
      if (city !== "all") params.set("city", city);
      return api.get<{ items: ShipmentListItem[]; total: number; totalPages: number }>(`/api/shipments?${params}`);
    },
  });

  const resetFilters = () => {
    setSearch(""); setStatus("all"); setPriority("all"); setService("all"); setCity("all"); setPage(1);
  };

  const hasFilters = status !== "all" || priority !== "all" || service !== "all" || city !== "all" || search !== "";

  const bulkUpdate = useMutation({
    mutationFn: async (newStatus: string) => {
      const ids = Array.from(selectedIds);
      await Promise.all(ids.map((id) => api.patch(`/api/shipments/${id}`, { status: newStatus })));
    },
    onSuccess: () => {
      toast.success(`${selectedIds.size} shipment${selectedIds.size > 1 ? "s" : ""} updated`);
      setSelectedIds(new Set());
      qc.invalidateQueries({ queryKey: ["shipments"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (e: Error) => toast.error("Bulk update failed", { description: e.message }),
  });

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (!data) return;
    const allOnPage = data.items.every((s) => selectedIds.has(s.id));
    if (allOnPage) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        data.items.forEach((s) => next.delete(s.id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        data.items.forEach((s) => next.add(s.id));
        return next;
      });
    }
  };

  const exportSelected = () => {
    if (!data) return;
    const toExport = data.items.filter((s) => selectedIds.has(s.id));
    const rows = [
      ["Tracking #", "Status", "Priority", "Service", "Origin", "Destination", "Sender", "Receiver", "Weight (kg)", "Pieces", "Cost", "Created"],
      ...toExport.map((s) => [
        s.trackingNumber, s.status, s.priority, s.serviceType,
        s.originCity, s.destinationCity, s.sender.name, s.receiver.name,
        String(s.weightKg), String(s.pieces), String(s.cost), new Date(s.createdAt).toISOString(),
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `shipments-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${toExport.length} shipment${toExport.length > 1 ? "s" : ""} to CSV`);
  };

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search tracking #, sender, route…"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="pl-9"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
                <SelectTrigger className="w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  {SHIPMENT_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>{SHIPMENT_STATUS_META[s].label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={priority} onValueChange={(v) => { setPriority(v); setPage(1); }}>
                <SelectTrigger className="w-[130px]"><SelectValue placeholder="Priority" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All priority</SelectItem>
                  {PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p}>{PRIORITY_META[p].label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={service} onValueChange={(v) => { setService(v); setPage(1); }}>
                <SelectTrigger className="w-[140px]"><SelectValue placeholder="Service" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All services</SelectItem>
                  {SERVICE_TYPES.map((s) => (
                    <SelectItem key={s} value={s}>{SERVICE_META[s].label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={city} onValueChange={(v) => { setCity(v); setPage(1); }}>
                <SelectTrigger className="w-[150px]"><SelectValue placeholder="City" /></SelectTrigger>
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
              <Button size="sm" onClick={() => setCreateOpen(true)} className="gap-1.5">
                <Plus className="h-4 w-4" /> New
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div className="sticky top-16 z-20 flex flex-wrap items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50/95 px-4 py-2.5 shadow-sm backdrop-blur dark:border-emerald-900 dark:bg-emerald-950/80">
          <span className="flex items-center gap-2 text-sm font-medium text-emerald-700 dark:text-emerald-300">
            <Checkbox checked={true} onCheckedChange={() => setSelectedIds(new Set())} className="border-emerald-400" />
            {selectedIds.size} selected
          </span>
          <div className="ml-auto flex flex-wrap items-center gap-1.5">
            <Select value="" onValueChange={(v) => { if (v) bulkUpdate.mutate(v); }}>
              <SelectTrigger className="h-8 w-[160px] text-xs">
                <SelectValue placeholder="Update status…" />
              </SelectTrigger>
              <SelectContent>
                {SHIPMENT_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>{SHIPMENT_STATUS_META[s].label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs" onClick={exportSelected}>
              <Download className="h-3.5 w-3.5" /> Export CSV
            </Button>
            <Button size="sm" variant="ghost" className="h-8 gap-1.5 text-xs" onClick={() => setSelectedIds(new Set())}>
              <X className="h-3.5 w-3.5" /> Clear
            </Button>
          </div>
        </div>
      )}

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
            </div>
          ) : !data?.items?.length ? (
            <div className="flex flex-col items-center justify-center gap-3 p-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <Package className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium">No shipments found</p>
                <p className="text-xs text-muted-foreground">Try adjusting filters or create a new shipment.</p>
              </div>
              <Button size="sm" variant="outline" onClick={resetFilters}>Reset filters</Button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto custom-scroll">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40 hover:bg-muted/40">
                      <TableHead className="w-[40px]">
                        <Checkbox
                          aria-label="Select all"
                          checked={data.items.length > 0 && data.items.every((s) => selectedIds.has(s.id))}
                          onCheckedChange={toggleSelectAll}
                        />
                      </TableHead>
                      <TableHead className="min-w-[140px]">Tracking #</TableHead>
                      <TableHead className="min-w-[200px]">Route</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="hidden md:table-cell">Priority</TableHead>
                      <TableHead className="hidden lg:table-cell">Driver</TableHead>
                      <TableHead className="text-right">Cost</TableHead>
                      <TableHead className="hidden sm:table-cell">Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.items.map((s) => {
                      const SIcon = SERVICE_ICON[s.serviceType] || Package;
                      const isSelected = selectedIds.has(s.id);
                      return (
                        <TableRow
                          key={s.id}
                          onClick={() => setSelectedShipmentId(s.id)}
                          className={cn("cursor-pointer transition-colors hover:bg-muted/50", isSelected && "bg-emerald-50/60 dark:bg-emerald-950/30")}
                        >
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                              aria-label={`Select ${s.trackingNumber}`}
                              checked={isSelected}
                              onCheckedChange={() => toggleSelect(s.id)}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                <SIcon className="h-4 w-4" />
                              </div>
                              <div className="flex flex-col">
                                <span className="font-mono text-xs font-semibold">{s.trackingNumber}</span>
                                <span className="text-[10px] text-muted-foreground">{SERVICE_META[s.serviceType as keyof typeof SERVICE_META]?.label}</span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5 text-sm">
                              <span className="font-medium">{s.originCity}</span>
                              <ArrowRight className="h-3 w-3 text-muted-foreground" />
                              <span className="font-medium">{s.destinationCity}</span>
                            </div>
                            <p className="text-[10px] text-muted-foreground">{s.sender.name} → {s.receiver.name}</p>
                          </TableCell>
                          <TableCell><StatusBadge status={s.status} kind="shipment" /></TableCell>
                          <TableCell className="hidden md:table-cell"><PriorityBadge priority={s.priority} /></TableCell>
                          <TableCell className="hidden lg:table-cell">
                            {s.driver ? (
                              <div className="flex items-center gap-2">
                                <Avatar className="h-7 w-7">
                                  <AvatarFallback className={cn("text-[10px] font-semibold text-white", avatarColorClass(s.driver.avatarColor))}>
                                    {initials(s.driver.name)}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-xs">{s.driver.name}</span>
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">Unassigned</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right font-semibold tabular-nums">{formatCurrency(s.cost)}</TableCell>
                          <TableCell className="hidden sm:table-cell text-xs text-muted-foreground">{formatRelativeTime(s.createdAt)}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between gap-3 border-t px-4 py-3">
                <p className="text-xs text-muted-foreground">
                  Showing <span className="font-medium text-foreground">{(page - 1) * pageSize + 1}</span>–
                  <span className="font-medium text-foreground">{Math.min(page * pageSize, data.total)}</span> of{" "}
                  <span className="font-medium text-foreground">{data.total}</span>
                </p>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="gap-1">
                    <ChevronLeft className="h-3.5 w-3.5" /> Prev
                  </Button>
                  <span className="px-2 text-xs text-muted-foreground">{page} / {data.totalPages || 1}</span>
                  <Button variant="outline" size="sm" disabled={page >= data.totalPages} onClick={() => setPage((p) => p + 1)} className="gap-1">
                    Next <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Create dialog */}
      <CreateShipmentDialog open={createOpen} onOpenChange={setCreateOpen} onCreated={(s) => {
        setSelectedShipmentId(s.id);
        qc.invalidateQueries({ queryKey: ["shipments"] });
        qc.invalidateQueries({ queryKey: ["dashboard"] });
        toast.success("Shipment created", { description: s.trackingNumber });
      }} />

      {/* Detail drawer */}
      <ShipmentDetailDrawer
        shipmentId={selectedShipmentId}
        open={detailOpen}
        onOpenChange={(o) => { setDetailOpen(o); if (!o) setSelectedShipmentId(null); }}
      />
    </div>
  );
}

// ---------- Create dialog ----------
function CreateShipmentDialog({
  open, onOpenChange, onCreated,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onCreated: (s: ShipmentListItem) => void;
}) {
  const qc = useQueryClient();
  const [form, setForm] = React.useState({
    senderId: "", receiverId: "", originAddress: "", originCity: "",
    destinationAddress: "", destinationCity: "", weightKg: "", pieces: "1",
    description: "", priority: "standard", serviceType: "standard",
    driverId: "", vehicleId: "", notes: "",
  });

  const { data: customers } = useQuery({
    queryKey: ["customers", "all"],
    queryFn: () => api.get<{ items: { id: string; name: string; city: string }[] }>("/api/customers?pageSize=100"),
    enabled: open,
  });
  const { data: drivers } = useQuery({
    queryKey: ["drivers", "all"],
    queryFn: () => api.get<{ items: { id: string; name: string; status: string }[] }>("/api/drivers"),
    enabled: open,
  });
  const { data: vehicles } = useQuery({
    queryKey: ["vehicles", "all"],
    queryFn: () => api.get<{ items: { id: string; plateNumber: string; model: string }[] }>("/api/vehicles"),
    enabled: open,
  });

  const create = useMutation({
    mutationFn: () => api.post<ShipmentListItem>("/api/shipments", {
      ...form,
      weightKg: Number(form.weightKg) || 0,
      pieces: Number(form.pieces) || 1,
      cost: (Number(form.weightKg) || 1) * 0.5 + 20,
    }),
    onSuccess: (s) => {
      onCreated(s);
      onOpenChange(false);
      setForm({ senderId: "", receiverId: "", originAddress: "", originCity: "", destinationAddress: "", destinationCity: "", weightKg: "", pieces: "1", description: "", priority: "standard", serviceType: "standard", driverId: "", vehicleId: "", notes: "" });
    },
    onError: (e: Error) => toast.error("Failed to create shipment", { description: e.message }),
  });

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto custom-scroll">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Plus className="h-5 w-5 text-emerald-500" /> Create New Shipment</DialogTitle>
          <DialogDescription>Fill in the shipment details. Tracking number is auto-generated.</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-4 py-2 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Service Type</Label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
              {SERVICE_TYPES.map((s) => {
                const Icon = SERVICE_ICON[s] || Package;
                const active = form.serviceType === s;
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => set("serviceType", s)}
                    className={cn(
                      "flex flex-col items-center gap-1 rounded-lg border p-2 text-xs transition-all",
                      active ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300" : "hover:bg-muted"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {SERVICE_META[s].label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Sender *</Label>
            <Select value={form.senderId} onValueChange={(v) => set("senderId", v)}>
              <SelectTrigger><SelectValue placeholder="Select sender" /></SelectTrigger>
              <SelectContent>
                {customers?.items.map((c) => <SelectItem key={c.id} value={c.id}>{c.name} · {c.city}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Receiver *</Label>
            <Select value={form.receiverId} onValueChange={(v) => set("receiverId", v)}>
              <SelectTrigger><SelectValue placeholder="Select receiver" /></SelectTrigger>
              <SelectContent>
                {customers?.items.map((c) => <SelectItem key={c.id} value={c.id}>{c.name} · {c.city}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Origin Address *</Label>
            <Input value={form.originAddress} onChange={(e) => set("originAddress", e.target.value)} placeholder="Street address" />
          </div>
          <div className="space-y-1.5">
            <Label>Origin City *</Label>
            <Select value={form.originCity} onValueChange={(v) => set("originCity", v)}>
              <SelectTrigger><SelectValue placeholder="Select city" /></SelectTrigger>
              <SelectContent>
                {VIETNAM_CITIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Destination Address *</Label>
            <Input value={form.destinationAddress} onChange={(e) => set("destinationAddress", e.target.value)} placeholder="Street address" />
          </div>
          <div className="space-y-1.5">
            <Label>Destination City *</Label>
            <Select value={form.destinationCity} onValueChange={(v) => set("destinationCity", v)}>
              <SelectTrigger><SelectValue placeholder="Select city" /></SelectTrigger>
              <SelectContent>
                {VIETNAM_CITIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Weight (kg)</Label>
            <Input type="number" value={form.weightKg} onChange={(e) => set("weightKg", e.target.value)} placeholder="0.0" />
          </div>
          <div className="space-y-1.5">
            <Label>Pieces</Label>
            <Input type="number" value={form.pieces} onChange={(e) => set("pieces", e.target.value)} placeholder="1" />
          </div>

          <div className="space-y-1.5">
            <Label>Priority</Label>
            <Select value={form.priority} onValueChange={(v) => set("priority", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {PRIORITIES.map((p) => <SelectItem key={p} value={p}>{PRIORITY_META[p].label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Input value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="e.g. Electronics" />
          </div>

          <div className="space-y-1.5">
            <Label>Assign Driver</Label>
            <Select value={form.driverId || "none"} onValueChange={(v) => set("driverId", v === "none" ? "" : v)}>
              <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Unassigned</SelectItem>
                {drivers?.items.map((d) => <SelectItem key={d.id} value={d.id}>{d.name} · {d.status}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Assign Vehicle</Label>
            <Select value={form.vehicleId || "none"} onValueChange={(v) => set("vehicleId", v === "none" ? "" : v)}>
              <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Unassigned</SelectItem>
                {vehicles?.items.map((v) => <SelectItem key={v.id} value={v.id}>{v.plateNumber} · {v.model}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label>Notes</Label>
            <Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Optional handling notes…" rows={2} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            disabled={create.isPending || !form.senderId || !form.receiverId || !form.originAddress || !form.destinationAddress}
            onClick={() => create.mutate()}
            className="gap-1.5"
          >
            {create.isPending ? "Creating…" : (<><Plus className="h-4 w-4" /> Create Shipment</>)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------- Detail drawer ----------
function ShipmentDetailDrawer({
  shipmentId, open, onOpenChange,
}: {
  shipmentId: string | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const qc = useQueryClient();
  const { data: shipment, isLoading } = useQuery({
    queryKey: ["shipment", shipmentId],
    queryFn: () => api.get<ShipmentDetail>(`/api/shipments/${shipmentId}`),
    enabled: !!shipmentId && open,
  });

  const update = useMutation({
    mutationFn: (body: Record<string, unknown>) => api.patch<ShipmentDetail>(`/api/shipments/${shipmentId}`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["shipment", shipmentId] });
      qc.invalidateQueries({ queryKey: ["shipments"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("Shipment updated");
    },
    onError: (e: Error) => toast.error("Update failed", { description: e.message }),
  });

  const remove = useMutation({
    mutationFn: () => api.delete(`/api/shipments/${shipmentId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["shipments"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("Shipment deleted");
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error("Delete failed", { description: e.message }),
  });

  const [editOpen, setEditOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto custom-scroll p-0">
        <SheetHeader className="border-b px-5 py-4">
          <SheetDescription className="sr-only">Shipment details</SheetDescription>
          <SheetTitle className="flex items-center justify-between gap-2 text-base">
            <span className="flex items-center gap-2 min-w-0">
              {shipment ? (
                <>
                  <Package className="h-5 w-5 shrink-0 text-emerald-500" />
                  <span className="font-mono truncate">{shipment.trackingNumber}</span>
                  <StatusBadge status={shipment.status} kind="shipment" />
                </>
              ) : "Loading…"}
            </span>
            {shipment && (
              <span className="flex shrink-0 items-center gap-1">
                <Button size="sm" variant="ghost" className="h-8 gap-1.5 px-2 text-xs" onClick={() => setEditOpen(true)}>
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </Button>
                <Button size="sm" variant="ghost" className="h-8 gap-1.5 px-2 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40" onClick={() => setDeleteOpen(true)}>
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </Button>
              </span>
            )}
          </SheetTitle>
        </SheetHeader>

        {isLoading || !shipment ? (
          <div className="space-y-3 p-5">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        ) : (
          <div className="space-y-5 p-5">
            {/* Route */}
            <div className="rounded-xl border bg-muted/30 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">From</p>
                  <p className="font-semibold">{shipment.originCity}</p>
                  <p className="text-xs text-muted-foreground">{shipment.originAddress}</p>
                </div>
                <div className="flex flex-col items-center">
                  <ArrowRight className="h-5 w-5 text-emerald-500" />
                  <span className="mt-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                    {shipment.distanceKm} km
                  </span>
                </div>
                <div className="flex-1 text-right">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">To</p>
                  <p className="font-semibold">{shipment.destinationCity}</p>
                  <p className="text-xs text-muted-foreground">{shipment.destinationAddress}</p>
                </div>
              </div>
              {shipment.status !== "pending" && shipment.status !== "cancelled" && (
                <div className="mt-3">
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-semibold tabular-nums">{shipment.progress}%</span>
                  </div>
                  <Progress value={shipment.progress} className="h-2" />
                </div>
              )}
            </div>

            {/* Quick actions */}
            <div className="flex flex-wrap gap-2">
              {shipment.status !== "delivered" && shipment.status !== "cancelled" && (
                <>
                  <Button size="sm" variant="outline" disabled={update.isPending} onClick={() => update.mutate({ status: "picked_up" })} className="gap-1.5">
                    <PackageCheck className="h-3.5 w-3.5" /> Pick Up
                  </Button>
                  <Button size="sm" variant="outline" disabled={update.isPending} onClick={() => update.mutate({ status: "in_transit" })} className="gap-1.5">
                    <Truck className="h-3.5 w-3.5" /> In Transit
                  </Button>
                  <Button size="sm" variant="outline" disabled={update.isPending} onClick={() => update.mutate({ status: "out_for_delivery" })} className="gap-1.5">
                    <MapPin className="h-3.5 w-3.5" /> Out for Delivery
                  </Button>
                  <Button size="sm" disabled={update.isPending} onClick={() => update.mutate({ status: "delivered", progress: 100 })} className="gap-1.5 bg-emerald-600 hover:bg-emerald-700">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Mark Delivered
                  </Button>
                </>
              )}
              {shipment.status !== "delayed" && shipment.status !== "cancelled" && shipment.status !== "delivered" && (
                <Button size="sm" variant="outline" disabled={update.isPending} onClick={() => update.mutate({ status: "delayed" })} className="gap-1.5 text-orange-600">
                  <AlertTriangle className="h-3.5 w-3.5" /> Delay
                </Button>
              )}
              {shipment.status !== "cancelled" && shipment.status !== "delivered" && (
                <Button size="sm" variant="outline" disabled={update.isPending} onClick={() => update.mutate({ status: "cancelled" })} className="gap-1.5 text-rose-600">
                  <XCircle className="h-3.5 w-3.5" /> Cancel
                </Button>
              )}
              {shipment.status === "delivered" && (
                <Button size="sm" variant="outline" disabled={update.isPending} onClick={() => update.mutate({ status: "returned" })} className="gap-1.5">
                  <RotateCcw className="h-3.5 w-3.5" /> Mark Returned
                </Button>
              )}
            </div>

            {/* Parties */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border p-3">
                <p className="mb-1 flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground"><User className="h-3 w-3" /> Sender</p>
                <p className="text-sm font-medium">{shipment.sender.name}</p>
                <p className="text-xs text-muted-foreground">{shipment.sender.city}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="mb-1 flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground"><User className="h-3 w-3" /> Receiver</p>
                <p className="text-sm font-medium">{shipment.receiver.name}</p>
                <p className="text-xs text-muted-foreground">{shipment.receiver.city}</p>
              </div>
            </div>

            {/* Cargo & cost grid */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat label="Weight" value={formatWeight(shipment.weightKg)} icon={Weight} />
              <Stat label="Pieces" value={String(shipment.pieces)} icon={Box} />
              <Stat label="Cost" value={formatCurrency(shipment.cost)} icon={DollarSign} />
              <Stat label="Insurance" value={formatCurrency(shipment.insurance)} icon={DollarSign} />
            </div>

            {/* Driver / Vehicle */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-lg border p-3">
                <p className="mb-2 text-[10px] uppercase tracking-wider text-muted-foreground">Assigned Driver</p>
                {shipment.driver ? (
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-emerald-500 text-xs font-semibold text-white">{initials(shipment.driver.name)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{shipment.driver.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">{shipment.driver.status.replace("_", " ")}</p>
                    </div>
                  </div>
                ) : <p className="text-xs text-muted-foreground">Unassigned</p>}
              </div>
              <div className="rounded-lg border p-3">
                <p className="mb-2 text-[10px] uppercase tracking-wider text-muted-foreground">Vehicle</p>
                {shipment.vehicle ? (
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400">
                      <Truck className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{shipment.vehicle.plateNumber}</p>
                      <p className="text-xs text-muted-foreground">{shipment.vehicle.model}</p>
                    </div>
                  </div>
                ) : <p className="text-xs text-muted-foreground">Unassigned</p>}
              </div>
            </div>

            {/* Tracking timeline */}
            <div>
              <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                <Clock className="h-4 w-4 text-muted-foreground" /> Tracking History
              </h4>
              <div className="relative space-y-3 border-l-2 border-muted pl-4">
                {shipment.trackingEvents.map((ev, i) => {
                  const meta = SHIPMENT_STATUS_META[ev.status as keyof typeof SHIPMENT_STATUS_META];
                  return (
                    <div key={ev.id} className="relative">
                      <span className={cn("absolute -left-[21px] top-1 h-3 w-3 rounded-full border-2 border-background", meta?.dot || "bg-slate-400")} />
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium">{meta?.label || ev.status}</span>
                        <span className="text-[10px] text-muted-foreground">{formatDateTime(ev.timestamp)}</span>
                      </div>
                      {ev.note && <p className="text-xs text-muted-foreground">{ev.note}</p>}
                      {ev.location && <p className="text-[10px] text-muted-foreground">📍 {ev.location}</p>}
                    </div>
                  );
                })}
              </div>
            </div>

            {shipment.notes && (
              <div className="rounded-lg border bg-amber-50 dark:bg-amber-950/20 p-3">
                <p className="mb-1 text-[10px] uppercase tracking-wider text-amber-700 dark:text-amber-400">Notes</p>
                <p className="text-xs">{shipment.notes}</p>
              </div>
            )}
          </div>
        )}
      </SheetContent>

      {/* Edit dialog */}
      {shipment && (
        <EditShipmentDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          shipment={shipment}
          onSaved={() => {
            qc.invalidateQueries({ queryKey: ["shipment", shipmentId] });
            qc.invalidateQueries({ queryKey: ["shipments"] });
            qc.invalidateQueries({ queryKey: ["dashboard"] });
          }}
        />
      )}

      {/* Delete confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-rose-500" /> Delete shipment?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete shipment <span className="font-mono font-semibold text-foreground">{shipment?.trackingNumber}</span> and all its tracking events. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-rose-600 hover:bg-rose-700 focus:ring-rose-600"
              disabled={remove.isPending}
              onClick={(e) => {
                e.preventDefault();
                remove.mutate();
              }}
            >
              {remove.isPending ? "Deleting…" : "Delete shipment"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Sheet>
  );
}

// ---------- Edit dialog ----------
function EditShipmentDialog({
  open, onOpenChange, shipment, onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  shipment: ShipmentDetail;
  onSaved: () => void;
}) {
  const [form, setForm] = React.useState({
    priority: shipment.priority,
    serviceType: shipment.serviceType,
    driverId: shipment.driver?.id || "",
    vehicleId: shipment.vehicle?.id || "",
    weightKg: String(shipment.weightKg),
    pieces: String(shipment.pieces),
    description: shipment.description || "",
    notes: shipment.notes || "",
  });

  React.useEffect(() => {
    if (open) {
      setForm({
        priority: shipment.priority,
        serviceType: shipment.serviceType,
        driverId: shipment.driver?.id || "",
        vehicleId: shipment.vehicle?.id || "",
        weightKg: String(shipment.weightKg),
        pieces: String(shipment.pieces),
        description: shipment.description || "",
        notes: shipment.notes || "",
      });
    }
  }, [open, shipment]);

  const { data: drivers } = useQuery({
    queryKey: ["drivers", "all"],
    queryFn: () => api.get<{ items: { id: string; name: string; status: string }[] }>("/api/drivers"),
    enabled: open,
  });
  const { data: vehicles } = useQuery({
    queryKey: ["vehicles", "all"],
    queryFn: () => api.get<{ items: { id: string; plateNumber: string; model: string }[] }>("/api/vehicles"),
    enabled: open,
  });

  const save = useMutation({
    mutationFn: () =>
      api.patch<ShipmentDetail>(`/api/shipments/${shipment.id}`, {
        priority: form.priority,
        serviceType: form.serviceType,
        driverId: form.driverId || null,
        vehicleId: form.vehicleId || null,
        weightKg: Number(form.weightKg) || 0,
        pieces: Number(form.pieces) || 1,
        description: form.description || null,
        notes: form.notes || null,
      }),
    onSuccess: () => {
      toast.success("Shipment updated");
      onSaved();
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error("Update failed", { description: e.message }),
  });

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto custom-scroll">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Pencil className="h-5 w-5 text-emerald-500" /> Edit Shipment</DialogTitle>
          <DialogDescription>Update shipment details for <span className="font-mono">{shipment.trackingNumber}</span></DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-4 py-2 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Priority</Label>
            <Select value={form.priority} onValueChange={(v) => set("priority", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {PRIORITIES.map((p) => <SelectItem key={p} value={p}>{PRIORITY_META[p].label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Service Type</Label>
            <Select value={form.serviceType} onValueChange={(v) => set("serviceType", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {SERVICE_TYPES.map((s) => <SelectItem key={s} value={s}>{SERVICE_META[s].label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Assign Driver</Label>
            <Select value={form.driverId || "none"} onValueChange={(v) => set("driverId", v === "none" ? "" : v)}>
              <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Unassigned</SelectItem>
                {drivers?.items.map((d) => <SelectItem key={d.id} value={d.id}>{d.name} · {d.status}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Assign Vehicle</Label>
            <Select value={form.vehicleId || "none"} onValueChange={(v) => set("vehicleId", v === "none" ? "" : v)}>
              <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Unassigned</SelectItem>
                {vehicles?.items.map((v) => <SelectItem key={v.id} value={v.id}>{v.plateNumber} · {v.model}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Weight (kg)</Label>
            <Input type="number" value={form.weightKg} onChange={(e) => set("weightKg", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Pieces</Label>
            <Input type="number" value={form.pieces} onChange={(e) => set("pieces", e.target.value)} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Description</Label>
            <Input value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="e.g. Electronics" />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Notes</Label>
            <Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={2} placeholder="Handling notes…" />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={save.isPending} onClick={() => save.mutate()} className="gap-1.5">
            {save.isPending ? "Saving…" : (<><CheckCircle2 className="h-4 w-4" /> Save Changes</>)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Stat({ label, value, icon: Icon }: { label: string; value: string; icon: React.ElementType }) {
  return (
    <div className="rounded-lg border p-3">
      <p className="mb-1 flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground">
        <Icon className="h-3 w-3" /> {label}
      </p>
      <p className="text-sm font-semibold tabular-nums">{value}</p>
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
