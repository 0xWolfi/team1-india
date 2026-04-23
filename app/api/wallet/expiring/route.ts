import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";

// GET /api/wallet/expiring — points expiring within next 7 days
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const wallet = await prisma.userWallet.findUnique({
    where: { userEmail: session.user.email },
    select: { id: true },
  });

  if (!wallet) {
    return NextResponse.json({ expiring: [], totalExpiring: 0 });
  }

  const now = new Date();
  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

  const expiring = await prisma.pointsBatch.findMany({
    where: {
      walletId: wallet.id,
      remaining: { gt: 0 },
      expiresAt: { gt: now, lte: sevenDaysFromNow },
    },
    orderBy: { expiresAt: "asc" },
    select: {
      id: true,
      remaining: true,
      source: true,
      expiresAt: true,
    },
  });

  const totalExpiring = expiring.reduce((sum, b) => sum + b.remaining, 0);

  return NextResponse.json({ expiring, totalExpiring });
}
