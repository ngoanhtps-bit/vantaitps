import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// Trả về mã TPS tiếp theo (preview trước khi tạo chuyến)
export async function GET() {
  const today = new Date();
  const dateStr = today.getFullYear().toString() +
    (today.getMonth() + 1).toString().padStart(2, "0") +
    today.getDate().toString().padStart(2, "0");

  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
  const todayCount = await db.shipment.count({
    where: { createdAt: { gte: startOfDay, lt: endOfDay } },
  });

  const nextTracking = `TPS${dateStr}${(todayCount + 1).toString().padStart(3, "0")}`;

  return NextResponse.json({ trackingNumber: nextTracking, dateStr, stt: todayCount + 1 });
}
