import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return new NextResponse("Unauthorized", { status: 401 });

    // @ts-ignore
    const role = session.user.role;
    if (role !== 'CORE' && role !== 'MEMBER') {
        return new NextResponse("Forbidden", { status: 403 });
    }

    try {
        const content = await prisma.contentResource.findMany({
            orderBy: { createdAt: 'desc' },
            include: { createdBy: { select: { email: true } } }
        });
        return NextResponse.json(content);
    } catch (error) {
        console.error("GET /api/content error:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

import { ContentSchema } from "@/lib/schemas";
import { z } from "zod";

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

    try {
        const body = await req.json();
        const validatedData = ContentSchema.parse(body);

        const item = await prisma.contentResource.create({
            data: {
                ...validatedData,
                createdById: session.user.id
            }
        });
        return NextResponse.json(item);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return new NextResponse(JSON.stringify({ errors: error.flatten() }), { status: 400 });
        }
        console.error(error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
