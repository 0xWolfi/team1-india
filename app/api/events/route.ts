import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return new NextResponse("Unauthorized", { status: 401 });

    try {
        const events = await prisma.event.findMany({
            orderBy: { createdAt: 'desc' },
            include: { createdBy: { select: { email: true } } }
        });
        return NextResponse.json(events);
    } catch (error) {
        return new NextResponse("Internal Error", { status: 500 });
    }
}

import { EventSchema } from "@/lib/schemas";
import { z } from "zod";

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

    try {
        const body = await req.json();
        // Server-side Zod Validation
        const validatedData = EventSchema.parse(body);

        const event = await prisma.event.create({
            data: {
                ...validatedData,
                createdById: session.user.id
            }
        });
        return NextResponse.json(event);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return new NextResponse(JSON.stringify({ errors: error.flatten() }), { status: 400 });
        }
        console.error(error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
