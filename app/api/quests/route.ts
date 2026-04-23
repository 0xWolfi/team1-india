import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";

// GET /api/quests — list active quests (public)
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") || "active";
  const type = searchParams.get("type");
  const category = searchParams.get("category");

  const where: any = { status, deletedAt: null };

  // Filter by audience based on role
  if (!role || role === "PUBLIC") {
    where.audience = { in: ["all", "public"] };
  } else if (role === "MEMBER") {
    where.audience = { in: ["all", "member", "public"] };
  }
  // CORE sees all

  if (type) where.type = type;
  if (category) where.category = category;

  const now = new Date();
  where.OR = [
    { startDate: null },
    { startDate: { lte: now } },
  ];

  const quests = await prisma.quest.findMany({
    where,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      description: true,
      type: true,
      category: true,
      xpReward: true,
      pointsReward: true,
      audience: true,
      status: true,
      maxCompletions: true,
      totalCompletions: true,
      proofRequired: true,
      proofDescription: true,
      startDate: true,
      endDate: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ quests });
}

// POST /api/quests — create quest (CORE only)
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || (session.user as any)?.role !== "CORE") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const {
    title,
    description,
    type,
    category,
    xpReward,
    pointsReward,
    audience,
    maxCompletions,
    proofRequired,
    proofDescription,
    startDate,
    endDate,
  } = body;

  if (!title || !type) {
    return NextResponse.json(
      { error: "title and type are required" },
      { status: 400 }
    );
  }

  const quest = await prisma.quest.create({
    data: {
      title,
      description,
      type,
      category,
      xpReward: xpReward ?? 10,
      pointsReward: pointsReward ?? 10,
      audience: audience ?? "all",
      maxCompletions,
      proofRequired: proofRequired ?? true,
      proofDescription,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      createdBy: session.user.email,
    },
  });

  return NextResponse.json({ quest }, { status: 201 });
}
