import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { spendPoints } from "@/lib/wallet";
import { sendNotification } from "@/lib/notify";
import { storePii } from "@/lib/pii";

const MAX_REDEEM_QUANTITY = 100;

// POST /api/swag/[id]/redeem — redeem swag item with points
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: itemId } = await params;

    let body: { variantId?: string; shippingAddress?: unknown; quantity?: unknown } = {};
    try {
      body = await request.json();
    } catch {
      // empty/invalid body — quantity defaults to 1 below
    }
    const { variantId, shippingAddress } = body;

    // SECURITY: Validate quantity is a positive integer in a sane range BEFORE
    // any DB work. A negative quantity would otherwise (a) inflate stock via
    // the "stock - quantity" SQL and (b) mint points via Prisma's `decrement`
    // of a negative number.
    const rawQuantity = body.quantity ?? 1;
    const quantity = typeof rawQuantity === "number" ? rawQuantity : Number(rawQuantity);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_REDEEM_QUANTITY) {
      return NextResponse.json({ error: "Invalid quantity" }, { status: 400 });
    }

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

      if (error?.message === "INSUFFICIENT_BALANCE" || error?.message === "INVALID_AMOUNT") {
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
    if (typeof shippingAddress === "string" && shippingAddress.length > 0) {
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
  } catch (err) {
    console.error("POST /api/swag/[id]/redeem failed", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
