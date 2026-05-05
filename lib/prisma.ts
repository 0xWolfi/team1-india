import { PrismaClient } from '@prisma/client';

// Models that don't have a `deletedAt` column — the soft-delete filter below
// must skip them or every findMany/findFirst on these models crashes with
// "Unknown argument `deletedAt`". Keep this list in sync with the schema.
const noSoftDelete = [
  // Legacy entries — kept defensively in case future schema additions reuse the names.
  'Setting', 'AuditLog', 'PushSubscription', 'NotificationPreference',
  'ChallengeTrack', 'ChallengeRegistration', 'ChallengeTeamMember',
  'ChallengeSubmission', 'ChallengeWinner', 'ReferralCode', 'PartnerReviewLink',
  'ScheduledEmail',
  // Models in the current schema without `deletedAt`:
  'LumaEvent',
  'PersonalVault', 'Notification',
  'UserWallet', 'PointsBatch', 'WalletTransaction', 'QuestCompletion',
  'SwagVariant', 'SwagOrder',
  'ProjectVersion', 'ProjectLike', 'ProjectReport', 'ShowcaseSection',
  'SpeedrunTrack', 'SpeedrunTeam', 'SpeedrunTeamMember',
  'SpeedrunRegistration', 'SpeedrunReferralCode',
  'AnalyticsEvent', 'AnalyticsDailyStat', 'ApiHealthLog',
  'TwoFactorAuth', 'Passkey',
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
