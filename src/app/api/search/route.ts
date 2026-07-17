import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() ?? "";
  if (q.length < 1) {
    return NextResponse.json({ shipments: [], drivers: [], vehicles: [], customers: [] });
  }

  const [shipments, drivers, vehicles, customers] = await Promise.all([
    db.shipment.findMany({
      where: {
        OR: [
          { trackingNumber: { contains: q } },
          { description: { contains: q } },
          { originCity: { contains: q } },
          { destinationCity: { contains: q } },
        ],
      },
      take: 5,
      select: {
        id: true,
        trackingNumber: true,
        status: true,
        sender: { select: { name: true } },
      },
    }),
    db.driver.findMany({
      where: {
        OR: [
          { name: { contains: q } },
          { phone: { contains: q } },
          { licenseNumber: { contains: q } },
        ],
      },
      take: 4,
      select: { id: true, name: true, status: true },
    }),
    db.vehicle.findMany({
      where: {
        OR: [
          { plateNumber: { contains: q } },
          { model: { contains: q } },
          { brand: { contains: q } },
        ],
      },
      take: 4,
      select: { id: true, plateNumber: true, model: true },
    }),
    db.customer.findMany({
      where: {
        OR: [
          { name: { contains: q } },
          { phone: { contains: q } },
          { company: { contains: q } },
          { email: { contains: q } },
        ],
      },
      take: 4,
      select: { id: true, name: true, city: true },
    }),
  ]);

  return NextResponse.json({ shipments, drivers, vehicles, customers });
}
