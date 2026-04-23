import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { sendNotification } from "@/lib/notify";

// PATCH /api/swag/orders/[id] — update order status + tracking (CORE only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || (session.user as any)?.role !== "CORE") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const { status, trackingNumber, trackingUrl, notes } = body;

  const order = await prisma.swagOrder.findUnique({
    where: { id },
    include: { item: { select: { name: true } } },
  });

  if (!order) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const data: any = {};
  if (status) data.status = status;
  if (trackingNumber !== undefined) data.trackingNumber = trackingNumber;
  if (trackingUrl !== undefined) data.trackingUrl = trackingUrl;
  if (notes !== undefined) data.notes = notes;

  const updated = await prisma.swagOrder.update({ where: { id }, data });

  // Notify user on status changes
  if (status && status !== order.status) {
    const messages: Record<string, string> = {
      processing: `Your order for "${order.item.name}" is being processed.`,
      shipped: `Your order for "${order.item.name}" has been shipped!${trackingNumber ? ` Tracking: ${trackingNumber}` : ""}`,
      delivered: `Your order for "${order.item.name}" has been delivered!`,
      cancelled: `Your order for "${order.item.name}" has been cancelled.`,
    };

    if (messages[status]) {
      await sendNotification(
        order.userEmail,
        `swag_${status}`,
        `Order ${status.charAt(0).toUpperCase() + status.slice(1)}`,
        messages[status],
        "/member/shop"
      );
    }
  }

  return NextResponse.json({ order: updated });
}
