import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// Thống kê xe theo dòng xe (loaiXe) — gộp xe + tài xế vào 1 danh mục
export async function GET() {
  // Lấy tất cả xe kèm tài xế và NCC
  const vehicles = await db.vehicle.findMany({
    include: {
      driver: { select: { id: true, name: true, phone: true, avatarColor: true, status: true, rating: true } },
      nhaCungCap: { select: { id: true, tenDonVi: true, maNCC: true, sdt: true } },
    },
    orderBy: { plateNumber: "asc" },
  });

  // Nhóm theo loaiXe
  const byLoaiXe = new Map<string, typeof vehicles>();
  const ungrouped: typeof vehicles = [];

  for (const v of vehicles) {
    if (v.loaiXe) {
      const arr = byLoaiXe.get(v.loaiXe) || [];
      arr.push(v);
      byLoaiXe.set(v.loaiXe, arr);
    } else {
      ungrouped.push(v);
    }
  }

  // Tạo danh sách nhóm dòng xe
  const groups = Array.from(byLoaiXe.entries())
    .map(([loaiXe, xeList]) => ({
      loaiXe,
      soLuong: xeList.length,
      soTaiXe: xeList.filter((v) => v.driver).length,
      xes: xeList,
    }))
    .sort((a, b) => b.soLuong - a.soLuong);

  // Nhóm "Chưa phân loại"
  if (ungrouped.length > 0) {
    groups.push({
      loaiXe: "Chưa phân loại",
      soLuong: ungrouped.length,
      soTaiXe: ungrouped.filter((v) => v.driver).length,
      xes: ungrouped,
    });
  }

  // Thống kê tổng quan
  const tongXe = vehicles.length;
  const tongTaiXe = vehicles.filter((v) => v.driver).length;
  const tongDongXe = byLoaiXe.size;

  return NextResponse.json({
    tongXe,
    tongTaiXe,
    tongDongXe,
    groups,
  });
}
