import { PrismaClient } from '@prisma/client';

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query'] : [],
  }).$extends({
    query: {
      $allModels: {
        async findMany({ model, args, query }) {
          const noSoftDelete = ['LumaEvent', 'Setting', 'AuditLog', 'PushSubscription', 'NotificationPreference'];
          const where = args.where as any;
          if (where !== undefined && !noSoftDelete.includes(model) && where.deletedAt === undefined) {
             where.deletedAt = null;
          }
          return query(args);
        },
        async findFirst({ model, args, query }) {
             const noSoftDelete = ['LumaEvent', 'Setting', 'AuditLog', 'PushSubscription', 'NotificationPreference'];
             const where = args.where as any;
             if (where !== undefined && !noSoftDelete.includes(model) && where.deletedAt === undefined) {
                where.deletedAt = null;
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
