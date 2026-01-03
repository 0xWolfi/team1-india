import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { MediaItemSchema } from "@/lib/schemas";
import { z } from "zod";

export async function GET(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const whereClause: any = {
            deletedAt: null,
        };
        
        if (status && status !== 'ALL') {
             whereClause.status = status;
        }

        const items = await prisma.mediaItem.findMany({
            where: whereClause,
            include: {
                createdBy: {
                    select: { email: true, id: true }
                },
                _count: {
                    select: { posts: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(items);
    } catch (error) {
        console.error("Failed to fetch media items", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

export async function POST(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

    try {
        const body = await request.json();
        const validatedData = MediaItemSchema.parse(body);

        const newItem = await prisma.mediaItem.create({
            data: {
                title: validatedData.title,
                description: validatedData.description || "",
                platform: validatedData.platform,
                links: validatedData.links,
                status: 'draft',
                createdById: session.user.id
            }
        });

        // Audit Log
        await prisma.auditLog.create({
            data: {
                action: 'CREATE',
                resource: 'MediaItem',
                resourceId: newItem.id,
                actorId: session.user.id,
                mediaItemId: newItem.id,
                metadata: { title: validatedData.title }
            }
        });

        return NextResponse.json(newItem);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return new NextResponse(JSON.stringify({ errors: error.flatten() }), { status: 400 });
        }
        console.error("Failed to create media item", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
