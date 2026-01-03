import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options"; 
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/logger";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);
    
    // Check if user is logged in
    if (!session || !session.user?.email) {
        return new NextResponse("Unauthorized", { status: 403 });
    }

    // Check if user has FULL_ACCESS
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userPermissions = (session.user as any).permissions || {};
    const hasFullAccess = userPermissions['*'] === 'FULL_ACCESS' || userPermissions['default'] === 'FULL_ACCESS';

    if (!hasFullAccess) {
         return new NextResponse("Unauthorized. Requires FULL_ACCESS.", { status: 403 });
    }

    try {
        const { id } = await params;
        const { permissions } = await request.json();
        
        // Basic validation: ensure it's an object
        if (typeof permissions !== 'object') {
            return new NextResponse("Invalid permissions format", { status: 400 });
        }

        const updatedMember = await prisma.member.update({
            where: { id },
            data: { permissions }
        });

        // Log the action
        await logActivity({
            action: "UPDATE",
            entity: "Member",
            entityId: id,
            actorEmail: session.user.email,
            metadata: { field: "permissions", newValue: permissions }
        });

        return NextResponse.json(updatedMember);
    } catch (error) {
        console.error("Permissions Update Error", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
