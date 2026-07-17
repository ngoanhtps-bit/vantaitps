import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const [
    totalShipments,
    statusCountsRaw,
    driverCount,
    vehicleCount,
    customerCount,
    warehouseCount,
    activeShipments,
    recentShipments,
    topDrivers,
    revenueByStatus,
    cityThroughput,
  ] = await Promise.all([
    db.shipment.count(),
    db.shipment.groupBy({ by: ["status"], _count: true }),
    db.driver.count(),
    db.vehicle.count(),
    db.customer.count(),
    db.warehouse.count(),
    db.shipment.count({
      where: { status: { in: ["in_transit", "out_for_delivery", "picked_up"] } },
    }),
    db.shipment.findMany({
      take: 8,
      orderBy: { createdAt: "desc" },
      include: {
        sender: { select: { name: true, city: true } },
        receiver: { select: { name: true, city: true } },
        driver: { select: { name: true, avatarColor: true } },
      },
    }),
    db.driver.findMany({
      take: 5,
      orderBy: { totalDeliveries: "desc" },
      include: { vehicle: { select: { plateNumber: true, model: true } } },
    }),
    db.shipment.groupBy({
      by: ["status"],
      _sum: { cost: true },
    }),
    db.shipment.groupBy({
      by: ["originCity"],
      _count: true,
      orderBy: { _count: { originCity: "desc" } },
      take: 6,
    }),
  ]);

  const statusCounts: Record<string, number> = {};
  statusCountsRaw.forEach((s) => (statusCounts[s.status] = s._count));

  const totalRevenue = revenueByStatus
    .filter((r) => r.status === "delivered")
    .reduce((sum, r) => sum + (r._sum.cost || 0), 0);
  const pendingRevenue = revenueByStatus
    .filter((r) => ["pending", "picked_up", "in_transit", "out_for_delivery", "delayed"].includes(r.status))
    .reduce((sum, r) => sum + (r._sum.cost || 0), 0);

  // last 14 days shipments volume
  const since = new Date(Date.now() - 14 * 86400000);
  const recentVolumeRaw = await db.shipment.findMany({
    where: { createdAt: { gte: since } },
    select: { createdAt: true, status: true, cost: true },
  });
  const dailyVolume: { date: string; total: number; delivered: number; revenue: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    const key = d.toISOString().slice(0, 10);
    const dayItems = recentVolumeRaw.filter((s) => s.createdAt.toISOString().slice(0, 10) === key);
    dailyVolume.push({
      date: key,
      total: dayItems.length,
      delivered: dayItems.filter((s) => s.status === "delivered").length,
      revenue: dayItems.filter((s) => s.status === "delivered").reduce((sum, s) => sum + (s.cost || 0), 0),
    });
  }

  // live shipments (with positions)
  const liveShipments = await db.shipment.findMany({
    where: { status: { in: ["in_transit", "out_for_delivery"] } },
    select: {
      id: true,
      trackingNumber: true,
      status: true,
      progress: true,
      currentLat: true,
      currentLng: true,
      originCity: true,
      destinationCity: true,
      driver: { select: { name: true } },
      vehicle: { select: { plateNumber: true } },
    },
  });

  // vehicle status breakdown
  const vehicleStatus = await db.vehicle.groupBy({ by: ["status"], _count: true });
  const vehicleTypeBreakdown = await db.vehicle.groupBy({ by: ["type"], _count: true });

  // warehouse capacity
  const warehouses = await db.warehouse.findMany({
    select: { id: true, name: true, city: true, capacity: true, used: true, status: true, lat: true, lng: true },
  });

  return NextResponse.json({
    totals: {
      shipments: totalShipments,
      activeShipments,
      drivers: driverCount,
      vehicles: vehicleCount,
      customers: customerCount,
      warehouses: warehouseCount,
      delivered: statusCounts.delivered || 0,
      delayed: statusCounts.delayed || 0,
      inTransit: (statusCounts.in_transit || 0) + (statusCounts.out_for_delivery || 0),
    },
    statusCounts,
    revenue: { total: totalRevenue, pending: pendingRevenue },
    recentShipments,
    topDrivers,
    dailyVolume,
    liveShipments,
    cityThroughput,
    vehicleStatus,
    vehicleTypeBreakdown,
    warehouses,
  });
}
