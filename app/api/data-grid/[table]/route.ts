import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options'; // Fixed path

// Field allowlists per table — only these fields can be written via DataGrid
const ALLOWED_FIELDS: Record<string, string[]> = {
    members: ['name', 'tags', 'customFields', 'xHandle', 'twitterUrl', 'bio'],
    projects: ['name', 'description', 'status', 'tags', 'links', 'coverImage'],
    partners: ['name', 'description', 'status', 'tags', 'links', 'logo', 'website'],
};

function sanitizeBody(table: string, body: Record<string, any>): Record<string, any> {
    const allowed = ALLOWED_FIELDS[table];
    if (!allowed) return body; // unknown table will be rejected by getDelegate anyway
    const sanitized: Record<string, any> = {};
    for (const key of allowed) {
        if (key in body) sanitized[key] = body[key];
    }
    return sanitized;
}

// Helper to map route slug to Prisma model delegate
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


import { checkCoreAccess, hasPermission, PERMISSIONS } from '@/lib/permissions';

// ... (existing imports)

export async function GET(
    request: Request,
    { params }: { params: Promise<{ table: string }> }
) {
    const { table } = await params;
    
    // Security Check
    const session = await getServerSession(authOptions);
    const access = checkCoreAccess(session);
    if (!access.authorized) return access.response!;

    // Permission Check
    // @ts-ignore
    if (!hasPermission(session.user.permissions, table, PERMISSIONS.READ)) {
        return new NextResponse('Insufficient Permissions', { status: 403 });
    }

    const delegate = getDelegate(table);
    if (!delegate) return new NextResponse('Invalid table', { status: 400 });

    try {
        // Fetch data
        const data = await (delegate as any).findMany({
            where: { deletedAt: null },
            orderBy: { createdAt: 'desc' }
        });

        // Fetch config
        // @ts-ignore
        const config = await prisma.tableConfig.findUnique({
            where: { tableName: table }
        });

        return NextResponse.json({ data, config: config?.columns || [] });
    } catch (error) {
        console.error('Fetch Error:', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}

export async function POST(
    request: Request,
    { params }: { params: Promise<{ table: string }> }
) {
    const { table } = await params;
    
    // Security Check
    const session = await getServerSession(authOptions);
    const access = checkCoreAccess(session);
    if (!access.authorized) return access.response!;

    // Permission Check
    // @ts-ignore
    if (!hasPermission(session.user.permissions, table, PERMISSIONS.WRITE)) {
        return new NextResponse('Insufficient Permissions. Write Access Required.', { status: 403 });
    }

    const delegate = getDelegate(table);
    if (!delegate) return new NextResponse('Invalid table', { status: 400 });

    try {
        const body = await request.json();
        
        // Handle batch creation if array
        if (Array.isArray(body)) {
             const created = await Promise.all(body.map(async (item) => {
                return (delegate as any).create({
                    data: {
                        ...sanitizeBody(table, item),
                        ...(table !== 'members' ? {
                            // @ts-ignore
                            createdBy: { connect: { email: session.user.email } }
                        } : {})
                    }
                });
             }));
             return NextResponse.json(created);
        }

        // Single creation
        const newItem = await (delegate as any).create({
            data: {
                ...sanitizeBody(table, body),
                 ...(table !== 'members' ? {
                    // @ts-ignore
                    createdBy: { connect: { email: session.user.email } }
                } : {})
            }
        });

        return NextResponse.json(newItem);
    } catch (error) {
        console.error('DataGrid POST Error:', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}

