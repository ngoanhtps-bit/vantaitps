// Reports API v2 — generates aggregated logistics reports for export
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const range = searchParams.get("range") || "30d";

  const now = new Date();
  let since: Date;
  switch (range) {
    case "7d": since = new Date(now.getTime() - 7 * 86400000); break;
    case "30d": since = new Date(now.getTime() - 30 * 86400000); break;
    case "90d": since = new Date(now.getTime() - 90 * 86400000); break;
    case "ytd": since = new Date(now.getFullYear(), 0, 1); break;
    default: since = new Date(now.getTime() - 30 * 86400000);
  }

  const [
    totalShipments,
    shipmentsInPeriod,
    statusBreakdown,
    topCustomers,
    topDrivers,
    topRoutes,
    revenueByService,
    dailyVolumeRaw,
    deliveredShipments,
  ] = await Promise.all([
    db.shipment.count(),
    db.shipment.findMany({
      where: { createdAt: { gte: since } },
      select: {
        id: true, trackingNumber: true, status: true, priority: true, serviceType: true,
        cost: true, insurance: true, weightKg: true, distanceKm: true, pieces: true,
        createdAt: true, deliveredAt: true, pickedUpAt: true,
        originCity: true, destinationCity: true,
        sender: { select: { id: true, name: true, company: true } },
        driver: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    db.shipment.groupBy({ by: ["status"], where: { createdAt: { gte: since } }, _count: true }),
    db.shipment.groupBy({ by: ["senderId"], where: { createdAt: { gte: since } }, _count: true, orderBy: { _count: { senderId: "desc" } }, take: 10 }),
    db.shipment.groupBy({ by: ["driverId"], where: { createdAt: { gte: since }, driverId: { not: null } }, _count: true, orderBy: { _count: { driverId: "desc" } }, take: 10 }),
    db.shipment.groupBy({ by: ["originCity", "destinationCity"], where: { createdAt: { gte: since } }, _count: true, orderBy: { _count: { originCity: "desc" } }, take: 10 }),
    db.shipment.groupBy({ by: ["serviceType"], where: { createdAt: { gte: since } }, _count: true, _sum: { cost: true } }),
    db.shipment.findMany({ where: { createdAt: { gte: since } }, select: { createdAt: true, status: true, cost: true } }),
    db.shipment.findMany({ where: { createdAt: { gte: since }, status: "delivered", deliveredAt: { not: null }, pickedUpAt: { not: null } }, select: { pickedUpAt: true, deliveredAt: true } }),
  ]);

  // Invoice stats (separate try-catch to handle any Prisma client issues)
  let invoiceStats: { status: string; _count: number; _sum: { total: number | null } }[] = [];
  try {
    if (db.invoice) {
      invoiceStats = await db.invoice.groupBy({ by: ["status"], _count: true, _sum: { total: true } });
    }
  } catch {
    invoiceStats = [];
  }

  // Fetch customer names
  const customerIds = topCustomers.map((c) => c.senderId);
  const customers = await db.customer.findMany({ where: { id: { in: customerIds } }, select: { id: true, name: true, company: true, city: true } });
  const customerMap = new Map(customers.map((c) => [c.id, c]));
  const topCustomersWithName = topCustomers.map((tc) => ({ ...tc, customer: customerMap.get(tc.senderId) }));

  // Fetch driver names
  const driverIds = topDrivers.map((d) => d.driverId).filter(Boolean) as string[];
  const drivers = await db.driver.findMany({ where: { id: { in: driverIds } }, select: { id: true, name: true, avatarColor: true, rating: true, totalDeliveries: true } });
  const driverMap = new Map(drivers.map((d) => [d.id, d]));
  const topDriversWithName = topDrivers.map((td) => ({ ...td, driver: td.driverId ? driverMap.get(td.driverId) : null }));

  // Daily volume
  const days = Math.ceil((now.getTime() - since.getTime()) / 86400000);
  const dailyMap = new Map<string, { date: string; total: number; delivered: number; revenue: number }>();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86400000);
    const key = d.toISOString().slice(0, 10);
    dailyMap.set(key, { date: key, total: 0, delivered: 0, revenue: 0 });
  }
  dailyVolumeRaw.forEach((s) => {
    const key = s.createdAt.toISOString().slice(0, 10);
    const entry = dailyMap.get(key);
    if (entry) {
      entry.total++;
      if (s.status === "delivered") { entry.delivered++; entry.revenue += s.cost || 0; }
    }
  });

  // Avg delivery time
  const deliveryTimes = deliveredShipments
    .filter((s) => s.pickedUpAt && s.deliveredAt)
    .map((s) => (new Date(s.deliveredAt!).getTime() - new Date(s.pickedUpAt!).getTime()) / 3600000)
    .filter((h) => h >= 0 && h < 720);
  const avgHours = deliveryTimes.length > 0 ? deliveryTimes.reduce((a, b) => a + b, 0) / deliveryTimes.length : 0;

  const totalRevenue = shipmentsInPeriod.filter((s) => s.status === "delivered").reduce((sum, s) => sum + (s.cost || 0), 0);
  const pendingRevenue = shipmentsInPeriod.filter((s) => ["pending", "picked_up", "in_transit", "out_for_delivery", "delayed"].includes(s.status)).reduce((sum, s) => sum + (s.cost || 0), 0);
  const invoiceRevenue = invoiceStats.filter((i) => i.status === "paid").reduce((sum, i) => sum + (i._sum.total || 0), 0);
  const outstandingInvoices = invoiceStats.filter((i) => ["sent", "overdue"].includes(i.status)).reduce((sum, i) => sum + (i._sum.total || 0), 0);

  return NextResponse.json({
    range,
    since: since.toISOString(),
    until: now.toISOString(),
    summary: {
      totalShipments,
      shipmentsInPeriod: shipmentsInPeriod.length,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      pendingRevenue: Math.round(pendingRevenue * 100) / 100,
      avgDeliveryHours: Math.round(avgHours * 10) / 10,
      invoiceRevenue: Math.round(invoiceRevenue * 100) / 100,
      outstandingInvoices: Math.round(outstandingInvoices * 100) / 100,
    },
    statusBreakdown: statusBreakdown.map((s) => ({ status: s.status, count: s._count })),
    topCustomers: topCustomersWithName,
    topDrivers: topDriversWithName,
    topRoutes: topRoutes.map((r) => ({ originCity: r.originCity, destinationCity: r.destinationCity, count: r._count })),
    revenueByService: revenueByService.map((s) => ({ serviceType: s.serviceType, count: s._count, revenue: s._sum.cost || 0 })),
    dailyVolume: Array.from(dailyMap.values()),
    shipments: shipmentsInPeriod.slice(0, 100),
  });
}
