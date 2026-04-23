import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";

// GET /api/wallet/[userId] — admin view of any user's wallet (CORE only)
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || (session.user as any)?.role !== "CORE") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { userId } = await params;

  // userId can be email or wallet ID
  const wallet = await prisma.userWallet.findFirst({
    where: { OR: [{ userEmail: userId }, { id: userId }] },
    include: {
      transactions: { orderBy: { createdAt: "desc" }, take: 20 },
      batches: { where: { remaining: { gt: 0 } }, orderBy: { expiresAt: "asc" } },
    },
  });

  if (!wallet) {
    return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
  }

  return NextResponse.json({ wallet });
}
