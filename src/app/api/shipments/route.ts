import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

const SHIPMENT_INCLUDE = {
  sender: { select: { id: true, name: true, city: true, phone: true } },
  receiver: { select: { id: true, name: true, city: true, phone: true } },
  driver: { select: { id: true, name: true, avatarColor: true, status: true } },
  vehicle: { select: { id: true, plateNumber: true, model: true, type: true } },
  originWarehouse: { select: { id: true, name: true, city: true } },
  destinationWarehouse: { select: { id: true, name: true, city: true } },
  trackingEvents: { orderBy: { timestamp: "desc" as const }, take: 20 },
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const priority = searchParams.get("priority");
  const service = searchParams.get("service");
  const city = searchParams.get("city");
  const search = searchParams.get("q")?.trim();
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") || "20", 10)));

  const where: Record<string, unknown> = {};
  if (status && status !== "all") where.status = status;
  if (priority && priority !== "all") where.priority = priority;
  if (service && service !== "all") where.serviceType = service;
  if (city && city !== "all") {
    where.OR = [{ originCity: city }, { destinationCity: city }];
  }
  if (search) {
    where.OR = [
      { trackingNumber: { contains: search } },
      { description: { contains: search } },
      { originCity: { contains: search } },
      { destinationCity: { contains: search } },
      { sender: { name: { contains: search } } },
      { receiver: { name: { contains: search } } },
    ];
  }

  const [total, items] = await Promise.all([
    db.shipment.count({ where }),
    db.shipment.findMany({
      where,
      include: SHIPMENT_INCLUDE,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return NextResponse.json({
    items,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    trackingNumber,
    senderId,
    receiverId,
    originAddress,
    originCity,
    destinationAddress,
    destinationCity,
    distanceKm,
    weightKg,
    volumeM3,
    pieces,
    description,
    priority,
    serviceType,
    driverId,
    vehicleId,
    originWarehouseId,
    destinationWarehouseId,
    estimatedDelivery,
    cost,
    insurance,
    notes,
    trailerNumber,
    containerNumber,
    salePerson,
    dispatcher,
    tripDate,
    customerCode,
  } = body;

  if (!senderId || !receiverId || !originAddress || !destinationAddress) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const tn =
    trackingNumber ||
    "LG" + Date.now().toString().slice(-8) + Math.floor(Math.random() * 1000).toString().padStart(3, "0");

  const shipment = await db.shipment.create({
    data: {
      trackingNumber: tn,
      status: "pending",
      priority: priority || "standard",
      serviceType: serviceType || "standard",
      senderId,
      receiverId,
      originWarehouseId: originWarehouseId || null,
      destinationWarehouseId: destinationWarehouseId || null,
      originAddress,
      originCity,
      destinationAddress,
      destinationCity,
      distanceKm: Number(distanceKm) || 0,
      weightKg: Number(weightKg) || 0,
      volumeM3: Number(volumeM3) || 0,
      pieces: Number(pieces) || 1,
      description: description || null,
      driverId: driverId || null,
      vehicleId: vehicleId || null,
      cost: Number(cost) || 0,
      insurance: Number(insurance) || 0,
      estimatedDelivery: estimatedDelivery || null,
      notes: notes || null,
      trailerNumber: trailerNumber || null,
      containerNumber: containerNumber || null,
      salePerson: salePerson || null,
      dispatcher: dispatcher || null,
      tripDate: tripDate || null,
      customerCode: customerCode || null,
    },
    include: SHIPMENT_INCLUDE,
  });

  // create initial tracking event
  await db.trackingEvent.create({
    data: {
      shipmentId: shipment.id,
      status: "pending",
      location: originCity,
      note: `Order created — ${tn}`,
    },
  });

  return NextResponse.json(shipment, { status: 201 });
}

export { SHIPMENT_INCLUDE };
