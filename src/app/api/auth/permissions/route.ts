import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { USER_ROLES, ROLE_PERMISSIONS } from "@/lib/constants";

// GET /api/auth/permissions?role=admin
// Trả về quyền động cho 1 role từ DB
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const role = searchParams.get("role") as string;

  if (!role || !USER_ROLES.includes(role as typeof USER_ROLES[number])) {
    return NextResponse.json({ error: "Role không hợp lệ" }, { status: 400 });
  }

  // Admin luôn có toàn quyền
  if (role === "admin") {
    const allViews = ROLE_PERMISSIONS.admin;
    const result: Record<string, { canView: boolean; canCreate: boolean; canEdit: boolean; canDelete: boolean }> = {};
    for (const v of allViews) {
      result[v] = { canView: true, canCreate: true, canEdit: true, canDelete: true };
    }
    return NextResponse.json({ role, permissions: result });
  }

  // Lấy quyền động từ DB
  const perms = await db.rolePermission.findMany({
    where: { role },
  });

  const result: Record<string, { canView: boolean; canCreate: boolean; canEdit: boolean; canDelete: boolean }> = {};
  for (const p of perms) {
    result[p.view] = {
      canView: p.canView,
      canCreate: p.canCreate,
      canEdit: p.canEdit,
      canDelete: p.canDelete,
    };
  }

  return NextResponse.json({ role, permissions: result });
}
