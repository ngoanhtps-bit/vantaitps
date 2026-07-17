import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

const DRIVER_INCLUDE = {
  vehicle: { select: { id: true, plateNumber: true, model: true, type: true } },
  _count: { select: { shipments: true } },
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const driver = await db.driver.findUnique({
    where: { id },
    include: {
      ...DRIVER_INCLUDE,
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
          cost: true,
        },
      },
    },
  });
  if (!driver) return NextResponse.json({ error: "Driver not found" }, { status: 404 });
  return NextResponse.json(driver);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const { name, email, phone, licenseNumber, licenseExpiry, status, vehicleId, avatarColor } = body;
  const data: Record<string, unknown> = {};
  if (name !== undefined) data.name = name;
  if (email !== undefined) data.email = email;
  if (phone !== undefined) data.phone = phone;
  if (licenseNumber !== undefined) data.licenseNumber = licenseNumber;
  if (licenseExpiry !== undefined) data.licenseExpiry = licenseExpiry;
  if (status !== undefined) data.status = status;
  if (vehicleId !== undefined) data.vehicleId = vehicleId || null;
  if (avatarColor !== undefined) data.avatarColor = avatarColor;

  const updated = await db.driver.update({ where: { id }, data, include: DRIVER_INCLUDE });
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await db.driver.delete({ where: { id } }).catch(() => null);
  return NextResponse.json({ ok: true });
}
