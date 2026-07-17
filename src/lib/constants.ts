// Logistics domain constants & metadata

export const SHIPMENT_STATUSES = [
  "pending",
  "picked_up",
  "in_transit",
  "out_for_delivery",
  "delivered",
  "delayed",
  "cancelled",
  "returned",
] as const;
export type ShipmentStatus = (typeof SHIPMENT_STATUSES)[number];

export const SHIPMENT_STATUS_META: Record<
  ShipmentStatus,
  { label: string; color: string; badge: string; dot: string }
> = {
  pending: {
    label: "Pending",
    color: "slate",
    badge: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700",
    dot: "bg-slate-400",
  },
  picked_up: {
    label: "Picked Up",
    color: "sky",
    badge: "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300 border-sky-200 dark:border-sky-900",
    dot: "bg-sky-500",
  },
  in_transit: {
    label: "In Transit",
    color: "amber",
    badge: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-900",
    dot: "bg-amber-500",
  },
  out_for_delivery: {
    label: "Out for Delivery",
    color: "violet",
    badge: "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300 border-violet-200 dark:border-violet-900",
    dot: "bg-violet-500",
  },
  delivered: {
    label: "Delivered",
    color: "emerald",
    badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900",
    dot: "bg-emerald-500",
  },
  delayed: {
    label: "Delayed",
    color: "orange",
    badge: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300 border-orange-200 dark:border-orange-900",
    dot: "bg-orange-500",
  },
  cancelled: {
    label: "Cancelled",
    color: "rose",
    badge: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border-rose-200 dark:border-rose-900",
    dot: "bg-rose-500",
  },
  returned: {
    label: "Returned",
    color: "red",
    badge: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 border-red-200 dark:border-red-900",
    dot: "bg-red-500",
  },
};

export const PRIORITIES = ["low", "standard", "high", "express"] as const;
export type Priority = (typeof PRIORITIES)[number];

export const PRIORITY_META: Record<Priority, { label: string; badge: string }> = {
  low: { label: "Low", badge: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700" },
  standard: { label: "Standard", badge: "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300 border-sky-200 dark:border-sky-900" },
  high: { label: "High", badge: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300 border-orange-200 dark:border-orange-900" },
  express: { label: "Express", badge: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border-rose-200 dark:border-rose-900" },
};

export const SERVICE_TYPES = ["standard", "express", "same_day", "freight", "cold_chain"] as const;
export type ServiceType = (typeof SERVICE_TYPES)[number];

export const SERVICE_META: Record<ServiceType, { label: string; icon: string }> = {
  standard: { label: "Standard", icon: "Package" },
  express: { label: "Express", icon: "Zap" },
  same_day: { label: "Same Day", icon: "Clock" },
  freight: { label: "Freight", icon: "Truck" },
  cold_chain: { label: "Cold Chain", icon: "Snowflake" },
};

export const DRIVER_STATUSES = ["available", "on_delivery", "off_duty", "on_leave"] as const;
export type DriverStatus = (typeof DRIVER_STATUSES)[number];

export const DRIVER_STATUS_META: Record<DriverStatus, { label: string; badge: string; dot: string }> = {
  available: {
    label: "Available",
    badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900",
    dot: "bg-emerald-500",
  },
  on_delivery: {
    label: "On Delivery",
    badge: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-900",
    dot: "bg-amber-500",
  },
  off_duty: {
    label: "Off Duty",
    badge: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700",
    dot: "bg-slate-400",
  },
  on_leave: {
    label: "On Leave",
    badge: "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300 border-violet-200 dark:border-violet-900",
    dot: "bg-violet-500",
  },
};

export const VEHICLE_STATUSES = ["active", "maintenance", "retired"] as const;
export type VehicleStatus = (typeof VEHICLE_STATUSES)[number];

export const VEHICLE_STATUS_META: Record<VehicleStatus, { label: string; badge: string; dot: string }> = {
  active: {
    label: "Active",
    badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900",
    dot: "bg-emerald-500",
  },
  maintenance: {
    label: "Maintenance",
    badge: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300 border-orange-200 dark:border-orange-900",
    dot: "bg-orange-500",
  },
  retired: {
    label: "Retired",
    badge: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700",
    dot: "bg-slate-400",
  },
};

export const VEHICLE_TYPES = ["truck", "van", "motorbike", "container"] as const;

export const WAREHOUSE_STATUSES = ["operational", "full", "maintenance", "closed"] as const;
export type WarehouseStatus = (typeof WAREHOUSE_STATUSES)[number];

export const WAREHOUSE_STATUS_META: Record<WarehouseStatus, { label: string; badge: string; dot: string }> = {
  operational: {
    label: "Operational",
    badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900",
    dot: "bg-emerald-500",
  },
  full: {
    label: "At Capacity",
    badge: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border-rose-200 dark:border-rose-900",
    dot: "bg-rose-500",
  },
  maintenance: {
    label: "Maintenance",
    badge: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300 border-orange-200 dark:border-orange-900",
    dot: "bg-orange-500",
  },
  closed: {
    label: "Closed",
    badge: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700",
    dot: "bg-slate-400",
  },
};

export const AVATAR_COLORS: Record<string, string> = {
  emerald: "bg-emerald-500",
  amber: "bg-amber-500",
  rose: "bg-rose-500",
  sky: "bg-sky-500",
  violet: "bg-violet-500",
  orange: "bg-orange-500",
  teal: "bg-teal-500",
  fuchsia: "bg-fuchsia-500",
};

export const VIETNAM_CITIES = [
  "Ho Chi Minh City",
  "Hanoi",
  "Da Nang",
  "Hai Phong",
  "Can Tho",
  "Nha Trang",
  "Hue",
  "Vung Tau",
];

export const ROUTE_STATUSES = ["planned", "active", "completed", "cancelled"] as const;
export type RouteStatus = (typeof ROUTE_STATUSES)[number];

export const ROUTE_STATUS_META: Record<RouteStatus, { label: string; badge: string; dot: string }> = {
  planned: {
    label: "Planned",
    badge: "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300 border-sky-200 dark:border-sky-900",
    dot: "bg-sky-500",
  },
  active: {
    label: "Active",
    badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900",
    dot: "bg-emerald-500",
  },
  completed: {
    label: "Completed",
    badge: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700",
    dot: "bg-slate-400",
  },
  cancelled: {
    label: "Cancelled",
    badge: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border-rose-200 dark:border-rose-900",
    dot: "bg-rose-500",
  },
};

