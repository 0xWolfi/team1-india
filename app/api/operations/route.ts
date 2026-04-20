
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const status = searchParams.get('status');

    try {
        const operations = await prisma.operation.findMany({
            where: {
                ...(type ? { type } : {}),
                ...(status ? { status } : {})
            },
            include: {
                assignee: { select: { id: true, email: true, tags: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json(operations);
    } catch (error) {
        console.error("Failed to fetch operations", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

export async function POST(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
        return new NextResponse("Unauthorized", { status: 401 });
    }
    if (session.user.role !== 'CORE') {
        return new NextResponse("Forbidden", { status: 403 });
    }

    try {
        const body = await request.json();
        const user = await prisma.member.findUnique({ where: { email: session.user.email } });
        
        if (!user) return new NextResponse("User not found", { status: 404 });

        const operation = await prisma.operation.create({
            data: {
                title: body.title || "Untitled Task",
                type: body.type || "task", // task, meeting
                status: body.status || "todo",
                dueDate: body.dueDate ? new Date(body.dueDate) : null,
                timeEstimate: body.timeEstimate ? parseInt(body.timeEstimate) : 0,
                timeLogged: 0,
                assigneeId: body.assigneeId || user.id, // Default to self
                links: body.links || []
            }
        });

        // Audit Log
        const { logAudit } = await import('@/lib/audit');
        await logAudit({
            action: 'CREATE',
            resource: 'OPERATION',
            resourceId: operation.id,
            actorId: user.id,
            metadata: { title: operation.title, type: operation.type }
        });

        return NextResponse.json(operation);
    } catch (error) {
        console.error("Failed to create operation", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
