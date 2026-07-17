"use client";

import * as React from "react";
import {
  Package,
  Truck,
  CarFront,
  Users,
  Warehouse,
  MapPin,
  BarChart3,
  LayoutDashboard,
  Search,
  ArrowRight,
  Route as RouteIcon,
  Receipt,
  FileBarChart,
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { useAppStore, type ViewKey } from "@/lib/store";
import { api } from "@/lib/api-client";
import { SHIPMENT_STATUS_META } from "@/lib/constants";

type QuickResult = {
  id: string;
  type: "shipment" | "driver" | "vehicle" | "customer";
  label: string;
  sub: string;
};

const NAV_ITEMS: { key: ViewKey; label: string; icon: React.ElementType; desc: string }[] = [
  { key: "dashboard", label: "Tổng quan", icon: LayoutDashboard, desc: "Tổng quan hoạt động" },
  { key: "shipments", label: "Đơn hàng", icon: Package, desc: "Tất cả đơn hàng" },
  { key: "tracking", label: "Theo dõi trực tuyến", icon: MapPin, desc: "Bản đồ thời gian thực" },
  { key: "drivers", label: "Tài xế", icon: Truck, desc: "Danh sách tài xế" },
  { key: "vehicles", label: "Đội xe", icon: CarFront, desc: "Phương tiện" },
  { key: "customers", label: "Khách hàng", icon: Users, desc: "Khách hàng" },
  { key: "warehouses", label: "Kho hàng", icon: Warehouse, desc: "Trung tâm phân phối" },
  { key: "routes", label: "Lập kế hoạch tuyến", icon: RouteIcon, desc: "Tuyến giao hàng" },
  { key: "invoices", label: "Hóa đơn", icon: Receipt, desc: "Thanh toán" },
  { key: "reports", label: "Báo cáo", icon: FileBarChart, desc: "Xuất báo cáo" },
  { key: "analytics", label: "Phân tích", icon: BarChart3, desc: "Báo cáo" },
];

export function CommandPalette() {
  const { commandOpen, setCommandOpen, setView, setSelectedShipmentId } = useAppStore();
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<QuickResult[]>([]);

  React.useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const data = await api.get<{
          shipments: { id: string; trackingNumber: string; status: string; sender: { name: string } }[];
          drivers: { id: string; name: string; status: string }[];
          vehicles: { id: string; plateNumber: string; model: string }[];
          customers: { id: string; name: string; city: string }[];
        }>(`/api/search?q=${encodeURIComponent(q)}`);
        if (cancelled) return;
        const r: QuickResult[] = [];
        data.shipments.slice(0, 5).forEach((s) =>
          r.push({ id: s.id, type: "shipment", label: s.trackingNumber, sub: `${s.sender.name} · ${SHIPMENT_STATUS_META[s.status as keyof typeof SHIPMENT_STATUS_META]?.label ?? s.status}` })
        );
        data.drivers.slice(0, 4).forEach((d) => r.push({ id: d.id, type: "driver", label: d.name, sub: `Driver · ${d.status}` }));
        data.vehicles.slice(0, 4).forEach((v) => r.push({ id: v.id, type: "vehicle", label: v.plateNumber, sub: `Vehicle · ${v.model}` }));
        data.customers.slice(0, 4).forEach((c) => r.push({ id: c.id, type: "customer", label: c.name, sub: `Customer · ${c.city}` }));
        setResults(r);
      } catch {
        setResults([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [query]);

  const go = (v: ViewKey) => {
    setView(v);
    setCommandOpen(false);
  };

  return (
    <CommandDialog open={commandOpen} onOpenChange={setCommandOpen}>
      <CommandInput
        placeholder="Tìm đơn hàng, tài xế, phương tiện…"
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>Không tìm thấy kết quả.</CommandEmpty>

        {results.length > 0 && (
          <CommandGroup heading="Kết quả">
            {results.map((r) => (
              <CommandItem
                key={`${r.type}-${r.id}`}
                onSelect={() => {
                  if (r.type === "shipment") {
                    setSelectedShipmentId(r.id);
                    setView("shipments");
                  } else {
                    setView(r.type === "driver" ? "drivers" : r.type === "vehicle" ? "vehicles" : "customers");
                  }
                  setCommandOpen(false);
                }}
                className="gap-2"
              >
                <Search className="h-4 w-4 text-muted-foreground" />
                <div className="flex flex-1 flex-col">
                  <span className="text-sm font-medium">{r.label}</span>
                  <span className="text-xs text-muted-foreground">{r.sub}</span>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        <CommandGroup heading="Điều hướng">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <CommandItem key={item.key} onSelect={() => go(item.key)} className="gap-2">
                <Icon className="h-4 w-4 text-muted-foreground" />
                <span className="flex-1">{item.label}</span>
                <span className="text-xs text-muted-foreground">{item.desc}</span>
              </CommandItem>
            );
          })}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Thao tác nhanh">
          <CommandItem
            onSelect={() => {
              setView("shipments");
              setCommandOpen(false);
              window.dispatchEvent(new CustomEvent("open-new-shipment"));
            }}
            className="gap-2"
          >
            <Package className="h-4 w-4" />
            Tạo đơn hàng mới
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
