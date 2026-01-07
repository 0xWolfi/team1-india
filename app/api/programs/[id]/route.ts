
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { ProgramSchema } from "@/lib/schemas";
import { z } from "zod";


export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return new NextResponse("Unauthorized", { status: 401 });

    try {
        const program = await prisma.program.findUnique({
            where: { id }
        });
        if (!program) return new NextResponse("Not Found", { status: 404 });
        return NextResponse.json(program);
    } catch (error) {
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

    try {
        const body = await req.json();
        // Allow partial updates, so we don't strictly parse full schema or use .partial()
        // But ProgramSchema has defaults. Let's use clean partial logic manually or via zod
        const validatedData = ProgramSchema.partial().parse(body);

        const program = await prisma.program.update({
            where: { id },
            data: validatedData
        });
        return NextResponse.json(program);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return new NextResponse(JSON.stringify({ errors: error.flatten() }), { status: 400 });
        }
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

    try {
        await prisma.program.delete({
            where: { id }
        });
        return new NextResponse(null, { status: 204 });
    } catch (error) {
        return new NextResponse("Internal Error", { status: 500 });
    }
}

