import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

const ROUTE_INCLUDE = {
  driver: { select: { id: true, name: true, avatarColor: true, status: true, phone: true } },
  vehicle: { select: { id: true, plateNumber: true, model: true, type: true } },
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const search = searchParams.get("q")?.trim();

  const where: Record<string, unknown> = {};
  if (status && status !== "all") where.status = status;
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { driver: { name: { contains: search } } },
      { vehicle: { plateNumber: { contains: search } } },
    ];
  }

  const items = await db.route.findMany({
    where,
    include: ROUTE_INCLUDE,
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });

  // For each route, fetch assigned shipments count by status
  const routesWithStats = await Promise.all(
    items.map(async (r) => {
      const shipments = await db.shipment.findMany({
        where: { driverId: r.driverId ?? undefined, status: { in: ["in_transit", "out_for_delivery", "picked_up"] } },
        take: 20,
        select: {
          id: true,
          trackingNumber: true,
          status: true,
          priority: true,
          originCity: true,
          destinationCity: true,
          originAddress: true,
          destinationAddress: true,
          progress: true,
          weightKg: true,
          pieces: true,
          receiver: { select: { name: true, phone: true, address: true, city: true } },
          sender: { select: { name: true, city: true } },
          estimatedDelivery: true,
        },
      });
      return {
        ...r,
        stops: shipments,
        stopsCount: shipments.length,
        totalWeight: shipments.reduce((sum, s) => sum + s.weightKg, 0),
        totalPieces: shipments.reduce((sum, s) => sum + s.pieces, 0),
      };
    })
  );

  return NextResponse.json({ items: routesWithStats });
}
