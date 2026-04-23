import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";

// GET /api/swag — list swag items
export async function GET() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;

  const where: any = { deletedAt: null, status: { not: "out_of_stock" } };

  if (role !== "CORE") {
    where.status = "active";
    if (!role || role === "PUBLIC") {
      where.audience = { in: ["all", "public"] };
    } else {
      where.audience = { in: ["all", "member"] };
    }
  }

  const items = await prisma.swagItem.findMany({
    where,
    orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
    include: {
      variants: { select: { id: true, label: true, stock: true } },
      _count: { select: { orders: true } },
    },
  });

  return NextResponse.json({ items });
}

// POST /api/swag — create swag item (CORE only)
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || (session.user as any)?.role !== "CORE") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const {
    name, description, image, images, pointsCost, category,
    audience, totalStock, featured, variants,
  } = body;

  if (!name || !pointsCost) {
    return NextResponse.json({ error: "name and pointsCost required" }, { status: 400 });
  }

  const item = await prisma.swagItem.create({
    data: {
      name,
      description,
      image,
      images,
      pointsCost,
      category,
      audience: audience ?? "all",
      totalStock: totalStock ?? 0,
      remainingStock: totalStock ?? 0,
      featured: featured ?? false,
      variants: variants?.length
        ? { create: variants.map((v: any) => ({ label: v.label, stock: v.stock ?? 0 })) }
        : undefined,
    },
    include: { variants: true },
  });

  return NextResponse.json({ item }, { status: 201 });
}
