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
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard, desc: "Operations overview" },
  { key: "shipments", label: "Shipments", icon: Package, desc: "All shipments" },
  { key: "tracking", label: "Live Tracking", icon: MapPin, desc: "Real-time map" },
  { key: "drivers", label: "Drivers", icon: Truck, desc: "Driver roster" },
  { key: "vehicles", label: "Fleet", icon: CarFront, desc: "Vehicles" },
  { key: "customers", label: "Customers", icon: Users, desc: "Customers" },
  { key: "warehouses", label: "Warehouses", icon: Warehouse, desc: "Distribution centers" },
  { key: "routes", label: "Route Planning", icon: RouteIcon, desc: "Delivery routes" },
  { key: "analytics", label: "Analytics", icon: BarChart3, desc: "Reports" },
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
        placeholder="Search shipments, drivers, vehicles…"
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        {results.length > 0 && (
          <CommandGroup heading="Results">
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

        <CommandGroup heading="Navigation">
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
        <CommandGroup heading="Quick Actions">
          <CommandItem
            onSelect={() => {
              setView("shipments");
              setCommandOpen(false);
              window.dispatchEvent(new CustomEvent("open-new-shipment"));
            }}
            className="gap-2"
          >
            <Package className="h-4 w-4" />
            Create new shipment
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
