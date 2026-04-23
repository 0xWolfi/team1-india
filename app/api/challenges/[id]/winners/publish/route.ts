import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { earnReward } from "@/lib/wallet";
import { sendNotification } from "@/lib/notify";

// POST /api/challenges/[id]/winners/publish — batch publish + award (CORE)
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || (session.user as any)?.role !== "CORE") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;

  const winners = await prisma.challengeWinner.findMany({ where: { challengeId: id, isPublished: false } });
  const challenge = await prisma.challenge.findUnique({ where: { id }, select: { title: true } });

  let published = 0;
  for (const w of winners) {
    await prisma.challengeWinner.update({ where: { id: w.id }, data: { isPublished: true, publishedAt: new Date() } });

    // Award XP + Points
    if (w.xpAwarded > 0 || w.pointsAwarded > 0) {
      await earnReward(w.teamEmail, w.xpAwarded, w.pointsAwarded, "challenge_winner", id, `${w.position} place — ${challenge?.title}`);
    }

    // Mark project as winner
    if (w.projectId) {
      await prisma.userProject.update({ where: { id: w.projectId }, data: { isWinner: true, winnerBadge: w.position } }).catch(() => {});
    }

    // Notify winner
    await sendNotification(w.teamEmail, "winner_announcement", "You Won!", `Congratulations! You placed ${w.position} in "${challenge?.title}"!`, `/public/challenges/${id}`);

    published++;
  }

  return NextResponse.json({ success: true, published });
}
