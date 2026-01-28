import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { checkCoreAccess } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);
    const access = checkCoreAccess(session);
    if (!access.authorized) return access.response!;

    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');

    if (!email) {
        return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    try {
        // Check both Member and CommunityMember tables
        const [coreMember, communityMember] = await Promise.all([
            prisma.member.findUnique({
                where: { email: email.trim().toLowerCase() },
                select: { id: true, email: true }
            }),
            prisma.communityMember.findUnique({
                where: { email: email.trim().toLowerCase() },
                select: { id: true, email: true }
            })
        ]);

        if (coreMember) {
            return NextResponse.json({ 
                exists: true, 
                type: 'CORE',
                message: "Email already exists in Core Team"
            });
        }

        if (communityMember) {
            return NextResponse.json({ 
                exists: true, 
                type: 'COMMUNITY',
                message: "Email already exists in Community Members"
            });
        }

        return NextResponse.json({ exists: false });
    } catch (error) {
        console.error("Email check error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
