import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // @ts-ignore
        const role = session.user.role;
        let member = null;

        if (role === 'CORE') {
            member = await prisma.member.findUnique({ 
                where: { email: session.user.email },
                select: { customFields: true }
            });
        } else {
            member = await prisma.communityMember.findUnique({ 
                where: { email: session.user.email },
                select: { customFields: true }
            });
        }

        return NextResponse.json(member?.customFields || {});
    } catch (error) {
        console.error("[PROFILE_GET]", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { customFields, tags } = body;

        // Determine if user is Core or Community based on Role
        // @ts-ignore
        const role = session.user.role;

        if (role === 'CORE') {
            await prisma.member.update({
                where: { email: session.user.email },
                data: {
                    customFields,
                    // Note: Tags might be locked for Core members too? User said "type member and contributor... set by core... but address... can be edited".
                    // I'll allow customFields update.
                }
            });
        } else {
            // Community Member
            await prisma.communityMember.update({
                where: { email: session.user.email },
                data: {
                    customFields,
                    // Tags are locked for members as per requirements ("role set by core")
                }
            });
        }

        // Log audit
        // @ts-ignore
        await prisma.log.create({
            data: {
                action: "UPDATE_PROFILE",
                entity: "MEMBER",
                entityId: session.user.email,
                metadata: { customFields },
                actorId: role === 'CORE' ? (await prisma.member.findUnique({ where: { email: session.user.email } }))?.id : undefined
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[PROFILE_UPDATE]", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
