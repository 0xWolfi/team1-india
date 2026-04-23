import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { earnReward } from "@/lib/wallet";
import { sendNotification } from "@/lib/notify";
import { log } from "@/lib/logger";

// POST /api/bounty/submissions/bulk-review — approve/reject multiple (CORE only)
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

  // @ts-ignore
  const reviewerId = session.user.id;
  let processed = 0;

  const submissions = await prisma.bountySubmission.findMany({
    where: { id: { in: ids }, status: "pending", deletedAt: null },
    include: { bounty: true },
  });

  for (const submission of submissions) {
    const xpAwarded = status === "approved" ? submission.bounty.xpReward : 0;
    const pointsAwarded = status === "approved" ? (submission.bounty.pointsReward ?? 0) : 0;

    await prisma.bountySubmission.update({
      where: { id: submission.id },
      data: {
        status,
        reviewNote: reviewNote || null,
        xpAwarded: status === "approved" ? xpAwarded : null,
        pointsAwarded: status === "approved" ? pointsAwarded : null,
        reviewedById: reviewerId,
        reviewedAt: new Date(),
      },
    });

    if (status === "approved") {
      await earnReward(
        submission.submittedByEmail,
        xpAwarded,
        pointsAwarded,
        "bounty_reward",
        submission.bountyId,
        `Bounty: ${submission.bounty.title}`
      );

      if (submission.submittedById) {
        await prisma.communityMember.update({
          where: { id: submission.submittedById },
          data: { totalXp: { increment: xpAwarded } },
        }).catch(() => {});
      }

      await sendNotification(
        submission.submittedByEmail,
        "bounty_approved",
        "Bounty Approved!",
        `Your submission for "${submission.bounty.title}" was approved. +${xpAwarded} XP, +${pointsAwarded} Points`,
        "/member/bounty"
      );
    } else {
      await sendNotification(
        submission.submittedByEmail,
        "bounty_rejected",
        "Bounty Submission Rejected",
        `Your submission for "${submission.bounty.title}" was not approved.${reviewNote ? ` Reason: ${reviewNote}` : ""}`,
        "/member/bounty"
      );
    }

    processed++;
  }

  log("INFO", `Bulk ${status} ${processed} bounty submissions`, "BOUNTY", { ids, status });

  return NextResponse.json({ success: true, processed });
}
