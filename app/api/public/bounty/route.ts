import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";

// GET — list active public-audience bounties
export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const bounties = await prisma.bounty.findMany({
            where: { deletedAt: null, status: 'active', audience: 'public' },
            orderBy: { createdAt: 'desc' },
            include: {
                _count: { select: { submissions: { where: { deletedAt: null } } } }
            }
        });

        return NextResponse.json(bounties);
    } catch (error) {
        console.error("Failed to fetch public bounties:", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
