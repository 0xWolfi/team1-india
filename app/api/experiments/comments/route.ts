
import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options"; 
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
    // CRITICAL SECURITY FIX: Require authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const experimentId = searchParams.get('experimentId');

    if (!experimentId) return new NextResponse("Missing experimentId", { status: 400 });

    try {
        const comments = await prisma.experimentComment.findMany({
            where: { experimentId },
            orderBy: { createdAt: 'desc' },
            include: { 
                author: { select: { email: true } } 
            }
        });
        return NextResponse.json(comments);
    } catch (error) {
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function POST(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) return new NextResponse("Unauthorized", { status: 401 });

    try {
        const body = await request.json();
        const { experimentId, text } = body;

        if (!experimentId || !text) return new NextResponse("Invalid Data", { status: 400 });

        const member = await prisma.member.findUnique({ where: { email: session.user.email } });
        if (!member) return new NextResponse("Forbidden", { status: 403 });

        const comment = await prisma.experimentComment.create({
            data: {
                body: text,
                experimentId,
                authorId: member.id,
            },
            include: {
                author: { select: { email: true } }
            }
        });

        return NextResponse.json(comment);
    } catch (error) {
        return new NextResponse("Internal Error", { status: 500 });
    }
}
