import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { spendPoints } from "@/lib/wallet";
import { sendNotification } from "@/lib/notify";
import { storePii } from "@/lib/pii";

// POST /api/swag/[id]/redeem — redeem swag item with points
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: itemId } = await params;
  const body = await request.json();
  const { variantId, shippingAddress, quantity = 1 } = body;

  // Fetch item
  const item = await prisma.swagItem.findUnique({ where: { id: itemId } });
  if (!item || item.deletedAt || item.status !== "active") {
    return NextResponse.json({ error: "Item not available" }, { status: 404 });
  }

  // Check audience
  const role = (session.user as any)?.role;
  if (item.audience === "member" && role !== "MEMBER" && role !== "CORE") {
    return NextResponse.json({ error: "Member-only item" }, { status: 403 });
  }

  const totalCost = item.pointsCost * quantity;

  // Atomic stock decrement — prevents overselling
  const updated = await prisma.$executeRaw`
    UPDATE "SwagItem" SET "remainingStock" = "remainingStock" - ${quantity}
    WHERE id = ${itemId} AND "remainingStock" >= ${quantity}
  `;

  if (updated === 0) {
    return NextResponse.json({ error: "Out of stock" }, { status: 400 });
  }

  // Spend points (throws INSUFFICIENT_BALANCE if not enough)
  try {
    await spendPoints(
      session.user.email,
      totalCost,
      "swag_purchase",
      itemId,
      `Swag: ${item.name}${quantity > 1 ? ` x${quantity}` : ""}`
    );
  } catch (error: any) {
    // Rollback stock if points spend fails
    await prisma.$executeRaw`
      UPDATE "SwagItem" SET "remainingStock" = "remainingStock" + ${quantity}
      WHERE id = ${itemId}
    `;

    if (error.message === "INSUFFICIENT_BALANCE") {
      return NextResponse.json({ error: "Insufficient points" }, { status: 400 });
    }
    throw error;
  }

  // Create order
  const order = await prisma.swagOrder.create({
    data: {
      itemId,
      variantId,
      userEmail: session.user.email,
      pointsSpent: totalCost,
      quantity,
    },
  });

  // Store shipping address in PII vault if provided
  if (shippingAddress) {
    await storePii("PublicUser", order.id, "shipping_address", shippingAddress, false);
  }

  // Notify user
  await sendNotification(
    session.user.email,
    "swag_redeemed",
    "Swag Order Placed!",
    `You redeemed "${item.name}" for ${totalCost} points. We'll update you when it ships.`,
    "/member/shop"
  );

  return NextResponse.json({ order }, { status: 201 });
}
