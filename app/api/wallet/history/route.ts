import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";

// GET /api/wallet/history — transaction history (cursor pagination)
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const cursor = searchParams.get("cursor");
  const limit = Math.min(Number(searchParams.get("limit") || "20"), 50);
  const type = searchParams.get("type"); // optional filter

  const wallet = await prisma.userWallet.findUnique({
    where: { userEmail: session.user.email },
    select: { id: true },
  });

  if (!wallet) {
    return NextResponse.json({ transactions: [], nextCursor: null });
  }

  const where: any = { walletId: wallet.id };
  if (type) where.type = type;

  const transactions = await prisma.walletTransaction.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });

  const hasMore = transactions.length > limit;
  if (hasMore) transactions.pop();

  return NextResponse.json({
    transactions,
    nextCursor: hasMore ? transactions[transactions.length - 1]?.id : null,
  });
}
