import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { generateUniqueReferralCode } from "@/lib/speedrun";

// GET /api/speedrun/referrals/me — get-or-create the caller's referral code + stats
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userEmail = session.user.email;

  let referral = await prisma.speedrunReferralCode.findUnique({
    where: { userEmail },
  });

  if (!referral) {
    const code = await generateUniqueReferralCode();
    referral = await prisma.speedrunReferralCode.create({
      data: { code, userEmail },
    });
  }

  return NextResponse.json({
    code: referral.code,
    clicks: referral.clicks,
    conversions: referral.conversions,
    createdAt: referral.createdAt,
  });
}
