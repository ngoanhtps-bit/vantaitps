import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const city = searchParams.get("city");

  const where: Record<string, unknown> = {};
  if (status && status !== "all") where.status = status;
  if (city && city !== "all") where.city = city;

  const items = await db.warehouse.findMany({
    where,
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: { shipmentsOrigin: true, shipmentsDestination: true },
      },
    },
  });
  return NextResponse.json({ items });
}
