import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// Returns all shipments currently in motion (in_transit / out_for_delivery)
// plus warehouse locations to render on the map.
export async function GET() {
  const live = await db.shipment.findMany({
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
      originAddress: true,
      destinationAddress: true,
      priority: true,
      serviceType: true,
      estimatedDelivery: true,
      driver: { select: { id: true, name: true, avatarColor: true, phone: true } },
      vehicle: { select: { id: true, plateNumber: true, model: true, type: true } },
      sender: { select: { name: true } },
      receiver: { select: { name: true } },
    },
  });

  const warehouses = await db.warehouse.findMany({
    select: {
      id: true,
      name: true,
      code: true,
      city: true,
      lat: true,
      lng: true,
      status: true,
      used: true,
      capacity: true,
    },
  });

  const delayed = await db.shipment.findMany({
    where: { status: "delayed" },
    take: 20,
    select: {
      id: true,
      trackingNumber: true,
      originCity: true,
      destinationCity: true,
      estimatedDelivery: true,
    },
  });

  return NextResponse.json({ live, warehouses, delayed, count: live.length });
}
