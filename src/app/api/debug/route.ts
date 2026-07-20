import { NextResponse } from "next/server";

export async function GET() {
  const dbUrl = process.env.DATABASE_URL;
  
  if (!dbUrl) {
    return NextResponse.json({
      error: "DATABASE_URL chua duoc set tren Vercel!",
      fix: "Vao Settings > Environment Variables > them DATABASE_URL",
    }, { status: 500 });
  }

  // Mask password
  const masked = dbUrl.replace(/:[^@]+@/, ":****@");

  // Check if using direct or pooler
  const isDirect = dbUrl.includes("db.") && dbUrl.includes(".supabase.co:5432");
  const isPooler = dbUrl.includes("pooler.supabase.com");

  return NextResponse.json({
    DATABASE_URL_set: true,
    value: masked,
    length: dbUrl.length,
    starts_with_postgresql: dbUrl.startsWith("postgresql://"),
    is_direct_connection: isDirect,
    is_pooler_connection: isPooler,
    problem: isDirect ? "DUNG DIRECT CONNECTION - can doi sang pooler" : null,
    fix: isDirect ? "Doi sang: postgresql://postgres.sfpmauzfusoarpjhzvgh:Vantaitps%40123@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true" : null,
  });
}
