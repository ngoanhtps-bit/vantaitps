import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const type = searchParams.get("type");
  const search = searchParams.get("q")?.trim();
  const city = searchParams.get("city");

  const where: Record<string, unknown> = {};
  if (status && status !== "all") where.status = status;
  if (type && type !== "all") where.type = type;
  if (city && city !== "all") where.city = city;
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { email: { contains: search } },
      { phone: { contains: search } },
      { company: { contains: search } },
      { address: { contains: search } },
    ];
  }

  const items = await db.customer.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { shipmentsAsSender: true, shipmentsAsReceiver: true },
      },
    },
  });
  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, email, phone, company, address, city, country, zipCode, type, status, notes } = body;
  if (!name || !phone || !address || !city) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }
  const customer = await db.customer.create({
    data: {
      name,
      email,
      phone,
      company,
      address,
      city,
      country: country || "Vietnam",
      zipCode,
      type: type || "business",
      status: status || "active",
      notes,
    },
  });
  return NextResponse.json(customer, { status: 201 });
}
