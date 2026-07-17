"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { KpiCard } from "@/components/kpi-card";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
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
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Receipt, Search, Plus, DollarSign, CheckCircle2, Clock, AlertCircle,
  FileText, Download, ArrowRight, User, Calendar, Percent, Printer,
} from "lucide-react";
import {
  INVOICE_STATUSES, INVOICE_STATUS_META, type InvoiceStatus,
} from "@/lib/constants";
import {
  formatCurrency, formatDate, formatRelativeTime, formatDateTime, formatWeight,
} from "@/lib/format";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type InvoiceCustomer = {
  id: string; name: string; email: string; phone: string;
  address: string; city: string; company: string | null;
};

type Invoice = {
  id: string;
  invoiceNumber: string;
  customerId: string;
  status: string;
  issueDate: string;
  dueDate: string;
  periodStart: string;
  periodEnd: string;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  currency: string;
  notes: string | null;
  paidAt: string | null;
  createdAt: string;
  customer: InvoiceCustomer;
};

type InvoiceDetail = Invoice & {
  lineItems: Array<{
    id: string;
    trackingNumber: string;
    cost: number;
    insurance: number;
    weightKg: number;
    pieces: number;
    destinationCity: string;
    destinationAddress: string;
    deliveredAt: string;
    receiver: { name: string; city: string };
  }>;
};

function InvoiceStatusBadge({ status }: { status: string }) {
  const meta = INVOICE_STATUS_META[status as InvoiceStatus] ?? INVOICE_STATUS_META.draft;
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium", meta.badge)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot, status === "sent" && "animate-pulse")} />
      {meta.label}
    </span>
  );
}

export function InvoicesView() {
  const qc = useQueryClient();
  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState("all");
  const [createOpen, setCreateOpen] = React.useState(false);
  const [detailId, setDetailId] = React.useState<string | null>(null);

  const debouncedSearch = useDebounce(search, 350);

  const { data, isLoading } = useQuery({
    queryKey: ["invoices", { debouncedSearch, status }],
    queryFn: () => {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set("q", debouncedSearch);
      if (status !== "all") params.set("status", status);
      return api.get<{ items: Invoice[] }>(`/api/invoices?${params}`);
    },
  });

  const invoices = data?.items ?? [];

  // KPIs
  const total = invoices.length;
  const paid = invoices.filter((i) => i.status === "paid");
  const outstanding = invoices.filter((i) => i.status === "sent" || i.status === "overdue");
  const overdue = invoices.filter((i) => i.status === "overdue");
  const totalRevenue = paid.reduce((sum, i) => sum + i.total, 0);
  const outstandingAmount = outstanding.reduce((sum, i) => sum + i.total, 0);

  return (
    <div className="space-y-4">
      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <KpiCard title="Tổng hóa đơn" value={total} icon={Receipt} accent="emerald" />
        <KpiCard title="Đã thanh toán" value={paid.length} icon={CheckCircle2} accent="teal" footer={formatCurrency(totalRevenue)} />
        <KpiCard title="Chưa thanh toán" value={outstanding.length} icon={Clock} accent="amber" footer={formatCurrency(outstandingAmount)} />
        <KpiCard title="Quá hạn" value={overdue.length} icon={AlertCircle} accent="rose" />
        <KpiCard title="Hóa đơn TB" value={formatCurrency(total > 0 ? totalRevenue / paid.length : 0)} icon={DollarSign} accent="violet" />
      </div>

      {/* Filter bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Tìm số hóa đơn, khách hàng, công ty…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-full sm:w-[160px]"><SelectValue placeholder="Trạng thái" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                {INVOICE_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>{INVOICE_STATUS_META[s].label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="sm" onClick={() => setCreateOpen(true)} className="gap-1.5">
              <Plus className="h-4 w-4" /> Tạo hóa đơn
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
            </div>
          ) : invoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 p-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <Receipt className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium">Chưa có hóa đơn</p>
                <p className="text-xs text-muted-foreground">Tạo hóa đơn từ đơn hàng đã giao để bắt đầu.</p>
              </div>
              <Button size="sm" onClick={() => setCreateOpen(true)} className="gap-1.5">
                <Plus className="h-4 w-4" /> Tạo hóa đơn
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto custom-scroll">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead className="min-w-[140px]">Số hóa đơn</TableHead>
                    <TableHead className="min-w-[180px]">Khách hàng</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className="hidden md:table-cell">Kỳ hạn</TableHead>
                    <TableHead className="hidden sm:table-cell">Hạn thanh toán</TableHead>
                    <TableHead className="text-right">Tổng cộng</TableHead>
                    <TableHead className="hidden lg:table-cell">Ngày phát hành</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((inv) => (
                    <TableRow
                      key={inv.id}
                      onClick={() => setDetailId(inv.id)}
                      className="cursor-pointer transition-colors hover:bg-muted/50"
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                            <FileText className="h-4 w-4" />
                          </div>
                          <span className="font-mono text-xs font-semibold">{inv.invoiceNumber}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm font-medium">{inv.customer.name}</p>
                        <p className="text-xs text-muted-foreground">{inv.customer.company || inv.customer.city}</p>
                      </TableCell>
                      <TableCell><InvoiceStatusBadge status={inv.status} /></TableCell>
                      <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                        {formatDate(inv.periodStart)} → {formatDate(inv.periodEnd)}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-xs">
                        {inv.status === "paid" && inv.paidAt ? (
                          <span className="text-emerald-600 dark:text-emerald-400">Đã thanh toán {formatDate(inv.paidAt)}</span>
                        ) : (
                          <span className={cn(inv.status === "overdue" && "text-rose-600 dark:text-rose-400 font-medium")}>
                            {formatDate(inv.dueDate)}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-semibold tabular-nums">{formatCurrency(inv.total)}</TableCell>
                      <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">{formatRelativeTime(inv.issueDate)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create dialog */}
      <CreateInvoiceDialog open={createOpen} onOpenChange={setCreateOpen} onCreated={(id) => {
        qc.invalidateQueries({ queryKey: ["invoices"] });
        setDetailId(id);
      }} />

      {/* Detail drawer */}
      <InvoiceDetailDrawer
        invoiceId={detailId}
        open={!!detailId}
        onOpenChange={(o) => { if (!o) setDetailId(null); }}
      />
    </div>
  );
}

