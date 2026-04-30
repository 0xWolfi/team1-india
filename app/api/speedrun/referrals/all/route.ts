import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";

// GET /api/speedrun/referrals/all — admin (CORE) list of all referral codes with stats
export async function GET() {
  const session = await getServerSession(authOptions);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const role = (session?.user as any)?.role;
  if (role !== "CORE") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const referrals = await prisma.speedrunReferralCode.findMany({
    orderBy: [{ conversions: "desc" }, { clicks: "desc" }, { createdAt: "desc" }],
    include: {
      registrations: {
        select: {
          id: true,
          fullName: true,
          userEmail: true,
          createdAt: true,
          run: { select: { monthLabel: true, slug: true } },
        },
      },
    },
  });

  return NextResponse.json({ referrals });
}
