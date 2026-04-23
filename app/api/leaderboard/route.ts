import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { cached } from "@/lib/cache";

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
        const leaderboard = await cached("leaderboard:top100", 60, async () => {
            // Primary: rank by wallet totalXp
            const wallets = await prisma.userWallet.findMany({
                where: { totalXp: { gt: 0 } },
                orderBy: { totalXp: "desc" },
                take: 100,
                select: { userEmail: true, totalXp: true, pointsBalance: true },
            }).catch(() => []);

            if (wallets.length > 0) {
                return wallets.map((w, i) => ({
                    rank: i + 1,
                    email: w.userEmail,
                    totalXp: w.totalXp,
                    pointsBalance: w.pointsBalance,
                }));
            }

            // Fallback: legacy CommunityMember.totalXp
            const members = await prisma.communityMember.findMany({
                where: { totalXp: { gt: 0 }, status: "active", deletedAt: null },
                orderBy: { totalXp: "desc" },
                take: 100,
                select: { id: true, name: true, email: true, totalXp: true },
            });

            return members.map((m, i) => ({
                rank: i + 1,
                id: m.id,
                name: m.name,
                email: m.email,
                totalXp: m.totalXp,
            }));
        });

        return NextResponse.json(leaderboard);
    } catch (error) {
        console.error("Failed to fetch leaderboard:", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
