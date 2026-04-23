import { PrismaClient } from '@prisma/client';

// Models that don't have deletedAt (skip soft-delete filter)
const noSoftDelete = [
  'LumaEvent', 'Setting', 'AuditLog', 'PushSubscription', 'NotificationPreference',
  // New models without deletedAt:
  'PersonalVault', 'Notification', 'UserWallet', 'PointsBatch', 'WalletTransaction',
  'QuestCompletion', 'ProjectVersion', 'ProjectLike', 'ShowcaseSection',
  'ChallengeTrack', 'ChallengeRegistration', 'ChallengeTeamMember',
  'ChallengeSubmission', 'ChallengeWinner', 'ReferralCode', 'PartnerReviewLink',
  'ScheduledEmail', 'AnalyticsEvent', 'AnalyticsDailyStat', 'ApiHealthLog',
  'SwagVariant', 'SwagOrder',
];

const SLOW_QUERY_THRESHOLD_MS = 200;

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query'] : [],
  }).$extends({
    query: {
      $allModels: {
        async findMany({ model, args, query }) {
          const where = args.where as any;
          if (where !== undefined && !noSoftDelete.includes(model) && where.deletedAt === undefined) {
             where.deletedAt = null;
          }
          const start = performance.now();
          const result = await query(args);
          const duration = performance.now() - start;
          if (duration > SLOW_QUERY_THRESHOLD_MS) {
            console.warn(`[Slow Query] ${model}.findMany (${duration.toFixed(0)}ms)`);
          }
          return result;
        },
        async findFirst({ model, args, query }) {
             const where = args.where as any;
             if (where !== undefined && !noSoftDelete.includes(model) && where.deletedAt === undefined) {
                where.deletedAt = null;
             }
             const start = performance.now();
             const result = await query(args);
             const duration = performance.now() - start;
             if (duration > SLOW_QUERY_THRESHOLD_MS) {
               console.warn(`[Slow Query] ${model}.findFirst (${duration.toFixed(0)}ms)`);
             }
             return result;
        },
      },
    },
  });
};

type ExtendedPrismaClient = ReturnType<typeof prismaClientSingleton>;

const globalForPrisma = global as unknown as { prisma: ExtendedPrismaClient };

export const prisma = globalForPrisma.prisma || prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
