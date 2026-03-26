import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";

const getCachedLeaderboardData = unstable_cache(
    () => prisma.bountySubmission.findMany({
        where: { status: 'approved', deletedAt: null, bounty: { audience: 'member' } },
        select: {
            xpAwarded: true,
            submittedById: true,
            submittedBy: {
                select: { id: true, name: true }
            }
        }
    }),
    ["member-leaderboard"],
    { revalidate: 300 }
);

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
        // Get all approved submissions for member-audience bounties only
        const submissions = await getCachedLeaderboardData() as any[];

        // Aggregate XP per member
        const memberMap = new Map<string, {
            id: string;
            name: string | null;
            email: string;
            totalXp: number;
            completedBounties: number;
        }>();

        for (const sub of submissions) {
            if (!sub.submittedById || !sub.submittedBy) continue;
            const existing = memberMap.get(sub.submittedById);
            if (existing) {
                existing.totalXp += sub.xpAwarded || 0;
                existing.completedBounties += 1;
            } else {
                memberMap.set(sub.submittedById, {
                    id: sub.submittedBy.id,
                    name: sub.submittedBy.name,
                    email: sub.submittedBy.email,
                    totalXp: sub.xpAwarded || 0,
                    completedBounties: 1,
                });
            }
        }

        // Sort by XP descending
        const leaderboard = Array.from(memberMap.values())
            .sort((a, b) => b.totalXp - a.totalXp)
            .map((entry, index) => ({ ...entry, rank: index + 1 }));

        return NextResponse.json(leaderboard);
    } catch (error) {
        console.error("Failed to fetch leaderboard:", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
