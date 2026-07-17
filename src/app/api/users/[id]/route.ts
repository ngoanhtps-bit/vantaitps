import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

const USER_SELECT = {
  id: true, username: true, hoTen: true, email: true, sdt: true,
  role: true, active: true, avatarColor: true, lastLogin: true, createdAt: true,
};

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const { hoTen, email, sdt, role, active, avatarColor, password } = body;

  const data: Record<string, unknown> = {};
  if (hoTen !== undefined) data.hoTen = hoTen;
  if (email !== undefined) data.email = email || null;
  if (sdt !== undefined) data.sdt = sdt || null;
  if (role !== undefined) data.role = role;
  if (active !== undefined) data.active = active;
  if (avatarColor !== undefined) data.avatarColor = avatarColor;
  if (password !== undefined && password) data.password = password;

  const updated = await db.user.update({ where: { id }, data, select: USER_SELECT });
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await db.user.delete({ where: { id } }).catch(() => null);
  return NextResponse.json({ ok: true });
}
