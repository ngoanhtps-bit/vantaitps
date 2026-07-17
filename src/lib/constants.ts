// Logistics domain constants & metadata (Tiếng Việt)

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
    label: "Chờ xử lý",
    color: "slate",
    badge: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700",
    dot: "bg-slate-400",
  },
  picked_up: {
    label: "Đã lấy hàng",
    color: "sky",
    badge: "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300 border-sky-200 dark:border-sky-900",
    dot: "bg-sky-500",
  },
  in_transit: {
    label: "Đang vận chuyển",
    color: "amber",
    badge: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-900",
    dot: "bg-amber-500",
  },
  out_for_delivery: {
    label: "Đang giao hàng",
    color: "violet",
    badge: "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300 border-violet-200 dark:border-violet-900",
    dot: "bg-violet-500",
  },
  delivered: {
    label: "Đã giao",
    color: "emerald",
    badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900",
    dot: "bg-emerald-500",
  },
  delayed: {
    label: "Trễ hạn",
    color: "orange",
    badge: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300 border-orange-200 dark:border-orange-900",
    dot: "bg-orange-500",
  },
  cancelled: {
    label: "Đã hủy",
    color: "rose",
    badge: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border-rose-200 dark:border-rose-900",
    dot: "bg-rose-500",
  },
  returned: {
    label: "Trả hàng",
    color: "red",
    badge: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 border-red-200 dark:border-red-900",
    dot: "bg-red-500",
  },
};

export const PRIORITIES = ["low", "standard", "high", "express"] as const;
export type Priority = (typeof PRIORITIES)[number];

export const PRIORITY_META: Record<Priority, { label: string; badge: string }> = {
  low: { label: "Thấp", badge: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700" },
  standard: { label: "Tiêu chuẩn", badge: "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300 border-sky-200 dark:border-sky-900" },
  high: { label: "Cao", badge: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300 border-orange-200 dark:border-orange-900" },
  express: { label: "Hỏa tốc", badge: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border-rose-200 dark:border-rose-900" },
};

export const SERVICE_TYPES = ["standard", "express", "same_day", "freight", "cold_chain"] as const;
export type ServiceType = (typeof SERVICE_TYPES)[number];

export const SERVICE_META: Record<ServiceType, { label: string; icon: string }> = {
  standard: { label: "Tiêu chuẩn", icon: "Package" },
  express: { label: "Chuyển phát nhanh", icon: "Zap" },
  same_day: { label: "Giao trong ngày", icon: "Clock" },
  freight: { label: "Hàng hóa", icon: "Truck" },
  cold_chain: { label: "Chuỗi lạnh", icon: "Snowflake" },
};

export const DRIVER_STATUSES = ["available", "on_delivery", "off_duty", "on_leave"] as const;
export type DriverStatus = (typeof DRIVER_STATUSES)[number];

export const DRIVER_STATUS_META: Record<DriverStatus, { label: string; badge: string; dot: string }> = {
  available: {
    label: "Sẵn sàng",
    badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900",
    dot: "bg-emerald-500",
  },
  on_delivery: {
    label: "Đang giao hàng",
    badge: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-900",
    dot: "bg-amber-500",
  },
  off_duty: {
    label: "Nghỉ phép",
    badge: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700",
    dot: "bg-slate-400",
  },
  on_leave: {
    label: "Tạm nghỉ",
    badge: "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300 border-violet-200 dark:border-violet-900",
    dot: "bg-violet-500",
  },
};

export const VEHICLE_STATUSES = ["active", "maintenance", "retired"] as const;
export type VehicleStatus = (typeof VEHICLE_STATUSES)[number];

export const VEHICLE_STATUS_META: Record<VehicleStatus, { label: string; badge: string; dot: string }> = {
  active: {
    label: "Hoạt động",
    badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900",
    dot: "bg-emerald-500",
  },
  maintenance: {
    label: "Bảo trì",
    badge: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300 border-orange-200 dark:border-orange-900",
    dot: "bg-orange-500",
  },
  retired: {
    label: "Ngừng hoạt động",
    badge: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700",
    dot: "bg-slate-400",
  },
};

export const VEHICLE_TYPES = ["truck", "van", "motorbike", "container"] as const;

export const VEHICLE_TYPE_LABELS: Record<string, string> = {
  truck: "Xe tải",
  van: "Xe tải nhỏ",
  motorbike: "Xe máy",
  container: "Container",
};

export const FUEL_TYPE_LABELS: Record<string, string> = {
  diesel: "Diesel",
  petrol: "Xăng",
  electric: "Điện",
};

export const WAREHOUSE_STATUSES = ["operational", "full", "maintenance", "closed"] as const;
export type WarehouseStatus = (typeof WAREHOUSE_STATUSES)[number];

export const WAREHOUSE_STATUS_META: Record<WarehouseStatus, { label: string; badge: string; dot: string }> = {
  operational: {
    label: "Hoạt động",
    badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900",
    dot: "bg-emerald-500",
  },
  full: {
    label: "Đầy công suất",
    badge: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border-rose-200 dark:border-rose-900",
    dot: "bg-rose-500",
  },
  maintenance: {
    label: "Bảo trì",
    badge: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300 border-orange-200 dark:border-orange-900",
    dot: "bg-orange-500",
  },
  closed: {
    label: "Đã đóng",
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
  "TP. Hồ Chí Minh",
  "Hà Nội",
  "Đà Nẵng",
  "Hải Phòng",
  "Cần Thơ",
  "Nha Trang",
  "Huế",
  "Vũng Tàu",
];

export const ROUTE_STATUSES = ["planned", "active", "completed", "cancelled"] as const;
export type RouteStatus = (typeof ROUTE_STATUSES)[number];

export const ROUTE_STATUS_META: Record<RouteStatus, { label: string; badge: string; dot: string }> = {
  planned: {
    label: "Đã lên kế hoạch",
    badge: "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300 border-sky-200 dark:border-sky-900",
    dot: "bg-sky-500",
  },
  active: {
    label: "Đang hoạt động",
    badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900",
    dot: "bg-emerald-500",
  },
  completed: {
    label: "Hoàn thành",
    badge: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700",
    dot: "bg-slate-400",
  },
  cancelled: {
    label: "Đã hủy",
    badge: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border-rose-200 dark:border-rose-900",
    dot: "bg-rose-500",
  },
};

export const INVOICE_STATUSES = ["draft", "sent", "paid", "overdue", "cancelled"] as const;
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

export const INVOICE_STATUS_META: Record<InvoiceStatus, { label: string; badge: string; dot: string }> = {
  draft: {
    label: "Bản nháp",
    badge: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700",
    dot: "bg-slate-400",
  },
  sent: {
    label: "Đã gửi",
    badge: "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300 border-sky-200 dark:border-sky-900",
    dot: "bg-sky-500",
  },
  paid: {
    label: "Đã thanh toán",
    badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900",
    dot: "bg-emerald-500",
  },
  overdue: {
    label: "Quá hạn",
    badge: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border-rose-200 dark:border-rose-900",
    dot: "bg-rose-500",
  },
  cancelled: {
    label: "Đã hủy",
    badge: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700 line-through",
    dot: "bg-slate-400",
  },
};
