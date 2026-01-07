import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

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
        
        // Data Handling
        let data = { ...body };
        // Removed: special handling for tags array conversion (now scalar)

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
        // Hard delete
        const deleted = await (delegate as any).delete({
            where: { id }
        });

        return NextResponse.json(deleted);
    } catch (error) {
        console.error('Delete Error:', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
