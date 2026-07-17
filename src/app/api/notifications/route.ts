import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// Aggregated notifications for the ops team:
// - delayed shipments
// - vehicles with low fuel or overdue maintenance
// - drivers off-duty / on-leave
// - warehouses at/near capacity
// - shipments pending pickup for too long
export async function GET() {
  const now = Date.now();
  const dayMs = 86400000;

  const [
    delayedShipments,
    lowFuelVehicles,
    maintenanceDueVehicles,
    unavailableDrivers,
    fullWarehouses,
    pendingPickup,
    recentlyDelivered,
  ] = await Promise.all([
    db.shipment.findMany({
      where: { status: "delayed" },
      take: 5,
      orderBy: { createdAt: "desc" },
      select: { id: true, trackingNumber: true, originCity: true, destinationCity: true, estimatedDelivery: true },
    }),
    db.vehicle.findMany({
      where: { fuelLevel: { lt: 25 }, status: "active" },
      take: 5,
      select: { id: true, plateNumber: true, model: true, fuelLevel: true },
    }),
    db.vehicle.findMany({
      where: {
        nextMaintenance: { not: null },
        status: "active",
      },
      take: 10,
      select: { id: true, plateNumber: true, model: true, nextMaintenance: true },
    }),
    db.driver.findMany({
      where: { status: { in: ["off_duty", "on_leave"] } },
      take: 5,
      select: { id: true, name: true, status: true },
    }),
    db.warehouse.findMany({
      where: { status: { in: ["full", "maintenance"] } },
      take: 5,
      select: { id: true, name: true, city: true, status: true, used: true, capacity: true },
    }),
    db.shipment.findMany({
      where: { status: "pending", createdAt: { lt: new Date(now - dayMs) } },
      take: 5,
      orderBy: { createdAt: "asc" },
      select: { id: true, trackingNumber: true, createdAt: true, originCity: true, destinationCity: true },
    }),
    db.shipment.findMany({
      where: { status: "delivered", deliveredAt: { not: null } },
      take: 3,
      orderBy: { updatedAt: "desc" },
      select: { id: true, trackingNumber: true, deliveredAt: true, destinationCity: true },
    }),
  ]);

  type Notification = {
    id: string;
    type: "delayed" | "low_fuel" | "maintenance" | "driver" | "warehouse" | "pending" | "delivered";
    severity: "critical" | "warning" | "info" | "success";
    title: string;
    description: string;
    refId?: string;
    view?: "shipments" | "tracking" | "vehicles" | "drivers" | "warehouses";
    timestamp: string;
  };

  const notifications: Notification[] = [];

  delayedShipments.forEach((s) => {
    notifications.push({
      id: `delayed-${s.id}`,
      type: "delayed",
      severity: "critical",
      title: "Đơn hàng trễ hạn",
      description: `${s.trackingNumber} · ${s.originCity} → ${s.destinationCity}`,
      refId: s.id,
      view: "shipments",
      timestamp: s.estimatedDelivery || new Date().toISOString(),
    });
  });

  lowFuelVehicles.forEach((v) => {
    notifications.push({
      id: `fuel-${v.id}`,
      type: "low_fuel",
      severity: "warning",
      title: "Mức nhiên liệu thấp",
      description: `${v.plateNumber} · ${v.model} — còn ${Math.round(v.fuelLevel)}%`,
      refId: v.id,
      view: "vehicles",
      timestamp: new Date().toISOString(),
    });
  });

  maintenanceDueVehicles.forEach((v) => {
    if (!v.nextMaintenance) return;
    const due = new Date(v.nextMaintenance).getTime();
    if (due < now) {
      notifications.push({
        id: `maint-${v.id}`,
        type: "maintenance",
        severity: "warning",
        title: "Bảo trì quá hạn",
        description: `${v.plateNumber} · ${v.model}`,
        refId: v.id,
        view: "vehicles",
        timestamp: v.nextMaintenance,
      });
    } else if (due < now + 7 * dayMs) {
      notifications.push({
        id: `maint-${v.id}`,
        type: "maintenance",
        severity: "info",
        title: "Sắp đến hạn bảo trì",
        description: `${v.plateNumber} · ${v.model}`,
        refId: v.id,
        view: "vehicles",
        timestamp: v.nextMaintenance,
      });
    }
  });

  unavailableDrivers.forEach((d) => {
    notifications.push({
      id: `driver-${d.id}`,
      type: "driver",
      severity: "info",
      title: `Tài xế ${d.status === "off_duty" ? "nghỉ phép" : "tạm nghỉ"}`,
      description: d.name,
      refId: d.id,
      view: "drivers",
      timestamp: new Date().toISOString(),
    });
  });

  fullWarehouses.forEach((w) => {
    const pct = w.capacity > 0 ? Math.round((w.used / w.capacity) * 100) : 0;
    notifications.push({
      id: `wh-${w.id}`,
      type: "warehouse",
      severity: w.status === "full" ? "critical" : "warning",
      title: w.status === "full" ? "Kho đầy công suất" : "Kho đang bảo trì",
      description: `${w.city} · đã sử dụng ${pct}%`,
      refId: w.id,
      view: "warehouses",
      timestamp: new Date().toISOString(),
    });
  });

  pendingPickup.forEach((s) => {
    notifications.push({
      id: `pending-${s.id}`,
      type: "pending",
      severity: "warning",
      title: "Chờ lấy hàng",
      description: `${s.trackingNumber} · chờ từ ${new Date(s.createdAt).toLocaleDateString()}`,
      refId: s.id,
      view: "shipments",
      timestamp: s.createdAt,
    });
  });

  recentlyDelivered.forEach((s) => {
    notifications.push({
      id: `delivered-${s.id}`,
      type: "delivered",
      severity: "success",
      title: "Đơn hàng đã giao",
      description: `${s.trackingNumber} → ${s.destinationCity}`,
      refId: s.id,
      view: "shipments",
      timestamp: s.deliveredAt || new Date().toISOString(),
    });
  });

  // Sort by severity (critical first) then timestamp desc
  const sevOrder = { critical: 0, warning: 1, info: 2, success: 3 };
  notifications.sort((a, b) => {
    const sevDiff = sevOrder[a.severity] - sevOrder[b.severity];
    if (sevDiff !== 0) return sevDiff;
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });

  const counts = {
    critical: notifications.filter((n) => n.severity === "critical").length,
    warning: notifications.filter((n) => n.severity === "warning").length,
    info: notifications.filter((n) => n.severity === "info").length,
    success: notifications.filter((n) => n.severity === "success").length,
    total: notifications.length,
  };

  return NextResponse.json({ notifications, counts });
}
