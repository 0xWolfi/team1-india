
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
    
    const user = await prisma.member.findUnique({
        where: { email: userEmail }
    });
    
    if (!user) return new NextResponse("User not found", { status: 404 });

    try {
        const playbook = await prisma.playbook.findUnique({ where: { id } });
        if (!playbook) return new NextResponse("Playbook not found", { status: 404 });

        // Check permissions (Superadmin or Owner)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const permissions = (user.permissions as any) || {};
        const isSuperAdmin = permissions['*'] === 'FULL_ACCESS';

        if (playbook.lockedById !== user.id && playbook.lockedById !== null && !isSuperAdmin) {
             // Optional: Allow force unlock if > 5 mins
             const LOCK_TIMEOUT_MS = 5 * 60 * 1000;
             const now = new Date();
             const isExpired = playbook.lockedAt && (now.getTime() - new Date(playbook.lockedAt).getTime() > LOCK_TIMEOUT_MS);
             
             if (!isExpired) {
                return new NextResponse("Locked by someone else", { status: 403 });
             }
        }

        await prisma.playbook.update({
            where: { id },
            data: {
                lockedById: null,
                lockedAt: null
            }
        });

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("Failed to unlock playbook", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
