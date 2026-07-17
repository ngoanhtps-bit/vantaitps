"use client";

import * as React from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, Package, MapPin, User, Weight, Box, Truck } from "lucide-react";
import {
  SHIPMENT_STATUS_META, SERVICE_META, type ShipmentStatus,
} from "@/lib/constants";
import { formatWeight, formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

type LabelData = {
  trackingNumber: string;
  status: string;
  priority: string;
  serviceType: string;
  originAddress: string;
  originCity: string;
  destinationAddress: string;
  destinationCity: string;
  weightKg: number;
  pieces: number;
  distanceKm: number;
  sender: { name: string; city: string; phone?: string };
  receiver: { name: string; city: string; phone?: string };
  estimatedDelivery: string | null;
};

// Generate a pseudo-barcode pattern from the tracking number string
function generateBarcodePattern(input: string): number[] {
  const bars: number[] = [];
  for (let i = 0; i < input.length; i++) {
    const code = input.charCodeAt(i);
    // each char produces 4 bars of varying width (1-4 units)
    bars.push((code % 4) + 1);
    bars.push(((code >> 2) % 3) + 1);
    bars.push(((code >> 4) % 4) + 1);
    bars.push(((code >> 6) % 3) + 1);
  }
  return bars;
}

function Barcode({ value, className }: { value: string; className?: string }) {
  const bars = React.useMemo(() => generateBarcodePattern(value), [value]);
  return (
    <div className={cn("flex h-16 items-end gap-px", className)} aria-label={`Mã vạch ${value}`}>
      {bars.map((w, i) => (
        <div
          key={i}
          className={cn("shrink-0", i % 2 === 0 ? "bg-black dark:bg-white" : "bg-transparent")}
          style={{ width: `${w * 1.5}px`, height: "100%" }}
        />
      ))}
    </div>
  );
}

export function PrintLabelDialog({
  open, onOpenChange, shipment,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  shipment: LabelData | null;
}) {
  const handlePrint = () => {
    window.print();
  };

  if (!shipment) return null;

  const statusMeta = SHIPMENT_STATUS_META[shipment.status as ShipmentStatus] ?? SHIPMENT_STATUS_META.pending;
  const serviceLabel = SERVICE_META[shipment.serviceType as keyof typeof SERVICE_META]?.label ?? shipment.serviceType;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto custom-scroll print:max-w-none print:max-h-none print:overflow-visible print:border-0 print:shadow-none">
        <DialogHeader className="print:hidden">
          <DialogTitle className="flex items-center gap-2">
            <Printer className="h-5 w-5 text-emerald-500" /> Nhãn vận đơn
          </DialogTitle>
          <DialogDescription>Xem trước nhãn vận chuyển. Nhấn in để gửi đến máy in.</DialogDescription>
        </DialogHeader>

        {/* Printable label */}
        <div className="print-area rounded-lg border-2 border-dashed border-slate-300 p-5 print:rounded-none print:border-0 print:p-0">
          {/* Top: company + status */}
          <div className="flex items-start justify-between border-b-2 border-slate-900 pb-3">
            <div>
              <h2 className="text-lg font-black tracking-tight">LOGISTICS V2</h2>
              <p className="text-[9px] uppercase tracking-widest text-slate-500">Mạng lưới giao hàng nhanh</p>
            </div>
            <div className="text-right">
              <span className={cn("inline-block rounded border px-2 py-0.5 text-[10px] font-bold uppercase", statusMeta.badge)}>
                {statusMeta.label}
              </span>
              <p className="mt-1 text-[10px] font-semibold text-slate-600">{serviceLabel}</p>
            </div>
          </div>

          {/* Tracking number + barcode */}
          <div className="border-b border-slate-300 py-3">
            <p className="mb-1 text-[9px] uppercase tracking-widest text-slate-500">Mã vận đơn</p>
            <p className="font-mono text-xl font-bold tracking-wider">{shipment.trackingNumber}</p>
            <div className="mt-2 rounded border border-slate-200 bg-white p-2">
              <Barcode value={shipment.trackingNumber} />
              <p className="mt-1 text-center font-mono text-[10px] tracking-[0.3em] text-slate-700">{shipment.trackingNumber}</p>
            </div>
          </div>

          {/* From / To */}
          <div className="grid grid-cols-2 gap-3 border-b border-slate-300 py-3">
            <div>
              <p className="mb-1 flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest text-slate-500">
                <User className="h-2.5 w-2.5" /> Từ
              </p>
              <p className="text-sm font-bold">{shipment.sender.name}</p>
              <p className="text-[11px] text-slate-600">{shipment.originAddress}</p>
              <p className="text-[11px] font-medium text-slate-700">{shipment.originCity}</p>
              {shipment.sender.phone && <p className="text-[10px] text-slate-500">ĐT: {shipment.sender.phone}</p>}
            </div>
            <div className="border-l border-slate-300 pl-3">
              <p className="mb-1 flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest text-slate-500">
                <MapPin className="h-2.5 w-2.5" /> Đến
              </p>
              <p className="text-sm font-bold">{shipment.receiver.name}</p>
              <p className="text-[11px] text-slate-600">{shipment.destinationAddress}</p>
              <p className="text-[11px] font-medium text-slate-700">{shipment.destinationCity}</p>
              {shipment.receiver.phone && <p className="text-[10px] text-slate-500">ĐT: {shipment.receiver.phone}</p>}
            </div>
          </div>

          {/* Cargo details */}
          <div className="grid grid-cols-4 gap-2 border-b border-slate-300 py-3 text-center">
            <div>
              <Weight className="mx-auto mb-0.5 h-3.5 w-3.5 text-slate-400" />
              <p className="text-[9px] uppercase text-slate-500">Trọng lượng</p>
              <p className="text-xs font-bold">{formatWeight(shipment.weightKg)}</p>
            </div>
            <div>
              <Box className="mx-auto mb-0.5 h-3.5 w-3.5 text-slate-400" />
              <p className="text-[9px] uppercase text-slate-500">Số kiện</p>
              <p className="text-xs font-bold">{shipment.pieces}</p>
            </div>
            <div>
              <Truck className="mx-auto mb-0.5 h-3.5 w-3.5 text-slate-400" />
              <p className="text-[9px] uppercase text-slate-500">Quãng đường</p>
              <p className="text-xs font-bold">{shipment.distanceKm} km</p>
            </div>
            <div>
              <Package className="mx-auto mb-0.5 h-3.5 w-3.5 text-slate-400" />
              <p className="text-[9px] uppercase text-slate-500">Ưu tiên</p>
              <p className="text-xs font-bold capitalize">{shipment.priority}</p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-3">
            <div>
              <p className="text-[9px] uppercase tracking-widest text-slate-500">Dự kiến giao</p>
              <p className="text-xs font-semibold">{shipment.estimatedDelivery ? formatDateTime(shipment.estimatedDelivery) : "N/A"}</p>
            </div>
            <div className="text-right">
              <p className="text-[9px] uppercase tracking-widest text-slate-500">Đã in</p>
              <p className="text-[10px] text-slate-600">{new Date().toLocaleString()}</p>
            </div>
          </div>

          {/* QR-like square (decorative) */}
          <div className="mt-3 flex justify-end">
            <div className="grid grid-cols-6 gap-px rounded border border-slate-900 bg-slate-900 p-1" aria-hidden>
              {Array.from({ length: 36 }).map((_, i) => {
                const hash = (shipment.trackingNumber.charCodeAt(i % shipment.trackingNumber.length) + i) % 3;
                return <div key={i} className={cn("h-2 w-2", hash < 2 ? "bg-white" : "bg-slate-900")} />;
              })}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-4 flex justify-end gap-2 print:hidden">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Đóng</Button>
          <Button onClick={handlePrint} className="gap-1.5">
            <Printer className="h-4 w-4" /> In nhãn
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
