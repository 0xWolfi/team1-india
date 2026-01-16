import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options"; 
import { prisma } from "@/lib/prisma";
import { checkCoreAccess, hasPermission, PERMISSIONS } from "@/lib/permissions";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    
    // Only CORE users can view individual member details
    if (!session?.user?.email) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    // @ts-ignore
    const role = session.user.role;
    if (role !== 'CORE') {
        return new NextResponse("Forbidden", { status: 403 });
    }

    try {
        const { id } = await params;
        const member = await prisma.communityMember.findUnique({
            where: { id },
            select: {
                id: true,
                email: true,
                tags: true,
                status: true,
                createdAt: true,
                updatedAt: true,
                name: true,
                xHandle: true,
                telegram: true,
                customFields: true
            }
        });

        if (!member) {
            return new NextResponse("Member not found", { status: 404 });
        }

        return NextResponse.json(member);
    } catch (error) {
        console.error("Community Member Fetch Error", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    const access = checkCoreAccess(session);
    if (!access.authorized) return access.response!;

    // @ts-ignore
    const userPermissions = session.user.permissions || {};
    const isSuperAdmin = userPermissions['*'] === 'FULL_ACCESS';

    // Only superadmins can change member roles
    if (!isSuperAdmin) {
        return new NextResponse("Only Superadmins can change member roles", { status: 403 });
    }

    try {
        const { id } = await params;
        const body = await request.json();
        const { tags } = body;

        if (!tags || (tags !== 'member' && tags !== 'collaborator')) {
            return new NextResponse("Invalid role. Must be 'member' or 'collaborator'", { status: 400 });
        }

        const updatedMember = await prisma.communityMember.update({
            where: { id },
            data: { tags },
            select: {
                id: true,
                email: true,
                tags: true,
                status: true,
                name: true,
                xHandle: true,
                telegram: true,
                customFields: true
            }
        });

        return NextResponse.json(updatedMember);
    } catch (error) {
        console.error("Community Member Update Error", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
