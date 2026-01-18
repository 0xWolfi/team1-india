import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options"; 
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/logger";
import { z } from "zod";

// Strict validation schema to prevent permission injection attacks
const PermissionsSchema = z.record(z.string(), z.enum(["READ", "WRITE", "FULL_ACCESS", "DENY"]));

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
        const body = await request.json();
        
        // Strict validation with Zod to prevent mass assignment and injection
        const validationResult = PermissionsSchema.safeParse(body.permissions);
        if (!validationResult.success) {
            return new NextResponse(
                JSON.stringify({ error: "Invalid permissions format", details: validationResult.error.flatten() }), 
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }
        
        const permissions = validationResult.data;

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
