import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options'; // Fixed path

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
                        ...item,
                        // Ensure relation connection if needed (e.g. createdBy)
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
                ...body,
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

