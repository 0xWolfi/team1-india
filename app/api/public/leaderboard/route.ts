import { NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        // Get all approved submissions for public-audience bounties
        const submissions = await prisma.bountySubmission.findMany({
            where: {
                status: 'approved',
                deletedAt: null,
                bounty: { audience: 'public' },
                publicUserId: { not: null },
            },
            select: {
                xpAwarded: true,
                publicUserId: true,
                publicUser: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                    }
                }
            }
        });

        // Aggregate XP per public user
        const userMap = new Map<string, {
            id: string;
            name: string | null;
            email: string;
            totalXp: number;
            completedBounties: number;
        }>();

        for (const sub of submissions) {
            if (!sub.publicUserId || !sub.publicUser) continue;
            const existing = userMap.get(sub.publicUserId);
            if (existing) {
                existing.totalXp += sub.xpAwarded || 0;
                existing.completedBounties += 1;
            } else {
                userMap.set(sub.publicUserId, {
                    id: sub.publicUser.id,
                    name: sub.publicUser.fullName,
                    email: sub.publicUser.email,
                    totalXp: sub.xpAwarded || 0,
                    completedBounties: 1,
                });
            }
        }

        // Sort by XP descending
        const leaderboard = Array.from(userMap.values())
            .sort((a, b) => b.totalXp - a.totalXp)
            .map((entry, index) => ({ ...entry, rank: index + 1 }));

        return NextResponse.json(leaderboard);
    } catch (error) {
        console.error("Failed to fetch public leaderboard:", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
