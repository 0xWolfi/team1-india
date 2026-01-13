import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { email, xHandle, telegram } = await req.json();

    if (!email && !xHandle && !telegram) {
      return NextResponse.json({ error: "Please provide an email, X handle, or Telegram handle." }, { status: 400 });
    }

    // Clean up handles
    const cleanX = xHandle ? xHandle.trim().replace(/^@/, '').replace(/https?:\/\/(www\.)?(twitter|x)\.com\//, '') : undefined;
    const cleanTelegram = telegram ? telegram.trim().replace(/^@/, '').replace(/https?:\/\/(www\.)?t\.me\//, '') : undefined;
    const cleanEmail = email ? email.trim().toLowerCase() : undefined;

    console.log('[CHECK-MEMBER] Search params:', { cleanEmail, cleanX, cleanTelegram });

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

    console.log('[CHECK-MEMBER] Core member result:', coreMember ? 'Found' : 'Not found');

    if (coreMember) {
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

    console.log('[CHECK-MEMBER] Community member result:', communityMember ? 'Found' : 'Not found');

    if (communityMember) {
        return NextResponse.json({
            isMember: true,
            name: communityMember.name || "Community Member",
            role: communityMember.tags || "Contributor",
        });
    }

    console.log('[CHECK-MEMBER] No member found with provided credentials');
    return NextResponse.json({ isMember: false });

  } catch (error) {
    console.error("Check Member Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
