import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options"; 
import { prisma } from "@/lib/prisma";
import { checkCoreAccess, hasPermission, PERMISSIONS } from "@/lib/permissions";
import { sendEmail, getWelcomeEmailTemplate, getMemberRemovalEmailTemplate } from "@/lib/email";

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
        const { email, tags } = await request.json();

        if (!email) {
            return new NextResponse("Email is required.", { status: 400 });
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
                name: null, // Will be filled by user on first login
                telegram: null,
                xHandle: null,
                tags: tags || "member", // Default to member if not specified
                status: "active",
            }
        });

        // Send welcome email
        try {
            const memberName = newMember.name || email.split('@')[0];
            const emailHtml = getWelcomeEmailTemplate(memberName);
            await sendEmail({
                to: email,
                subject: "Welcome to Team1 India 🎉",
                html: emailHtml
            });
        } catch (emailError) {
            console.error("Failed to send welcome email:", emailError);
            // Don't fail the request if email fails
        }

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

        // Get member details before deleting
        const member = await prisma.communityMember.findUnique({
            where: { id },
            select: {
                email: true,
                name: true
            }
        });

        if (!member) {
            return new NextResponse("Member not found", { status: 404 });
        }

        // Delete the member
        await prisma.communityMember.delete({
            where: { id }
        });

        // Send removal email
        try {
            const memberName = member.name || member.email.split('@')[0];
            const emailHtml = getMemberRemovalEmailTemplate(memberName);
            await sendEmail({
                to: member.email,
                subject: "Membership Update - Team1 India",
                html: emailHtml
            });
        } catch (emailError) {
            console.error("Failed to send member removal email:", emailError);
            // Don't fail the request if email fails
        }

        return new NextResponse("Deleted", { status: 200 });
    } catch (error) {
        console.error("Community Member Delete Error", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
