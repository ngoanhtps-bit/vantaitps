"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { KpiCard } from "@/components/kpi-card";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
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
  Building2, Search, Plus, Truck, User, Phone, MapPin, Mail, FileText,
  PhoneCall, Car, ChevronRight, Pencil, Trash2, CheckCircle2, X,
} from "lucide-react";
import { LOAI_XE_OPTIONS, LOAI_XE_NHOM } from "@/lib/constants";
import { initials } from "@/lib/format";
import { avatarColorClass } from "@/components/avatar-color";
import { useToast } from "@/hooks/use-toast";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type NCCVehicle = {
  id: string; plateNumber: string; loaiXe: string | null; model: string; brand: string;
  type: string; status: string; capacityKg: number;
  driver: { id: string; name: string; phone: string; avatarColor: string; status: string } | null;
};

type NCCDriver = {
  id: string; name: string; phone: string; avatarColor: string; status: string; rating: number;
  vehicle: { id: string; plateNumber: string; loaiXe: string | null } | null;
};

type NhaCungCap = {
  id: string; tenDonVi: string; maNCC: string | null; sdt: string | null; email: string | null;
  diaChi: string | null; nguoiLienHe: string | null; sdtLienHe: string | null; msThue: string | null;
  ghiChu: string | null; createdAt: string;
  _count: { vehicles: number; drivers: number };
  vehicles?: NCCVehicle[];
  drivers?: NCCDriver[];
};

