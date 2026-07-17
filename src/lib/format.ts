// Formatting helpers (Tiếng Việt)

export function formatCurrency(value: number, currency = "USD"): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value || 0);
}

export function formatNumber(value: number, digits = 0): string {
  return new Intl.NumberFormat("vi-VN", {
    maximumFractionDigits: digits,
    minimumFractionDigits: 0,
  }).format(value || 0);
}

export function formatWeight(kg: number): string {
  if (kg >= 1000) return `${(kg / 1000).toFixed(2)} tấn`;
  return `${kg.toFixed(1)} kg`;
}

export function formatDistance(km: number): string {
  if (km >= 1000) return `${(km / 1000).toFixed(2)} Mm`;
  return `${Math.round(km)} km`;
}

export function formatVolume(m3: number): string {
  return `${m3.toFixed(2)} m³`;
}

export function formatCompact(value: number): string {
  return new Intl.NumberFormat("vi-VN", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value || 0);
}

export function formatRelativeTime(date: string | Date | number | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "number" ? new Date(date) : typeof date === "string" ? new Date(date) : date;
  const diff = Date.now() - d.getTime();
  const sec = Math.round(diff / 1000);
  const min = Math.round(sec / 60);
  const hr = Math.round(min / 60);
  const day = Math.round(hr / 24);
  if (sec < 60) return "vừa xong";
  if (min < 60) return `${min} phút trước`;
  if (hr < 24) return `${hr} giờ trước`;
  if (day < 30) return `${day} ngày trước`;
  return d.toLocaleDateString("vi-VN");
}

export function formatDate(date: string | Date | null | undefined, opts?: Intl.DateTimeFormatOptions): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("vi-VN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    ...opts,
  });
}

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString("vi-VN", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(-2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}
