import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options"; 
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/logger";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (!session || !session.user?.email) {
        return new NextResponse("Unauthorized", { status: 401 });
    }
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userPermissions = (session.user as any).permissions || {};
    const hasFullAccess = userPermissions['*'] === 'FULL_ACCESS';
    const canManageMembers = hasFullAccess || userPermissions['members'] === 'WRITE';

    if (!canManageMembers) {
        return new NextResponse("Unauthorized. Insufficient permissions.", { status: 403 });
    }

    try {
        const { id } = await params;
        const { status } = await request.json();
        const validStatuses = ['applied', 'approved', 'active', 'paused'];
        
        if (!validStatuses.includes(status)) {
            return new NextResponse("Invalid status value", { status: 400 });
        }

        const updatedMember = await prisma.member.update({
            where: { id },
            data: { status }
        });

        // Log the action
        await logActivity({
            action: "UPDATE",
            entity: "Member",
            entityId: id,
            actorEmail: session.user.email,
            metadata: { field: "status", newValue: status }
        });

        return NextResponse.json(updatedMember);
    } catch (error) {
        console.error("Status Update Error", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
