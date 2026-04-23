import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { log } from "@/lib/logger";
import { earnReward } from "@/lib/wallet";
import { sendNotification } from "@/lib/notify";

// PATCH — approve/reject submission (CORE only)
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // @ts-ignore
    if (session.user.role !== 'CORE') {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    // @ts-ignore
    const reviewerId = session.user.id;

    try {
        const body = await request.json();
        const { status, reviewNote } = body;

        if (status !== 'approved' && status !== 'rejected') {
            return NextResponse.json({ error: "Status must be 'approved' or 'rejected'" }, { status: 400 });
        }

        const submission = await prisma.bountySubmission.findUnique({
            where: { id },
            include: { bounty: true }
        });

        if (!submission || submission.deletedAt) {
            return NextResponse.json({ error: "Submission not found" }, { status: 404 });
        }

        if (submission.status !== 'pending') {
            return NextResponse.json({ error: "Submission already reviewed" }, { status: 409 });
        }

        const xpAwarded = status === 'approved' ? submission.bounty.xpReward : 0;
        const pointsAwarded = status === 'approved' ? (submission.bounty.pointsReward ?? 0) : 0;

        // Atomic conditional update: only transition if still 'pending'
        const result = await prisma.bountySubmission.updateMany({
            where: { id, status: 'pending', deletedAt: null },
            data: {
                status,
                reviewNote: reviewNote || null,
                xpAwarded: status === 'approved' ? xpAwarded : null,
                pointsAwarded: status === 'approved' ? pointsAwarded : null,
                reviewedById: reviewerId,
                reviewedAt: new Date(),
            }
        });

        if (result.count === 0) {
            return NextResponse.json({ error: "Submission already reviewed" }, { status: 409 });
        }

        // Award via wallet system (XP + Points)
        if (status === 'approved') {
            await earnReward(
                submission.submittedByEmail,
                xpAwarded,
                pointsAwarded,
                "bounty_reward",
                submission.bountyId,
                `Bounty: ${submission.bounty.title}`
            );

            // Also update legacy CommunityMember.totalXp for backwards compatibility
            if (submission.submittedById) {
                await prisma.communityMember.update({
                    where: { id: submission.submittedById },
                    data: { totalXp: { increment: xpAwarded } }
                }).catch(() => {}); // non-critical
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

        const updated = await prisma.bountySubmission.findUnique({ where: { id } });

        log("INFO", `Bounty submission ${status}`, "BOUNTY", {
            submissionId: id,
            bountyId: submission.bountyId,
            memberId: submission.submittedById,
            xpAwarded: status === 'approved' ? xpAwarded : 0,
            pointsAwarded: status === 'approved' ? pointsAwarded : 0,
        });

        return NextResponse.json(updated);
    } catch (error) {
        log("ERROR", "Failed to review submission", "BOUNTY", {}, error instanceof Error ? error : new Error(String(error)));
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
