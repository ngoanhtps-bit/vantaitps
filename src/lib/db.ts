// Import directly from the generated Prisma client output to bypass Turbopack's
// @prisma/client module cache. This ensures schema changes are picked up.
import { PrismaClient } from '../../node_modules/.prisma/client/index.js'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Force a new client if the cached one is missing the Invoice model
// (handles schema changes without dev server restart)
let cachedClient = globalForPrisma.prisma;
if (cachedClient && !(cachedClient as unknown as { invoice?: unknown }).invoice) {
  cachedClient = undefined;
  globalForPrisma.prisma = undefined;
}

export const db =
  cachedClient ??
  new PrismaClient({
    log: ['error', 'warn'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db