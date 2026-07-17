/* eslint-disable @typescript-eslint/no-explicit-any */
import { db } from "../src/lib/db";

// Deterministic-ish pseudo random
const rand = (min: number, max: number) => Math.random() * (max - min) + min;
const randInt = (min: number, max: number) => Math.floor(rand(min, max + 1));
const pick = <T,>(arr: T[]): T => arr[randInt(0, arr.length - 1)];

const cities = [
  { city: "Ho Chi Minh City", lat: 10.7626, lng: 106.6601 },
  { city: "Hanoi", lat: 21.0285, lng: 105.8342 },
  { city: "Da Nang", lat: 16.0544, lng: 108.2022 },
  { city: "Hai Phong", lat: 20.8449, lng: 106.6881 },
  { city: "Can Tho", lat: 10.0452, lng: 105.7469 },
  { city: "Nha Trang", lat: 12.2388, lng: 109.1967 },
  { city: "Hue", lat: 16.4637, lng: 107.5909 },
  { city: "Vung Tau", lat: 10.9877, lng: 107.0819 },
];

const firstNames = [
  "Nguyen", "Tran", "Le", "Pham", "Hoang", "Phan", "Vu", "Dang", "Bui", "Do", "Ho", "Ngo", "Duong", "Ly",
];
const lastNames = [
  "Van An", "Thi Binh", "Minh Cuong", "Hai Dang", "Quoc Hung", "Thi Lan", "Duc Manh", "Thi Ngoc", "Anh Tuan", "Bao Long", "Thi Mai", "Van Thanh", "Huu Tien", "Thi Hoa",
];
const companyNames = [
  "Phuong Nam Trading", "Saigon Import-Export", "Mekong Foods", "Hanoi Electronics", "Vina Logistics", "Pacific Mart", "Dragon Supplies", "Lotus Distribution", "Golden Rice Co.", "Bamboo Tech", "Ocean Freight", "Highland Coffee", "Sunrise Garments", "Evergreen Goods",
];

const vehicleBrands = [
  { brand: "Hino", model: "500 Series" },
  { brand: "Isuzu", model: "FRR90" },
  { brand: "Hyundai", model: "HD270" },
  { brand: "Thaco", model: "Foton 9T" },
  { brand: "Mercedes", model: "Actros" },
  { brand: "Toyota", model: "Hiace" },
  { brand: "Ford", model: "Transit" },
  { brand: "VinFast", model: "Felix" },
];

const avatarColors = ["emerald", "amber", "rose", "sky", "violet", "orange", "teal", "fuchsia"];
const vehicleColors = ["slate", "red", "blue", "green", "orange", "purple", "cyan"];

const shipmentStatuses = [
  "pending", "picked_up", "in_transit", "out_for_delivery", "delivered", "delayed", "cancelled", "returned",
];
const priorities = ["low", "standard", "high", "express"];
const serviceTypes = ["standard", "express", "same_day", "freight", "cold_chain"];

function genPhone() {
  return "09" + String(randInt(10000000, 99999999));
}
function genLicense() {
  return "B2-" + String(randInt(100000, 999999));
}
function genPlate() {
  const codes = ["51A", "59A", "60C", "29A", "14C", "37A", "49C", "51A"];
  return `${pick(codes)}-${randInt(1000, 9999)}`;
}
function genTrackingNumber(i: number) {
  return "LG" + String(Date.now()).slice(-6) + String(i).padStart(4, "0");
}
function distanceBetween(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x)));
}

