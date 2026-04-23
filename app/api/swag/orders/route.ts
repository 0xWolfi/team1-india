import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";

// GET /api/swag/orders — all orders (CORE only)
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || (session.user as any)?.role !== "CORE") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  const where: any = {};
  if (status) where.status = status;

  const orders = await prisma.swagOrder.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      item: { select: { id: true, name: true, image: true } },
    },
  });

  return NextResponse.json({ orders });
}