function CreateInvoiceDialog({
  open, onOpenChange, onCreated,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onCreated: (id: string) => void;
}) {
  const qc = useQueryClient();
  const now = new Date();
  const firstOfMonth = new Date(now.getTime() - 45 * 86400000).toISOString().slice(0, 10);
  const lastOfMonth = now.toISOString().slice(0, 10);
  const dueDate = new Date(now.getTime() + 30 * 86400000).toISOString().slice(0, 10);

  const [form, setForm] = React.useState({
    customerId: "",
    periodStart: firstOfMonth,
    periodEnd: lastOfMonth,
    dueDate,
    taxRate: "0.1",
    notes: "",
  });

  const { data: customersData } = useQuery({
    queryKey: ["customers", "all"],
    queryFn: () => api.get<{ items: { id: string; name: string; city: string; company: string | null }[] }>("/api/customers?pageSize=100"),
    enabled: open,
  });

  // Preview: count delivered shipments for selected customer in period
  const [previewCount, setPreviewCount] = React.useState<number | null>(null);
  const [previewTotal, setPreviewTotal] = React.useState(0);

  React.useEffect(() => {
    if (!form.customerId || !open) {
      setPreviewCount(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const params = new URLSearchParams({
          page: "1",
          pageSize: "100",
          status: "delivered",
        });
        const data = await api.get<{ items: { id: string; cost: number; insurance: number; deliveredAt: string | null; senderId: string }[] }>(`/api/shipments?${params}`);
        if (cancelled) return;
        const start = new Date(form.periodStart).getTime();
        const end = new Date(form.periodEnd).getTime();
        const matching = data.items.filter((s) => {
          if (s.senderId !== form.customerId || !s.deliveredAt) return false;
          const t = new Date(s.deliveredAt).getTime();
          return t >= start && t <= end;
        });
        setPreviewCount(matching.length);
        setPreviewTotal(matching.reduce((sum, s) => sum + s.cost + (s.insurance || 0), 0));
      } catch {
        setPreviewCount(null);
      }
    })();
    return () => { cancelled = true; };
  }, [form.customerId, form.periodStart, form.periodEnd, open]);

  const create = useMutation({
    mutationFn: () => api.post<{ id: string }>("/api/invoices", {
      ...form,
      taxRate: Number(form.taxRate),
    }),
    onSuccess: (data) => {
      toast.success("Đã tạo hóa đơn");
      qc.invalidateQueries({ queryKey: ["invoices"] });
      onCreated(data.id);
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error("Tạo hóa đơn thất bại", { description: e.message }),
  });

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto custom-scroll">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Plus className="h-5 w-5 text-emerald-500" /> Tạo hóa đơn</DialogTitle>
          <DialogDescription>Tạo hóa đơn từ đơn hàng đã giao trong kỳ thanh toán.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Khách hàng *</Label>
            <Select value={form.customerId} onValueChange={(v) => set("customerId", v)}>
              <SelectTrigger><SelectValue placeholder="Chọn khách hàng" /></SelectTrigger>
              <SelectContent>
                {customersData?.items.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name} · {c.company || c.city}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Từ ngày *</Label>
              <Input type="date" value={form.periodStart} onChange={(e) => set("periodStart", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Đến ngày *</Label>
              <Input type="date" value={form.periodEnd} onChange={(e) => set("periodEnd", e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Hạn thanh toán</Label>
              <Input type="date" value={form.dueDate} onChange={(e) => set("dueDate", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Thuế suất</Label>
              <Select value={form.taxRate} onValueChange={(v) => set("taxRate", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">0% (Không thuế)</SelectItem>
                  <SelectItem value="0.05">5%</SelectItem>
                  <SelectItem value="0.08">8%</SelectItem>
                  <SelectItem value="0.1">10%</SelectItem>
                  <SelectItem value="0.15">15%</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Preview */}
          {previewCount !== null && (
            <div className={cn(
              "rounded-lg border p-3",
              previewCount === 0 ? "border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30" : "border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/30"
            )}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium">
                  {previewCount > 0 ? (
                    <span className="text-emerald-700 dark:text-emerald-400">
                      ✓ Tìm thấy {previewCount} đơn hàng đã giao
                    </span>
                  ) : (
                    <span className="text-amber-700 dark:text-amber-400">
                      ⚠ Không có đơn hàng đã giao trong kỳ này
                    </span>
                  )}
                </span>
                {previewCount > 0 && (
                  <span className="text-sm font-bold tabular-nums text-emerald-700 dark:text-emerald-400">
                    {formatCurrency(previewTotal)}
                  </span>
                )}
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Ghi chú</Label>
            <Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Ghi chú hóa đơn tùy chọn…" rows={2} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
          <Button
            disabled={create.isPending || !form.customerId || previewCount === 0}
            onClick={() => create.mutate()}
            className="gap-1.5"
          >
            {create.isPending ? "Đang tạo…" : (<><FileText className="h-4 w-4" /> Tạo hóa đơn</>)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function InvoiceDetailDrawer({
  invoiceId, open, onOpenChange,
}: {
  invoiceId: string | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const qc = useQueryClient();
  const { data: invoice, isLoading } = useQuery({
    queryKey: ["invoice", invoiceId],
    queryFn: () => api.get<InvoiceDetail>(`/api/invoices/${invoiceId}`),
    enabled: !!invoiceId && open,
  });

  const update = useMutation({
    mutationFn: (body: Record<string, unknown>) => api.patch(`/api/invoices/${invoiceId}`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invoice", invoiceId] });
      qc.invalidateQueries({ queryKey: ["invoices"] });
      toast.success("Đã cập nhật hóa đơn");
    },
    onError: (e: Error) => toast.error("Cập nhật thất bại", { description: e.message }),
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto custom-scroll p-0">
        <SheetHeader className="border-b px-5 py-4">
          <SheetDescription className="sr-only">Chi tiết hóa đơn</SheetDescription>
          <SheetTitle className="flex items-center justify-between gap-2 text-base">
            <span className="flex items-center gap-2 min-w-0">
              {invoice ? (
                <>
                  <Receipt className="h-5 w-5 shrink-0 text-emerald-500" />
                  <span className="font-mono truncate">{invoice.invoiceNumber}</span>
                  <InvoiceStatusBadge status={invoice.status} />
                </>
              ) : "Đang tải…"}
            </span>
            {invoice && (
              <Button size="sm" variant="ghost" className="h-8 gap-1.5 px-2 text-xs" onClick={handlePrint}>
                <Printer className="h-3.5 w-3.5" /> In
              </Button>
            )}
          </SheetTitle>
        </SheetHeader>

        {isLoading || !invoice ? (
          <div className="space-y-3 p-5">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        ) : (
          <div className="space-y-5 p-5">
            {/* Print area */}
            <div className="print-area space-y-5">
              {/* Status actions */}
              <div className="flex flex-wrap gap-2 print:hidden">
                {invoice.status === "draft" && (
                  <Button size="sm" variant="outline" disabled={update.isPending} onClick={() => update.mutate({ status: "sent" })} className="gap-1.5">
                    <ArrowRight className="h-3.5 w-3.5" /> Đánh dấu đã gửi
                  </Button>
                )}
                {(invoice.status === "sent" || invoice.status === "overdue") && (
                  <Button size="sm" disabled={update.isPending} onClick={() => update.mutate({ status: "paid" })} className="gap-1.5 bg-emerald-600 hover:bg-emerald-700">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Đánh dấu đã thanh toán
                  </Button>
                )}
                {invoice.status === "sent" && (
                  <Button size="sm" variant="outline" disabled={update.isPending} onClick={() => update.mutate({ status: "overdue" })} className="gap-1.5 text-rose-600">
                    <AlertCircle className="h-3.5 w-3.5" /> Đánh dấu quá hạn
                  </Button>
                )}
                {invoice.status !== "cancelled" && invoice.status !== "paid" && (
                  <Button size="sm" variant="outline" disabled={update.isPending} onClick={() => update.mutate({ status: "cancelled" })} className="gap-1.5 text-rose-600">
                    Hủy hóa đơn
                  </Button>
                )}
              </div>

              {/* Invoice header */}
              <div className="flex items-start justify-between border-b pb-4">
                <div>
                  <h2 className="text-xl font-bold tracking-tight">LOGISTICS V2</h2>
                  <p className="text-xs text-muted-foreground">Mạng lưới giao hàng nhanh</p>
                  <p className="mt-1 font-mono text-xs text-muted-foreground">{invoice.invoiceNumber}</p>
                </div>
                <div className="text-right">
                  <InvoiceStatusBadge status={invoice.status} />
                  <p className="mt-1 text-xs text-muted-foreground">Ngày phát hành: {formatDate(invoice.issueDate)}</p>
                  <p className="text-xs text-muted-foreground">Hạn thanh toán: {formatDate(invoice.dueDate)}</p>
                </div>
              </div>

              {/* Bill to */}
              <div className="rounded-lg border p-3">
                <p className="mb-1 flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                  <User className="h-3 w-3" /> Thanh toán cho
                </p>
                <p className="text-sm font-bold">{invoice.customer.name}</p>
                {invoice.customer.company && <p className="text-xs text-muted-foreground">{invoice.customer.company}</p>}
                <p className="text-xs text-muted-foreground">{invoice.customer.address}</p>
                <p className="text-xs text-muted-foreground">{invoice.customer.city}</p>
                <p className="text-xs text-muted-foreground">{invoice.customer.email} · {invoice.customer.phone}</p>
              </div>

              {/* Period */}
              <div className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2 text-xs">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" /> Kỳ thanh toán
                </span>
                <span className="font-medium">{formatDate(invoice.periodStart)} → {formatDate(invoice.periodEnd)}</span>
              </div>

              {/* Line items */}
              {invoice.lineItems.length > 0 && (
                <div>
                  <h4 className="mb-2 text-sm font-semibold">Chi tiết hạng mục ({invoice.lineItems.length})</h4>
                  <div className="overflow-hidden rounded-lg border">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/40">
                          <TableHead className="text-xs">Mã vận đơn</TableHead>
                          <TableHead className="text-xs hidden sm:table-cell">Điểm đến</TableHead>
                          <TableHead className="text-xs text-right">Thành tiền</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {invoice.lineItems.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-mono text-xs">{item.trackingNumber}</TableCell>
                            <TableCell className="text-xs hidden sm:table-cell">
                              {item.destinationCity}
                              <p className="text-[10px] text-muted-foreground">{item.receiver.name}</p>
                            </TableCell>
                            <TableCell className="text-right text-xs font-medium tabular-nums">
                              {formatCurrency(item.cost + (item.insurance || 0))}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              {/* Totals */}
              <div className="ml-auto max-w-xs space-y-1.5 border-t pt-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tạm tính</span>
                  <span className="tabular-nums font-medium">{formatCurrency(invoice.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Percent className="h-3 w-3" /> Thuế ({(invoice.taxRate * 100).toFixed(0)}%)
                  </span>
                  <span className="tabular-nums font-medium">{formatCurrency(invoice.taxAmount)}</span>
                </div>
                <div className="flex justify-between border-t pt-1.5 text-base font-bold">
                  <span>Tổng cộng</span>
                  <span className="tabular-nums">{formatCurrency(invoice.total)}</span>
                </div>
                {invoice.status === "paid" && invoice.paidAt && (
                  <div className="flex justify-between rounded bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                    <span>✓ Đã thanh toán ngày {formatDate(invoice.paidAt)}</span>
                  </div>
                )}
              </div>

              {invoice.notes && (
                <div className="rounded-lg border bg-amber-50 dark:bg-amber-950/20 p-3">
                  <p className="mb-1 text-[10px] uppercase tracking-wider text-amber-700 dark:text-amber-400">Ghi chú</p>
                  <p className="text-xs">{invoice.notes}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
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
