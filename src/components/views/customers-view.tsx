"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { KpiCard, EmptyState } from "@/components/kpi-card";
import { StatusBadge } from "@/components/status-badge";
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
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Users, Crown, UserCheck, Building2, Search, Plus, Mail, Phone,
  MapPin, X, ArrowRight, ArrowDownLeft, ArrowUpRight, Package, Calendar,
} from "lucide-react";
import { VIETNAM_CITIES } from "@/lib/constants";
import {
  formatNumber, formatCurrency, formatRelativeTime, formatDate, initials,
} from "@/lib/format";
import { toast } from "sonner";
import { avatarColorClass } from "@/components/avatar-color";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/store";

// ---------- Customer domain meta ----------
const CUSTOMER_STATUSES = ["active", "inactive", "vip"] as const;
type CustomerStatus = (typeof CUSTOMER_STATUSES)[number];

const CUSTOMER_STATUS_META: Record<CustomerStatus, { label: string; badge: string; dot: string }> = {
  active: {
    label: "Hoạt động",
    badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900",
    dot: "bg-emerald-500",
  },
  inactive: {
    label: "Không hoạt động",
    badge: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700",
    dot: "bg-slate-400",
  },
  vip: {
    label: "VIP",
    badge: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-900",
    dot: "bg-amber-500",
  },
};

const CUSTOMER_TYPES = ["business", "individual"] as const;
type CustomerType = (typeof CUSTOMER_TYPES)[number];

const CUSTOMER_TYPE_META: Record<CustomerType, { label: string; badge: string }> = {
  business: { label: "Doanh nghiệp", badge: "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300 border-sky-200 dark:border-sky-900" },
  individual: { label: "Cá nhân", badge: "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300 border-violet-200 dark:border-violet-900" },
};

function CustomerStatusBadge({ status }: { status: string }) {
  const meta = CUSTOMER_STATUS_META[status as CustomerStatus] ?? CUSTOMER_STATUS_META.active;
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium", meta.badge)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} />
      {meta.label}
    </span>
  );
}

function CustomerTypeBadge({ type }: { type: string }) {
  const meta = CUSTOMER_TYPE_META[type as CustomerType] ?? CUSTOMER_TYPE_META.business;
  return (
    <span className={cn("inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-medium", meta.badge)}>
      {meta.label}
    </span>
  );
}

// ---------- Types ----------
type Customer = {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  company: string | null;
  address: string;
  city: string;
  country: string;
  zipCode: string | null;
  type: string;
  status: string;
  notes: string | null;
  createdAt: string;
  _count: { shipmentsAsSender: number; shipmentsAsReceiver: number };
};

type CustomerShipment = {
  id: string;
  trackingNumber: string;
  status: string;
  originCity: string;
  destinationCity: string;
  cost: number;
  createdAt: string;
};

type CustomerDetail = Customer & {
  shipmentsAsSender: CustomerShipment[];
  shipmentsAsReceiver: CustomerShipment[];
};

