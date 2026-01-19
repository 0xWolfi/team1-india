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
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '50');
        const search = searchParams.get('search') || '';
        const visibility = searchParams.get('visibility') || 'ALL';
        const offset = (page - 1) * limit;

        // @ts-ignore
        const role = session.user.role;
        
        // Filter playbooks based on user role and visibility
        const whereClause: any = { 
            deletedAt: null,
            ...(search && {
                OR: [
                    { title: { contains: search, mode: 'insensitive' } },
                    { description: { contains: search, mode: 'insensitive' } }
                ]
            })
        };
        
        // Members can only see MEMBER and PUBLIC playbooks
        // CORE can see all playbooks
        if (role === 'MEMBER') {
            whereClause.visibility = { in: ['MEMBER', 'PUBLIC'] };
        }

        // Apply Visibility Filter if requested (and allowed)
        if (visibility !== 'ALL') {
             if (role === 'MEMBER' && visibility === 'CORE') {
                 // Member asking for CORE -> Deny/Empty
                 return NextResponse.json({ data: [], pagination: { total: 0, page, limit, totalPages: 0 } });
             }
             whereClause.visibility = visibility;
        }

        const [playbooks, total] = await Promise.all([
            prisma.playbook.findMany({
                where: whereClause,
                orderBy: { updatedAt: 'desc' },
                take: limit,
                skip: offset,
                include: {
                    createdBy: { select: { email: true, id: true } },
                    lockedBy: { select: { email: true, id: true } }
                }
            }),
            prisma.playbook.count({ where: whereClause })
        ]);

        return NextResponse.json({
            data: playbooks,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
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
