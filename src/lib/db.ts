import { PrismaClient } from '@prisma/client'
// Catatan: jalankan `bun run db:push` setelah mengubah prisma/schema.prisma
// agar Prisma Client ter-regenerate. KEY cache diberi versi — naikkan angkanya
// (mis. prisma_v3) bila Anda mengubah schema dan instance lama masih menempel
// di memori dev server.

const PRISMA_CACHE_KEY = 'prisma_v6'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  (globalForPrisma as Record<string, PrismaClient | undefined>)[PRISMA_CACHE_KEY] ??
  new PrismaClient({
    log: ['error'],
  })

if (process.env.NODE_ENV !== 'production') {
  ;(globalForPrisma as Record<string, PrismaClient | undefined>)[PRISMA_CACHE_KEY] = db
}
