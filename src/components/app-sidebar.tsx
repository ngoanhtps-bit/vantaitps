"use client";

import * as React from "react";
import {
  LayoutDashboard,
  Package,
  MapPin,
  Truck,
  CarFront,
  Users,
  Warehouse,
  BarChart3,
  Zap,
  Route as RouteIcon,
  Receipt,
  FileBarChart,
  Building2,
  UserCog,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore, type ViewKey } from "@/lib/store";
import { useAuthStore } from "@/lib/auth-store";

const NAV: {
  key: ViewKey;
  label: string;
  icon: React.ElementType;
  hint?: string;
}[] = [
  { key: "dashboard", label: "Tổng quan", icon: LayoutDashboard },
  { key: "shipments", label: "Đơn hàng", icon: Package },
  { key: "tracking", label: "Theo dõi trực tuyến", icon: MapPin, hint: "Trực tiếp" },
  { key: "danh-muc-xe", label: "Danh mục xe", icon: Truck },
  { key: "nha-cung-cap", label: "NCC xe", icon: Building2 },
  { key: "customers", label: "Khách hàng", icon: Users },
  { key: "warehouses", label: "Kho hàng", icon: Warehouse },
  { key: "routes", label: "Lập kế hoạch tuyến", icon: RouteIcon },
  { key: "invoices", label: "Hóa đơn", icon: Receipt },
  { key: "reports", label: "Báo cáo", icon: FileBarChart },
  { key: "analytics", label: "Phân tích", icon: BarChart3 },
  { key: "users", label: "Người dùng", icon: UserCog },
  { key: "phan-quyen", label: "Phân quyền", icon: ShieldCheck },
];

export function AppSidebar() {
  const { view, setView, setSidebarOpen } = useAppStore();
  const { canView } = useAuthStore();

  // Lọc nav theo quyền của user
  const visibleNav = NAV.filter((item) => canView(item.key));

  return (
    <aside className="flex h-full w-full flex-col gap-2 border-r bg-sidebar/80 backdrop-blur-sm">
      {/* Brand */}
      <div className="flex h-16 items-center gap-3 px-5 border-b">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/30">
          <Zap className="h-5 w-5" />
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-bold tracking-tight">Logistics V2</span>
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
            Bảng điều khiển
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4 custom-scroll">
        <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Vận hành
        </div>
        {visibleNav.map((item) => {
          const active = view === item.key;
          const Icon = item.icon;
          return (
            <button
              key={item.key}
              onClick={() => {
                setView(item.key);
                setSidebarOpen(false);
              }}
              className={cn(
                "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                active
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <Icon
                className={cn(
                  "h-[1.15rem] w-[1.15rem] shrink-0 transition-transform group-hover:scale-110",
                  active ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"
                )}
              />
              <span className="flex-1 text-left">{item.label}</span>
              {item.hint && (
                <span className="flex items-center gap-1">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  </span>
                  <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                    {item.hint}
                  </span>
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer card */}
      <div className="px-3 pb-4">
        <div className="rounded-xl border bg-gradient-to-br from-emerald-50 to-teal-50 p-3 dark:from-emerald-950/40 dark:to-teal-950/40">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500 text-white">
              <Truck className="h-4 w-4" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-xs font-semibold">Đội xe trực tuyến</span>
              <span className="text-[10px] text-muted-foreground">Đồng bộ thời gian thực</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
