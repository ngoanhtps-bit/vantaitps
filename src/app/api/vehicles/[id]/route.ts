import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

const VEHICLE_INCLUDE = {
  driver: { select: { id: true, name: true, avatarColor: true, status: true } },
  _count: { select: { shipments: true } },
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const vehicle = await db.vehicle.findUnique({
    where: { id },
    include: {
      ...VEHICLE_INCLUDE,
      shipments: {
        take: 10,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          trackingNumber: true,
          status: true,
          originCity: true,
          destinationCity: true,
          createdAt: true,
        },
      },
    },
  });
  if (!vehicle) return NextResponse.json({ error: "Vehicle not found" }, { status: 404 });
  return NextResponse.json(vehicle);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const { status, fuelLevel, mileage, nextMaintenance, lastMaintenance } = body;
  const data: Record<string, unknown> = {};
  if (status !== undefined) data.status = status;
  if (fuelLevel !== undefined) data.fuelLevel = Number(fuelLevel);
  if (mileage !== undefined) data.mileage = Number(mileage);
  if (nextMaintenance !== undefined) data.nextMaintenance = nextMaintenance;
  if (lastMaintenance !== undefined) data.lastMaintenance = lastMaintenance;

  const updated = await db.vehicle.update({ where: { id }, data, include: VEHICLE_INCLUDE });
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await db.vehicle.delete({ where: { id } }).catch(() => null);
  return NextResponse.json({ ok: true });
}
