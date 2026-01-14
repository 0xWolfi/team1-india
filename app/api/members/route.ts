
import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options"; 
import { prisma } from "@/lib/prisma";
import { checkCoreAccess, hasPermission, PERMISSIONS } from "@/lib/permissions";
import { sendEmail, getWelcomeEmailTemplate } from "@/lib/email";

export async function GET(request: Request) {
    const session = await getServerSession(authOptions);
    const access = checkCoreAccess(session);
    if (!access.authorized) return access.response!;

    // @ts-ignore
    if (!hasPermission(session.user.permissions, 'members', PERMISSIONS.READ)) {
        return new NextResponse("Insufficient Permissions", { status: 403 });
    }

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
    const access = checkCoreAccess(session);
    if (!access.authorized) return access.response!;

    // @ts-ignore
    if (!hasPermission(session.user.permissions, 'members', PERMISSIONS.WRITE)) {
        return new NextResponse("Insufficient Permissions. Write Access Required.", { status: 403 });
    }

    try {
        const { email, permissions, tags } = await request.json();

        if (!email) return new NextResponse("Email is required", { status: 400 });

        // CROSS-CHECK: Ensure not in Community (CommunityMember table)
        const existingCommunityMember = await prisma.communityMember.findUnique({ where: { email } });
        if (existingCommunityMember) {
            return new NextResponse("Email already exists in Community. Cannot add to Team (Core Admin).", { status: 409 });
        }

        // Check if already in Team (Implicitly handled by unique constraint, but good for custom message)
        const existingTeamMember = await prisma.member.findUnique({ where: { email } });
        if (existingTeamMember) {
            return new NextResponse("Email already exists in Team.", { status: 409 });
        }

        const newMember = await prisma.member.create({
            data: {
                email,
                permissions: permissions || { default: "READ" },
                tags: tags || [],
                status: "active", // Auto-activate manually added members
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
        console.error("Member Create Error", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function DELETE(request: Request) {
    const session = await getServerSession(authOptions);
    const access = checkCoreAccess(session);
    if (!access.authorized) return access.response!;

    // @ts-ignore
    if (!hasPermission(session.user.permissions, 'members', PERMISSIONS.WRITE)) {
         // Using WRITE for delete is standard, though sometimes DELETE is separate. 
         // For now WRITE implies capability to manage the collection.
        return new NextResponse("Insufficient Permissions. Write Access Required.", { status: 403 });
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

