import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { SHIPMENT_INCLUDE } from "@/app/api/shipments/route";

// Quick trip creation — Vietnam container trucking format
// Accepts: route, tripDate, plateNumber, trailerNumber, containerNumber,
//          driverName, driverPhone, customerCode, salePerson, dispatcher
// Auto-creates/links driver (by phone), vehicle (by plate), customer (by code)
export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    route,           // "BẮC NINH - HCM"
    tripDate,        // "17/07/2026"
    plateNumber,     // "51C 47495"
    trailerNumber,   // "50RM 15513"
    containerNumber, // "TCLU 1071990"
    driverName,      // "LÊ VĂN BÌNH"
    driverPhone,     // "0942043414"
    customerCode,    // "GTVD"
    customerName,    // optional full name
    salePerson,      // "HIỀN"
    dispatcher,      // "ÁNH"
    notes,
    matHang,         // Mặt hàng: PALET, ĐIỆN TỬ...
    ngayDi,          // Ngày đi (dd/mm/yyyy)
    gioDi,           // Giờ đi (HH:mm)
    loaiXe,          // Dòng xe: CONT 40 RF, MOOC RÀO...
    nhaCungCapId,    // ID nhà cung cấp xe
    status,          // Trạng thái chuyến
  } = body;

  if (!route || !plateNumber || !driverName) {
    return NextResponse.json(
      { error: "Thiếu thông tin bắt buộc: lộ trình, biển số, tên tài xế" },
      { status: 400 }
    );
  }

  // Parse route "BẮC NINH - HCM" → originCity, destinationCity
  const routeParts = route.split(/\s*[-–—]\s*/).map((s: string) => s.trim());
  const originCity = routeParts[0] || route;
  const destinationCity = routeParts[1] || route;

  // Find or create driver by phone
  let driver = null;
  if (driverPhone) {
    driver = await db.driver.findFirst({ where: { phone: driverPhone } });
    if (!driver) {
      driver = await db.driver.create({
        data: {
          name: driverName,
          phone: driverPhone,
          licenseNumber: "AUTO-" + Date.now().toString().slice(-6),
          status: "on_delivery",
          avatarColor: "emerald",
        },
      });
    } else {
      // Update name if changed
      if (driver.name !== driverName) {
        driver = await db.driver.update({
          where: { id: driver.id },
          data: { name: driverName, status: "on_delivery" },
        });
      }
    }
  }

  // Find or create vehicle by plate number
  let vehicle = null;
  if (plateNumber) {
    vehicle = await db.vehicle.findUnique({ where: { plateNumber } });
    if (!vehicle) {
      vehicle = await db.vehicle.create({
        data: {
          plateNumber,
          model: "Container",
          brand: "Container",
          type: "container",
          loaiXe: loaiXe || (containerNumber ? "CONT 40 HC" : null),
          nhaCungCapId: nhaCungCapId || null,
          capacityKg: 30000,
          fuelType: "diesel",
          status: "active",
        },
      });
    }
  }

  // Link driver to vehicle if both exist
  if (driver && vehicle) {
    await db.driver.update({
      where: { id: driver.id },
      data: { vehicleId: vehicle.id },
    }).catch(() => null);
  }

  // Find or create customer by code (customerCode stored in company field or name)
  let customer = null;
  const searchName = customerName || customerCode || "Khách hàng";
  if (customerCode) {
    // Try to find by company code first, then by name
    customer = await db.customer.findFirst({
      where: {
        OR: [
          { company: { contains: customerCode } },
          { name: { contains: customerCode } },
          { name: searchName },
        ],
      },
    });
    if (!customer) {
      customer = await db.customer.create({
        data: {
          name: searchName,
          company: customerCode,
          phone: "",
          address: "",
          city: originCity,
          type: "business",
          status: "active",
        },
      });
    }
  }

  // If no customer, create a default one
  if (!customer) {
    customer = await db.customer.create({
      data: {
        name: "Khách hàng mặc định",
        phone: "",
        address: "",
        city: originCity,
        type: "business",
        status: "active",
      },
    });
  }

  // Sinh mã TPS: TPS(NGÀY ĐÓNG)(STT CHUYẾN TRONG NGÀY)
  // VD: TPS20260718001
  const today = new Date();
  const dateStr = today.getFullYear().toString() +
    (today.getMonth() + 1).toString().padStart(2, "0") +
    today.getDate().toString().padStart(2, "0");

  // Đếm số đơn hàng đã tạo hôm nay để sinh STT
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
  const todayCount = await db.shipment.count({
    where: { createdAt: { gte: startOfDay, lt: endOfDay } },
  });
  const tn = `TPS${dateStr}${(todayCount + 1).toString().padStart(3, "0")}`;

  // Parse trip date (dd/mm/yyyy → ISO)
  let tripDateIso: string | null = null;
  if (tripDate) {
    const parts = tripDate.split(/[\/\-]/);
    if (parts.length === 3) {
      const [dd, mm, yyyy] = parts;
      tripDateIso = new Date(`${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`).toISOString();
    } else {
      tripDateIso = new Date(tripDate).toISOString();
    }
  }

  // Create the shipment
  const shipment = await db.shipment.create({
    data: {
      trackingNumber: tn,
      status: status || "in_transit",
      priority: "high",
      serviceType: "freight",
      senderId: customer.id,
      receiverId: customer.id, // same customer for quick trip
      originAddress: originCity,
      originCity,
      destinationAddress: destinationCity,
      destinationCity,
      distanceKm: 0,
      weightKg: 0,
      pieces: 1,
      description: `Container ${containerNumber || ""} · Mooc ${trailerNumber || ""}`.trim(),
      driverId: driver?.id || null,
      vehicleId: vehicle?.id || null,
      cost: 0,
      insurance: 0,
      estimatedDelivery: null,
      notes: notes || null,
      // Vietnam trucking fields
      trailerNumber: trailerNumber || null,
      containerNumber: containerNumber || null,
      salePerson: salePerson || null,
      dispatcher: dispatcher || null,
      tripDate: tripDateIso,
      customerCode: customerCode || null,
      matHang: matHang || null,
      ngayDi: ngayDi || tripDate || null,
      gioDi: gioDi || null,
      progress: 10,
      pickedUpAt: tripDateIso,
    },
    include: SHIPMENT_INCLUDE,
  });

  // Create initial tracking events
  const finalStatus = status || "in_transit";
  await db.trackingEvent.create({
    data: {
      shipmentId: shipment.id,
      status: "pending",
      location: originCity,
      note: `Tạo chuyến nhanh — ${tn}`,
    },
  });
  if (finalStatus !== "pending") {
    await db.trackingEvent.create({
      data: {
        shipmentId: shipment.id,
        status: "picked_up",
        location: originCity,
        note: `Lấy hàng tại ${originCity}${containerNumber ? ` · Cont ${containerNumber}` : ""}`,
        timestamp: new Date(),
      },
    });
  }
  if (finalStatus === "in_transit" || finalStatus === "out_for_delivery" || finalStatus === "delivered") {
    await db.trackingEvent.create({
      data: {
        shipmentId: shipment.id,
        status: "in_transit",
        location: originCity,
        note: `Khởi hành ${originCity} → ${destinationCity}${tripDate ? ` · ${tripDate}` : ""}`,
        timestamp: new Date(),
      },
    });
  }

  return NextResponse.json(shipment, { status: 201 });
}
