import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// Dùng Prisma ORM thay vì raw SQL (hoạt động tốt hơn với pgbouncer)
export async function GET() {
  const results: { tables: string[]; users: number; error: string | null } = {
    tables: [],
    users: 0,
    error: null,
  };

  try {
    // Thử tạo user bằng Prisma ORM (không dùng raw SQL)
    const existingUsers = await db.user.count().catch((e) => {
      results.error = `count users: ${e.message}`;
      return -1;
    });

    if (existingUsers === -1) {
      // Nếu không count được → tables chưa tồn tại
      // Thử tạo user trực tiếp (Prisma sẽ tự báo lỗi chi tiết)
      const testUser = await db.user.create({
        data: {
          id: "test-" + Date.now(),
          username: "test_" + Date.now(),
          password: "test",
          hoTen: "Test User",
          role: "thuky",
        },
      }).catch((e) => {
        results.error = `create user: ${e.message}`;
        return null;
      });

      if (testUser) {
        results.tables.push("User (table auto-created by Prisma)");
        // Xóa test user
        await db.user.delete({ where: { id: testUser.id } }).catch(() => {});
      } else {
        return NextResponse.json({
          success: false,
          error: results.error,
          fix: "DATABASE_URL cần dùng pooler port 5432 (session mode), KHÔNG dùng port 6543 (transaction mode). Đổi thành: postgresql://postgres.sfpmauzfusoarpjhzvgh:Vantaitps%40123@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"
        }, { status: 500 });
      }
    }

    // Seed 5 users nếu chưa có
    if (existingUsers === 0) {
      const users = [
        { id: "u1", username: "admin", password: "123456", hoTen: "Quản trị viên", email: "admin@logistics.vn", sdt: "0901112233", role: "admin", avatarColor: "rose" },
        { id: "u2", username: "dieuxe", password: "123456", hoTen: "Nguyễn Điều Xe", email: "dieuxe@logistics.vn", sdt: "0902223344", role: "dieuxe", avatarColor: "emerald" },
        { id: "u3", username: "dieuphoi", password: "123456", hoTen: "Trần Điều Phối", email: "dieuphoi@logistics.vn", sdt: "0903334455", role: "dieuphoi", avatarColor: "sky" },
        { id: "u4", username: "ketoan", password: "123456", hoTen: "Lê Kế Toán", email: "ketoan@logistics.vn", sdt: "0904445566", role: "ketoan", avatarColor: "violet" },
        { id: "u5", username: "thuky", password: "123456", hoTen: "Phạm Thư Ký", email: "thuky@logistics.vn", sdt: "0905556677", role: "thuky", avatarColor: "amber" },
      ];
      
      for (const u of users) {
        await db.user.create({ data: u }).catch((e) => {
          results.error = `seed ${u.username}: ${e.message}`;
        });
      }
      results.users = 5;
    } else {
      results.users = existingUsers;
    }

    return NextResponse.json({
      success: true,
      message: existingUsers > 0 ? "Users đã tồn tại" : "Đã tạo 5 user thành công!",
      usersCount: results.users,
      error: results.error,
    });
  } catch (e) {
    return NextResponse.json({
      success: false,
      error: e instanceof Error ? e.message : "Unknown error",
      fix: "Đổi DATABASE_URL sang: postgresql://postgres.sfpmauzfusoarpjhzvgh:Vantaitps%40123@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"
    }, { status: 500 });
  }
}
