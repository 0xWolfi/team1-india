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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userPermissions = (session.user as any).permissions || {};
    const hasFullAccess = userPermissions['*'] === 'FULL_ACCESS' || userPermissions['default'] === 'FULL_ACCESS';
    const hasWriteAccess = hasFullAccess || userPermissions['default'] === 'WRITE';

    // Allow WRITE or FULL_ACCESS to manage tags? Let's say WRITE is enough for tags.
    if (!hasWriteAccess) {
         return new NextResponse("Unauthorized. Requires WRITE access.", { status: 403 });
    }

    try {
        const { id } = await params;
        const { tags } = await request.json();
        
        if (!Array.isArray(tags)) {
            return new NextResponse("Invalid tags format. Must be array.", { status: 400 });
        }

        const updatedMember = await prisma.member.update({
            where: { id },
            data: { tags }
        });

        await logActivity({
            action: "UPDATE",
            entity: "Member",
            entityId: id,
            actorEmail: session.user.email,
            metadata: { field: "tags", newValue: tags }
        });

        return NextResponse.json(updatedMember);
    } catch (error) {
        console.error("Tags Update Error", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
