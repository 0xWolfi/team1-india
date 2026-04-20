import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { MediaItemSchema } from "@/lib/schemas";
import { z } from "zod";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });
    const { id } = await params;

    try {
        const body = await request.json();
        // Allow partial updates
        const validatedData = MediaItemSchema.parse(body);

        // Fetch current item and check ownership
        const currentItem = await prisma.mediaItem.findUnique({
            where: { id },
            select: { status: true, createdById: true }
        });

        if (!currentItem) return new NextResponse("Not Found", { status: 404 });

        // Only the creator or CORE users can edit
        if (currentItem.createdById !== session.user.id && session.user.role !== 'CORE') {
            return new NextResponse("Forbidden", { status: 403 });
        }

        // Only allow edits in Draft or Needs Edit
        const editableStatuses = ['draft', 'needs_edit'];
        if (!editableStatuses.includes(currentItem.status || 'draft')) {
             return new NextResponse("Cannot edit item in current status", { status: 403 });
        }

        const updatedItem = await prisma.mediaItem.update({
            where: { id },
            data: {
                title: validatedData.title,
                description: validatedData.description || "",
                platform: validatedData.platform,
                links: validatedData.links,
            }
        });

        // Audit Log
        await prisma.auditLog.create({
            data: {
                action: 'UPDATE',
                resource: 'MediaItem',
                resourceId: id,
                actorId: session.user.id,
                mediaItemId: id,
                metadata: { changes: body }
            }
        });

        return NextResponse.json(updatedItem);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return new NextResponse(JSON.stringify({ errors: error.flatten() }), { status: 400 });
        }
        console.error("Failed to update media item", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return new NextResponse("Unauthorized", { status: 401 });
    const { id } = await params;

    try {
        const item = await prisma.mediaItem.findUnique({
            where: { id },
            include: {
                createdBy: { select: { id: true, email: true } },
                posts: {
                     take: 10,
                     orderBy: { postedAt: 'desc' }
                },
                comments: {
                    take: 20, // Limit to recent 20 comments
                    include: {
                        author: { select: { id: true, email: true } }
                    },
                    orderBy: { createdAt: 'desc' } // Newest first
                },
                auditLogs: {
                    take: 10, // Limit audit usage
                    include: {
                        actor: { select: { id: true, email: true } }
                    },
                    orderBy: { createdAt: 'desc' }
                }
            }
        });

        if (!item) return new NextResponse("Not Found", { status: 404 });
        
        // Reverse comments for UI if needed or handle client-side
        // For now, returning newest first is safer for memory.
        return NextResponse.json(item);
    } catch (error) {
        console.error(error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });
    const { id } = await params;

    try {
        // Check ownership
        const item = await prisma.mediaItem.findUnique({
            where: { id },
            select: { createdById: true }
        });
        if (!item) return new NextResponse("Not Found", { status: 404 });
        if (item.createdById !== session.user.id && session.user.role !== 'CORE') {
            return new NextResponse("Forbidden", { status: 403 });
        }

        await prisma.mediaItem.update({
            where: { id },
            data: { deletedAt: new Date() }
        });

         // Audit Log
         await prisma.auditLog.create({
            data: {
                action: 'DELETE',
                resource: 'MediaItem',
                resourceId: id,
                actorId: session.user.id,
                mediaItemId: id,
            }
        });

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error("Failed to delete media item", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
