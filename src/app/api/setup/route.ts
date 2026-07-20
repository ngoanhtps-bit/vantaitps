import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

export async function GET() {
  const pass = "Vantaitps%40123";
  const ref = "sfpmauzfusoarpjhzvgh";
  const url = `postgresql://postgres.${ref}:${pass}@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true`;

  const results: string[] = [];

  try {
    const prisma = new PrismaClient({ datasources: { db: { url } } });

    // Check existing users
    const userCount = await prisma.user.count().catch(() => -1);
    results.push(`Users: ${userCount}`);

    // Check existing tables
    const tables = await prisma.$queryRawUnsafe("SELECT tablename FROM pg_tables WHERE schemaname = 'public'") as Array<{ tablename: string }>;
    const tableNames = tables.map(t => t.tablename);
    results.push(`Existing tables: ${tableNames.join(", ") || "none"}`);

    // Create tables using raw SQL if they don't exist
    const createSQL = [
      { name: "Customer", sql: `CREATE TABLE IF NOT EXISTS "Customer" (id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT, phone TEXT NOT NULL, company TEXT, address TEXT NOT NULL, city TEXT NOT NULL, country TEXT DEFAULT 'Vietnam', "zipCode" TEXT, type TEXT DEFAULT 'business', status TEXT DEFAULT 'active', notes TEXT, "createdAt" TIMESTAMP DEFAULT NOW(), "updatedAt" TIMESTAMP DEFAULT NOW())` },
      { name: "NhaCungCap", sql: `CREATE TABLE IF NOT EXISTS "NhaCungCap" (id TEXT PRIMARY KEY, "tenDonVi" TEXT NOT NULL, "maNCC" TEXT UNIQUE, sdt TEXT, email TEXT, "diaChi" TEXT, "nguoiLienHe" TEXT, "sdtLienHe" TEXT, "msThue" TEXT, "ghiChu" TEXT, "createdAt" TIMESTAMP DEFAULT NOW(), "updatedAt" TIMESTAMP DEFAULT NOW())` },
      { name: "Vehicle", sql: `CREATE TABLE IF NOT EXISTS "Vehicle" (id TEXT PRIMARY KEY, "plateNumber" TEXT UNIQUE NOT NULL, model TEXT NOT NULL, brand TEXT NOT NULL, type TEXT DEFAULT 'truck', "loaiXe" TEXT, "capacityKg" DOUBLE PRECISION DEFAULT 0, "fuelType" TEXT DEFAULT 'diesel', "fuelLevel" DOUBLE PRECISION DEFAULT 100, mileage DOUBLE PRECISION DEFAULT 0, status TEXT DEFAULT 'active', "lastMaintenance" TEXT, "nextMaintenance" TEXT, color TEXT DEFAULT 'slate', "nhaCungCapId" TEXT, "createdAt" TIMESTAMP DEFAULT NOW(), "updatedAt" TIMESTAMP DEFAULT NOW())` },
      { name: "Driver", sql: `CREATE TABLE IF NOT EXISTS "Driver" (id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT UNIQUE, phone TEXT NOT NULL, "licenseNumber" TEXT NOT NULL, "licenseExpiry" TEXT, status TEXT DEFAULT 'available', rating DOUBLE PRECISION DEFAULT 5.0, "totalDeliveries" INTEGER DEFAULT 0, "totalDistance" DOUBLE PRECISION DEFAULT 0, "hireDate" TEXT, "avatarColor" TEXT DEFAULT 'emerald', "vehicleId" TEXT UNIQUE, "nhaCungCapId" TEXT, "createdAt" TIMESTAMP DEFAULT NOW(), "updatedAt" TIMESTAMP DEFAULT NOW())` },
      { name: "Warehouse", sql: `CREATE TABLE IF NOT EXISTS "Warehouse" (id TEXT PRIMARY KEY, name TEXT NOT NULL, code TEXT UNIQUE NOT NULL, address TEXT NOT NULL, city TEXT NOT NULL, country TEXT DEFAULT 'Vietnam', capacity DOUBLE PRECISION DEFAULT 1000, used DOUBLE PRECISION DEFAULT 0, manager TEXT, phone TEXT, status TEXT DEFAULT 'operational', lat DOUBLE PRECISION, lng DOUBLE PRECISION, "createdAt" TIMESTAMP DEFAULT NOW(), "updatedAt" TIMESTAMP DEFAULT NOW())` },
      { name: "Shipment", sql: `CREATE TABLE IF NOT EXISTS "Shipment" (id TEXT PRIMARY KEY, "trackingNumber" TEXT UNIQUE NOT NULL, status TEXT DEFAULT 'pending', priority TEXT DEFAULT 'standard', "serviceType" TEXT DEFAULT 'standard', "senderId" TEXT NOT NULL, "receiverId" TEXT NOT NULL, "originWarehouseId" TEXT, "destinationWarehouseId" TEXT, "originAddress" TEXT NOT NULL, "originCity" TEXT NOT NULL, "destinationAddress" TEXT NOT NULL, "destinationCity" TEXT NOT NULL, "distanceKm" DOUBLE PRECISION DEFAULT 0, "weightKg" DOUBLE PRECISION NOT NULL, "volumeM3" DOUBLE PRECISION DEFAULT 0, pieces INTEGER DEFAULT 1, description TEXT, "driverId" TEXT, "vehicleId" TEXT, cost DOUBLE PRECISION DEFAULT 0, insurance DOUBLE PRECISION DEFAULT 0, currency TEXT DEFAULT 'USD', "estimatedDelivery" TEXT, "pickedUpAt" TEXT, "deliveredAt" TEXT, "currentLat" DOUBLE PRECISION, "currentLng" DOUBLE PRECISION, progress DOUBLE PRECISION DEFAULT 0, notes TEXT, signature TEXT, "trailerNumber" TEXT, "containerNumber" TEXT, "salePerson" TEXT, dispatcher TEXT, "tripDate" TEXT, "customerCode" TEXT, "matHang" TEXT, "ngayDi" TEXT, "gioDi" TEXT, "daGuiBienBan" BOOLEAN DEFAULT false, "ghiChu1" TEXT, "ghiChu2" TEXT, "ghiChu3" TEXT, "createdAt" TIMESTAMP DEFAULT NOW(), "updatedAt" TIMESTAMP DEFAULT NOW())` },
      { name: "TrackingEvent", sql: `CREATE TABLE IF NOT EXISTS "TrackingEvent" (id TEXT PRIMARY KEY, "shipmentId" TEXT NOT NULL, status TEXT NOT NULL, location TEXT, lat DOUBLE PRECISION, lng DOUBLE PRECISION, note TEXT, timestamp TIMESTAMP DEFAULT NOW())` },
      { name: "Route", sql: `CREATE TABLE IF NOT EXISTS "Route" (id TEXT PRIMARY KEY, name TEXT NOT NULL, "driverId" TEXT, "vehicleId" TEXT, status TEXT DEFAULT 'planned', "stopsCount" INTEGER DEFAULT 0, "distanceKm" DOUBLE PRECISION DEFAULT 0, "durationMin" INTEGER DEFAULT 0, "startedAt" TEXT, "endedAt" TEXT, "createdAt" TIMESTAMP DEFAULT NOW(), "updatedAt" TIMESTAMP DEFAULT NOW())` },
      { name: "Invoice", sql: `CREATE TABLE IF NOT EXISTS "Invoice" (id TEXT PRIMARY KEY, "invoiceNumber" TEXT UNIQUE NOT NULL, "customerId" TEXT NOT NULL, status TEXT DEFAULT 'draft', "issueDate" TIMESTAMP DEFAULT NOW(), "dueDate" TEXT, "periodStart" TEXT, "periodEnd" TEXT, subtotal DOUBLE PRECISION DEFAULT 0, "taxRate" DOUBLE PRECISION DEFAULT 0.1, "taxAmount" DOUBLE PRECISION DEFAULT 0, total DOUBLE PRECISION DEFAULT 0, currency TEXT DEFAULT 'USD', notes TEXT, "paidAt" TEXT, "createdAt" TIMESTAMP DEFAULT NOW(), "updatedAt" TIMESTAMP DEFAULT NOW())` },
      { name: "RolePermission", sql: `CREATE TABLE IF NOT EXISTS "RolePermission" (id TEXT PRIMARY KEY, role TEXT NOT NULL, view TEXT NOT NULL, "canView" BOOLEAN DEFAULT false, "canCreate" BOOLEAN DEFAULT false, "canEdit" BOOLEAN DEFAULT false, "canDelete" BOOLEAN DEFAULT false, "createdAt" TIMESTAMP DEFAULT NOW(), "updatedAt" TIMESTAMP DEFAULT NOW(), UNIQUE(role, view))` },
    ];

    for (const t of createSQL) {
      if (!tableNames.includes(t.name)) {
        await prisma.$executeRawUnsafe(t.sql);
        results.push(`✅ Created table: ${t.name}`);
      } else {
        results.push(`⏭️ Table exists: ${t.name}`);
      }
    }

    await prisma.$disconnect();

    return NextResponse.json({
      success: true,
      message: "Tất cả bảng đã sẵn sàng!",
      users: userCount,
      results,
      correct_DATABASE_URL: `postgresql://postgres.${ref}:${pass}@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true`
    });
  } catch (e) {
    return NextResponse.json({
      success: false,
      error: e instanceof Error ? e.message : "unknown",
      results,
    }, { status: 500 });
  }
}
