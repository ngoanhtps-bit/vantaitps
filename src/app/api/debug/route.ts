import { NextResponse } from "next/server";

// Debug: thử tất cả cách kết nối
export async function GET() {
  const dbUrl = process.env.DATABASE_URL || "";
  const results: string[] = [];

  results.push(`Current URL (masked): ${dbUrl.replace(/:[^@]+@/, ":****@")}`);

  // Thử kết nối trực tiếp bằng pg (node-postgres)
  try {
    const { Client } = await import("pg");
    
    // Thử cả 3 URL
    const urls = [
      dbUrl,
      "postgresql://postgres:Vantaitps%40123@db.sfpmauzfusoarpjhzvgh.supabase.co:5432/postgres",
      "postgresql://postgres.sfpmauzfusoarpjhzvgh:Vantaitps%40123@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres",
      "postgresql://postgres.sfpmauzfusoarpjhzvgh:Vantaitps%40123@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true",
    ];

    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      const masked = url.replace(/:[^@]+@/, ":****@");
      try {
        const client = new Client({ connectionString: url, connectionTimeoutMillis: 5000 });
        await client.connect();
        const res = await client.query("SELECT current_database(), current_user");
        results.push(`✅ URL ${i+1}: ${masked} → Connected! DB: ${res.rows[0].current_database}, User: ${res.rows[0].current_user}`);
        
        // Kiểm tra bảng
        const tables = await client.query("SELECT tablename FROM pg_tables WHERE schemaname = 'public'");
        results.push(`   Tables: ${tables.rows.map((r: { tablename: string }) => r.tablename).join(", ") || "none"}`);
        
        await client.end();
        
        // Nếu URL này hoạt động → trả về ngay
        return NextResponse.json({
          success: true,
          working_url_index: i + 1,
          working_url_masked: masked,
          results,
        });
      } catch (e) {
        results.push(`❌ URL ${i+1}: ${masked} → ${e instanceof Error ? e.message.slice(0, 100) : "failed"}`);
      }
    }
  } catch (e) {
    results.push(`pg import error: ${e instanceof Error ? e.message : "unknown"}`);
  }

  return NextResponse.json({ success: false, results });
}
