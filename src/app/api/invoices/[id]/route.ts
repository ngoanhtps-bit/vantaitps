import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const invoice = await db.invoice.findUnique({
    where: { id },
    include: {
      customer: { select: { id: true, name: true, email: true, phone: true, address: true, city: true, country: true, zipCode: true, company: true } },
    },
  });
  if (!invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });

  // Fetch delivered shipments for this customer in the invoice period as line items
  const start = new Date(invoice.periodStart).getTime();
  const end = new Date(invoice.periodEnd).getTime();
  const shipments = await db.shipment.findMany({
    where: {
      senderId: invoice.customerId,
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
      destinationAddress: true,
      deliveredAt: true,
      receiver: { select: { name: true, city: true } },
    },
    orderBy: { deliveredAt: "asc" },
  });

  const lineItems = shipments.filter((s) => {
    if (!s.deliveredAt) return false;
    const t = new Date(s.deliveredAt).getTime();
    return t >= start && t <= end;
  });

  return NextResponse.json({ ...invoice, lineItems });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const { status, paidAt, notes, dueDate, taxRate } = body;
  const data: Record<string, unknown> = {};
  if (status !== undefined) data.status = status;
  if (paidAt !== undefined) data.paidAt = paidAt;
  if (notes !== undefined) data.notes = notes;
  if (dueDate !== undefined) data.dueDate = dueDate;
  if (taxRate !== undefined) {
    const invoice = await db.invoice.findUnique({ where: { id } });
    if (invoice) {
      const rate = Number(taxRate);
      const taxAmount = Math.round(invoice.subtotal * rate * 100) / 100;
      data.taxRate = rate;
      data.taxAmount = taxAmount;
      data.total = Math.round((invoice.subtotal + taxAmount) * 100) / 100;
    }
  }

  if (status === "paid" && !paidAt) {
    data.paidAt = new Date().toISOString();
  }

  const updated = await db.invoice.update({
    where: { id },
    data,
    include: {
      customer: { select: { id: true, name: true, email: true, phone: true, address: true, city: true, company: true } },
    },
  });
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await db.invoice.delete({ where: { id } }).catch(() => null);
  return NextResponse.json({ ok: true });
}
