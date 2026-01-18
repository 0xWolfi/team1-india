import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { log } from "@/lib/logger";

// Zod validation schema for profile updates
const ProfileUpdateSchema = z.object({
    name: z.string().min(1).max(200).optional(),
    xHandle: z.string().max(100).optional().nullable(),
    telegram: z.string().max(100).optional().nullable(),
    customFields: z.record(z.string(), z.any()).optional(),
});

export async function GET(request: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {

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
        log("ERROR", "Failed to fetch profile", "PROFILE", { 
            email: session.user.email 
        }, error instanceof Error ? error : new Error(String(error)));
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function PATCH(request: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {

        const body = await request.json();
        
        // Validate input with Zod
        const validationResult = ProfileUpdateSchema.safeParse(body);
        if (!validationResult.success) {
            log("WARN", "Invalid profile update request", "PROFILE", { 
                email: session.user.email,
                errors: validationResult.error.flatten()
            });
            return NextResponse.json({ 
                error: "Invalid input", 
                details: validationResult.error.flatten() 
            }, { status: 400 });
        }

        const { customFields, name, xHandle, telegram } = validationResult.data;

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

        log("INFO", "Profile updated", "PROFILE", { 
            email: session.user.email,
            role 
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        log("ERROR", "Failed to update profile", "PROFILE", { 
            email: session?.user?.email || "unknown"
        }, error instanceof Error ? error : new Error(String(error)));
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
