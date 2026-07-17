"use client";

import { cn } from "@/lib/utils";
import {
  SHIPMENT_STATUS_META,
  DRIVER_STATUS_META,
  VEHICLE_STATUS_META,
  WAREHOUSE_STATUS_META,
  PRIORITY_META,
  type ShipmentStatus,
  type DriverStatus,
  type VehicleStatus,
  type WarehouseStatus,
  type Priority,
} from "@/lib/constants";

// statuses that represent live / in-progress activity
const ACTIVE_STATUSES = new Set([
  "in_transit",
  "out_for_delivery",
  "on_delivery",
  "active",
  "operational",
]);

export function StatusBadge({
  status,
  kind,
  className,
}: {
  status: ShipmentStatus | DriverStatus | VehicleStatus | WarehouseStatus | string;
  kind: "shipment" | "driver" | "vehicle" | "warehouse";
  className?: string;
}) {
  let meta: { label: string; badge: string; dot: string };
  if (kind === "shipment") meta = SHIPMENT_STATUS_META[status as ShipmentStatus] ?? SHIPMENT_STATUS_META.pending;
  else if (kind === "driver") meta = DRIVER_STATUS_META[status as DriverStatus] ?? DRIVER_STATUS_META.off_duty;
  else if (kind === "vehicle") meta = VEHICLE_STATUS_META[status as VehicleStatus] ?? VEHICLE_STATUS_META.retired;
  else meta = WAREHOUSE_STATUS_META[status as WarehouseStatus] ?? WAREHOUSE_STATUS_META.closed;

  const isActive = ACTIVE_STATUSES.has(status);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-all duration-150 hover:brightness-95 dark:hover:brightness-110",
        meta.badge,
        className
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot, isActive && "animate-pulse")} />
      {meta.label}
    </span>
  );
}

export function PriorityBadge({ priority, className }: { priority: Priority | string; className?: string }) {
  const meta = PRIORITY_META[priority as Priority] ?? PRIORITY_META.standard;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium transition-all duration-150 hover:brightness-95 dark:hover:brightness-110",
        meta.badge,
        className
      )}
    >
      {meta.label}
    </span>
  );
}
