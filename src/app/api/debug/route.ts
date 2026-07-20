import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

// Debug: thử tất cả region pooler
export async function GET() {
  const results: string[] = [];
  const pass = "Vantaitps%40123";
  const ref = "sfpmauzfusoarpjhzvgh";

  const urls = [
    // Direct connection - IPv4 forced
    { name: "direct-5432", url: `postgresql://postgres:${pass}@db.${ref}.supabase.co:5432/postgres` },
    // Pooler - ap-southeast-1 (Singapore)
    { name: "pooler-sg-6543", url: `postgresql://postgres.${ref}:${pass}@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true` },
    { name: "pooler-sg-5432", url: `postgresql://postgres.${ref}:${pass}@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres` },
    // Pooler - us-east-1 (N. Virginia)
    { name: "pooler-us-6543", url: `postgresql://postgres.${ref}:${pass}@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true` },
    // Pooler - eu-west-1
    { name: "pooler-eu-6543", url: `postgresql://postgres.${ref}:${pass}@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true` },
    // Pooler - ap-northeast-1 (Tokyo)
    { name: "pooler-tokyo-6543", url: `postgresql://postgres.${ref}:${pass}@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true` },
    // Direct with ?sslmode=require
    { name: "direct-ssl", url: `postgresql://postgres:${pass}@db.${ref}.supabase.co:5432/postgres?sslmode=require` },
  ];

  for (const { name, url } of urls) {
    const masked = url.replace(/:[^@]+@/, ":****@");
    try {
      const prisma = new PrismaClient({ datasources: { db: { url } } });
      const count = await Promise.race([
        prisma.user.count(),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error("timeout 8s")), 8000))
      ]).catch((e) => { throw e; });
      
      results.push(`✅ ${name}: Connected! Users: ${count}`);
      await prisma.$disconnect();
      return NextResponse.json({ success: true, working: name, url_masked: masked, results });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "failed";
      results.push(`❌ ${name}: ${msg.slice(0, 100)}`);
    }
  }

  return NextResponse.json({ 
    success: false, 
    results,
    fix: "Vào Supabase Dashboard > Settings > Database > Connection string > copy chính xác URL họ cung cấp"
  });
}