export function NhaCungCapView() {
  const qc = useQueryClient();
  const [search, setSearch] = React.useState("");
  const [createOpen, setCreateOpen] = React.useState(false);
  const [detailId, setDetailId] = React.useState<string | null>(null);

  const debouncedSearch = useDebounce(search, 350);

  const { data, isLoading } = useQuery({
    queryKey: ["nha-cung-cap", debouncedSearch],
    queryFn: () => {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set("q", debouncedSearch);
      return api.get<{ items: NhaCungCap[] }>(`/api/nha-cung-cap?${params}`);
    },
  });

  const items = data?.items ?? [];
  const totalXe = items.reduce((s, n) => s + n._count.vehicles, 0);
  const totalTx = items.reduce((s, n) => s + n._count.drivers, 0);

  return (
    <div className="space-y-4">
      {/* KPI */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <KpiCard title="Tổng NCC" value={items.length} icon={Building2} accent="emerald" />
        <KpiCard title="Tổng xe" value={totalXe} icon={Truck} accent="sky" />
        <KpiCard title="Tổng tài xế" value={totalTx} icon={User} accent="violet" />
        <KpiCard title="Loại xe" value={LOAI_XE_OPTIONS.length} icon={Car} accent="amber" footer="danh mục dòng xe" />
      </div>

      {/* Filter bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Tìm đơn vị, mã NCC, SĐT, người liên hệ…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button size="sm" onClick={() => setCreateOpen(true)} className="gap-1.5">
              <Plus className="h-4 w-4" /> Thêm NCC
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* NCC cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
        </div>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 p-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium">Chưa có nhà cung cấp nào</p>
              <p className="text-xs text-muted-foreground">Thêm NCC để quản lý xe và tài xế theo đơn vị.</p>
            </div>
            <Button size="sm" onClick={() => setCreateOpen(true)} className="gap-1.5">
              <Plus className="h-4 w-4" /> Thêm NCC
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {items.map((ncc) => (
            <NCCCard key={ncc.id} ncc={ncc} onViewDetails={() => setDetailId(ncc.id)} />
          ))}
        </div>
      )}

      <CreateNCCDialog open={createOpen} onOpenChange={setCreateOpen} onCreated={(id) => {
        qc.invalidateQueries({ queryKey: ["nha-cung-cap"] });
        setDetailId(id);
      }} />

      <NCCDetailDrawer nccId={detailId} open={!!detailId} onOpenChange={(o) => { if (!o) setDetailId(null); }} />
    </div>
  );
}

function NCCCard({ ncc, onViewDetails }: { ncc: NhaCungCap; onViewDetails: () => void }) {
  return (
    <Card className="group transition-all hover:shadow-md">
      <CardContent className="p-0">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b p-4">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
              <Building2 className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-sm font-semibold">{ncc.tenDonVi}</h3>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                {ncc.maNCC && <Badge variant="outline" className="font-mono text-[10px]">{ncc.maNCC}</Badge>}
                {ncc.sdt && <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {ncc.sdt}</span>}
              </div>
            </div>
          </div>
          <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs" onClick={onViewDetails}>
            Chi tiết <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-px bg-border">
          <div className="bg-card p-3 text-center">
            <Truck className="mx-auto mb-1 h-4 w-4 text-sky-500" />
            <p className="text-lg font-bold tabular-nums">{ncc._count.vehicles}</p>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Xe</p>
          </div>
          <div className="bg-card p-3 text-center">
            <User className="mx-auto mb-1 h-4 w-4 text-violet-500" />
            <p className="text-lg font-bold tabular-nums">{ncc._count.drivers}</p>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Tài xế</p>
          </div>
          <div className="bg-card p-3 text-center">
            <FileText className="mx-auto mb-1 h-4 w-4 text-emerald-500" />
            <p className="text-lg font-bold tabular-nums">{ncc._count.vehicles + ncc._count.drivers}</p>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Tổng</p>
          </div>
        </div>

        {/* Contact info */}
        {(ncc.nguoiLienHe || ncc.diaChi) && (
          <div className="border-t p-3 space-y-1 text-xs text-muted-foreground">
            {ncc.nguoiLienHe && (
              <p className="flex items-center gap-1.5">
                <User className="h-3 w-3" /> {ncc.nguoiLienHe}
                {ncc.sdtLienHe && <span className="flex items-center gap-1"><PhoneCall className="h-3 w-3" /> {ncc.sdtLienHe}</span>}
              </p>
            )}
            {ncc.diaChi && <p className="flex items-center gap-1.5"><MapPin className="h-3 w-3" /> {ncc.diaChi}</p>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function CreateNCCDialog({
  open, onOpenChange, onCreated,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onCreated: (id: string) => void;
}) {
  const qc = useQueryClient();
  const [form, setForm] = React.useState({
    tenDonVi: "", maNCC: "", sdt: "", email: "", diaChi: "",
    nguoiLienHe: "", sdtLienHe: "", msThue: "", ghiChu: "",
  });

  React.useEffect(() => {
    if (open) {
      setForm({ tenDonVi: "", maNCC: "", sdt: "", email: "", diaChi: "", nguoiLienHe: "", sdtLienHe: "", msThue: "", ghiChu: "" });
    }
  }, [open]);

  const create = useMutation({
    mutationFn: () => api.post<{ id: string }>("/api/nha-cung-cap", form),
    onSuccess: (data) => {
      toast.success("Đã tạo NCC");
      qc.invalidateQueries({ queryKey: ["nha-cung-cap"] });
      onCreated(data.id);
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error("Tạo NCC thất bại", { description: e.message }),
  });

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto custom-scroll sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Plus className="h-5 w-5 text-emerald-500" /> Thêm nhà cung cấp xe</DialogTitle>
          <DialogDescription>Nhập thông tin đơn vị cho thuê xe.</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-4 py-2 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Tên đơn vị *</Label>
            <Input value={form.tenDonVi} onChange={(e) => set("tenDonVi", e.target.value)} placeholder="VD: Công ty CP Vận tải ABC" />
          </div>
          <div className="space-y-1.5">
            <Label>Mã NCC</Label>
            <Input value={form.maNCC} onChange={(e) => set("maNCC", e.target.value.toUpperCase())} placeholder="NCC001" className="font-mono uppercase" />
          </div>
          <div className="space-y-1.5">
            <Label>SĐT đơn vị</Label>
            <Input value={form.sdt} onChange={(e) => set("sdt", e.target.value)} placeholder="0283..." className="font-mono" inputMode="tel" />
          </div>
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="info@abc.com" />
          </div>
          <div className="space-y-1.5">
            <Label>Mã số thuế</Label>
            <Input value={form.msThue} onChange={(e) => set("msThue", e.target.value)} placeholder="0123456789" className="font-mono" />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Địa chỉ</Label>
            <Input value={form.diaChi} onChange={(e) => set("diaChi", e.target.value)} placeholder="Số nhà, đường, quận, TP" />
          </div>
          <div className="space-y-1.5">
            <Label>Người liên hệ</Label>
            <Input value={form.nguoiLienHe} onChange={(e) => set("nguoiLienHe", e.target.value)} placeholder="Họ tên" />
          </div>
          <div className="space-y-1.5">
            <Label>SĐT liên hệ</Label>
            <Input value={form.sdtLienHe} onChange={(e) => set("sdtLienHe", e.target.value)} placeholder="0987..." className="font-mono" inputMode="tel" />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Ghi chú</Label>
            <Textarea value={form.ghiChu} onChange={(e) => set("ghiChu", e.target.value)} rows={2} placeholder="Ghi chú thêm..." />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
          <Button disabled={create.isPending || !form.tenDonVi} onClick={() => create.mutate()} className="gap-1.5">
            {create.isPending ? "Đang tạo..." : (<><CheckCircle2 className="h-4 w-4" /> Tạo NCC</>)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function NCCDetailDrawer({
  nccId, open, onOpenChange,
}: {
  nccId: string | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const qc = useQueryClient();
  const { data: ncc, isLoading } = useQuery({
    queryKey: ["nha-cung-cap", nccId],
    queryFn: () => api.get<NhaCungCap & { vehicles: NCCVehicle[]; drivers: NCCDriver[] }>(`/api/nha-cung-cap/${nccId}`),
    enabled: !!nccId && open,
  });

  const [editOpen, setEditOpen] = React.useState(false);
  const [addVehicleOpen, setAddVehicleOpen] = React.useState(false);

  const addVehicle = useMutation({
    mutationFn: (body: Record<string, unknown>) => api.post("/api/vehicles", body),
    onSuccess: () => {
      toast.success("Đã thêm xe");
      qc.invalidateQueries({ queryKey: ["nha-cung-cap", nccId] });
      qc.invalidateQueries({ queryKey: ["vehicles"] });
      setAddVehicleOpen(false);
    },
    onError: (e: Error) => toast.error("Thêm xe thất bại", { description: e.message }),
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto custom-scroll p-0">
        <SheetHeader className="border-b px-5 py-4">
          <SheetDescription className="sr-only">Chi tiết NCC</SheetDescription>
          <SheetTitle className="flex items-center justify-between gap-2 text-base">
            <span className="flex items-center gap-2 min-w-0">
              {ncc ? (
                <>
                  <Building2 className="h-5 w-5 shrink-0 text-emerald-500" />
                  <span className="truncate">{ncc.tenDonVi}</span>
                </>
              ) : "Đang tải…"}
            </span>
            {ncc && (
              <Button size="sm" variant="ghost" className="h-8 gap-1.5 px-2 text-xs" onClick={() => setEditOpen(true)}>
                <Pencil className="h-3.5 w-3.5" /> Sửa
              </Button>
            )}
          </SheetTitle>
        </SheetHeader>

        {isLoading || !ncc ? (
          <div className="space-y-3 p-5">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        ) : (
          <div className="space-y-5 p-5">
            {/* Thông tin đơn vị */}
            <div className="rounded-lg border p-3 space-y-2">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Thông tin đơn vị</p>
              <div className="grid grid-cols-1 gap-y-1.5 text-xs sm:grid-cols-2">
                {ncc.maNCC && <InfoRow icon={FileText} label="Mã NCC" value={ncc.maNCC} mono />}
                {ncc.sdt && <InfoRow icon={Phone} label="SĐT" value={ncc.sdt} mono />}
                {ncc.email && <InfoRow icon={Mail} label="Email" value={ncc.email} />}
                {ncc.msThue && <InfoRow icon={FileText} label="Mã số thuế" value={ncc.msThue} mono />}
                {ncc.diaChi && <InfoRow icon={MapPin} label="Địa chỉ" value={ncc.diaChi} />}
                {ncc.nguoiLienHe && <InfoRow icon={User} label="Người liên hệ" value={`${ncc.nguoiLienHe}${ncc.sdtLienHe ? ` · ${ncc.sdtLienHe}` : ""}`} />}
              </div>
            </div>

            {/* Danh sách xe */}
            <div>
              <div className="mb-3 flex items-center justify-between">
                <h4 className="flex items-center gap-2 text-sm font-semibold">
                  <Truck className="h-4 w-4 text-sky-500" /> Danh sách xe ({ncc.vehicles?.length || 0})
                </h4>
                <Button size="sm" variant="outline" className="h-7 gap-1 text-xs" onClick={() => setAddVehicleOpen(true)}>
                  <Plus className="h-3.5 w-3.5" /> Thêm xe
                </Button>
              </div>
              {ncc.vehicles && ncc.vehicles.length > 0 ? (
                <div className="space-y-2">
                  {ncc.vehicles.map((v) => (
                    <div key={v.id} className="flex items-center gap-3 rounded-lg border p-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400">
                        <Truck className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-semibold">{v.plateNumber}</span>
                          {v.loaiXe && (
                            <Badge variant="outline" className="text-[10px]">{v.loaiXe}</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {v.brand} {v.model}
                          {v.driver && ` · TX: ${v.driver.name} · ${v.driver.phone}`}
                        </p>
                      </div>
                      <span className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium",
                        v.status === "active" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" :
                        v.status === "maintenance" ? "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300" :
                        "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                      )}>
                        {v.status === "active" ? "Hoạt động" : v.status === "maintenance" ? "Bảo trì" : "Ngừng"}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed p-6 text-center">
                  <Truck className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
                  <p className="text-sm font-medium">Chưa có xe</p>
                  <p className="text-xs text-muted-foreground">Thêm xe cho NCC này.</p>
                </div>
              )}
            </div>

            {/* Danh sách tài xế */}
            <div>
              <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                <User className="h-4 w-4 text-violet-500" /> Danh sách tài xế ({ncc.drivers?.length || 0})
              </h4>
              {ncc.drivers && ncc.drivers.length > 0 ? (
                <div className="space-y-2">
                  {ncc.drivers.map((d) => (
                    <div key={d.id} className="flex items-center gap-3 rounded-lg border p-3">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className={cn("text-xs font-semibold text-white", avatarColorClass(d.avatarColor))}>
                          {initials(d.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{d.name}</p>
                        <p className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Phone className="h-3 w-3" /> {d.phone}
                          {d.vehicle && <span>· {d.vehicle.plateNumber} {d.vehicle.loaiXe && `(${d.vehicle.loaiXe})`}</span>}
                        </p>
                      </div>
                      <span className="text-xs font-medium">★ {d.rating.toFixed(1)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed p-6 text-center">
                  <User className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
                  <p className="text-sm font-medium">Chưa có tài xế</p>
                </div>
              )}
            </div>

            {ncc.ghiChu && (
              <div className="rounded-lg border bg-amber-50 dark:bg-amber-950/20 p-3">
                <p className="mb-1 text-[10px] uppercase tracking-wider text-amber-700 dark:text-amber-400">Ghi chú</p>
                <p className="text-xs">{ncc.ghiChu}</p>
              </div>
            )}
          </div>
        )}
      </SheetContent>

      {/* Add vehicle dialog */}
      {ncc && (
        <AddVehicleDialog
          open={addVehicleOpen}
          onOpenChange={setAddVehicleOpen}
          nccId={ncc.id}
          onAdd={(body) => addVehicle.mutate({ ...body, nhaCungCapId: ncc.id })}
          isPending={addVehicle.isPending}
        />
      )}
    </Sheet>
  );
}

function AddVehicleDialog({
  open, onOpenChange, onAdd, isPending,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  nccId: string;
  onAdd: (body: Record<string, unknown>) => void;
  isPending: boolean;
}) {
  const [form, setForm] = React.useState({
    plateNumber: "", loaiXe: "", model: "Container", brand: "Container", capacityKg: "30000",
  });

  React.useEffect(() => {
    if (open) setForm({ plateNumber: "", loaiXe: "", model: "Container", brand: "Container", capacityKg: "30000" });
  }, [open]);

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto custom-scroll sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Plus className="h-5 w-5 text-emerald-500" /> Thêm xe</DialogTitle>
          <DialogDescription>Nhập thông tin xe cho NCC.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Biển số *</Label>
            <Input value={form.plateNumber} onChange={(e) => set("plateNumber", e.target.value.toUpperCase())} placeholder="51C 47495" className="font-mono font-semibold uppercase" autoFocus />
          </div>
          <div className="space-y-1.5">
            <Label>Dòng xe</Label>
            <Select value={form.loaiXe || "none"} onValueChange={(v) => set("loaiXe", v === "none" ? "" : v)}>
              <SelectTrigger><SelectValue placeholder="Chọn dòng xe" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— Chọn —</SelectItem>
                {LOAI_XE_OPTIONS.map((lx) => (
                  <SelectItem key={lx} value={lx}>{lx}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Hãng xe</Label>
              <Input value={form.brand} onChange={(e) => set("brand", e.target.value)} placeholder="Hyundai" />
            </div>
            <div className="space-y-1.5">
              <Label>Mẫu xe</Label>
              <Input value={form.model} onChange={(e) => set("model", e.target.value)} placeholder="HD270" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Tải trọng (kg)</Label>
            <Input type="number" value={form.capacityKg} onChange={(e) => set("capacityKg", e.target.value)} placeholder="30000" />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
          <Button disabled={isPending || !form.plateNumber} onClick={() => onAdd({
            plateNumber: form.plateNumber,
            loaiXe: form.loaiXe || null,
            model: form.model || "Container",
            brand: form.brand || "Container",
            type: "container",
            capacityKg: Number(form.capacityKg) || 0,
          })} className="gap-1.5">
            {isPending ? "Đang thêm..." : (<><CheckCircle2 className="h-4 w-4" /> Thêm xe</>)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function InfoRow({ icon: Icon, label, value, mono }: { icon: React.ElementType; label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}: </span>
        <span className={cn("font-medium", mono && "font-mono")}>{value}</span>
      </div>
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
