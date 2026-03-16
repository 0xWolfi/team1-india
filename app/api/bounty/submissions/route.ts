import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { log } from "@/lib/logger";

const SubmissionSchema = z.object({
    bountyId: z.string().uuid(),
    proofUrl: z.string().url().min(1),
    proofNote: z.string().max(1000).optional(),
});

// GET — list submissions
export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // @ts-ignore
    const role = session.user.role;
    // @ts-ignore
    const userId = session.user.id;

    try {
        if (role === 'CORE') {
            // Core sees all submissions
            const submissions = await prisma.bountySubmission.findMany({
                where: { deletedAt: null },
                orderBy: { submittedAt: 'desc' },
                include: {
                    bounty: { select: { id: true, title: true, type: true, xpReward: true } },
                    submittedBy: { select: { id: true, name: true, email: true } }
                }
            });
            return NextResponse.json(submissions);
        }

        // Members see only their own
        const submissions = await prisma.bountySubmission.findMany({
            where: { submittedById: userId, deletedAt: null },
            orderBy: { submittedAt: 'desc' },
            include: {
                bounty: { select: { id: true, title: true, type: true, xpReward: true } }
            }
        });
        return NextResponse.json(submissions);
    } catch (error) {
        log("ERROR", "Failed to fetch submissions", "BOUNTY", {}, error instanceof Error ? error : new Error(String(error)));
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}

// POST — submit proof (MEMBER only)
export async function POST(request: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // @ts-ignore
    const role = session.user.role;
    // @ts-ignore
    const userId: string = session.user.id;

    if (role !== 'MEMBER' || !userId) {
        return NextResponse.json({ error: "Only members can submit bounties" }, { status: 403 });
    }

    try {
        const body = await request.json();
        const result = SubmissionSchema.safeParse(body);
        if (!result.success) {
            return NextResponse.json({ error: "Invalid input", details: result.error.flatten() }, { status: 400 });
        }

        const { bountyId, proofUrl, proofNote } = result.data;

        // Verify bounty exists and is active
        const bounty = await prisma.bounty.findUnique({ where: { id: bountyId } });
        if (!bounty || bounty.deletedAt || bounty.status !== 'active') {
            return NextResponse.json({ error: "Bounty not available" }, { status: 404 });
        }

        // Check if member already has any submission for this bounty (one per bounty per member)
        const existingSubmission = await prisma.bountySubmission.findFirst({
            where: { bountyId, submittedById: userId, deletedAt: null }
        });
        if (existingSubmission) {
            return NextResponse.json({ error: "You have already submitted for this bounty" }, { status: 409 });
        }

        const submission = await prisma.bountySubmission.create({
            data: {
                proofUrl,
                proofNote,
                bountyId,
                submittedById: userId,
                submittedByEmail: session.user.email,
            }
        });

        log("INFO", "Bounty submission created", "BOUNTY", { submissionId: submission.id, bountyId });
        return NextResponse.json(submission, { status: 201 });
    } catch (error) {
        log("ERROR", "Failed to submit bounty", "BOUNTY", {}, error instanceof Error ? error : new Error(String(error)));
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
