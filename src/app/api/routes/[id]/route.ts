import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

const ROUTE_INCLUDE = {
  driver: { select: { id: true, name: true, avatarColor: true, status: true, phone: true } },
  vehicle: { select: { id: true, plateNumber: true, model: true, type: true } },
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const route = await db.route.findUnique({
    where: { id },
    include: ROUTE_INCLUDE,
  });
  if (!route) return NextResponse.json({ error: "Route not found" }, { status: 404 });
  return NextResponse.json(route);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const { status, startedAt, endedAt } = body;
  const data: Record<string, unknown> = {};
  if (status !== undefined) data.status = status;
  if (startedAt !== undefined) data.startedAt = startedAt;
  if (endedAt !== undefined) data.endedAt = endedAt;

  const updated = await db.route.update({ where: { id }, data, include: ROUTE_INCLUDE });
  return NextResponse.json(updated);
}
