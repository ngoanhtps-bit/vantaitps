"use client";

import * as React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from "@/components/ui/tabs";
import {
  Zap, Route as RouteIcon, Calendar, Truck, Container as ContainerIcon, User, Phone,
  Building2, UserCheck, Headphones, MapPin, CheckCircle2, Loader2,
  ClipboardPaste, Wand2, Eraser,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type QuickTripForm = {
  route: string;
  tripDate: string;
  plateNumber: string;
  trailerNumber: string;
  containerNumber: string;
  driverName: string;
  driverPhone: string;
  customerCode: string;
  customerName: string;
  salePerson: string;
  dispatcher: string;
  notes: string;
};

const PLACEHOLDERS: QuickTripForm = {
  route: "BẮC NINH - HCM",
  tripDate: "17/07/2026",
  plateNumber: "51C 47495",
  trailerNumber: "50RM 15513",
  containerNumber: "TCLU 1071990",
  driverName: "LÊ VĂN BÌNH",
  driverPhone: "0942043414",
  customerCode: "GTVD",
  customerName: "",
  salePerson: "HIỀN",
  dispatcher: "ÁNH",
  notes: "",
};

const EMPTY_FORM: QuickTripForm = {
  route: "",
  tripDate: new Date().toLocaleDateString("vi-VN"),
  plateNumber: "",
  trailerNumber: "",
  containerNumber: "",
  driverName: "",
  driverPhone: "",
  customerCode: "",
  customerName: "",
  salePerson: "",
  dispatcher: "",
  notes: "",
};

// Sample paste text matching user's format
const SAMPLE_PASTE = `Lộ Trình : BẮC NINH - HCM
Ngày : 17/07/2026
Biển Số : 51C 47495
Số Mooc : 50RM 15513
Số Cont : TCLU 1071990
Tên LX : LÊ VĂN BÌNH
SĐT LX : 0942043414
KH : GTVD
SALE : HIỀN
DP : ÁNH`;

/**
 * Remove Vietnamese diacritics for accent-insensitive matching.
 * "Lộ Trình" → "Lo Trinh", "Biển Số" → "Bien So"
 */
function removeDiacritics(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove combining diacritics
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
}

/**
 * Parse a pasted message block into QuickTripForm fields.
 * Handles formats like:
 *   "Lộ Trình : BẮC NINH - HCM"
 *   "Biển Số: 51C 47495"
 *   "SĐT LX: 0942043414"
 *   "Tên LX: LÊ VĂN BÌNH"
 */
function parsePastedMessage(text: string): Partial<QuickTripForm> {
  const result: Partial<QuickTripForm> = {};
  const lines = text.split(/\r?\n/);

  // Patterns matched against the de-accented, lowercased line.
  // Each label regex is anchored at start, then a separator ( : or - or =), then the value.
  const patterns: { field: keyof QuickTripForm; regex: RegExp }[] = [
    // Lộ trình / Lo trinh / Lo trinh / Hanh trinh / Tuyen / Route
    { field: "route", regex: /^(?:lo\s*trinh|hanh\s*trinh|tuyen|route|lo\s*trinh)\s*[:\-]\s*(.+)$/ },
    // Ngày / Date / Ngay di / Ngay khoi hanh
    { field: "tripDate", regex: /^(?:ngay|date|ngay\s*di|ngay\s*khoi\s*hanh|ngay\s*tao)\s*[:\-]\s*(.+)$/ },
    // Biển số / Bien so / Bien so / Plate / Xe
    { field: "plateNumber", regex: /^(?:bien\s*so|plate|bien\s*so\s*xe|so\s*xe|xe)\s*[:\-]\s*(.+)$/ },
    // Số Mooc / So mooc / Mooc / Trailer
    { field: "trailerNumber", regex: /^(?:so\s*mooc|mooc|trailer|ro\s*mooc)\s*[:\-]\s*(.+)$/ },
    // Số Cont / So cont / Cont / Container
    { field: "containerNumber", regex: /^(?:so\s*cont|cont|container)\s*[:\-]\s*(.+)$/ },
    // Tên LX / Ten lx / Ten tai xe / Tai xe / Driver / Ten lai xe
    { field: "driverName", regex: /^(?:ten\s*lx|ten\s*tai\s*xe|ten\s*lai\s*xe|tai\s*xe|lai\s*xe|driver|ten\s*lx|lx)\s*[:\-]\s*(.+)$/ },
    // SĐT LX / SDT / Phone / Dien thoai / So dien thoai
    { field: "driverPhone", regex: /^(?:sdt|dien\s*thoai|phone|so\s*dien\s*thoai|sdt\s*lx|sdt\s*tai\s*xe|tel)\s*[:\-]\s*(.+)$/ },
    // KH / Ma kh / Khach hang / Customer
    { field: "customerCode", regex: /^(?:kh|ma\s*kh|khach\s*hang|customer|ma\s*khach\s*hang)\s*[:\-]\s*(.+)$/ },
    // SALE / Sale
    { field: "salePerson", regex: /^(?:sale)\s*[:\-]\s*(.+)$/ },
    // DP / Dieu phoi / Dispatch
    { field: "dispatcher", regex: /^(?:dp|dieu\s*phoi|dispatch|nguoi\s*dieu\s*phoi)\s*[:\-]\s*(.+)$/ },
  ];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Normalize: remove diacritics + lowercase for matching
    const normalized = removeDiacritics(trimmed).toLowerCase();

    for (const { field, regex } of patterns) {
      const match = normalized.match(regex);
      if (match && match[1]) {
        // Extract the value from the ORIGINAL line (preserve accents in value).
        // Find the FIRST separator (: or -) in the normalized line to locate
        // where the label ends, then take the rest of the original line.
        const sepIdx = normalized.search(/[:\-]/);
        let value: string;
        if (sepIdx >= 0) {
          value = trimmed.slice(sepIdx + 1).replace(/^[\s:\-]+/, "").trim();
        } else {
          value = match[1].trim();
        }
        // Don't overwrite if already set (first match wins)
        if (value && (!(field in result) || !result[field])) {
          result[field] = value;
        }
        break;
      }
    }
  }

  return result;
}

