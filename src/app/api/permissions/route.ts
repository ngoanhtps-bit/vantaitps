import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { USER_ROLES } from "@/lib/constants";

// Danh sách tất cả views cần phân quyền
export const ALL_VIEWS = [
  { key: "dashboard", label: "Tổng quan", icon: "LayoutDashboard" },
  { key: "shipments", label: "Đơn hàng", icon: "Package" },
  { key: "tracking", label: "Theo dõi trực tuyến", icon: "MapPin" },
  { key: "danh-muc-xe", label: "Danh mục xe", icon: "Truck" },
  { key: "nha-cung-cap", label: "NCC xe", icon: "Building2" },
  { key: "customers", label: "Khách hàng", icon: "Users" },
  { key: "warehouses", label: "Kho hàng", icon: "Warehouse" },
  { key: "routes", label: "Lập kế hoạch tuyến", icon: "Route" },
  { key: "invoices", label: "Hóa đơn", icon: "Receipt" },
  { key: "reports", label: "Báo cáo", icon: "FileBarChart" },
  { key: "analytics", label: "Phân tích", icon: "BarChart3" },
  { key: "users", label: "Người dùng", icon: "UserCog" },
] as const;

// Quyền mặc định theo mô tả của user
const DEFAULT_PERMISSIONS: Record<string, Record<string, { canView: boolean; canCreate: boolean; canEdit: boolean; canDelete: boolean }>> = {
  admin: {
    dashboard: { canView: true, canCreate: true, canEdit: true, canDelete: true },
    shipments: { canView: true, canCreate: true, canEdit: true, canDelete: true },
    tracking: { canView: true, canCreate: true, canEdit: true, canDelete: true },
    "danh-muc-xe": { canView: true, canCreate: true, canEdit: true, canDelete: true },
    "nha-cung-cap": { canView: true, canCreate: true, canEdit: true, canDelete: true },
    customers: { canView: true, canCreate: true, canEdit: true, canDelete: true },
    warehouses: { canView: true, canCreate: true, canEdit: true, canDelete: true },
    routes: { canView: true, canCreate: true, canEdit: true, canDelete: true },
    invoices: { canView: true, canCreate: true, canEdit: true, canDelete: true },
    reports: { canView: true, canCreate: true, canEdit: true, canDelete: true },
    analytics: { canView: true, canCreate: true, canEdit: true, canDelete: true },
    users: { canView: true, canCreate: true, canEdit: true, canDelete: true },
  },
  // ĐIỀU XE: quản lý NCC, dòng xe, tạo/sửa/xóa chuyến
  dieuxe: {
    dashboard: { canView: true, canCreate: false, canEdit: false, canDelete: false },
    shipments: { canView: true, canCreate: true, canEdit: true, canDelete: true },
    tracking: { canView: true, canCreate: false, canEdit: true, canDelete: false },
    "danh-muc-xe": { canView: true, canCreate: true, canEdit: true, canDelete: true },
    "nha-cung-cap": { canView: true, canCreate: true, canEdit: true, canDelete: true },
    customers: { canView: true, canCreate: true, canEdit: true, canDelete: false },
    warehouses: { canView: false, canCreate: false, canEdit: false, canDelete: false },
    routes: { canView: true, canCreate: true, canEdit: true, canDelete: false },
    invoices: { canView: false, canCreate: false, canEdit: false, canDelete: false },
    reports: { canView: false, canCreate: false, canEdit: false, canDelete: false },
    analytics: { canView: false, canCreate: false, canEdit: false, canDelete: false },
    users: { canView: false, canCreate: false, canEdit: false, canDelete: false },
  },
  // ĐIỀU PHỐI: tạo chuyến, theo dõi tình trạng xe, đóng/trả hàng
  dieuphoi: {
    dashboard: { canView: true, canCreate: false, canEdit: false, canDelete: false },
    shipments: { canView: true, canCreate: true, canEdit: true, canDelete: false },
    tracking: { canView: true, canCreate: false, canEdit: true, canDelete: false },
    "danh-muc-xe": { canView: true, canCreate: false, canEdit: false, canDelete: false },
    "nha-cung-cap": { canView: false, canCreate: false, canEdit: false, canDelete: false },
    customers: { canView: false, canCreate: false, canEdit: false, canDelete: false },
    warehouses: { canView: false, canCreate: false, canEdit: false, canDelete: false },
    routes: { canView: true, canCreate: false, canEdit: true, canDelete: false },
    invoices: { canView: false, canCreate: false, canEdit: false, canDelete: false },
    reports: { canView: false, canCreate: false, canEdit: false, canDelete: false },
    analytics: { canView: false, canCreate: false, canEdit: false, canDelete: false },
    users: { canView: false, canCreate: false, canEdit: false, canDelete: false },
  },
  // KẾ TOÁN: hóa đơn, báo cáo
  ketoan: {
    dashboard: { canView: true, canCreate: false, canEdit: false, canDelete: false },
    shipments: { canView: true, canCreate: false, canEdit: false, canDelete: false },
    tracking: { canView: false, canCreate: false, canEdit: false, canDelete: false },
    "danh-muc-xe": { canView: false, canCreate: false, canEdit: false, canDelete: false },
    "nha-cung-cap": { canView: false, canCreate: false, canEdit: false, canDelete: false },
    customers: { canView: true, canCreate: false, canEdit: false, canDelete: false },
    warehouses: { canView: false, canCreate: false, canEdit: false, canDelete: false },
    routes: { canView: false, canCreate: false, canEdit: false, canDelete: false },
    invoices: { canView: true, canCreate: true, canEdit: true, canDelete: true },
    reports: { canView: true, canCreate: true, canEdit: false, canDelete: false },
    analytics: { canView: true, canCreate: false, canEdit: false, canDelete: false },
    users: { canView: false, canCreate: false, canEdit: false, canDelete: false },
  },
  // THƯ KÝ: xem danh sách
  thuky: {
    dashboard: { canView: true, canCreate: false, canEdit: false, canDelete: false },
    shipments: { canView: true, canCreate: false, canEdit: false, canDelete: false },
    tracking: { canView: true, canCreate: false, canEdit: false, canDelete: false },
    "danh-muc-xe": { canView: true, canCreate: false, canEdit: false, canDelete: false },
    "nha-cung-cap": { canView: true, canCreate: false, canEdit: false, canDelete: false },
    customers: { canView: true, canCreate: false, canEdit: false, canDelete: false },
    warehouses: { canView: false, canCreate: false, canEdit: false, canDelete: false },
    routes: { canView: false, canCreate: false, canEdit: false, canDelete: false },
    invoices: { canView: false, canCreate: false, canEdit: false, canDelete: false },
    reports: { canView: false, canCreate: false, canEdit: false, canDelete: false },
    analytics: { canView: false, canCreate: false, canEdit: false, canDelete: false },
    users: { canView: false, canCreate: false, canEdit: false, canDelete: false },
  },
};

