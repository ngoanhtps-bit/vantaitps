import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Dùng Tokyo pooler connection
const DB_URL = "postgresql://postgres.sfpmauzfusoarpjhzvgh:Vantaitps%40123@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { rows } = body as { rows: string[][] };

  if (!rows || rows.length < 2) {
    return NextResponse.json({ error: "File không có dữ liệu" }, { status: 400 });
  }

  const headers = rows[0].map((h) => h.toLowerCase().trim());
  const dataRows = rows.slice(1);
  const results = { success: 0, errors: 0, errorDetails: [] as string[] };

  // Tạo PrismaClient với Tokyo pooler
  const db = new PrismaClient({ datasources: { db: { url: DB_URL } } });

  try {
    // Lấy hoặc tạo customer mặc định
    let defaultCustomer = await db.customer.findFirst().catch(() => null);
    if (!defaultCustomer) {
      defaultCustomer = await db.customer.create({
        data: { name: "Khách hàng mặc định", phone: "000", address: "N/A", city: "Hà Nội", type: "business", status: "active" },
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

        // Headers theo file cũ: ID,SALE,Mat hang,Diem dong,Diem tra,Ngay di,Gio di,Ten LX,BKS,Mooc,Cont,SDT LX,Loai xe,Trang thai,BB,Dieu phoi,NCC xe,Ghi chu 1,Ghi chu 2,Ghi chu 3
        const diemDong = get(["diem dong", "diem_dong", "pickup"]);
        const diemTra = get(["diem tra", "diem_tra", "delivery"]);
        const plateNumber = get(["bks", "bien so", "bien_so", "plate", "truck"]);
        const driverName = get(["ten lx", "ten tai xe", "tai xe", "driver"]);
        const driverPhone = get(["sdt lx", "sdt tai xe", "sdt", "phone"]);
        const mooc = get(["mooc", "so mooc", "trailer"]);
        const cont = get(["cont", "so cont", "container"]);
        const loaiXe = get(["loai xe", "loai_xe", "vehicle_type"]);
        const trangThai = get(["trang thai", "trang_thai", "status"]).toLowerCase();
        const bb = get(["bb"]);
        const salePerson = get(["sale", "shipper"]);
        const matHang = get(["mat hang", "mat_hang", "cargo"]);
        const ngayDi = get(["ngay di", "ngay_di", "date"]);
        const gioDi = get(["gio di", "gio_di", "departure_time"]);
        const dispatcher = get(["dieu phoi", "dieu_phoi", "dispatch"]);
        const ghiChu1 = get(["ghi chu 1", "ghi_chu_1", "note_1", "note 1"]);
        const ghiChu2 = get(["ghi chu 2", "ghi_chu_2", "note_2", "note 2"]);
        const ghiChu3 = get(["ghi chu 3", "ghi_chu_3", "note_3", "note 3"]);
        const customId = get(["id", "trackingnumber", "tracking number"]);

        if (!diemDong && !diemTra && !plateNumber) {
          results.errors++;
          results.errorDetails.push(`Dòng ${i + 2}: Thiếu điểm đóng, điểm trả và biển số`);
          continue;
        }

        // Parse status
        let status = "pending";
        if (trangThai.includes("giao")) status = "delivered";
        else if (trangThai.includes("chuyen")) status = "in_transit";
        else if (trangThai.includes("giao hang")) status = "out_for_delivery";
        else if (trangThai.includes("cho")) status = "pending";
        else if (trangThai.includes("tre")) status = "delayed";
        else if (trangThai.includes("huy")) status = "cancelled";
        else if (trangThai.includes("lay")) status = "picked_up";

        // Tìm/tạo tài xế
        let driverId: string | null = null;
        if (driverPhone) {
          let driver = await db.driver.findFirst({ where: { phone: driverPhone } }).catch(() => null);
          if (!driver && driverName) {
            driver = await db.driver.create({
              data: { name: driverName, phone: driverPhone, licenseNumber: "IMP-" + Date.now().toString().slice(-6), status: "available", avatarColor: "emerald" },
            }).catch(() => null);
          }
          driverId = driver?.id || null;
        } else if (driverName) {
          let driver = await db.driver.findFirst({ where: { name: { contains: driverName } } }).catch(() => null);
          if (!driver) {
            driver = await db.driver.create({
              data: { name: driverName, phone: "000", licenseNumber: "IMP-" + Date.now().toString().slice(-6), status: "available", avatarColor: "emerald" },
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
              data: { plateNumber, model: "Container", brand: "Container", type: "container", loaiXe: loaiXe || "CONT 40 HC", capacityKg: 30000, fuelType: "diesel", status: "active" },
            }).catch(() => null);
          } else if (loaiXe && !vehicle.loaiXe) {
            await db.vehicle.update({ where: { id: vehicle.id }, data: { loaiXe } }).catch(() => null);
          }
          vehicleId = vehicle?.id || null;
        }

        // Sinh tracking number TPS
        const today = new Date();
        const dateStr = today.getFullYear().toString() + (today.getMonth() + 1).toString().padStart(2, "0") + today.getDate().toString().padStart(2, "0");
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
        const todayCount = await db.shipment.count({ where: { createdAt: { gte: startOfDay, lt: endOfDay } } }).catch(() => 0);
        const tn = customId || `TPS${dateStr}${(todayCount + 1).toString().padStart(3, "0")}`;

        // Tạo shipment
        await db.shipment.create({
          data: {
            trackingNumber: tn,
            status,
            priority: "standard",
            serviceType: "freight",
            senderId: defaultCustomer?.id || "default",
            receiverId: defaultCustomer?.id || "default",
            originAddress: diemDong || "N/A",
            originCity: diemDong || "N/A",
            destinationAddress: diemTra || "N/A",
            destinationCity: diemTra || "N/A",
            distanceKm: 0,
            weightKg: 0,
            pieces: 1,
            driverId,
            vehicleId,
            cost: 0,
            insurance: 0,
            trailerNumber: mooc || null,
            containerNumber: cont || null,
            salePerson: salePerson || null,
            dispatcher: dispatcher || null,
            tripDate: ngayDi || null,
            customerCode: null,
            matHang: matHang || null,
            ngayDi: ngayDi || null,
            gioDi: gioDi || null,
            daGuiBienBan: bb === "x" || bb === "X" || bb === "1" || bb.toLowerCase() === "true",
            ghiChu1: ghiChu1 || null,
            ghiChu2: ghiChu2 || null,
            ghiChu3: ghiChu3 || null,
            progress: status === "delivered" ? 100 : status === "in_transit" ? 50 : 0,
          },
        });

        results.success++;
      } catch (e) {
        results.errors++;
        results.errorDetails.push(`Dòng ${i + 2}: ${e instanceof Error ? e.message.slice(0, 100) : "Lỗi"}`);
      }
    }

    await db.$disconnect();
    return NextResponse.json(results);
  } catch (e) {
    await db.$disconnect();
    return NextResponse.json({
      success: 0,
      errors: 1,
      errorDetails: [`Lỗi tổng: ${e instanceof Error ? e.message : "unknown"}`],
    }, { status: 500 });
  }
}
