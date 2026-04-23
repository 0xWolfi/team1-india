import { prisma } from "@/lib/prisma";

const DEFAULT_POINTS_TTL_DAYS = 90; // Points expire after 90 days

/**
 * Get or create a wallet for a user.
 */
export async function getOrCreateWallet(userEmail: string) {
  return prisma.userWallet.upsert({
    where: { userEmail },
    update: {},
    create: { userEmail },
  });
}

/**
 * Earn a reward: adds XP (permanent) + Points (expirable) to wallet.
 * Creates a PointsBatch for the points with an expiry date.
 *
 * @param userEmail - user's email
 * @param xp - XP to award (permanent)
 * @param points - Points to award (expire after ttlDays)
 * @param type - transaction type (e.g. "quest_reward", "bounty_reward")
 * @param sourceId - related entity ID
 * @param description - human-readable description
 * @param ttlDays - days until points expire (default 90)
 */
export async function earnReward(
  userEmail: string,
  xp: number,
  points: number,
  type: string,
  sourceId?: string,
  description?: string,
  ttlDays = DEFAULT_POINTS_TTL_DAYS
): Promise<void> {
  const wallet = await getOrCreateWallet(userEmail);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + ttlDays);

  await prisma.$transaction([
    // Update wallet totals
    prisma.userWallet.update({
      where: { id: wallet.id },
      data: {
        totalXp: { increment: xp },
        pointsBalance: { increment: points },
        totalEarned: { increment: points },
      },
    }),
    // Create points batch (for FIFO expiry tracking)
    ...(points > 0
      ? [
          prisma.pointsBatch.create({
            data: {
              walletId: wallet.id,
              amount: points,
              remaining: points,
              source: type,
              sourceId,
              expiresAt,
            },
          }),
        ]
      : []),
    // Log the transaction
    prisma.walletTransaction.create({
      data: {
        walletId: wallet.id,
        pointsAmount: points,
        xpAmount: xp,
        type,
        description,
        sourceId,
      },
    }),
  ]);
}

/**
 * Spend points from wallet using FIFO (oldest batches first).
 * Uses a serializable transaction to prevent race conditions.
 *
 * @throws Error("INSUFFICIENT_BALANCE") if not enough points
 */
export async function spendPoints(
  userEmail: string,
  amount: number,
  type: string,
  sourceId?: string,
  description?: string
): Promise<void> {
  await prisma.$transaction(
    async (tx) => {
      const wallet = await tx.userWallet.findUnique({
        where: { userEmail },
        select: { id: true, pointsBalance: true },
      });

      if (!wallet || wallet.pointsBalance < amount) {
        throw new Error("INSUFFICIENT_BALANCE");
      }

      // FIFO: deduct from oldest non-expired batches first
      const batches = await tx.pointsBatch.findMany({
        where: {
          walletId: wallet.id,
          remaining: { gt: 0 },
          expiresAt: { gt: new Date() },
        },
        orderBy: { earnedAt: "asc" },
      });

      let remaining = amount;
      for (const batch of batches) {
        if (remaining <= 0) break;
        const deduct = Math.min(remaining, batch.remaining);
        await tx.pointsBatch.update({
          where: { id: batch.id },
          data: { remaining: { decrement: deduct } },
        });
        remaining -= deduct;
      }

      if (remaining > 0) {
        throw new Error("INSUFFICIENT_BALANCE");
      }

      // Update wallet balance
      await tx.userWallet.update({
        where: { id: wallet.id },
        data: {
          pointsBalance: { decrement: amount },
          totalSpent: { increment: amount },
        },
      });

      // Log transaction
      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          pointsAmount: -amount,
          xpAmount: 0,
          type,
          description,
          sourceId,
        },
      });
    },
    { isolationLevel: "Serializable", timeout: 10000 }
  );
}

/**
 * Expire points from all wallets where batches have passed their expiresAt.
 * Called by the daily cron job.
 * Returns total points expired across all wallets.
 */
export async function expirePoints(): Promise<number> {
  const now = new Date();

  // Find all expired batches with remaining > 0
  const expiredBatches = await prisma.pointsBatch.findMany({
    where: {
      expiresAt: { lte: now },
      remaining: { gt: 0 },
    },
    include: { wallet: { select: { id: true, userEmail: true } } },
  });

  let totalExpired = 0;

  for (const batch of expiredBatches) {
    const expiredAmount = batch.remaining;

    await prisma.$transaction([
      // Zero out the batch
      prisma.pointsBatch.update({
        where: { id: batch.id },
        data: { remaining: 0 },
      }),
      // Deduct from wallet balance
      prisma.userWallet.update({
        where: { id: batch.wallet.id },
        data: {
          pointsBalance: { decrement: expiredAmount },
          totalExpired: { increment: expiredAmount },
        },
      }),
      // Log expiry transaction
      prisma.walletTransaction.create({
        data: {
          walletId: batch.wallet.id,
          pointsAmount: -expiredAmount,
          xpAmount: 0,
          type: "expiry",
          description: `${expiredAmount} points expired`,
          sourceId: batch.id,
        },
      }),
    ]);

    totalExpired += expiredAmount;
  }

  return totalExpired;
}

/**
 * Admin: manually adjust a user's wallet (add/remove points and/or XP).
 */
export async function adminAdjust(
  userEmail: string,
  xp: number,
  points: number,
  description: string,
  adminEmail: string
): Promise<void> {
  const wallet = await getOrCreateWallet(userEmail);

  const updates: any = {};
  if (xp !== 0) updates.totalXp = { increment: xp };
  if (points > 0) {
    updates.pointsBalance = { increment: points };
    updates.totalEarned = { increment: points };
  } else if (points < 0) {
    updates.pointsBalance = { increment: points }; // negative increment = decrement
    updates.totalSpent = { increment: Math.abs(points) };
  }

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + DEFAULT_POINTS_TTL_DAYS);

  await prisma.$transaction([
    prisma.userWallet.update({
      where: { id: wallet.id },
      data: updates,
    }),
    ...(points > 0
      ? [
          prisma.pointsBatch.create({
            data: {
              walletId: wallet.id,
              amount: points,
              remaining: points,
              source: "admin_adjust",
              expiresAt,
            },
          }),
        ]
      : []),
    prisma.walletTransaction.create({
      data: {
        walletId: wallet.id,
        pointsAmount: points,
        xpAmount: xp,
        type: "admin_adjust",
        description: `${description} (by ${adminEmail})`,
      },
    }),
  ]);
}
