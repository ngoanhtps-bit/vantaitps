import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

// Debug: thử 4 cách kết nối với Prisma
export async function GET() {
  const results: string[] = [];

  const urls = [
    { name: "direct-5432", url: "postgresql://postgres:Vantaitps%40123@db.sfpmauzfusoarpjhzvgh.supabase.co:5432/postgres" },
    { name: "pooler-5432", url: "postgresql://postgres.sfpmauzfusoarpjhzvgh:Vantaitps%40123@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres" },
    { name: "pooler-6543-pgbouncer", url: "postgresql://postgres.sfpmauzfusoarpjhzvgh:Vantaitps%40123@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true" },
    { name: "pooler-6543-noparam", url: "postgresql://postgres.sfpmauzfusoarpjhzvgh:Vantaitps%40123@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres" },
  ];

  for (const { name, url } of urls) {
    const masked = url.replace(/:[^@]+@/, ":****@");
    try {
      const prisma = new PrismaClient({ datasources: { db: { url } } });
      const count = await prisma.user.count().catch(async (e) => {
        // Nếu bảng chưa tồn tại → thử tạo
        if (String(e.message).includes("does not exist") || String(e.message).includes("relation")) {
          await prisma.user.create({ data: { id: "test1", username: "test1_" + Date.now(), password: "x", hoTen: "Test", role: "thuky" } }).then(async (u) => {
            await prisma.user.delete({ where: { id: u.id } });
            results.push(`✅ ${name}: ${masked} → Table auto-created!`);
          }).catch((e2) => {
            results.push(`❌ ${name}: ${masked} → create: ${e2 instanceof Error ? e2.message.slice(0, 120) : "failed"}`);
          });
        } else {
          results.push(`❌ ${name}: ${masked} → ${e instanceof Error ? e.message.slice(0, 120) : "failed"}`);
        }
      });
      if (typeof count === "number") {
        results.push(`✅ ${name}: ${masked} → Connected! Users: ${count}`);
        await prisma.$disconnect();
        return NextResponse.json({ success: true, working: name, url_masked: masked, results });
      }
      await prisma.$disconnect();
    } catch (e) {
      results.push(`❌ ${name}: ${masked} → ${e instanceof Error ? e.message.slice(0, 120) : "failed"}`);
    }
  }

  return NextResponse.json({ success: false, results });
}
