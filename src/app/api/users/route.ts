import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

const USER_SELECT = {
  id: true, username: true, hoTen: true, email: true, sdt: true,
  role: true, active: true, avatarColor: true, lastLogin: true, createdAt: true,
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const role = searchParams.get("role");
  const search = searchParams.get("q")?.trim();

  const where: Record<string, unknown> = {};
  if (role && role !== "all") where.role = role;
  if (search) {
    where.OR = [
      { hoTen: { contains: search } },
      { username: { contains: search } },
      { email: { contains: search } },
      { sdt: { contains: search } },
    ];
  }

  const items = await db.user.findMany({
    where,
    select: USER_SELECT,
    orderBy: [{ role: "asc" }, { hoTen: "asc" }],
  });

  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { username, password, hoTen, email, sdt, role, avatarColor } = body;

  if (!username || !password || !hoTen) {
    return NextResponse.json({ error: "Thiếu tên đăng nhập, mật khẩu hoặc họ tên" }, { status: 400 });
  }

  // Check username unique
  const existing = await db.user.findUnique({ where: { username } });
  if (existing) {
    return NextResponse.json({ error: "Tên đăng nhập đã tồn tại" }, { status: 400 });
  }

  const user = await db.user.create({
    data: {
      username,
      password,
      hoTen,
      email: email || null,
      sdt: sdt || null,
      role: role || "thuky",
      avatarColor: avatarColor || "emerald",
    },
    select: USER_SELECT,
  });

  return NextResponse.json(user, { status: 201 });
}
