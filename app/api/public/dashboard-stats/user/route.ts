import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";

// GET /api/public/dashboard-stats/user — user-specific stats
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const email = session.user.email;

  const [wallet, questsCompleted, bountiesSubmitted, projectsCount] = await Promise.all([
    prisma.userWallet.findUnique({ where: { userEmail: email }, select: { totalXp: true, pointsBalance: true } }),
    prisma.questCompletion.count({ where: { userEmail: email, status: "approved" } }),
    prisma.bountySubmission.findMany({ where: { submittedByEmail: email, status: "approved", deletedAt: null }, select: { id: true } }).then((r) => r.length),
    prisma.userProject.count({ where: { teamEmails: { has: email }, deletedAt: null } }),
  ]);

  // Calculate rank
  const rank = wallet
    ? await prisma.userWallet.count({ where: { totalXp: { gt: wallet.totalXp } } }) + 1
    : null;

  return NextResponse.json({
    totalXp: wallet?.totalXp ?? 0,
    pointsBalance: wallet?.pointsBalance ?? 0,
    rank,
    questsCompleted,
    bountiesSubmitted,
    projectsCount,
  });
}
