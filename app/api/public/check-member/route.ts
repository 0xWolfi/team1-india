import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { email, xHandle } = await req.json();

    if (!email && !xHandle) {
      return NextResponse.json({ error: "Please provide an email or X handle." }, { status: 400 });
    }

    // specific clean up for X handle?
    // User said "no link", but better safe than sorry
    const cleanX = xHandle ? xHandle.trim().replace(/^@/, '').replace(/https?:\/\/(www\.)?(twitter|x)\.com\//, '') : undefined;
    const cleanEmail = email ? email.trim().toLowerCase() : undefined;

    // 1. Check Core Members
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
            role: "Core Member", // Or verify permissions/tags
            // Assuming Core Members are "Core Member" or specific tags
            tags: coreMember.tags
        });
    }

    // 2. Check Community Members
    const communityMember = await prisma.communityMember.findFirst({
        where: {
            OR: [
                ...(cleanEmail ? [{ email: { equals: cleanEmail, mode: 'insensitive' } as any }] : []),
                ...(cleanX ? [{ xHandle: { equals: cleanX, mode: 'insensitive' } as any }] : [])
            ]
        },
        select: { name: true, tags: true }
    });

    if (communityMember) {
        return NextResponse.json({
            isMember: true,
            name: communityMember.name || "Community Member",
            role: communityMember.tags || "Contributor", // Default to tag or Contributor
        });
    }

    return NextResponse.json({ isMember: false });

  } catch (error) {
    console.error("Check Member Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
