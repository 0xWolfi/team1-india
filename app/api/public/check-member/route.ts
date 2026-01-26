import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withRateLimit } from "@/lib/rate-limit";
import { z } from "zod";

// Zod validation schema
// Zod validation schema
const emptyToUndefined = (val: unknown) => (val === "" ? undefined : val);

const CheckMemberSchema = z.object({
    email: z.preprocess(emptyToUndefined, z.string().email().optional()),
    xHandle: z.preprocess(emptyToUndefined, z.string().max(100).optional()),
    telegram: z.preprocess(emptyToUndefined, z.string().max(100).optional()),
    discord: z.preprocess(emptyToUndefined, z.string().max(100).optional()),
}).refine((data) => data.email || data.xHandle || data.telegram || data.discord, {
    message: "At least one identifier (email, xHandle, telegram, or discord) is required"
});

export async function POST(req: NextRequest) {
  // Rate limiting: 30 requests per hour per IP
  const rateLimitResponse = await withRateLimit(30, 60 * 60 * 1000)(req);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const body = await req.json();
    
    // Validate input with Zod
    const validationResult = CheckMemberSchema.safeParse(body);
    if (!validationResult.success) {
        return NextResponse.json({ 
            error: "Invalid input", 
            details: validationResult.error.flatten() 
        }, { status: 400 });
    }

    const { email, xHandle, telegram, discord } = validationResult.data;

    if (!email && !xHandle && !telegram && !discord) {
      return NextResponse.json({ error: "Please provide an email, X handle, Telegram handle, or Discord ID." }, { status: 400 });
    }

    // Clean up handles
    const cleanX = xHandle ? xHandle.trim().replace(/^@/, '').replace(/https?:\/\/(www\.)?(twitter|x)\.com\//, '') : undefined;
    const cleanTelegram = telegram ? telegram.trim().replace(/^@/, '').replace(/https?:\/\/(www\.)?t\.me\//, '') : undefined;
    const cleanDiscord = discord ? discord.trim().replace(/^@/, '') : undefined;
    const cleanEmail = email ? email.trim().toLowerCase() : undefined;

    // 1. Check Core Members (Member table doesn't have telegram field, only email and xHandle)
    const coreMember = await prisma.member.findFirst({
        where: {
            OR: [
                ...(cleanEmail ? [{ email: { equals: cleanEmail, mode: 'insensitive' } as any }] : []),
                ...(cleanX ? [{ xHandle: { equals: cleanX, mode: 'insensitive' } as any }] : [])
            ]
        },
        select: { name: true, tags: true }
    });

    if (coreMember) {
        return NextResponse.json({
            isMember: true,
            name: coreMember.name || "Member",
            role: "Core Member",
            tags: coreMember.tags
        });
    }

    // 2. Check Community Members (includes telegram field, discord is in customFields)
    const communityMember = await prisma.communityMember.findFirst({
        where: {
            OR: [
                ...(cleanEmail ? [{ email: { equals: cleanEmail, mode: 'insensitive' } as any }] : []),
                ...(cleanX ? [{ xHandle: { equals: cleanX, mode: 'insensitive' } as any }] : []),
                ...(cleanTelegram ? [{ telegram: { equals: cleanTelegram, mode: 'insensitive' } as any }] : [])
            ]
        },
        select: { name: true, tags: true, customFields: true }
    });

    if (communityMember) {
        return NextResponse.json({
            isMember: true,
            name: communityMember.name || "Community Member",
            role: communityMember.tags || "Contributor",
        });
    }

    // 3. Check for Discord in customFields (if discord was provided)
    if (cleanDiscord) {
        const memberByDiscord = await prisma.communityMember.findFirst({
            where: {
                customFields: {
                    path: ['discord'],
                    string_contains: cleanDiscord
                }
            },
            select: { name: true, tags: true }
        });

        if (memberByDiscord) {
            return NextResponse.json({
                isMember: true,
                name: memberByDiscord.name || "Community Member",
                role: memberByDiscord.tags || "Contributor",
            });
        }
    }

    return NextResponse.json({ isMember: false });

  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
