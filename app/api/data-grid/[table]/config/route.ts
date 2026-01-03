import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export async function POST(
    request: Request,
    { params }: { params: Promise<{ table: string }> }
) {
    const { table } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return new NextResponse('Unauthorized', { status: 401 });

    try {
        const { columns } = await request.json();

        const config = await prisma.tableConfig.upsert({
            where: { tableName: table },
            update: { columns },
            create: { tableName: table, columns }
        });

        return NextResponse.json(config);
    } catch (error) {
        console.error('Config Error:', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