// ---------- Component ----------
export function CustomersView() {
  const qc = useQueryClient();
  const { setSelectedShipmentId, setView } = useAppStore();
  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState("all");
  const [type, setType] = React.useState("all");
  const [city, setCity] = React.useState("all");
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [createOpen, setCreateOpen] = React.useState(false);

  const debouncedSearch = useDebounce(search, 350);

  const queryKey = React.useMemo(
    () => ["customers", { debouncedSearch, status, type, city }] as const,
    [debouncedSearch, status, type, city]
  );

  const { data, isLoading } = useQuery<{ items: Customer[] }>({
    queryKey,
    queryFn: () => {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set("q", debouncedSearch);
      if (status !== "all") params.set("status", status);
      if (type !== "all") params.set("type", type);
      if (city !== "all") params.set("city", city);
      return api.get(`/api/customers?${params.toString()}`);
    },
  });

  const { data: detail, isLoading: detailLoading } = useQuery<CustomerDetail>({
    queryKey: ["customer", selectedId],
    queryFn: () => api.get(`/api/customers/${selectedId}`),
    enabled: !!selectedId,
  });

  const createMutation = useMutation({
    mutationFn: (body: Record<string, unknown>) => api.post("/api/customers", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["customers"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Đã tạo khách hàng thành công");
      setCreateOpen(false);
    },
    onError: (e: Error) => toast.error(e.message || "Tạo khách hàng thất bại"),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: CustomerStatus }) =>
      api.patch(`/api/customers/${id}`, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["customers"] });
      qc.invalidateQueries({ queryKey: ["customer", selectedId] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Đã cập nhật trạng thái khách hàng");
    },
    onError: (e: Error) => toast.error(e.message || "Cập nhật trạng thái thất bại"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/customers/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["customers"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Đã xóa khách hàng");
      setSelectedId(null);
    },
    onError: (e: Error) => toast.error(e.message || "Xóa khách hàng thất bại"),
  });

  const customers = data?.items ?? [];

  const stats = React.useMemo(() => {
    const total = customers.length;
    const vip = customers.filter((c) => c.status === "vip").length;
    const active = customers.filter((c) => c.status === "active").length;
    const business = customers.filter((c) => c.type === "business").length;
    return { total, vip, active, business };
  }, [customers]);

  const hasFilters = search !== "" || status !== "all" || type !== "all" || city !== "all";
  const resetFilters = () => {
    setSearch(""); setStatus("all"); setType("all"); setCity("all");
  };

  return (
    <div className="space-y-4">
      {/* KPI row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiCard
          title="Tổng khách hàng"
          value={formatNumber(stats.total)}
          icon={Users}
          accent="emerald"
          footer={`${stats.vip} VIP · ${stats.business} doanh nghiệp`}
        />
        <KpiCard
          title="Khách VIP"
          value={formatNumber(stats.vip)}
          icon={Crown}
          accent="amber"
          footer="Phân khưu ưu tiên cao"
        />
        <KpiCard
          title="Hoạt động"
          value={formatNumber(stats.active)}
          icon={UserCheck}
          accent="sky"
          footer="Đang giao dịch"
        />
        <KpiCard
          title="Loại doanh nghiệp"
          value={formatNumber(stats.business)}
          icon={Building2}
          accent="violet"
          footer="Tài khoản B2B"
        />
      </div>

      {/* Filter bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Tìm tên, điện thoại, email, công ty…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả trạng thái</SelectItem>
                  {CUSTOMER_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>{CUSTOMER_STATUS_META[s].label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Loại" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả loại</SelectItem>
                  {CUSTOMER_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>{CUSTOMER_TYPE_META[t].label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={city} onValueChange={setCity}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Thành phố" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả thành phố</SelectItem>
                  {VIETNAM_CITIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {hasFilters && (
                <Button variant="ghost" size="sm" onClick={resetFilters} className="gap-1 text-xs">
                  <X className="h-3.5 w-3.5" /> Xóa
                </Button>
              )}
              <Button size="sm" onClick={() => setCreateOpen(true)} className="gap-1.5">
                <Plus className="h-4 w-4" /> Thêm khách hàng
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
            </div>
          ) : customers.length === 0 ? (
            <EmptyState
              icon={Users}
              title="Không tìm thấy khách hàng"
              description="Thử điều chỉnh bộ lọc hoặc thêm khách hàng mới vào danh bạ của bạn."
              action={<Button size="sm" variant="outline" onClick={resetFilters}>Đặt lại bộ lọc</Button>}
              className="mx-4 my-6"
            />
          ) : (
            <div className="overflow-x-auto custom-scroll">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead className="min-w-[200px]">Khách hàng</TableHead>
                    <TableHead className="hidden md:table-cell min-w-[160px]">Công ty</TableHead>
                    <TableHead className="hidden lg:table-cell">Thành phố</TableHead>
                    <TableHead className="hidden sm:table-cell">Điện thoại</TableHead>
                    <TableHead className="text-center">Đơn hàng</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className="hidden sm:table-cell text-right">Ngày tạo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customers.map((c) => {
                    const sent = c._count?.shipmentsAsSender ?? 0;
                    const received = c._count?.shipmentsAsReceiver ?? 0;
                    return (
                      <TableRow
                        key={c.id}
                        onClick={() => setSelectedId(c.id)}
                        className="cursor-pointer transition-colors hover:bg-muted/50"
                      >
                        <TableCell>
                          <div className="flex items-center gap-2.5">
                            <Avatar className="h-9 w-9">
                              <AvatarFallback className={cn("text-xs font-semibold text-white", avatarColorClass(c.id))}>
                                {initials(c.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="truncate font-medium">{c.name}</p>
                              <div className="mt-0.5"><CustomerTypeBadge type={c.type} /></div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                          {c.company || <span className="italic">—</span>}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-sm">{c.city}</TableCell>
                        <TableCell className="hidden sm:table-cell text-sm text-muted-foreground font-mono text-xs">
                          {c.phone}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1.5 text-xs">
                            <span className="inline-flex items-center gap-0.5 rounded-md bg-emerald-500/10 px-1.5 py-0.5 font-medium text-emerald-700 dark:text-emerald-300">
                              <ArrowUpRight className="h-3 w-3" />{sent}
                            </span>
                            <span className="inline-flex items-center gap-0.5 rounded-md bg-sky-500/10 px-1.5 py-0.5 font-medium text-sky-700 dark:text-sky-300">
                              <ArrowDownLeft className="h-3 w-3" />{received}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell><CustomerStatusBadge status={c.status} /></TableCell>
                        <TableCell className="hidden sm:table-cell text-right text-xs text-muted-foreground">
                          {formatRelativeTime(c.createdAt)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail drawer */}
      <Sheet
        open={!!selectedId}
        onOpenChange={(o) => { if (!o) setSelectedId(null); }}
      >
        <SheetContent side="right" className="w-full gap-0 p-0 sm:max-w-lg">
          <SheetHeader className="border-b p-4">
            <SheetTitle>Chi tiết khách hàng</SheetTitle>
            <SheetDescription>Hồ sơ, thông tin liên hệ và lịch sử đơn hàng.</SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto">
            {detailLoading || !detail ? (
              <div className="space-y-3 p-4">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-32 w-full" />
              </div>
            ) : (
              <CustomerDetailContent
                customer={detail}
                onStatusChange={(s) => updateStatusMutation.mutate({ id: detail.id, status: s })}
                onDelete={() => deleteMutation.mutate(detail.id)}
                updating={updateStatusMutation.isPending}
                deleting={deleteMutation.isPending}
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
      <CreateCustomerDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSubmit={(body) => createMutation.mutate(body)}
        submitting={createMutation.isPending}
      />
    </div>
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
      <span className="w-24 shrink-0 text-xs text-muted-foreground">{label}</span>
      <span className={cn("min-w-0 flex-1 truncate font-medium", mono && "font-mono text-xs")}>{value || "—"}</span>
    </div>
  );
}

function CustomerDetailContent({
  customer,
  onStatusChange,
  onDelete,
  updating,
  deleting,
  onShipmentClick,
}: {
  customer: CustomerDetail;
  onStatusChange: (s: CustomerStatus) => void;
  onDelete: () => void;
  updating: boolean;
  deleting: boolean;
  onShipmentClick: (id: string) => void;
}) {
  const [confirmDelete, setConfirmDelete] = React.useState(false);

  const sent = customer.shipmentsAsSender ?? [];
  const received = customer.shipmentsAsReceiver ?? [];

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Avatar className="h-16 w-16">
          <AvatarFallback className={cn("text-lg font-semibold text-white", avatarColorClass(customer.id))}>
            {initials(customer.name)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-lg font-semibold">{customer.name}</h3>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <CustomerStatusBadge status={customer.status} />
            <CustomerTypeBadge type={customer.type} />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Khách hàng từ {formatDate(customer.createdAt)}
          </p>
        </div>
      </div>

      {/* Contact */}
      <div className="grid grid-cols-1 gap-2">
        {customer.email && <DetailRow icon={Mail} label="Email" value={customer.email} />}
        <DetailRow icon={Phone} label="Điện thoại" value={customer.phone} mono />
        {customer.company && <DetailRow icon={Building2} label="Công ty" value={customer.company} />}
        <DetailRow icon={MapPin} label="Địa chỉ" value={customer.address} />
        <DetailRow
          icon={MapPin}
          label="Thành phố"
          value={[customer.city, customer.country].filter(Boolean).join(", ")}
        />
        {customer.zipCode && <DetailRow icon={MapPin} label="Mã bưu chính" value={customer.zipCode} mono />}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg bg-emerald-500/10 p-3">
          <div className="flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-300">
            <ArrowUpRight className="h-3.5 w-3.5" /> Đã gửi
          </div>
          <p className="mt-1 text-2xl font-bold tabular-nums text-emerald-700 dark:text-emerald-300">
            {customer._count?.shipmentsAsSender ?? 0}
          </p>
        </div>
        <div className="rounded-lg bg-sky-500/10 p-3">
          <div className="flex items-center gap-1.5 text-xs text-sky-700 dark:text-sky-300">
            <ArrowDownLeft className="h-3.5 w-3.5" /> Đã nhận
          </div>
          <p className="mt-1 text-2xl font-bold tabular-nums text-sky-700 dark:text-sky-300">
            {customer._count?.shipmentsAsReceiver ?? 0}
          </p>
        </div>
      </div>

      {/* Status change */}
      <div>
        <p className="mb-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">Đổi trạng thái</p>
        <Select
          value={customer.status}
          onValueChange={(v) => onStatusChange(v as CustomerStatus)}
          disabled={updating}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Chọn trạng thái" />
          </SelectTrigger>
          <SelectContent>
            {CUSTOMER_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>{CUSTOMER_STATUS_META[s].label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Notes */}
      {customer.notes && (
        <div>
          <p className="mb-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">Ghi chú</p>
          <div className="rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground">
            {customer.notes}
          </div>
        </div>
      )}

      {/* Sent shipments */}
      <ShipmentList
        title="Đơn hàng đã gửi"
        icon={ArrowUpRight}
        iconClass="text-emerald-600 dark:text-emerald-400"
        shipments={sent}
        totalCount={customer._count?.shipmentsAsSender ?? 0}
        onShipmentClick={onShipmentClick}
      />

      {/* Received shipments */}
      <ShipmentList
        title="Đơn hàng đã nhận"
        icon={ArrowDownLeft}
        iconClass="text-sky-600 dark:text-sky-400"
        shipments={received}
        totalCount={customer._count?.shipmentsAsReceiver ?? 0}
        onShipmentClick={onShipmentClick}
      />

      {/* Delete */}
      <div className="border-t pt-3">
        {confirmDelete ? (
          <div className="flex items-center gap-2">
            <Button
              variant="destructive"
              size="sm"
              className="gap-1.5"
              onClick={onDelete}
              disabled={deleting}
            >
              {deleting ? "Đang xóa…" : "Xác nhận xóa"}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setConfirmDelete(false)}>
              Hủy
            </Button>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:text-rose-400 dark:hover:bg-rose-950/40"
            onClick={() => setConfirmDelete(true)}
          >
            Xóa khách hàng
          </Button>
        )}
      </div>
    </div>
  );
}

function ShipmentList({
  title, icon: Icon, iconClass, shipments, totalCount, onShipmentClick,
}: {
  title: string;
  icon: React.ElementType;
  iconClass: string;
  shipments: CustomerShipment[];
  totalCount: number;
  onShipmentClick: (id: string) => void;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          <Icon className={cn("h-3.5 w-3.5", iconClass)} /> {title}
        </p>
        <Badge variant="secondary" className="text-[10px]">{totalCount} tổng</Badge>
      </div>
      {shipments.length === 0 ? (
        <p className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">
          Chưa có đơn hàng
        </p>
      ) : (
        <div className="space-y-1.5">
          {shipments.map((s) => (
            <button
              key={s.id}
              onClick={() => onShipmentClick(s.id)}
              className="flex w-full items-center gap-2 rounded-lg border p-2.5 text-left transition-colors hover:bg-muted/50"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <Package className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-mono text-xs font-semibold">{s.trackingNumber}</p>
                <p className="truncate text-[10px] text-muted-foreground">
                  {s.originCity} → {s.destinationCity}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="text-[10px] font-medium tabular-nums">{formatCurrency(s.cost)}</span>
                <StatusBadge status={s.status} kind="shipment" />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------- Create dialog ----------
function CreateCustomerDialog({
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
  const [company, setCompany] = React.useState("");
  const [address, setAddress] = React.useState("");
  const [city, setCity] = React.useState("");
  const [type, setType] = React.useState<CustomerType>("business");
  const [status, setStatus] = React.useState<CustomerStatus>("active");
  const [notes, setNotes] = React.useState("");

  React.useEffect(() => {
    if (!open) {
      setName(""); setEmail(""); setPhone(""); setCompany("");
      setAddress(""); setCity(""); setType("business"); setStatus("active"); setNotes("");
    }
  }, [open]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !address || !city) {
      toast.error("Tên, điện thoại, địa chỉ và thành phố là bắt buộc");
      return;
    }
    onSubmit({
      name,
      email: email || undefined,
      phone,
      company: company || undefined,
      address,
      city,
      type,
      status,
      notes: notes || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Thêm khách hàng mới</DialogTitle>
          <DialogDescription>
            Đăng ký khách hàng mới (người gửi hoặc người nhận) cho các đơn hàng của bạn.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="c-name">Họ và tên *</Label>
            <Input id="c-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nguyen Van A" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="c-email">Email</Label>
              <Input id="c-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="a@company.com" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c-phone">Điện thoại *</Label>
              <Input id="c-phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+84 90x xxx xxx" required />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="c-company">Công ty</Label>
            <Input id="c-company" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Acme Logistics Co." />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="c-address">Địa chỉ *</Label>
            <Input id="c-address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="123 Lê Lợi, Quận 1" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="c-city">Thành phố *</Label>
              <Select value={city} onValueChange={setCity}>
                <SelectTrigger id="c-city" className="w-full">
                  <SelectValue placeholder="Chọn thành phố" />
                </SelectTrigger>
                <SelectContent>
                  {VIETNAM_CITIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c-type">Loại</Label>
              <Select value={type} onValueChange={(v) => setType(v as CustomerType)}>
                <SelectTrigger id="c-type" className="w-full">
                  <SelectValue placeholder="Chọn loại" />
                </SelectTrigger>
                <SelectContent>
                  {CUSTOMER_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>{CUSTOMER_TYPE_META[t].label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="c-status">Trạng thái</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as CustomerStatus)}>
              <SelectTrigger id="c-status" className="w-full">
                <SelectValue placeholder="Chọn trạng thái" />
              </SelectTrigger>
              <SelectContent>
                {CUSTOMER_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>{CUSTOMER_STATUS_META[s].label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="c-notes">Ghi chú</Label>
            <Textarea id="c-notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ghi chú tùy chọn về khách hàng này…" rows={2} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
            <Button type="submit" disabled={submitting} className="gap-1.5">
              {submitting ? "Đang tạo…" : (<><Plus className="h-4 w-4" /> Tạo mới</>)}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
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
