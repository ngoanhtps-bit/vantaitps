import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { rows } = body as { rows: string[][] };

  if (!rows || rows.length < 2) {
    return NextResponse.json({ error: "File không có dữ liệu" }, { status: 400 });
  }

  const headers = rows[0].map((h) => h.toLowerCase().trim());
  const dataRows = rows.slice(1);
  const results = { success: 0, errors: 0, errorDetails: [] as string[] };

  // Lấy hoặc tạo customer mặc định
  let defaultCustomer = await db.customer.findFirst().catch(() => null);
  if (!defaultCustomer) {
    defaultCustomer = await db.customer.create({
      data: { name: "Khách hàng mặc định", phone: "", address: "", city: "Hà Nội", type: "business", status: "active" },
    }).catch(() => null);
  }

  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i];
    try {
      const get = (names: string[]) => {
        for (const n of names) {
          const idx = headers.indexOf(n);
          if (idx >= 0 && row[idx]) return row[idx];
        }
        return "";
      };

      const route = get(["lo trinh", "lo_trinh", "route"]);
      const plateNumber = get(["bien so", "bien_so", "plate"]);
      const driverName = get(["ten tai xe", "tai xe", "driver"]);

      if (!route && !plateNumber) {
        results.errors++;
        results.errorDetails.push(`Dòng ${i + 2}: Thiếu lộ trình và biển số`);
        continue;
      }

      // Parse route
      const routeParts = route.split(/\s*[-–—]\s*/).map((s) => s.trim());
      const originCity = routeParts[0] || route || "N/A";
      const destinationCity = routeParts[1] || "N/A";

      // Tìm/tạo tài xế
      let driverId: string | null = null;
      const driverPhone = get(["sdt tai xe", "sdt", "phone"]);
      if (driverPhone) {
        let driver = await db.driver.findFirst({ where: { phone: driverPhone } }).catch(() => null);
        if (!driver && driverName) {
          driver = await db.driver.create({
            data: { name: driverName, phone: driverPhone, licenseNumber: "IMPORT-" + Date.now().toString().slice(-6), status: "on_delivery", avatarColor: "emerald" },
          }).catch(() => null);
        }
        driverId = driver?.id || null;
      }

      // Tìm/tạo xe
      let vehicleId: string | null = null;
      if (plateNumber) {
        let vehicle = await db.vehicle.findUnique({ where: { plateNumber } }).catch(() => null);
        if (!vehicle) {
          vehicle = await db.vehicle.create({
            data: { plateNumber, model: "Container", brand: "Container", type: "container", loaiXe: "CONT 40 HC", capacityKg: 30000, fuelType: "diesel", status: "active" },
          }).catch(() => null);
        }
        vehicleId = vehicle?.id || null;
      }

      // Tìm/tạo khách hàng
      const customerCode = get(["ma kh", "ma_kh", "kh", "customer code"]);
      const customerName = get(["ten kh", "ten_kh", "customer name"]);
      let customerId = defaultCustomer?.id || "";
      if (customerCode || customerName) {
        let customer = await db.customer.findFirst({
          where: { OR: [{ company: { contains: customerCode } }, { name: { contains: customerName || customerCode } }] },
        }).catch(() => null);
        if (!customer) {
          customer = await db.customer.create({
            data: { name: customerName || customerCode || "Khách hàng", company: customerCode || null, phone: "", address: "", city: originCity, type: "business", status: "active" },
          }).catch(() => null);
        }
        customerId = customer?.id || customerId;
      }

      const tn = "LG" + Date.now().toString().slice(-8) + Math.floor(Math.random() * 1000).toString().padStart(3, "0");

      await db.shipment.create({
        data: {
          trackingNumber: tn,
          status: "in_transit",
          priority: "high",
          serviceType: "freight",
          senderId: customerId,
          receiverId: customerId,
          originAddress: originCity,
          originCity,
          destinationAddress: destinationCity,
          destinationCity,
          distanceKm: 0,
          weightKg: 0,
          pieces: 1,
          driverId,
          vehicleId,
          cost: 0,
          insurance: 0,
          // Vietnam trucking
          trailerNumber: get(["so mooc", "mooc", "trailer"]) || null,
          containerNumber: get(["so cont", "cont", "container"]) || null,
          salePerson: get(["sale"]) || null,
          dispatcher: get(["dp", "dieu phoi", "dispatcher"]) || null,
          tripDate: get(["ngay di", "ngay_di", "date"]) || null,
          customerCode: customerCode || null,
          // New fields
          matHang: get(["mat hang", "mat_hang"]) || null,
          ngayDi: get(["ngay di", "ngay_di", "date"]) || null,
          gioDi: get(["gio di", "gio_di", "time"]) || null,
          daGuiBienBan: false,
          ghiChu1: get(["ghi chu 1", "ghi_chu_1"]) || null,
          ghiChu2: get(["ghi chu 2", "ghi_chu_2"]) || null,
          ghiChu3: get(["ghi chu 3", "ghi_chu_3"]) || null,
          progress: 10,
        },
      });

      // Tạo tracking events
      await db.trackingEvent.create({
        data: { shipmentId: tn, status: "in_transit", location: originCity, note: `Import: ${route}` },
      }).catch(() => null);

      results.success++;
    } catch (e) {
      results.errors++;
      results.errorDetails.push(`Dòng ${i + 2}: ${e instanceof Error ? e.message : "Lỗi"}`);
    }
  }

  return NextResponse.json(results);
}
