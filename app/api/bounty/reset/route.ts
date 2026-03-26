import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { log } from "@/lib/logger";

// DELETE — reset all bounty data (CORE only)
export async function DELETE() {
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
        // Run all resets in a transaction
        const result = await prisma.$transaction(async (tx) => {
            // 1. Delete all bounty submissions
            const deletedSubmissions = await tx.bountySubmission.deleteMany({});

            // 2. Delete all bounties
            const deletedBounties = await tx.bounty.deleteMany({});

            // 3. Reset totalXp to 0 for all community members
            const resetXp = await tx.communityMember.updateMany({
                where: { totalXp: { gt: 0 } },
                data: { totalXp: 0 },
            });

            return {
                deletedSubmissions: deletedSubmissions.count,
                deletedBounties: deletedBounties.count,
                resetMembers: resetXp.count,
            };
        });

        log("INFO", "Bounty data reset", "BOUNTY", {
            deletedSubmissions: result.deletedSubmissions,
            deletedBounties: result.deletedBounties,
            resetMembers: result.resetMembers,
            resetBy: session.user.email,
        });

        return NextResponse.json({ success: true, ...result });
    } catch (error) {
        log("ERROR", "Failed to reset bounty data", "BOUNTY", {}, error instanceof Error ? error : new Error(String(error)));
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
