import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { sendNotification } from "@/lib/notify";
import { checkRateLimit } from "@/lib/rate-limit";

// POST /api/challenges/[id]/register (rate limited: 3/min)
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const rateCheck = await checkRateLimit(request, 3, 60000);
  if (!rateCheck.allowed) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const { teamName, trackId, referralCode, utmSource, utmMedium, utmCampaign } = await request.json();

  const challenge = await prisma.challenge.findUnique({ where: { id } });
  if (!challenge || challenge.deletedAt) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (challenge.status !== "registration_open") return NextResponse.json({ error: "Registration not open" }, { status: 400 });
  if (challenge.registrationDeadline && new Date() > challenge.registrationDeadline) {
    return NextResponse.json({ error: "Registration deadline passed" }, { status: 400 });
  }

  try {
    const registration = await prisma.challengeRegistration.create({
      data: {
        challengeId: id, captainEmail: session.user.email, teamName, trackId,
        referralCode, utmSource, utmMedium, utmCampaign,
        teamMembers: { create: { email: session.user.email, role: "captain", status: "accepted" } },
      },
    });

    // Track referral conversion
    if (referralCode) {
      await prisma.referralCode.updateMany({
        where: { code: referralCode, challengeId: id },
        data: { conversions: { increment: 1 } },
      });
    }

    await sendNotification(session.user.email, "challenge_registered", "Registration Confirmed", `You're registered for "${challenge.title}"!`, `/public/challenges/${challenge.slug}`);

    return NextResponse.json({ registration }, { status: 201 });
  } catch (err: any) {
    if (err?.code === "P2002") return NextResponse.json({ error: "Already registered" }, { status: 409 });
    throw err;
  }
}
