
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = await params;
    
    try {
        const body = await request.json();
        const user = await prisma.member.findUnique({ where: { email: session.user.email } });
        if (!user) return new NextResponse("User not found", { status: 404 });

        const updated = await prisma.operation.update({
            where: { id },
            data: {
                title: body.title,
                status: body.status,
                dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
                timeEstimate: body.timeEstimate,
                timeLogged: body.timeLogged,
                assigneeId: body.assigneeId,
                links: body.links
            }
        });

        // Audit Log
        const { logAudit } = await import('@/lib/audit');
        await logAudit({
            action: 'UPDATE',
            resource: 'OPERATION',
            resourceId: id,
            actorId: user.id,
            metadata: { status: updated.status, timeLogged: updated.timeLogged }
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error("Failed to update operation", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = await params;

    try {
        const user = await prisma.member.findUnique({ where: { email: session.user.email } });
        if (!user) return new NextResponse("User not found", { status: 404 });

        await prisma.operation.delete({ where: { id } });

        // Audit Log
        const { logAudit } = await import('@/lib/audit');
        await logAudit({
            action: 'DELETE',
            resource: 'OPERATION',
            resourceId: id,
            actorId: user.id
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to delete operation", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
