import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withRateLimit } from "@/lib/rate-limit";
import { z } from "zod";
import { log } from "@/lib/logger";

// Zod validation schema
const CheckMemberSchema = z.object({
    email: z.string().email().optional(),
    xHandle: z.string().max(100).optional(),
    telegram: z.string().max(100).optional(),
}).refine((data) => data.email || data.xHandle || data.telegram, {
    message: "At least one identifier (email, xHandle, or telegram) is required"
});

export async function POST(req: NextRequest) {
  // Rate limiting: 5 requests per hour per IP
  const rateLimitResponse = await withRateLimit(5, 60 * 60 * 1000)(req);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const body = await req.json();
    
    // Validate input with Zod
    const validationResult = CheckMemberSchema.safeParse(body);
    if (!validationResult.success) {
        log("WARN", "Invalid check-member request", "CHECK_MEMBER", { 
            errors: validationResult.error.flatten()
        });
        return NextResponse.json({ 
            error: "Invalid input", 
            details: validationResult.error.flatten() 
        }, { status: 400 });
    }

    const { email, xHandle, telegram } = validationResult.data;

    if (!email && !xHandle && !telegram) {
      return NextResponse.json({ error: "Please provide an email, X handle, or Telegram handle." }, { status: 400 });
    }

    // Clean up handles
    const cleanX = xHandle ? xHandle.trim().replace(/^@/, '').replace(/https?:\/\/(www\.)?(twitter|x)\.com\//, '') : undefined;
    const cleanTelegram = telegram ? telegram.trim().replace(/^@/, '').replace(/https?:\/\/(www\.)?t\.me\//, '') : undefined;
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
        log("INFO", "Core member found", "CHECK_MEMBER", { 
            found: true,
            hasEmail: !!cleanEmail,
            hasXHandle: !!cleanX
        });
        return NextResponse.json({
            isMember: true,
            name: coreMember.name || "Member",
            role: "Core Member",
            tags: coreMember.tags
        });
    }

    // 2. Check Community Members (includes telegram field)
    const communityMember = await prisma.communityMember.findFirst({
        where: {
            OR: [
                ...(cleanEmail ? [{ email: { equals: cleanEmail, mode: 'insensitive' } as any }] : []),
                ...(cleanX ? [{ xHandle: { equals: cleanX, mode: 'insensitive' } as any }] : []),
                ...(cleanTelegram ? [{ telegram: { equals: cleanTelegram, mode: 'insensitive' } as any }] : [])
            ]
        },
        select: { name: true, tags: true }
    });

    if (communityMember) {
        log("INFO", "Community member found", "CHECK_MEMBER", { 
            found: true,
            hasEmail: !!cleanEmail,
            hasXHandle: !!cleanX,
            hasTelegram: !!cleanTelegram
        });
        return NextResponse.json({
            isMember: true,
            name: communityMember.name || "Community Member",
            role: communityMember.tags || "Contributor",
        });
    }

    log("INFO", "No member found", "CHECK_MEMBER", { 
        found: false,
        hasEmail: !!cleanEmail,
        hasXHandle: !!cleanX,
        hasTelegram: !!cleanTelegram
    });
    return NextResponse.json({ isMember: false });

  } catch (error) {
    log("ERROR", "Check member request failed", "CHECK_MEMBER", {}, 
        error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
