import { NextResponse } from "next/server";

// Debug: thử nhiều cách kết nối khác nhau
export async function GET() {
  const dbUrl = process.env.DATABASE_URL || "";
  const results: string[] = [];

  // Cách 1: Thử kết nối với URL hiện tại
  results.push(`Current URL (masked): ${dbUrl.replace(/:[^@]+@/, ":****@")}`);
  results.push(`Length: ${dbUrl.length}`);

  // Thử import PrismaClient mới
  try {
    const { PrismaClient } = await import("@prisma/client");
    const prisma = new PrismaClient({ log: ["error", "warn", "info"] });
    
    try {
      const count = await prisma.user.count();
      results.push(`✅ Prisma connected! Users count: ${count}`);
    } catch (e) {
      results.push(`❌ Prisma error: ${e instanceof Error ? e.message : "unknown"}`);
      
      // Thử query raw đơn giản
      try {
        const result = await prisma.$queryRaw`SELECT 1 as test`;
        results.push(`✅ Raw query works: ${JSON.stringify(result)}`);
      } catch (e2) {
        results.push(`❌ Raw query error: ${e2 instanceof Error ? e2.message : "unknown"}`);
      }
    }
    
    await prisma.$disconnect();
  } catch (e) {
    results.push(`❌ Prisma import error: ${e instanceof Error ? e.message : "unknown"}`);
  }

  return NextResponse.json({
    results,
    suggestion: "Nếu lỗi ENOTFOUND → thử đổi URL thành: postgresql://postgres:Vantaitps%40123@db.sfpmauzfusoarpjhzvgh.supabase.co:5432/postgres (direct connection, KHÔNG có project ref trong username)"
  });
}
