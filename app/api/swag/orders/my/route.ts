import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";

// GET /api/swag/orders/my — user's own orders
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const orders = await prisma.swagOrder.findMany({
    where: { userEmail: session.user.email },
    orderBy: { createdAt: "desc" },
    include: {
      item: { select: { id: true, name: true, image: true } },
    },
  });

  return NextResponse.json({ orders });
}
