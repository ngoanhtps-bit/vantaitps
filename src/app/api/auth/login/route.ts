import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const { username, password } = await req.json();

  if (!username || !password) {
    return NextResponse.json({ error: "Thiếu tên đăng nhập hoặc mật khẩu" }, { status: 400 });
  }

  const user = await db.user.findUnique({
    where: { username },
  });

  if (!user || user.password !== password) {
    return NextResponse.json({ error: "Tên đăng nhập hoặc mật khẩu không đúng" }, { status: 401 });
  }

  if (!user.active) {
    return NextResponse.json({ error: "Tài khoản đã bị khóa" }, { status: 403 });
  }

  // Update lastLogin
  await db.user.update({
    where: { id: user.id },
    data: { lastLogin: new Date().toISOString() },
  });

  return NextResponse.json({
    id: user.id,
    username: user.username,
    hoTen: user.hoTen,
    email: user.email,
    sdt: user.sdt,
    role: user.role,
    avatarColor: user.avatarColor,
  });
}
