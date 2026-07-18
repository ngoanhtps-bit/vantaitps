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
  const { status, driverId, vehicleId, priority, notes, progress, currentLat, currentLng,
    matHang, ngayDi, gioDi, daGuiBienBan, ghiChu1, ghiChu2, ghiChu3,
    salePerson, dispatcher, trailerNumber, containerNumber, customerCode, tripDate,
  } = body;

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
  // New fields
  if (matHang !== undefined) data.matHang = matHang || null;
  if (ngayDi !== undefined) data.ngayDi = ngayDi || null;
  if (gioDi !== undefined) data.gioDi = gioDi || null;
  if (daGuiBienBan !== undefined) data.daGuiBienBan = daGuiBienBan;
  if (ghiChu1 !== undefined) data.ghiChu1 = ghiChu1 || null;
  if (ghiChu2 !== undefined) data.ghiChu2 = ghiChu2 || null;
  if (ghiChu3 !== undefined) data.ghiChu3 = ghiChu3 || null;
  if (salePerson !== undefined) data.salePerson = salePerson || null;
  if (dispatcher !== undefined) data.dispatcher = dispatcher || null;
  if (trailerNumber !== undefined) data.trailerNumber = trailerNumber || null;
  if (containerNumber !== undefined) data.containerNumber = containerNumber || null;
  if (customerCode !== undefined) data.customerCode = customerCode || null;
  if (tripDate !== undefined) data.tripDate = tripDate || null;

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
