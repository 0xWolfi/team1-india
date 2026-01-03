
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = await params;
    const userEmail = session.user.email;
    
    // Find the user ID
    const user = await prisma.member.findUnique({
        where: { email: userEmail }
    });
    
    if (!user) return new NextResponse("User not found", { status: 404 });

    try {
        const playbook = await prisma.playbook.findUnique({
            where: { id },
             include: { lockedBy: true }
        });

        if (!playbook) return new NextResponse("Playbook not found", { status: 404 });

        // Check if locked by someone else
        // We consider a lock valid if it's less than 5 minutes old (heartbeat)
        const LOCK_TIMEOUT_MS = 5 * 60 * 1000;
        const now = new Date();
        const isLocked = playbook.lockedById && 
                         playbook.lockedById !== user.id && 
                         playbook.lockedAt && 
                         (now.getTime() - new Date(playbook.lockedAt).getTime() < LOCK_TIMEOUT_MS);

        if (isLocked) {
             return NextResponse.json({ 
                 success: false, 
                 lockedBy: playbook.lockedBy?.email
             }, { status: 409 });
        }

        // Acquire lock
        await prisma.playbook.update({
            where: { id },
            data: {
                lockedById: user.id,
                lockedAt: new Date()
            }
        });

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("Failed to lock playbook", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
