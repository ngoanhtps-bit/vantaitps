// Import directly from the generated Prisma client output to bypass Turbopack's
// @prisma/client module cache. This ensures schema changes are picked up.
import { PrismaClient } from '../../node_modules/.prisma/client/index.js'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Force a new client if the cached one is missing newer schema fields.
// Check for the Vietnam trucking field 'trailerNumber' on the Shipment delegate.
// If it's missing, the cached client predates the latest schema — discard it.
let cachedClient = globalForPrisma.prisma;
if (cachedClient) {
  try {
    const shipFields = (cachedClient as unknown as { shipment?: { fields?: Record<string, unknown> } }).shipment?.fields;
    if (!shipFields || !('trailerNumber' in shipFields)) {
      cachedClient = undefined;
      globalForPrisma.prisma = undefined;
    }
  } catch {
    cachedClient = undefined;
    globalForPrisma.prisma = undefined;
  }
}

export const db =
  cachedClient ??
  new PrismaClient({
    log: ['error', 'warn'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db