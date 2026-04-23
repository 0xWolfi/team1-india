import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/r/[code] — click track + redirect
export async function GET(_req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const referral = await prisma.referralCode.findUnique({ where: { code } });
  if (!referral) return NextResponse.json({ error: "Invalid code" }, { status: 404 });

  // Increment click count
  await prisma.referralCode.update({ where: { id: referral.id }, data: { clicks: { increment: 1 } } });

  const challenge = await prisma.challenge.findUnique({ where: { id: referral.challengeId }, select: { slug: true } });
  const redirectUrl = challenge ? `/public/challenges/${challenge.slug}?ref=${code}` : "/public";

  return NextResponse.redirect(new URL(redirectUrl, _req.url));
}
