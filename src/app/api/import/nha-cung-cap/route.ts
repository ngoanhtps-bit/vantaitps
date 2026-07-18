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

      const tenDonVi = get(["ten don vi", "ten_don_vi", "name"]);
      if (!tenDonVi) {
        results.errors++;
        results.errorDetails.push(`Dòng ${i + 2}: Thiếu tên đơn vị`);
        continue;
      }

      const maNCC = get(["ma ncc", "ma_ncc", "code"]);
      // Check trùng mã
      if (maNCC) {
        const existing = await db.nhaCungCap.findUnique({ where: { maNCC } }).catch(() => null);
        if (existing) {
          results.errors++;
          results.errorDetails.push(`Dòng ${i + 2}: Mã NCC ${maNCC} đã tồn tại`);
          continue;
        }
      }

      await db.nhaCungCap.create({
        data: {
          tenDonVi,
          maNCC: maNCC || null,
          sdt: get(["sdt", "phone", "dien thoai"]) || null,
          email: get(["email"]) || null,
          diaChi: get(["dia chi", "dia_chi", "address"]) || null,
          nguoiLienHe: get(["nguoi lien he", "nguoi_lien_he", "contact"]) || null,
          sdtLienHe: get(["sdt lien he", "sdt_lien_he", "contact phone"]) || null,
          msThue: get(["ma so thue", "ma_so_thue", "tax"]) || null,
          ghiChu: get(["ghi chu", "ghi_chu", "notes"]) || null,
        },
      });

      results.success++;
    } catch (e) {
      results.errors++;
      results.errorDetails.push(`Dòng ${i + 2}: ${e instanceof Error ? e.message : "Lỗi"}`);
    }
  }

  return NextResponse.json(results);
}
