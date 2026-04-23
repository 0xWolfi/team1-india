import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { earnReward } from "@/lib/wallet";
import { sendNotification } from "@/lib/notify";

// POST /api/quests/completions/bulk-review — approve/reject multiple (CORE only)
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || (session.user as any)?.role !== "CORE") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { ids, status, reviewNote } = body as {
    ids: string[];
    status: "approved" | "rejected";
    reviewNote?: string;
  };

  if (!ids?.length || !["approved", "rejected"].includes(status)) {
    return NextResponse.json({ error: "ids and valid status required" }, { status: 400 });
  }

  const completions = await prisma.questCompletion.findMany({
    where: { id: { in: ids }, status: "pending" },
    include: { quest: true },
  });

  let processed = 0;

  for (const completion of completions) {
    await prisma.questCompletion.update({
      where: { id: completion.id },
      data: {
        status,
        reviewNote,
        reviewedBy: session.user.email,
        reviewedAt: new Date(),
        ...(status === "approved"
          ? {
              xpAwarded: completion.quest.xpReward,
              pointsAwarded: completion.quest.pointsReward,
            }
          : {}),
      },
    });

    if (status === "approved") {
      await earnReward(
        completion.userEmail,
        completion.quest.xpReward,
        completion.quest.pointsReward,
        "quest_reward",
        completion.questId,
        `Quest: ${completion.quest.title}`
      );
      await prisma.quest.update({
        where: { id: completion.questId },
        data: { totalCompletions: { increment: 1 } },
      });
      await sendNotification(
        completion.userEmail,
        "quest_approved",
        "Quest Approved!",
        `Your completion of "${completion.quest.title}" was approved. +${completion.quest.xpReward} XP, +${completion.quest.pointsReward} Points`,
        "/member/quests"
      );
    } else {
      await sendNotification(
        completion.userEmail,
        "quest_rejected",
        "Quest Submission Rejected",
        `Your submission for "${completion.quest.title}" was not approved.${reviewNote ? ` Reason: ${reviewNote}` : ""}`,
        "/member/quests"
      );
    }

    processed++;
  }

  return NextResponse.json({ success: true, processed });
}
