import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

const NCC_INCLUDE = {
  _count: { select: { vehicles: true, drivers: true } },
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("q")?.trim();

  const where: Record<string, unknown> = {};
  if (search) {
    where.OR = [
      { tenDonVi: { contains: search } },
      { maNCC: { contains: search } },
      { sdt: { contains: search } },
      { nguoiLienHe: { contains: search } },
    ];
  }

  const items = await db.nhaCungCap.findMany({
    where,
    include: {
      ...NCC_INCLUDE,
      vehicles: {
        select: {
          id: true, plateNumber: true, loaiXe: true, model: true, type: true, status: true,
          driver: { select: { id: true, name: true, phone: true, avatarColor: true, status: true } },
        },
        orderBy: { plateNumber: "asc" },
      },
      drivers: {
        select: {
          id: true, name: true, phone: true, avatarColor: true, status: true,
          vehicle: { select: { id: true, plateNumber: true, loaiXe: true } },
        },
        orderBy: { name: "asc" },
      },
    },
    orderBy: { tenDonVi: "asc" },
  });

  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { tenDonVi, maNCC, sdt, email, diaChi, nguoiLienHe, sdtLienHe, msThue, ghiChu } = body;

  if (!tenDonVi) {
    return NextResponse.json({ error: "Thiếu tên đơn vị" }, { status: 400 });
  }

  const ncc = await db.nhaCungCap.create({
    data: {
      tenDonVi,
      maNCC: maNCC || null,
      sdt: sdt || null,
      email: email || null,
      diaChi: diaChi || null,
      nguoiLienHe: nguoiLienHe || null,
      sdtLienHe: sdtLienHe || null,
      msThue: msThue || null,
      ghiChu: ghiChu || null,
    },
    include: NCC_INCLUDE,
  });

  return NextResponse.json(ncc, { status: 201 });
}