// GET: trả về ma trận quyền [role][view] = { canView, canCreate, canEdit, canDelete }
export async function GET() {
  // Lấy tất cả quyền từ DB
  const existing = await db.rolePermission.findMany();
  const existingMap = new Map(existing.map((p) => [`${p.role}:${p.view}`, p]));

  // Đảm bảo mọi role × view đều có record (tạo nếu thiếu)
  const matrix: Record<string, Record<string, { canView: boolean; canCreate: boolean; canEdit: boolean; canDelete: boolean }>> = {};

  for (const role of USER_ROLES) {
    matrix[role] = {};
    for (const view of ALL_VIEWS) {
      const key = `${role}:${view.key}`;
      const dbPerm = existingMap.get(key);
      const defaultPerm = DEFAULT_PERMISSIONS[role]?.[view.key] || { canView: false, canCreate: false, canEdit: false, canDelete: false };

      if (dbPerm) {
        matrix[role][view.key] = {
          canView: dbPerm.canView,
          canCreate: dbPerm.canCreate,
          canEdit: dbPerm.canEdit,
          canDelete: dbPerm.canDelete,
        };
      } else {
        matrix[role][view.key] = defaultPerm;
        // Tạo record trong DB nếu thiếu
        await db.rolePermission.create({
          data: { role, view: view.key, ...defaultPerm },
        }).catch(() => null);
      }
    }
  }

  return NextResponse.json({ matrix, views: ALL_VIEWS, roles: USER_ROLES });
}

// PUT: cập nhật quyền cho 1 role × view
export async function PUT(req: NextRequest) {
  const body = await req.json();
  const { role, view, canView, canCreate, canEdit, canDelete } = body;

  if (!role || !view) {
    return NextResponse.json({ error: "Thiếu role hoặc view" }, { status: 400 });
  }

  // Admin luôn có toàn quyền — không cho phép sửa
  if (role === "admin") {
    return NextResponse.json({ error: "Không thể sửa quyền của Admin" }, { status: 403 });
  }

  const updated = await db.rolePermission.upsert({
    where: { role_view: { role, view } },
    update: {
      canView: canView ?? false,
      canCreate: canCreate ?? false,
      canEdit: canEdit ?? false,
      canDelete: canDelete ?? false,
    },
    create: {
      role,
      view,
      canView: canView ?? false,
      canCreate: canCreate ?? false,
      canEdit: canEdit ?? false,
      canDelete: canDelete ?? false,
    },
  });

  return NextResponse.json(updated);
}

// POST: reset quyền về mặc định
export async function POST() {
  await db.rolePermission.deleteMany();

  for (const role of USER_ROLES) {
    for (const view of ALL_VIEWS) {
      const perm = DEFAULT_PERMISSIONS[role]?.[view.key] || { canView: false, canCreate: false, canEdit: false, canDelete: false };
      await db.rolePermission.create({
        data: { role, view: view.key, ...perm },
      }).catch(() => null);
    }
  }

  return NextResponse.json({ ok: true, message: "Đã reset quyền về mặc định" });
}

export { DEFAULT_PERMISSIONS };
