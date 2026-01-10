
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        console.log(`[API] GET /api/playbooks/${id}`);
        const playbook = await prisma.playbook.findUnique({
            where: { id },
            include: {
                createdBy: { select: { email: true, id: true } },
                lockedBy: { select: { email: true, id: true } }
            }
        });

        if (!playbook) {
            console.warn(`[API] GET /api/playbooks/${id} - Not Found`);
            return new NextResponse("Not found", { status: 404 });
        }

        return NextResponse.json(playbook);
    } catch (error) {
        console.error(`[API] GET /api/playbooks/FAILED`, error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);
    const { id } = await params;
    console.log(`[API] PUT /api/playbooks/${id} - Initiated by ${session?.user?.email}`);

    if (!session || !session.user?.email) {
        console.warn(`[API] PUT /api/playbooks/${id} - Unauthorized`);
        return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await request.json();
    console.log(`[API] PUT /api/playbooks/${id} - Request Body:`, JSON.stringify({ 
        ...body, 
        body: body.body ? '(content hidden)' : undefined 
    }));
    
    // Permission Check
    // @ts-ignore
    const userPermissions = session.user.permissions || {};
    // @ts-ignore
    const { hasPermission } = await import("@/lib/permissions");
    
    if (!hasPermission(userPermissions, "playbook", "WRITE")) {
        return new NextResponse("Forbidden: Insufficient Write Access", { status: 403 });
    }
    
    // Validate lock ownership
    const user = await prisma.member.findUnique({ where: { email: session.user.email } });
    const playbook = await prisma.playbook.findUnique({ where: { id } });
    
    if (!playbook || !user) {
        console.error(`[API] PUT /api/playbooks/${id} - Playbook or User not found`);
        return new NextResponse("Not found", { status: 404 });
    }

    // Allow update if locked by self OR not locked (auto-acquire?)
    // Stricter: Must be locked by self.
    if (playbook.lockedById && playbook.lockedById !== user.id) {
         console.warn(`[API] PUT /api/playbooks/${id} - Optimization Conflict. Locked by ${playbook.lockedById}`);
         return new NextResponse("Locked by another user", { status: 409 });
    }

    try {
        console.log(`[API] PUT /api/playbooks/${id} - Executing Update...`);
        // Update Playbook
        const updated = await prisma.playbook.update({
            where: { id },
            data: {
                body: body.body, // Update content
                title: body.title, // Update title
                visibility: body.visibility, // Update visibility
                coverImage: body.coverImage, // Update cover image
                description: body.description, // Update description
                version: { increment: 1 }, // Increment version
                lockedById: null, // Release lock on save
                lockedAt: null, // Release lock on save
                

            }
        });

        const { logAudit } = await import('@/lib/audit');
        await logAudit({
            action: 'UPDATE',
            resource: 'PLAYBOOK',
            resourceId: id,
            actorId: user.id,
            metadata: { 
                version: updated.version,
                visibility: body.visibility
            }
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error("Failed to update playbook", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 }); // I assumed I updated this in previous turn but regex might fail if I didn't. 
    }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);
    const { id } = await params;
    console.log(`[API] DELETE /api/playbooks/${id} - Initiated by ${session?.user?.email}`);

    if (!session || !session.user?.email) {
        console.warn(`[API] DELETE /api/playbooks/${id} - Unauthorized`);
        return new NextResponse("Unauthorized", { status: 401 });
    }

    const user = await prisma.member.findUnique({ where: { email: session.user.email } });
    
    if (!user) {
        console.error(`[API] DELETE /api/playbooks/${id} - User not found`);
        return new NextResponse("User not found", { status: 404 });
    }

    // Check permissions
    // @ts-ignore
    const userPermissions = session.user.permissions || {};
    // @ts-ignore
    const { hasPermission } = await import("@/lib/permissions");

    if (!hasPermission(userPermissions, "playbook", "WRITE")) { // Using WRITE for delete as well per request implied "write access"
        console.warn(`[API] DELETE /api/playbooks/${id} - Forbidden. Missing permissions.`);
        return new NextResponse("Forbidden: Insufficient permissions", { status: 403 });
    }

    try {
        // Find existing to verify it exists first
        const existing = await prisma.playbook.findUnique({ where: { id } });
        if (!existing) return new NextResponse("Not Found", { status: 404 });

        await prisma.playbook.delete({
            where: { id }
        });
        
        console.log(`[API] DELETE /api/playbooks/${id} - Success`);

        const { logAudit } = await import('@/lib/audit');
        await logAudit({
            action: 'DELETE',
            resource: 'PLAYBOOK',
            resourceId: id,
            actorId: user.id,
            metadata: { title: existing.title }
        });
        
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error(`[API] DELETE /api/playbooks/${id} - Failed`, error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
