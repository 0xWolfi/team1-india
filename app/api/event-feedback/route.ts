import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";

// GET — fetch recent Luma events (past 10 days) with host info
export async function GET() {
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
        const tenDaysAgo = new Date();
        tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);

        const recentEvents = await prisma.lumaEvent.findMany({
            where: {
                startAt: { gte: tenDaysAgo, lte: new Date() },
            },
            orderBy: { startAt: 'desc' },
        });

        // Also fetch existing EVENT_FEEDBACK guides to mark which events already have forms
        const feedbackGuides = await prisma.guide.findMany({
            where: {
                type: 'EVENT_FEEDBACK',
                deletedAt: null,
            },
            select: {
                id: true,
                title: true,
                slug: true,
                body: true,
                createdAt: true,
                _count: { select: { applications: { where: { deletedAt: null } } } },
            },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json({ recentEvents, feedbackGuides });
    } catch (error) {
        console.error('Failed to fetch event feedback data:', error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
