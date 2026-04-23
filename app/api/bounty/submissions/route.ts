import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { log } from "@/lib/logger";
import { checkRateLimit } from "@/lib/rate-limit";

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
                    bounty: { select: { id: true, title: true, type: true, xpReward: true, audience: true } },
                    submittedBy: { select: { id: true, name: true, email: true } },
                    publicUser: { select: { id: true, fullName: true, email: true } }
                }
            });
            return NextResponse.json(submissions);
        }

        if (role === 'PUBLIC') {
            // Public users see only their own submissions
            const submissions = await prisma.bountySubmission.findMany({
                where: { publicUserId: userId, deletedAt: null },
                orderBy: { submittedAt: 'desc' },
                include: {
                    bounty: { select: { id: true, title: true, type: true, xpReward: true } }
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

// POST — submit proof (rate limited: 5/min)
export async function POST(request: NextRequest) {
    const rateCheck = await checkRateLimit(request, 5, 60000);
    if (!rateCheck.allowed) return NextResponse.json({ error: "Too many submissions. Slow down." }, { status: 429 });

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // @ts-ignore
    const role = session.user.role;
    // @ts-ignore
    const userId: string = session.user.id;

    if (!userId) {
        return NextResponse.json({ error: "User ID required" }, { status: 403 });
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

        // Validate audience: "all" allows everyone, "member" requires MEMBER/CORE, "public" allows PUBLIC
        if (bounty.audience === 'member' && role !== 'MEMBER' && role !== 'CORE') {
            return NextResponse.json({ error: "This bounty is for members only" }, { status: 403 });
        }
        if (bounty.audience === 'public' && role === 'MEMBER') {
            // Members can also submit to public bounties — no restriction
        }
        // audience: "all" → anyone logged in can submit

        // Check for existing submission (one per bounty per user)
        if (role === 'MEMBER') {
            const existing = await prisma.bountySubmission.findFirst({
                where: { bountyId, submittedById: userId, deletedAt: null }
            });
            if (existing) {
                return NextResponse.json({ error: "You have already submitted for this bounty" }, { status: 409 });
            }
        } else {
            const existing = await prisma.bountySubmission.findFirst({
                where: { bountyId, publicUserId: userId, deletedAt: null }
            });
            if (existing) {
                return NextResponse.json({ error: "You have already submitted for this bounty" }, { status: 409 });
            }
        }

        const submissionData: any = {
            proofUrl,
            proofNote,
            bountyId,
            submittedByEmail: session.user.email,
        };

        if (role === 'MEMBER') {
            submissionData.submittedById = userId;
        } else {
            submissionData.publicUserId = userId;
        }

        const submission = await prisma.bountySubmission.create({
            data: submissionData,
        });

        log("INFO", "Bounty submission created", "BOUNTY", { submissionId: submission.id, bountyId, role });
        return NextResponse.json(submission, { status: 201 });
    } catch (error: any) {
        // Handle unique constraint violation (race condition dedup backstop)
        // NOTE: Add @@unique([bountyId, submittedById]) and @@unique([bountyId, publicUserId])
        // to BountySubmission in prisma/schema.prisma for a DB-level guarantee
        if (error?.code === 'P2002') {
            return NextResponse.json({ error: "You have already submitted for this bounty" }, { status: 409 });
        }
        log("ERROR", "Failed to submit bounty", "BOUNTY", {}, error instanceof Error ? error : new Error(String(error)));
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