async function main() {
  console.log("🌱 Seeding logistics database...");

  // Clean
  await db.trackingEvent.deleteMany();
  await db.route.deleteMany();
  await db.shipment.deleteMany();
  await db.warehouse.deleteMany();
  await db.driver.deleteMany();
  await db.vehicle.deleteMany();
  await db.customer.deleteMany();

  // --- Warehouses ---
  const warehouses = [];
  for (let ci = 0; ci < cities.length; ci++) {
    const c = cities[ci];
    const code = "WH-" + c.city.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 4) + "-" + String(ci + 1).padStart(2, "0");
    const capacity = randInt(3000, 8000);
    const used = randInt(400, Math.floor(capacity * 0.98));
    const pct = used / capacity;
    const status = pct > 0.9 ? "full" : pick(["operational", "operational", "operational", "maintenance"]);
    const w = await db.warehouse.create({
      data: {
        name: c.city + " Distribution Center",
        code,
        address: `${randInt(1, 300)} Le Loi Street`,
        city: c.city,
        country: "Vietnam",
        capacity,
        used,
        manager: pick(lastNames),
        phone: genPhone(),
        status,
        lat: c.lat,
        lng: c.lng,
      },
    });
    warehouses.push(w);
  }

  // --- Customers ---
  const customers = [];
  for (let i = 0; i < 36; i++) {
    const c = pick(cities);
    const isBusiness = Math.random() > 0.3;
    const name = isBusiness ? pick(companyNames) : `${pick(firstNames)} ${pick(lastNames)}`;
    const cust = await db.customer.create({
      data: {
        name,
        email: `customer${i + 1}@${isBusiness ? "company" : "gmail"}.com`,
        phone: genPhone(),
        company: isBusiness ? name : null,
        address: `${randInt(1, 500)} Nguyen Trai Street`,
        city: c.city,
        country: "Vietnam",
        zipCode: String(randInt(10000, 99999)),
        type: isBusiness ? "business" : "individual",
        status: pick(["active", "active", "active", "vip", "inactive"]),
        notes: Math.random() > 0.7 ? "Priority customer with weekly shipments." : null,
      },
    });
    customers.push(cust);
  }

  // --- Vehicles ---
  const vehicles = [];
  for (let i = 0; i < 18; i++) {
    const b = pick(vehicleBrands);
    const type = pick(["truck", "truck", "van", "van", "container", "motorbike"]);
    const v = await db.vehicle.create({
      data: {
        plateNumber: genPlate(),
        model: b.model,
        brand: b.brand,
        type,
        capacityKg: type === "motorbike" ? randInt(50, 150) : type === "van" ? randInt(800, 2000) : randInt(3000, 15000),
        fuelType: pick(["diesel", "diesel", "petrol", "electric"]),
        fuelLevel: randInt(20, 100),
        mileage: randInt(5000, 280000),
        status: pick(["active", "active", "active", "maintenance"]),
        lastMaintenance: new Date(Date.now() - randInt(5, 80) * 86400000).toISOString(),
        nextMaintenance: new Date(Date.now() + randInt(5, 60) * 86400000).toISOString(),
        color: pick(vehicleColors),
      },
    });
    vehicles.push(v);
  }

  // --- Drivers ---
  const drivers = [];
  for (let i = 0; i < 16; i++) {
    const availVehicles = vehicles.filter((v) => !drivers.some((d: any) => d.vehicleId === v.id));
    const vehicleId = Math.random() > 0.3 && availVehicles.length ? pick(availVehicles).id : null;
    const d = await db.driver.create({
      data: {
        name: `${pick(firstNames)} ${pick(lastNames)}`,
        email: `driver${i + 1}@logistics.vn`,
        phone: genPhone(),
        licenseNumber: genLicense(),
        licenseExpiry: new Date(Date.now() + randInt(30, 1500) * 86400000).toISOString(),
        status: pick(["available", "available", "on_delivery", "off_duty", "on_leave"]),
        rating: Math.round(rand(3.8, 5) * 10) / 10,
        totalDeliveries: randInt(20, 980),
        totalDistance: randInt(5000, 240000),
        hireDate: new Date(Date.now() - randInt(60, 2000) * 86400000).toISOString(),
        avatarColor: pick(avatarColors),
        vehicleId,
      },
    });
    drivers.push(d);
  }

  // --- Shipments ---
  const shipmentsCount = 120;
  for (let i = 0; i < shipmentsCount; i++) {
    const sender = pick(customers);
    let receiver = pick(customers);
    while (receiver.id === sender.id) receiver = pick(customers);

    const origin = cities.find((c) => c.city === sender.city)! || pick(cities);
    let dest = cities.find((c) => c.city === receiver.city)!;
    while (!dest || dest.city === origin.city) dest = pick(cities);

    const distance = distanceBetween(origin, dest);
    const status = pick(shipmentStatuses);
    const service = pick(serviceTypes);
    const priority = pick(priorities);
    const driver = drivers.find((d: any) => d.status === "on_delivery" || d.status === "available");
    const vehicle = vehicles.find((v) => v.status === "active");

    const createdDaysAgo = randInt(0, 45);
    const createdAt = new Date(Date.now() - createdDaysAgo * 86400000);
    const estDelivery = new Date(Date.now() + randInt(-3, 8) * 86400000);

    const weight = Math.round(rand(0.5, 4500) * 10) / 10;
    const volume = Math.round(rand(0.01, 32) * 100) / 100;
    const cost = Math.round((distance * 0.6 + weight * 0.4 + (service === "express" ? 50 : 0)) * 100) / 100;

    const isLive = status === "in_transit" || status === "out_for_delivery";
    const progress =
      status === "delivered" ? 100 :
      status === "pending" ? 0 :
      status === "cancelled" || status === "returned" ? 0 :
      Math.round(rand(15, 92));

    const originWH = warehouses.find((w) => w.city === origin.city) || pick(warehouses);
    const destWH = warehouses.find((w) => w.city === dest.city) || pick(warehouses);

    const shipment = await db.shipment.create({
      data: {
        trackingNumber: genTrackingNumber(i),
        status,
        priority,
        serviceType: service,
        senderId: sender.id,
        receiverId: receiver.id,
        originWarehouseId: originWH.id,
        destinationWarehouseId: destWH.id,
        originAddress: sender.address,
        originCity: origin.city,
        destinationAddress: receiver.address,
        destinationCity: dest.city,
        distanceKm: distance,
        weightKg: weight,
        volumeM3: volume,
        pieces: randInt(1, 40),
        description: pick(["Electronics", "Furniture", "Apparel", "Foodstuff", "Machinery parts", "Documents", "Pharmaceuticals", "Consumer goods"]),
        driverId: status === "pending" ? null : driver?.id,
        vehicleId: status === "pending" ? null : vehicle?.id,
        cost,
        insurance: Math.round(cost * 0.05 * 100) / 100,
        currency: "USD",
        estimatedDelivery: estDelivery.toISOString(),
        pickedUpAt: status === "pending" ? null : new Date(createdAt.getTime() + randInt(1, 24) * 3600000).toISOString(),
        deliveredAt: status === "delivered" ? new Date(Date.now() - randInt(0, 5) * 86400000).toISOString() : null,
        currentLat: isLive ? origin.lat + (dest.lat - origin.lat) * (progress / 100) : null,
        currentLng: isLive ? origin.lng + (dest.lng - origin.lng) * (progress / 100) : null,
        progress,
        notes: Math.random() > 0.8 ? "Handle with care. Fragile contents." : null,
      },
    });

    // Tracking events
    const events: { status: string; note: string }[] = [
      { status: "pending", note: `Order created by ${sender.name}` },
    ];
    if (status !== "pending" && status !== "cancelled") {
      events.push({ status: "picked_up", note: `Picked up from ${origin.city} warehouse` });
    }
    if (["in_transit", "out_for_delivery", "delivered", "delayed", "returned"].includes(status)) {
      events.push({ status: "in_transit", note: `Departed ${origin.city} hub` });
    }
    if (["out_for_delivery", "delivered", "returned"].includes(status)) {
      events.push({ status: "out_for_delivery", note: `Out for delivery in ${dest.city}` });
    }
    if (status === "delivered") {
      events.push({ status: "delivered", note: `Delivered to ${receiver.name}` });
    }
    if (status === "delayed") {
      events.push({ status: "delayed", note: "Delayed due to weather conditions" });
    }
    if (status === "returned") {
      events.push({ status: "returned", note: "Returned to sender - undeliverable" });
    }
    if (status === "cancelled") {
      events.push({ status: "cancelled", note: "Order cancelled by customer" });
    }

    for (let j = 0; j < events.length; j++) {
      const ev = events[j];
      await db.trackingEvent.create({
        data: {
          shipmentId: shipment.id,
          status: ev.status,
          location: j === 0 ? origin.city : j === events.length - 1 ? dest.city : pick(cities).city,
          lat: j === 0 ? origin.lat : j === events.length - 1 ? dest.lat : pick(cities).lat,
          lng: j === 0 ? origin.lng : j === events.length - 1 ? dest.lng : pick(cities).lng,
          note: ev.note,
          timestamp: new Date(createdAt.getTime() + j * randInt(2, 18) * 3600000),
        },
      });
    }
  }

  // --- Routes ---
  for (let i = 0; i < 10; i++) {
    const driver = pick(drivers);
    const vehicle = vehicles.find((v) => v.id === (driver as any).vehicleId) || pick(vehicles);
    const o = pick(cities);
    let d = pick(cities);
    while (d.city === o.city) d = pick(cities);
    await db.route.create({
      data: {
        name: `${o.city} → ${d.city} Route #${i + 1}`,
        driverId: driver.id,
        vehicleId: vehicle.id,
        status: pick(["planned", "active", "completed", "completed", "cancelled"]),
        stopsCount: randInt(3, 18),
        distanceKm: distanceBetween(o, d),
        durationMin: randInt(120, 720),
        startedAt: new Date(Date.now() - randInt(0, 12) * 3600000).toISOString(),
        endedAt: Math.random() > 0.5 ? new Date(Date.now() + randInt(1, 8) * 3600000).toISOString() : null,
      },
    });
  }

  const counts = {
    warehouses: await db.warehouse.count(),
    customers: await db.customer.count(),
    vehicles: await db.vehicle.count(),
    drivers: await db.driver.count(),
    shipments: await db.shipment.count(),
    trackingEvents: await db.trackingEvent.count(),
    routes: await db.route.count(),
  };
  console.log("✅ Seed complete:", counts);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
