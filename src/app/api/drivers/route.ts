import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

const DRIVER_INCLUDE = {
  vehicle: { select: { id: true, plateNumber: true, model: true, type: true } },
  _count: { select: { shipments: true } },
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
      { email: { contains: search } },
      { phone: { contains: search } },
      { licenseNumber: { contains: search } },
    ];
  }

  const items = await db.driver.findMany({
    where,
    include: DRIVER_INCLUDE,
    orderBy: [{ totalDeliveries: "desc" }, { name: "asc" }],
  });
  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, email, phone, licenseNumber, licenseExpiry, hireDate, vehicleId, avatarColor } = body;
  if (!name || !phone || !licenseNumber) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }
  const driver = await db.driver.create({
    data: {
      name,
      email,
      phone,
      licenseNumber,
      licenseExpiry,
      hireDate,
      vehicleId: vehicleId || null,
      avatarColor: avatarColor || "emerald",
      status: "available",
    },
    include: DRIVER_INCLUDE,
  });
  return NextResponse.json(driver, { status: 201 });
}
