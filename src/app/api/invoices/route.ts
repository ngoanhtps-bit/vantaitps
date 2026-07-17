import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

const INVOICE_INCLUDE = {
  customer: { select: { id: true, name: true, email: true, phone: true, address: true, city: true, company: true } },
  _count: { select: { invoices: true } },
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const search = searchParams.get("q")?.trim();

  const where: Record<string, unknown> = {};
  if (status && status !== "all") where.status = status;
  if (search) {
    where.OR = [
      { invoiceNumber: { contains: search } },
      { customer: { name: { contains: search } } },
      { customer: { company: { contains: search } } },
    ];
  }

  const items = await db.invoice.findMany({
    where,
    include: {
      customer: { select: { id: true, name: true, email: true, phone: true, address: true, city: true, company: true } },
    },
    orderBy: { issueDate: "desc" },
  });

  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { customerId, periodStart, periodEnd, dueDate, taxRate, notes } = body;

  if (!customerId || !periodStart || !periodEnd) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Find all delivered shipments for this customer in the period
  const shipments = await db.shipment.findMany({
    where: {
      senderId: customerId,
      status: "delivered",
      deliveredAt: { not: null },
    },
    select: {
      id: true,
      trackingNumber: true,
      cost: true,
      insurance: true,
      weightKg: true,
      pieces: true,
      destinationCity: true,
      deliveredAt: true,
    },
  });

  // Filter by period (deliveredAt within periodStart..periodEnd)
  const start = new Date(periodStart).getTime();
  const end = new Date(periodEnd).getTime();
  const inPeriod = shipments.filter((s) => {
    if (!s.deliveredAt) return false;
    const t = new Date(s.deliveredAt).getTime();
    return t >= start && t <= end;
  });

  if (inPeriod.length === 0) {
    return NextResponse.json({ error: "No delivered shipments found in the selected period" }, { status: 400 });
  }

  const subtotal = inPeriod.reduce((sum, s) => sum + (s.cost || 0) + (s.insurance || 0), 0);
  const rate = Number(taxRate) || 0.1;
  const taxAmount = Math.round(subtotal * rate * 100) / 100;
  const total = Math.round((subtotal + taxAmount) * 100) / 100;

  const invoiceNumber = "INV-" + Date.now().toString().slice(-8) + Math.floor(Math.random() * 100).toString().padStart(2, "0");

  const invoice = await db.invoice.create({
    data: {
      invoiceNumber,
      customerId,
      status: "draft",
      dueDate: dueDate || new Date(Date.now() + 30 * 86400000).toISOString(),
      periodStart,
      periodEnd,
      subtotal: Math.round(subtotal * 100) / 100,
      taxRate: rate,
      taxAmount,
      total,
      currency: "USD",
      notes: notes || null,
    },
    include: {
      customer: { select: { id: true, name: true, email: true, phone: true, address: true, city: true, company: true } },
    },
  });

  return NextResponse.json({ ...invoice, lineItems: inPeriod }, { status: 201 });
}
