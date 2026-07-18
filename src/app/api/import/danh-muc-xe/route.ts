import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// Parse CSV đơn giản (hỗ trợ dấu phẩy, không hỗ斯特 quote phức tạp)
function parseCSV(text: string): string[][] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  return lines.map((line) => line.split(",").map((c) => c.trim()));
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { rows } = body as { rows: string[][] };

  if (!rows || rows.length < 2) {
    return NextResponse.json({ error: "File không có dữ liệu" }, { status: 400 });
  }

  const headers = rows[0].map((h) => h.toLowerCase().trim());
  const dataRows = rows.slice(1);

  const results = { success: 0, errors: 0, errorDetails: [] as string[] };

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

      const plateNumber = get(["bien so", "bien_so", "plate", "biển số"]);
      if (!plateNumber) {
        results.errors++;
        results.errorDetails.push(`Dòng ${i + 2}: Thiếu biển số`);
        continue;
      }

      // Check trùng
      const existing = await db.vehicle.findUnique({ where: { plateNumber } }).catch(() => null);
      if (existing) {
        results.errors++;
        results.errorDetails.push(`Dòng ${i + 2}: Biển số ${plateNumber} đã tồn tại`);
        continue;
      }

      // Tìm NCC theo mã
      const nccMa = get(["ma ncc", "ncc", "ma_ncc"]);
      let nhaCungCapId: string | null = null;
      if (nccMa) {
        const ncc = await db.nhaCungCap.findFirst({ where: { OR: [{ maNCC: nccMa }, { tenDonVi: { contains: nccMa } }] } }).catch(() => null);
        nhaCungCapId = ncc?.id || null;
      }

      // Tìm/tạo tài xế theo SĐT
      let driverId: string | null = null;
      const driverName = get(["ten tai xe", "tai xe", "ten_taixe", "driver"]);
      const driverPhone = get(["sdt tai xe", "sdt", "sdt_taixe", "phone"]);
      if (driverPhone) {
        let driver = await db.driver.findFirst({ where: { phone: driverPhone } }).catch(() => null);
        if (!driver && driverName) {
          driver = await db.driver.create({
            data: {
              name: driverName,
              phone: driverPhone,
              licenseNumber: "IMPORT-" + Date.now().toString().slice(-6),
              status: "available",
              avatarColor: "emerald",
            },
          }).catch(() => null);
        }
        driverId = driver?.id || null;
      }

      const loaiXe = get(["loai xe", "loai_xe", "type"]);
      const trangThai = get(["trang thai", "trang_thai", "status"]).toLowerCase();

      await db.vehicle.create({
        data: {
          plateNumber,
          loaiXe: loaiXe || null,
          model: get(["mau xe", "mau_xe", "model"]) || "Container",
          brand: get(["hang xe", "hang_xe", "brand"]) || "Container",
          type: "container",
          nhaCungCapId,
          capacityKg: Number(get(["tai trong (kg)", "tai_trong", "capacitykg", "capacity"])) || 0,
          fuelType: get(["nhien lieu", "nhien_lieu", "fuel"]) || "diesel",
          status: trangThai.includes("bao") ? "maintenance" : trangThai.includes("ngung") ? "retired" : "active",
        },
      });

      // Link driver to vehicle
      if (driverId) {
        await db.driver.update({ where: { id: driverId }, data: { vehicleId: null } }).catch(() => null);
      }

      results.success++;
    } catch (e) {
      results.errors++;
      results.errorDetails.push(`Dòng ${i + 2}: ${e instanceof Error ? e.message : "Lỗi không xác định"}`);
    }
  }

  return NextResponse.json(results);
}
