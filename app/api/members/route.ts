import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options"; 
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) return new NextResponse("Unauthorized", { status: 401 });

    // Only Core or Superadmin can view directory properly, but let's allow read for now
    // Ideally check roles here

    try {
        const members = await prisma.member.findMany({
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                email: true,
                permissions: true,
                tags: true,
                status: true,
                createdAt: true,
                customFields: true
            }
        });

        return NextResponse.json(members);
    } catch (error) {
        console.error("Members Fetch Error", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function POST(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) return new NextResponse("Unauthorized", { status: 401 });

    // Check permissions (Full Access required to create members directly)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userPermissions = (session.user as any).permissions || {};
    const hasFullAccess = userPermissions['*'] === 'FULL_ACCESS' || userPermissions['default'] === 'FULL_ACCESS';

    if (!hasFullAccess) {
         return new NextResponse("Unauthorized. Requires FULL_ACCESS.", { status: 403 });
    }

    try {
        const { email, permissions, tags } = await request.json();

        if (!email) return new NextResponse("Email is required", { status: 400 });

        const newMember = await prisma.member.create({
            data: {
                email,
                permissions: permissions || { default: "READ" },
                tags: tags || [],
                status: "active", // Auto-activate manually added members
            }
        });

        return NextResponse.json(newMember);
    } catch (error) {
        console.error("Member Create Error", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function DELETE(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) return new NextResponse("Unauthorized", { status: 401 });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userPermissions = (session.user as any).permissions || {};
    const hasFullAccess = userPermissions['*'] === 'FULL_ACCESS';

    if (!hasFullAccess) {
        return new NextResponse("Unauthorized. Requires Superadmin access.", { status: 403 });
    }

    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) return new NextResponse("ID is required", { status: 400 });

        await prisma.member.delete({
            where: { id }
        });

        return new NextResponse("Deleted", { status: 200 });
    } catch (error) {
        console.error("Member Delete Error", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
