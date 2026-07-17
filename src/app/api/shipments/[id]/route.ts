import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { SHIPMENT_INCLUDE } from "@/app/api/shipments/route";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const shipment = await db.shipment.findUnique({
    where: { id },
    include: {
      ...SHIPMENT_INCLUDE,
      trackingEvents: { orderBy: { timestamp: "desc" } },
    },
  });
  if (!shipment) return NextResponse.json({ error: "Shipment not found" }, { status: 404 });
  return NextResponse.json(shipment);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const { status, driverId, vehicleId, priority, notes, progress, currentLat, currentLng } = body;

  const existing = await db.shipment.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Shipment not found" }, { status: 404 });

  const data: Record<string, unknown> = {};
  if (status !== undefined) data.status = status;
  if (driverId !== undefined) data.driverId = driverId || null;
  if (vehicleId !== undefined) data.vehicleId = vehicleId || null;
  if (priority !== undefined) data.priority = priority;
  if (notes !== undefined) data.notes = notes;
  if (progress !== undefined) data.progress = Number(progress);
  if (currentLat !== undefined) data.currentLat = Number(currentLat);
  if (currentLng !== undefined) data.currentLng = Number(currentLng);

  if (status && status !== existing.status) {
    if (status === "picked_up" && !existing.pickedUpAt) {
      data.pickedUpAt = new Date().toISOString();
    }
    if (status === "delivered" && !existing.deliveredAt) {
      data.deliveredAt = new Date().toISOString();
      data.progress = 100;
    }
  }

  const updated = await db.shipment.update({ where: { id }, data, include: SHIPMENT_INCLUDE });

  // add tracking event on status change
  if (status && status !== existing.status) {
    await db.trackingEvent.create({
      data: {
        shipmentId: id,
        status,
        location: existing.destinationCity,
        note: `Status updated to ${status}`,
        lat: currentLat !== undefined ? Number(currentLat) : existing.currentLat ?? null,
        lng: currentLng !== undefined ? Number(currentLng) : existing.currentLng ?? null,
      },
    });
  }

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await db.shipment.delete({ where: { id } }).catch(() => null);
  return NextResponse.json({ ok: true });
}
