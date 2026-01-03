import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { MediaStatusSchema } from "@/lib/schemas";
import { z } from "zod";

// Strict State Machine
const TRANSITIONS: Record<string, string[]> = {
    'draft': ['pending_approval'],
    'needs_edit': ['pending_approval', 'draft'], 
    'pending_approval': ['approved', 'needs_edit'],
    'approved': ['posted', 'needs_edit'], 
    'posted': [] // End state
};

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });
    const { id } = await params;

    try {
        const body = await request.json();
        const validatedData = MediaStatusSchema.parse(body);
        const { status: newStatus, postUrl } = validatedData;

        const currentItem = await prisma.mediaItem.findUnique({
            where: { id },
        });

        if (!currentItem) return new NextResponse("Not Found", { status: 404 });

        const oldStatus = currentItem.status || 'draft';

        // 1. Validate Transition
        const allowedTargets = TRANSITIONS[oldStatus] || [];
        if (!allowedTargets.includes(newStatus)) {
            return new NextResponse(`Invalid transition from ${oldStatus} to ${newStatus}`, { status: 400 });
        }

        // 2. Permission Checks (Admin only for Approval)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const userPerms = (session.user as any).permissions || {};
        const isAdmin = userPerms['*'] === 'FULL_ACCESS'; 

        if ((newStatus === 'approved' || newStatus === 'needs_edit') && !isAdmin && oldStatus === 'pending_approval') {
             return new NextResponse("Only admins can approve or request edits", { status: 403 });
        }

        // 3. Special Logic for 'posted'
        if (newStatus === 'posted') {
            if (!postUrl) return new NextResponse("Post URL is required to mark as Posted", { status: 400 });
            
            // Create MediaPost record
            await prisma.mediaPost.create({
                data: {
                    mediaId: id,
                    postUrl,
                    postedAt: new Date()
                }
            });
        }

        // 4. Update Status
        const updatedItem = await prisma.mediaItem.update({
            where: { id },
            data: { status: newStatus }
        });

        // 5. Audit Log
        await prisma.auditLog.create({
            data: {
                action: 'STATUS_CHANGE',
                resource: 'MediaItem',
                resourceId: id,
                actorId: session.user.id,
                mediaItemId: id,
                metadata: { from: oldStatus, to: newStatus, postUrl }
            }
        });

        return NextResponse.json(updatedItem);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return new NextResponse(JSON.stringify({ errors: error.flatten() }), { status: 400 });
        }
        console.error("Failed to update media status", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
