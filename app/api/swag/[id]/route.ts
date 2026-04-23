import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";

// GET /api/swag/[id] — item detail
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const item = await prisma.swagItem.findUnique({
    where: { id },
    include: { variants: true },
  });

  if (!item || item.deletedAt) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ item });
}

// PATCH /api/swag/[id] — update item (CORE only)
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

  const allowedFields = [
    "name", "description", "image", "images", "pointsCost", "category",
    "audience", "totalStock", "remainingStock", "status", "featured",
  ];

  const data: any = {};
  for (const field of allowedFields) {
    if (body[field] !== undefined) data[field] = body[field];
  }

  const item = await prisma.swagItem.update({ where: { id }, data });

  return NextResponse.json({ item });
}

// DELETE /api/swag/[id] — soft delete (CORE only)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || (session.user as any)?.role !== "CORE") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  await prisma.swagItem.update({
    where: { id },
    data: { deletedAt: new Date(), status: "out_of_stock" },
  });

  return NextResponse.json({ success: true });
}
