import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { earnReward } from "@/lib/wallet";
import { sendNotification } from "@/lib/notify";

// PATCH /api/quests/completions/[id] — approve or reject (CORE only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || (session.user as any)?.role !== "CORE") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const { status, reviewNote } = body as {
    status: "approved" | "rejected";
    reviewNote?: string;
  };

  if (!["approved", "rejected"].includes(status)) {
    return NextResponse.json({ error: "status must be approved or rejected" }, { status: 400 });
  }

  const completion = await prisma.questCompletion.findUnique({
    where: { id },
    include: { quest: true },
  });

  if (!completion) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (completion.status !== "pending") {
    return NextResponse.json({ error: "Already reviewed" }, { status: 400 });
  }

  // Update completion
  const updated = await prisma.questCompletion.update({
    where: { id },
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
    // Award XP + Points
    await earnReward(
      completion.userEmail,
      completion.quest.xpReward,
      completion.quest.pointsReward,
      "quest_reward",
      completion.questId,
      `Quest: ${completion.quest.title}`
    );

    // Increment total completions
    await prisma.quest.update({
      where: { id: completion.questId },
      data: { totalCompletions: { increment: 1 } },
    });

    // Notify user
    await sendNotification(
      completion.userEmail,
      "quest_approved",
      "Quest Approved!",
      `Your completion of "${completion.quest.title}" was approved. +${completion.quest.xpReward} XP, +${completion.quest.pointsReward} Points`,
      "/member/quests"
    );
  } else {
    // Notify rejection
    await sendNotification(
      completion.userEmail,
      "quest_rejected",
      "Quest Submission Rejected",
      `Your submission for "${completion.quest.title}" was not approved.${reviewNote ? ` Reason: ${reviewNote}` : ""}`,
      "/member/quests"
    );
  }

  return NextResponse.json({ completion: updated });
}
