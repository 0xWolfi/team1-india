import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

// GET /api/r/[code] — click track + redirect (with IP dedup + self-referral block)
export async function GET(_req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const referral = await prisma.referralCode.findUnique({ where: { code } });
  if (!referral) return NextResponse.json({ error: "Invalid code" }, { status: 404 });

  // Self-referral block: don't count if the clicker is the code creator
  const session = await getServerSession(authOptions);
  const isSelf = session?.user?.email === referral.createdBy;

  // IP dedup: use rate limit table to track IP + code + day
  const ip = _req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const today = new Date().toISOString().split("T")[0];
  const dedupKey = `referral_click:${code}:${ip}:${today}`;

  let isDuplicate = false;
  try {
    const existing = await prisma.rateLimit.findUnique({ where: { key: dedupKey } });
    if (existing) {
      isDuplicate = true;
    } else {
      await prisma.rateLimit.create({
        data: { key: dedupKey, count: 1, resetAt: BigInt(Date.now() + 86400000) },
      });
    }
  } catch {
    // Unique constraint violation = duplicate, which is fine
    isDuplicate = true;
  }

  // Only increment if not self-click and not duplicate
  if (!isSelf && !isDuplicate) {
    await prisma.referralCode.update({ where: { id: referral.id }, data: { clicks: { increment: 1 } } });
  }

  const challenge = await prisma.challenge.findUnique({ where: { id: referral.challengeId }, select: { slug: true } });
  const redirectUrl = challenge ? `/public/challenges/${challenge.slug}?ref=${code}` : "/public";

  return NextResponse.redirect(new URL(redirectUrl, _req.url));
}
