import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const customer = await db.customer.findUnique({
    where: { id },
    include: {
      shipmentsAsSender: {
        take: 12,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          trackingNumber: true,
          status: true,
          originCity: true,
          destinationCity: true,
          cost: true,
          createdAt: true,
        },
      },
      shipmentsAsReceiver: {
        take: 12,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          trackingNumber: true,
          status: true,
          originCity: true,
          destinationCity: true,
          cost: true,
          createdAt: true,
        },
      },
    },
  });
  if (!customer) return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  return NextResponse.json(customer);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const { name, email, phone, company, address, city, country, zipCode, type, status, notes } = body;
  const data: Record<string, unknown> = {};
  if (name !== undefined) data.name = name;
  if (email !== undefined) data.email = email;
  if (phone !== undefined) data.phone = phone;
  if (company !== undefined) data.company = company;
  if (address !== undefined) data.address = address;
  if (city !== undefined) data.city = city;
  if (country !== undefined) data.country = country;
  if (zipCode !== undefined) data.zipCode = zipCode;
  if (type !== undefined) data.type = type;
  if (status !== undefined) data.status = status;
  if (notes !== undefined) data.notes = notes;

  const updated = await db.customer.update({ where: { id }, data });
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await db.customer.delete({ where: { id } }).catch(() => null);
  return NextResponse.json({ ok: true });
}
