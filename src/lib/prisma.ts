import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: PrismaClient | undefined;
}

let prisma: PrismaClient;

const connectionString = process.env.DATABASE_URL;

if (process.env.NODE_ENV === 'production') {
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  prisma = new PrismaClient({ adapter });
} else {
  if (!globalThis.prismaGlobal) {
    const pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);
    globalThis.prismaGlobal = new PrismaClient({ adapter });
  }
  prisma = globalThis.prismaGlobal;
}

export { prisma };