export function QuickTripDialog({
  open, onOpenChange, onCreated,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onCreated?: (shipmentId: string) => void;
}) {
  const qc = useQueryClient();
  const [form, setForm] = React.useState<QuickTripForm>(EMPTY_FORM);
  const [pasteText, setPasteText] = React.useState("");
  const [activeTab, setActiveTab] = React.useState<"paste" | "manual">("paste");

  React.useEffect(() => {
    if (open) {
      setForm(EMPTY_FORM);
      setPasteText("");
      setActiveTab("paste");
    }
  }, [open]);

  const create = useMutation({
    mutationFn: () => api.post<{ id: string; trackingNumber: string }>("/api/shipments/quick-trip", form),
    onSuccess: (data) => {
      toast.success("Đã tạo chuyến nhanh", { description: `Mã vận đơn: ${data.trackingNumber}` });
      qc.invalidateQueries({ queryKey: ["shipments"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["tracking"] });
      qc.invalidateQueries({ queryKey: ["notifications"] });
      onOpenChange(false);
      onCreated?.(data.id);
    },
    onError: (e: Error) => toast.error("Tạo chuyến thất bại", { description: e.message }),
  });

  const set = (k: keyof QuickTripForm, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleParse = () => {
    if (!pasteText.trim()) {
      toast.error("Vui lòng dán nội dung tin nhắn vào ô trước");
      return;
    }
    const parsed = parsePastedMessage(pasteText);
    const filledCount = Object.values(parsed).filter((v) => v).length;

    if (filledCount === 0) {
      toast.error("Không nhận diện được trường nào", {
        description: "Kiểm tra định dạng: 'Lộ Trình : BẮC NINH - HCM'",
      });
      return;
    }

    setForm((f) => ({ ...f, ...parsed }));
    setActiveTab("manual");
    toast.success(`Đã tách ${filledCount} trường`, {
      description: "Kiểm tra lại thông tin rồi ấn Tạo chuyến",
    });
  };

  const handlePasteSample = () => {
    setPasteText(SAMPLE_PASTE);
    toast.info("Đã điền mẫu — ấn 'Tách thông tin'");
  };

  const handleClearPaste = () => {
    setPasteText("");
  };

  // Auto-parse when paste text changes (debounced)
  React.useEffect(() => {
    if (!pasteText.trim()) return;
    const t = setTimeout(() => {
      const parsed = parsePastedMessage(pasteText);
      setForm((f) => ({ ...f, ...parsed }));
    }, 500);
    return () => clearTimeout(t);
  }, [pasteText]);

  const isValid = form.route.trim() && form.plateNumber.trim() && form.driverName.trim();

  // Parse route preview
  const routeParts = form.route.split(/\s*[-–—]\s*/).map((s) => s.trim()).filter(Boolean);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto custom-scroll sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
              <Zap className="h-4 w-4" />
            </div>
            Tạo chuyến nhanh
          </DialogTitle>
          <DialogDescription>
            Dán tin nhắn thông tin xe vào ô bên dưới — hệ thống tự động tách các trường.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "paste" | "manual")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="paste" className="gap-1.5">
              <ClipboardPaste className="h-3.5 w-3.5" /> Dán tin nhắn
            </TabsTrigger>
            <TabsTrigger value="manual" className="gap-1.5">
              <Wand2 className="h-3.5 w-3.5" /> Chỉnh sửa
            </TabsTrigger>
          </TabsList>

          {/* ===== PASTE TAB ===== */}
          <TabsContent value="paste" className="space-y-3">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-1.5">
                  <ClipboardPaste className="h-3.5 w-3.5 text-emerald-500" />
                  Dán nội dung tin nhắn
                </Label>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs" onClick={handlePasteSample}>
                    <ClipboardPaste className="h-3 w-3" /> Mẫu
                  </Button>
                  {pasteText && (
                    <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs" onClick={handleClearPaste}>
                      <Eraser className="h-3 w-3" /> Xóa
                    </Button>
                  )}
                </div>
              </div>
              <Textarea
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                placeholder={"Dán tin nhắn vào đây, ví dụ:\n\nLộ Trình : BẮC NINH - HCM\nNgày : 17/07/2026\nBiển Số : 51C 47495\nSố Mooc : 50RM 15513\nSố Cont : TCLU 1071990\nTên LX : LÊ VĂN BÌNH\nSĐT LX : 0942043414\nKH : GTVD\nSALE : HIỀN\nDP : ÁNH"}
                rows={11}
                className="resize-none font-mono text-xs leading-relaxed"
                autoFocus
              />
            </div>

            {/* Live parse preview */}
            {pasteText.trim() && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-3 dark:border-emerald-900 dark:bg-emerald-950/20">
                <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Đã nhận diện
                </p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs sm:grid-cols-3">
                  <ParsedField label="Lộ trình" value={form.route} />
                  <ParsedField label="Ngày" value={form.tripDate} />
                  <ParsedField label="Biển số" value={form.plateNumber} mono />
                  <ParsedField label="Số Mooc" value={form.trailerNumber} mono />
                  <ParsedField label="Số Cont" value={form.containerNumber} mono />
                  <ParsedField label="Tài xế" value={form.driverName} />
                  <ParsedField label="SĐT" value={form.driverPhone} mono />
                  <ParsedField label="KH" value={form.customerCode} mono />
                  <ParsedField label="SALE" value={form.salePerson} />
                  <ParsedField label="DP" value={form.dispatcher} />
                </div>
              </div>
            )}

            <Button
              onClick={handleParse}
              disabled={!pasteText.trim()}
              className="w-full gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
            >
              <Wand2 className="h-4 w-4" /> Tách thông tin &amp; sang bước chỉnh sửa
            </Button>
          </TabsContent>

          {/* ===== MANUAL TAB ===== */}
          <TabsContent value="manual" className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Lộ trình */}
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="flex items-center gap-1.5">
                  <RouteIcon className="h-3.5 w-3.5 text-emerald-500" />
                  Lộ trình <span className="text-rose-500">*</span>
                </Label>
                <Input
                  value={form.route}
                  onChange={(e) => set("route", e.target.value.toUpperCase())}
                  placeholder={PLACEHOLDERS.route}
                  className="font-medium uppercase"
                />
                {routeParts.length === 2 && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="outline" className="gap-1 border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-400">
                      <MapPin className="h-2.5 w-2.5" /> {routeParts[0]}
                    </Badge>
                    <span className="text-emerald-500">→</span>
                    <Badge variant="outline" className="gap-1 border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900 dark:bg-sky-950 dark:text-sky-400">
                      <MapPin className="h-2.5 w-2.5" /> {routeParts[1]}
                    </Badge>
                  </div>
                )}
              </div>

              {/* Ngày */}
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-sky-500" />
                  Ngày khởi hành
                </Label>
                <Input
                  value={form.tripDate}
                  onChange={(e) => set("tripDate", e.target.value)}
                  placeholder={PLACEHOLDERS.tripDate}
                />
              </div>

              {/* Biển số */}
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5">
                  <Truck className="h-3.5 w-3.5 text-amber-500" />
                  Biển số <span className="text-rose-500">*</span>
                </Label>
                <Input
                  value={form.plateNumber}
                  onChange={(e) => set("plateNumber", e.target.value.toUpperCase())}
                  placeholder={PLACEHOLDERS.plateNumber}
                  className="font-mono font-semibold uppercase"
                />
              </div>

              {/* Số Mooc */}
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5">
                  <ContainerIcon className="h-3.5 w-3.5 text-violet-500" />
                  Số Mooc
                </Label>
                <Input
                  value={form.trailerNumber}
                  onChange={(e) => set("trailerNumber", e.target.value.toUpperCase())}
                  placeholder={PLACEHOLDERS.trailerNumber}
                  className="font-mono uppercase"
                />
              </div>

              {/* Số Cont */}
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5">
                  <ContainerIcon className="h-3.5 w-3.5 text-teal-500" />
                  Số Cont
                </Label>
                <Input
                  value={form.containerNumber}
                  onChange={(e) => set("containerNumber", e.target.value.toUpperCase())}
                  placeholder={PLACEHOLDERS.containerNumber}
                  className="font-mono uppercase"
                />
              </div>

              {/* Tên tài xế */}
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-emerald-500" />
                  Tên tài xế <span className="text-rose-500">*</span>
                </Label>
                <Input
                  value={form.driverName}
                  onChange={(e) => set("driverName", e.target.value.toUpperCase())}
                  placeholder={PLACEHOLDERS.driverName}
                  className="font-medium uppercase"
                />
              </div>

              {/* SĐT tài xế */}
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-rose-500" />
                  SĐT tài xế
                </Label>
                <Input
                  value={form.driverPhone}
                  onChange={(e) => set("driverPhone", e.target.value)}
                  placeholder={PLACEHOLDERS.driverPhone}
                  className="font-mono"
                  inputMode="tel"
                />
              </div>

              {/* Mã KH */}
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5 text-sky-500" />
                  Mã khách hàng (KH)
                </Label>
                <Input
                  value={form.customerCode}
                  onChange={(e) => set("customerCode", e.target.value.toUpperCase())}
                  placeholder={PLACEHOLDERS.customerCode}
                  className="font-mono font-semibold uppercase"
                />
              </div>

              {/* Tên KH (optional) */}
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5 text-slate-400" />
                  Tên khách hàng (tuỳ chọn)
                </Label>
                <Input
                  value={form.customerName}
                  onChange={(e) => set("customerName", e.target.value)}
                  placeholder="Công ty TNHH..."
                />
              </div>

              {/* SALE */}
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5">
                  <UserCheck className="h-3.5 w-3.5 text-orange-500" />
                  SALE
                </Label>
                <Input
                  value={form.salePerson}
                  onChange={(e) => set("salePerson", e.target.value.toUpperCase())}
                  placeholder={PLACEHOLDERS.salePerson}
                  className="uppercase"
                />
              </div>

              {/* DP */}
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5">
                  <Headphones className="h-3.5 w-3.5 text-violet-500" />
                  DP (Điều phối)
                </Label>
                <Input
                  value={form.dispatcher}
                  onChange={(e) => set("dispatcher", e.target.value.toUpperCase())}
                  placeholder={PLACEHOLDERS.dispatcher}
                  className="uppercase"
                />
              </div>

              {/* Ghi chú */}
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Ghi chú</Label>
                <Textarea
                  value={form.notes}
                  onChange={(e) => set("notes", e.target.value)}
                  placeholder="Ghi chú thêm cho chuyến đi..."
                  rows={2}
                />
              </div>
            </div>

            {/* Preview summary */}
            {isValid && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-3 dark:border-emerald-900 dark:bg-emerald-950/20">
                <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Thông tin chuyến
                </p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs sm:grid-cols-3">
                  <PreviewItem label="Lộ trình" value={form.route} />
                  <PreviewItem label="Ngày" value={form.tripDate} />
                  <PreviewItem label="Biển số" value={form.plateNumber} mono />
                  {form.trailerNumber && <PreviewItem label="Số Mooc" value={form.trailerNumber} mono />}
                  {form.containerNumber && <PreviewItem label="Số Cont" value={form.containerNumber} mono />}
                  <PreviewItem label="Tài xế" value={form.driverName} />
                  {form.driverPhone && <PreviewItem label="SĐT" value={form.driverPhone} mono />}
                  {form.customerCode && <PreviewItem label="KH" value={form.customerCode} mono />}
                  {form.salePerson && <PreviewItem label="SALE" value={form.salePerson} />}
                  {form.dispatcher && <PreviewItem label="DP" value={form.dispatcher} />}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
          <Button
            disabled={create.isPending || !isValid}
            onClick={() => create.mutate()}
            className="gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
          >
            {create.isPending ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Đang tạo...</>
            ) : (
              <><Zap className="h-4 w-4" /> Tạo chuyến</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ParsedField({ label, value, mono }: { label: string; value?: string; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
      <p className={cn("truncate font-medium", !value && "text-muted-foreground/40 italic", mono && value && "font-mono")}>
        {value || "—"}
      </p>
    </div>
  );
}

function PreviewItem({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
      <p className={cn("truncate font-medium", mono && "font-mono")}>{value}</p>
    </div>
  );
}
