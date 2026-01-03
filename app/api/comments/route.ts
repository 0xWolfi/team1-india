import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { CommentSchema } from "@/lib/schemas";
import { z } from "zod";

export async function POST(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

    try {
        const body = await request.json();
        const validatedData = CommentSchema.parse(body);

        const comment = await prisma.comment.create({
            data: {
                content: validatedData.content,
                mediaId: validatedData.mediaId,
                authorId: session.user.id
            },
            include: {
                author: {
                    select: {
                        email: true,
                        id: true
                    }
                }
            }
        });

        return NextResponse.json(comment);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return new NextResponse(JSON.stringify({ errors: error.flatten() }), { status: 400 });
        }
        console.error("Failed to create comment", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
