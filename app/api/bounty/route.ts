import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { log } from "@/lib/logger";

const BountyCreateSchema = z.object({
    title: z.string().min(1).max(200),
    description: z.string().max(2000).optional(),
    type: z.enum(["tweet", "thread", "blog", "video", "developer"]),
    xpReward: z.number().int().min(1).max(1000).default(10),
    frequency: z.enum(["daily", "twice-weekly", "weekly", "biweekly"]),
    audience: z.enum(["member", "public"]).default("member"),
    deadline: z.string().optional(),
    maxPerCycle: z.number().int().min(1).max(100).optional(),
});

// GET — list bounties
export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // @ts-ignore
    const role = session.user.role;
    if (role !== 'MEMBER' && role !== 'CORE') {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        const where: any = { deletedAt: null };
        // Members only see active member-audience bounties
        if (role === 'MEMBER') {
            where.status = 'active';
            where.audience = 'member';
        }

        const bounties = await prisma.bounty.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: {
                _count: { select: { submissions: { where: { deletedAt: null } } } }
            }
        });

        return NextResponse.json(bounties);
    } catch (error) {
        log("ERROR", "Failed to fetch bounties", "BOUNTY", {}, error instanceof Error ? error : new Error(String(error)));
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}

// POST — create bounty (CORE only)
export async function POST(request: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // @ts-ignore
    const role = session.user.role;
    if (role !== 'CORE') {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        const body = await request.json();
        const result = BountyCreateSchema.safeParse(body);
        if (!result.success) {
            return NextResponse.json({ error: "Invalid input", details: result.error.flatten() }, { status: 400 });
        }

        const data = result.data;
        const bounty = await prisma.bounty.create({
            data: {
                title: data.title,
                description: data.description,
                type: data.type,
                xpReward: data.xpReward,
                frequency: data.frequency,
                audience: data.audience,
                deadline: data.deadline ? new Date(data.deadline) : null,
                maxPerCycle: data.maxPerCycle,
            }
        });

        log("INFO", "Bounty created", "BOUNTY", { bountyId: bounty.id, type: data.type });
        return NextResponse.json(bounty, { status: 201 });
    } catch (error) {
        log("ERROR", "Failed to create bounty", "BOUNTY", {}, error instanceof Error ? error : new Error(String(error)));
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
