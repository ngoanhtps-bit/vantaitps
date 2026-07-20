import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const results: { tables: string[]; users: number; error: string | null } = {
    tables: [],
    users: 0,
    error: null,
  };

  try {
    const tables = [
      { name: "User", sql: `CREATE TABLE IF NOT EXISTS "User" (id TEXT PRIMARY KEY, username TEXT UNIQUE NOT NULL, password TEXT NOT NULL, "hoTen" TEXT NOT NULL, email TEXT UNIQUE, sdt TEXT, role TEXT DEFAULT 'thuky', active BOOLEAN DEFAULT true, "avatarColor" TEXT DEFAULT 'emerald', "lastLogin" TEXT, "createdAt" TIMESTAMP DEFAULT NOW(), "updatedAt" TIMESTAMP DEFAULT NOW())` },
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

    for (const t of tables) {
      try {
        await db.$executeRawUnsafe(t.sql);
        results.tables.push(t.name);
      } catch (e) {
        results.tables.push(`${t.name} (error: ${e instanceof Error ? e.message.slice(0, 80) : "unknown"})`);
      }
    }

    // Seed 5 users
    const existingUsers = await db.user.count().catch(() => -1);
    if (existingUsers === 0) {
      await db.user.createMany({
        data: [
          { id: "u1", username: "admin", password: "123456", hoTen: "Quản trị viên", email: "admin@logistics.vn", sdt: "0901112233", role: "admin", avatarColor: "rose" },
          { id: "u2", username: "dieuxe", password: "123456", hoTen: "Nguyễn Điều Xe", email: "dieuxe@logistics.vn", sdt: "0902223344", role: "dieuxe", avatarColor: "emerald" },
          { id: "u3", username: "dieuphoi", password: "123456", hoTen: "Trần Điều Phối", email: "dieuphoi@logistics.vn", sdt: "0903334455", role: "dieuphoi", avatarColor: "sky" },
          { id: "u4", username: "ketoan", password: "123456", hoTen: "Lê Kế Toán", email: "ketoan@logistics.vn", sdt: "0904445566", role: "ketoan", avatarColor: "violet" },
          { id: "u5", username: "thuky", password: "123456", hoTen: "Phạm Thư Ký", email: "thuky@logistics.vn", sdt: "0905556677", role: "thuky", avatarColor: "amber" },
        ],
      }).catch((e) => { results.error = `Seed: ${e instanceof Error ? e.message : "unknown"}`; });
      results.users = 5;
    } else {
      results.users = existingUsers;
    }

    return NextResponse.json({
      success: true,
      message: "Đã tạo bảng + seed 5 user thành công!",
      tablesCreated: results.tables,
      usersCount: results.users,
      error: results.error,
    });
  } catch (e) {
    return NextResponse.json({
      success: false,
      error: e instanceof Error ? e.message : "Unknown error",
      partialResults: results,
    }, { status: 500 });
  }
}
