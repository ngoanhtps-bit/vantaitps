import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

const VEHICLE_INCLUDE = {
  driver: { select: { id: true, name: true, avatarColor: true, status: true } },
  _count: { select: { shipments: true } },
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const type = searchParams.get("type");
  const search = searchParams.get("q")?.trim();

  const where: Record<string, unknown> = {};
  if (status && status !== "all") where.status = status;
  if (type && type !== "all") where.type = type;
  if (search) {
    where.OR = [
      { plateNumber: { contains: search } },
      { model: { contains: search } },
      { brand: { contains: search } },
    ];
  }

  const items = await db.vehicle.findMany({
    where,
    include: VEHICLE_INCLUDE,
    orderBy: { mileage: "desc" },
  });
  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { plateNumber, model, brand, type, capacityKg, fuelType, color, loaiXe, nhaCungCapId } = body;
  if (!plateNumber || !model || !brand) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }
  const vehicle = await db.vehicle.create({
    data: {
      plateNumber,
      model,
      brand,
      type: type || "truck",
      loaiXe: loaiXe || null,
      nhaCungCapId: nhaCungCapId || null,
      capacityKg: Number(capacityKg) || 0,
      fuelType: fuelType || "diesel",
      color: color || "slate",
      status: "active",
    },
    include: VEHICLE_INCLUDE,
  });
  return NextResponse.json(vehicle, { status: 201 });
}
