import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options"; 
import { prisma } from "@/lib/prisma";
import { checkCoreAccess, hasPermission, PERMISSIONS } from "@/lib/permissions";

export async function GET(request: Request) {
    const session = await getServerSession(authOptions);
    
    // Allow both CORE and MEMBER roles to access
    if (!session?.user?.email) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    // @ts-ignore
    const role = session.user.role;
    if (role !== 'CORE' && role !== 'MEMBER') {
        return new NextResponse("Forbidden", { status: 403 });
    }

    try {
        const members = await prisma.communityMember.findMany({
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                email: true,
                tags: true,
                status: true,
                createdAt: true,
                name: true,
                xHandle: true,
                telegram: true
            }
        });

        return NextResponse.json(members);
    } catch (error) {
        console.error("Community Members Fetch Error", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function POST(request: Request) {
    const session = await getServerSession(authOptions);
    const access = checkCoreAccess(session);
    if (!access.authorized) return access.response!;

    // @ts-ignore
    if (!hasPermission(session.user.permissions, 'members', PERMISSIONS.WRITE)) {
        return new NextResponse("Insufficient Permissions. Write Access Required.", { status: 403 });
    }

    try {
        const { email, tags, name, telegram, xHandle } = await request.json();

        if (!email || !name || !telegram || !xHandle) {
            return new NextResponse("Missing required fields: Email, Name, Telegram, and X Handle are mandatory.", { status: 400 });
        }

        // CROSS-CHECK: Ensure not in Team (Member table)
        const existingTeamMember = await prisma.member.findUnique({ where: { email } });
        if (existingTeamMember) {
            return new NextResponse("Email already exists in Team (Core Admin). Cannot add to Community.", { status: 409 });
        }

        // Check if already in Community
        const existingCommunityMember = await prisma.communityMember.findUnique({ where: { email } });
        if (existingCommunityMember) {
            return new NextResponse("Email already exists in Community.", { status: 409 });
        }

        const newMember = await prisma.communityMember.create({
            data: {
                email,
                name,
                telegram,
                xHandle,
                tags: tags || "member", // Default tag
                status: "active",
            }
        });

        return NextResponse.json(newMember);
    } catch (error) {
        console.error("Community Member Create Error", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function DELETE(request: Request) {
    const session = await getServerSession(authOptions);
    const access = checkCoreAccess(session);
    if (!access.authorized) return access.response!;

    // @ts-ignore
    if (!hasPermission(session.user.permissions, 'members', PERMISSIONS.WRITE)) {
        return new NextResponse("Insufficient Permissions. Write Access Required.", { status: 403 });
    }

    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) return new NextResponse("ID is required", { status: 400 });

        await prisma.communityMember.delete({
            where: { id }
        });

        return new NextResponse("Deleted", { status: 200 });
    } catch (error) {
        console.error("Community Member Delete Error", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
