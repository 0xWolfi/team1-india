import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { log } from "@/lib/logger";

// GET — single bounty with submissions
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    try {
        const bounty = await prisma.bounty.findUnique({
            where: { id },
            include: {
                submissions: {
                    where: { deletedAt: null },
                    orderBy: { submittedAt: 'desc' },
                    include: { submittedBy: { select: { id: true, name: true, email: true } } }
                }
            }
        });

        if (!bounty || bounty.deletedAt) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }

        return NextResponse.json(bounty);
    } catch (error) {
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}

// PATCH — update bounty (CORE only)
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

    try {
        const body = await request.json();
        const bounty = await prisma.bounty.update({
            where: { id },
            data: {
                ...(body.title !== undefined && { title: body.title }),
                ...(body.description !== undefined && { description: body.description }),
                ...(body.xpReward !== undefined && { xpReward: body.xpReward }),
                ...(body.status !== undefined && { status: body.status }),
                ...(body.deadline !== undefined && { deadline: body.deadline ? new Date(body.deadline) : null }),
                ...(body.maxPerCycle !== undefined && { maxPerCycle: body.maxPerCycle }),
            }
        });

        log("INFO", "Bounty updated", "BOUNTY", { bountyId: id });
        return NextResponse.json(bounty);
    } catch (error) {
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}

// DELETE — soft delete bounty (CORE only)
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // @ts-ignore
    if (session.user.role !== 'CORE') {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    try {
        await prisma.bounty.update({ where: { id }, data: { deletedAt: new Date() } });
        log("INFO", "Bounty deleted", "BOUNTY", { bountyId: id });
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
