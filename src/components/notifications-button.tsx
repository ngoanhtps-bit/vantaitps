"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Bell, AlertTriangle, Fuel, Wrench, UserX, Warehouse as WarehouseIcon,
  Clock, CheckCircle2, Package, ArrowRight,
} from "lucide-react";
import { useAppStore, type ViewKey } from "@/lib/store";
import { formatRelativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";

type Notification = {
  id: string;
  type: "delayed" | "low_fuel" | "maintenance" | "driver" | "warehouse" | "pending" | "delivered";
  severity: "critical" | "warning" | "info" | "success";
  title: string;
  description: string;
  refId?: string;
  view?: ViewKey;
  timestamp: string;
};

const NOTIF_ICON: Record<string, React.ElementType> = {
  delayed: AlertTriangle,
  low_fuel: Fuel,
  maintenance: Wrench,
  driver: UserX,
  warehouse: WarehouseIcon,
  pending: Clock,
  delivered: CheckCircle2,
};

const SEVERITY_STYLE: Record<string, { bg: string; text: string; ring: string; dot: string }> = {
  critical: {
    bg: "bg-rose-500/10",
    text: "text-rose-600 dark:text-rose-400",
    ring: "ring-rose-500/20",
    dot: "bg-rose-500",
  },
  warning: {
    bg: "bg-amber-500/10",
    text: "text-amber-600 dark:text-amber-400",
    ring: "ring-amber-500/20",
    dot: "bg-amber-500",
  },
  info: {
    bg: "bg-sky-500/10",
    text: "text-sky-600 dark:text-sky-400",
    ring: "ring-sky-500/20",
    dot: "bg-sky-500",
  },
  success: {
    bg: "bg-emerald-500/10",
    text: "text-emerald-600 dark:text-emerald-400",
    ring: "ring-emerald-500/20",
    dot: "bg-emerald-500",
  },
};

export function NotificationsButton() {
  const { setView, setSelectedShipmentId } = useAppStore();

  const { data } = useQuery<{
    notifications: Notification[];
    counts: { critical: number; warning: number; info: number; success: number; total: number };
  }>({
    queryKey: ["notifications"],
    queryFn: () => api.get("/api/notifications"),
    refetchInterval: 60000,
  });

  const notifs = data?.notifications ?? [];
  const counts = data?.counts ?? { critical: 0, warning: 0, info: 0, success: 0, total: 0 };
  const urgentCount = counts.critical + counts.warning;

  const handleClick = (n: Notification) => {
    if (n.refId && n.view === "shipments") {
      setSelectedShipmentId(n.refId);
    }
    if (n.view) setView(n.view);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative rounded-full"
          aria-label={`Notifications${urgentCount > 0 ? `, ${urgentCount} urgent` : ""}`}
        >
          <Bell className="h-[1.15rem] w-[1.15rem]" />
          {urgentCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex min-h-[18px] min-w-[18px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white ring-2 ring-background">
              {urgentCount > 9 ? "9+" : urgentCount}
            </span>
          )}
          {urgentCount === 0 && (
            <span className="absolute right-1.5 top-1.5 flex h-2 w-2">
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0 sm:w-96">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-semibold">Notifications</span>
          </div>
          <div className="flex items-center gap-1">
            {counts.critical > 0 && (
              <Badge variant="outline" className="gap-1 border-rose-200 bg-rose-50 text-[10px] text-rose-600 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-400">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                {counts.critical}
              </Badge>
            )}
            {counts.warning > 0 && (
              <Badge variant="outline" className="gap-1 border-amber-200 bg-amber-50 text-[10px] text-amber-600 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-400">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                {counts.warning}
              </Badge>
            )}
          </div>
        </div>

        <div className="max-h-[400px] overflow-y-auto custom-scroll">
          {notifs.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <p className="text-sm font-medium">All clear!</p>
              <p className="text-xs text-muted-foreground">No notifications right now.</p>
            </div>
          ) : (
            notifs.map((n) => {
              const Icon = NOTIF_ICON[n.type] || Bell;
              const s = SEVERITY_STYLE[n.severity];
              return (
                <DropdownMenuItem
                  key={n.id}
                  onClick={() => handleClick(n)}
                  className="flex cursor-pointer items-start gap-3 border-b px-4 py-3 last:border-0 focus:bg-muted/50"
                >
                  <div className={cn("mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ring-1", s.bg, s.text, s.ring)}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-xs font-semibold">{n.title}</p>
                      <span className="shrink-0 text-[10px] text-muted-foreground">
                        {formatRelativeTime(n.timestamp)}
                      </span>
                    </div>
                    <p className="truncate text-xs text-muted-foreground">{n.description}</p>
                  </div>
                </DropdownMenuItem>
              );
            })
          )}
        </div>

        <div className="border-t p-2">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-center gap-1.5 text-xs"
            onClick={() => setView("tracking")}
          >
            View live tracking <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
