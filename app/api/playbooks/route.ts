import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { PlaybookSchema } from "@/lib/schemas";
import { z } from "zod";
import { checkCoreAccess } from "@/lib/permissions";
import { log } from "@/lib/logger";

export async function GET(request: Request) {
    // CRITICAL SECURITY FIX: Require authentication
    const session = await getServerSession(authOptions);
    const access = checkCoreAccess(session);
    if (!access.authorized) return access.response!;

    try {
        // @ts-ignore
        const role = session.user.role;
        
        // Filter playbooks based on user role and visibility
        const whereClause: any = { deletedAt: null };
        
        // Members can only see MEMBER and PUBLIC playbooks
        // CORE can see all playbooks
        if (role === 'MEMBER') {
            whereClause.visibility = { in: ['MEMBER', 'PUBLIC'] };
        }
        // CORE users can see all (no additional filter)

        const playbooks = await prisma.playbook.findMany({
            where: whereClause,
            orderBy: { updatedAt: 'desc' },
            include: {
                createdBy: { select: { email: true, id: true } },
                lockedBy: { select: { email: true, id: true } }
            }
        });
        return NextResponse.json(playbooks);
    } catch (error) {
        log("ERROR", "Failed to fetch playbooks", "PLAYBOOKS", {
            email: session?.user?.email || "unknown"
        }, error instanceof Error ? error : new Error(String(error)));
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

export async function POST(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

    // Permission Check
    // @ts-ignore
    const userPermissions = session.user.permissions || {};
    // @ts-ignore
    const { hasPermission } = await import("@/lib/permissions");
    
    if (!hasPermission(userPermissions, "playbooks", "WRITE")) {
        return new NextResponse("Forbidden: Insufficient Write Access", { status: 403 });
    }

    try {
        const body = await request.json();
        const validatedData = PlaybookSchema.parse(body);

        const newPlaybook = await prisma.playbook.create({
            data: {
                title: validatedData.title,
                body: [
                    {
                        type: "paragraph",
                        content: []
                    }
                ],
                createdById: session.user.id,
                status: 'draft',
                visibility: validatedData.visibility || 'CORE', 
                coverImage: validatedData.coverImage || null,
                description: validatedData.description || "",
                tags: []
            }
        });

        // Lock for creator
        await prisma.playbook.update({
            where: { id: newPlaybook.id },
            data: { lockedById: session.user.id, lockedAt: new Date() }
        });

        // Audit Log
        try {
            const { logAudit } = await import('@/lib/audit');
            await logAudit({
                action: 'CREATE',
                resource: 'PLAYBOOK',
                resourceId: newPlaybook.id,
                actorId: session.user.id,
                metadata: { title: newPlaybook.title }
            });
        } catch (auditError) {
             console.error("Audit log failed", auditError);
        }

        return NextResponse.json(newPlaybook);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return new NextResponse(JSON.stringify({ errors: error.flatten() }), { status: 400 });
        }
        console.error("Failed to create playbook", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
