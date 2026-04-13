import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

// Field allowlists — block permissions, status, role, deletedAt, etc.
const ALLOWED_FIELDS: Record<string, string[]> = {
    members: ['name', 'tags', 'customFields', 'xHandle', 'twitterUrl', 'bio'],
    projects: ['name', 'description', 'status', 'tags', 'links', 'coverImage'],
    partners: ['name', 'description', 'status', 'tags', 'links', 'logo', 'website'],
};

function sanitizeBody(table: string, body: Record<string, any>): Record<string, any> {
    const allowed = ALLOWED_FIELDS[table];
    if (!allowed) return body;
    const sanitized: Record<string, any> = {};
    for (const key of allowed) {
        if (key in body) sanitized[key] = body[key];
    }
    return sanitized;
}

const getDelegate = (tableName: string) => {
    switch (tableName) {
        // @ts-ignore
        case 'members': return prisma.communityMember;
        // @ts-ignore
        case 'projects': return prisma.project;
        // @ts-ignore
        case 'partners': return prisma.partner;
        default: return null;
    }
};

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ table: string; id: string }> }
) {
    const { table, id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return new NextResponse('Unauthorized', { status: 401 });

    // Security Check: Only CORE members can update via DataGrid
    // @ts-ignore
    const role = session.user.role;
    if (role !== 'CORE') return new NextResponse('Forbidden', { status: 403 });

    const delegate = getDelegate(table);
    if (!delegate) return new NextResponse('Invalid table', { status: 400 });

    try {
        const body = await request.json();

        // Sanitize: only allow safe fields, block permissions/status/role/deletedAt
        const data = sanitizeBody(table, body);

        const updated = await (delegate as any).update({
            where: { id },
            data: data
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error('Update Error:', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ table: string; id: string }> }
) {
    const { table, id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return new NextResponse('Unauthorized', { status: 401 });

    // Security Check: Only CORE members can delete
    // @ts-ignore
    const role = session.user.role;
    if (role !== 'CORE') return new NextResponse('Forbidden', { status: 403 });

    const delegate = getDelegate(table);
    if (!delegate) return new NextResponse('Invalid table', { status: 400 });

    try {
        // Soft delete instead of hard delete to prevent data loss
        const deleted = await (delegate as any).update({
            where: { id },
            data: { deletedAt: new Date() }
        });

        return NextResponse.json(deleted);
    } catch (error) {
        console.error('Delete Error:', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
