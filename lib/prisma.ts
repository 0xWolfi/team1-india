import { PrismaClient } from '@prisma/client';

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query'] : [],
  }).$extends({
    query: {
      $allModels: {
        async findMany({ args, query }) {
          if (args.where !== undefined && args.where.deletedAt === undefined) {
             // Exclude deleted records by default unless explicitly asked for
             (args.where as any).deletedAt = null;
          }
          return query(args);
        },
        async findFirst({ args, query }) {
             if (args.where !== undefined && args.where.deletedAt === undefined) {
                (args.where as any).deletedAt = null;
             }
             return query(args);
        },
      },
    },
  });
};

type ExtendedPrismaClient = ReturnType<typeof prismaClientSingleton>;

const globalForPrisma = global as unknown as { prisma: ExtendedPrismaClient };

export const prisma = globalForPrisma.prisma || prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
