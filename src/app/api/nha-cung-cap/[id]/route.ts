import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

const NCC_INCLUDE = {
  _count: { select: { vehicles: true, drivers: true } },
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const ncc = await db.nhaCungCap.findUnique({
    where: { id },
    include: {
      ...NCC_INCLUDE,
      vehicles: {
        select: {
          id: true, plateNumber: true, loaiXe: true, model: true, brand: true, type: true,
          status: true, capacityKg: true,
          driver: { select: { id: true, name: true, phone: true, avatarColor: true, status: true } },
        },
        orderBy: { plateNumber: "asc" },
      },
      drivers: {
        select: {
          id: true, name: true, phone: true, avatarColor: true, status: true, rating: true,
          vehicle: { select: { id: true, plateNumber: true, loaiXe: true } },
        },
        orderBy: { name: "asc" },
      },
    },
  });
  if (!ncc) return NextResponse.json({ error: "Không tìm thấy NCC" }, { status: 404 });
  return NextResponse.json(ncc);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const { tenDonVi, maNCC, sdt, email, diaChi, nguoiLienHe, sdtLienHe, msThue, ghiChu } = body;
  const data: Record<string, unknown> = {};
  if (tenDonVi !== undefined) data.tenDonVi = tenDonVi;
  if (maNCC !== undefined) data.maNCC = maNCC || null;
  if (sdt !== undefined) data.sdt = sdt || null;
  if (email !== undefined) data.email = email || null;
  if (diaChi !== undefined) data.diaChi = diaChi || null;
  if (nguoiLienHe !== undefined) data.nguoiLienHe = nguoiLienHe || null;
  if (sdtLienHe !== undefined) data.sdtLienHe = sdtLienHe || null;
  if (msThue !== undefined) data.msThue = msThue || null;
  if (ghiChu !== undefined) data.ghiChu = ghiChu || null;

  const updated = await db.nhaCungCap.update({ where: { id }, data, include: NCC_INCLUDE });
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await db.nhaCungCap.delete({ where: { id } }).catch(() => null);
  return NextResponse.json({ ok: true });
}
