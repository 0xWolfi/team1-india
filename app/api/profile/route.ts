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
                select: { customFields: true, name: true, email: true, xHandle: true }
            });
        } else {
            member = await prisma.communityMember.findUnique({ 
                where: { email: session.user.email },
                select: { customFields: true, name: true, email: true, xHandle: true, telegram: true }
            });
        }

        const customFields = member?.customFields as any || {};
        return NextResponse.json({
            customFields: customFields,
            name: member?.name || session.user.name || '',
            email: member?.email || session.user.email || '',
            xHandle: member?.xHandle || '',
            telegram: (member as any)?.telegram || '',
            wallet: customFields.wallet || '',
            address: customFields.address || '',
            discord: customFields.discord || '',
            bio: customFields.bio || ''
        });
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
        const { customFields, name, xHandle, telegram } = body;

        // Determine if user is Core or Community based on Role
        // @ts-ignore
        const role = session.user.role;

        if (role === 'CORE') {
            await prisma.member.update({
                where: { email: session.user.email },
                data: {
                    ...(name !== undefined && { name }),
                    ...(xHandle !== undefined && { xHandle }),
                    ...(customFields && { customFields }),
                }
            });
        } else {
            // Community Member
            // Community Member
            await prisma.communityMember.upsert({
                where: { email: session.user.email },
                update: {
                    ...(name !== undefined && { name }),
                    ...(xHandle !== undefined && { xHandle }),
                    ...(telegram !== undefined && { telegram }),
                    ...(customFields && { customFields }),
                },
                create: {
                    email: session.user.email,
                    name: name || session.user.name,
                    xHandle: xHandle,
                    telegram: telegram,
                    customFields: customFields,
                    status: 'active'
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
