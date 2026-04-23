import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";

// GET /api/quests/[id] — quest detail
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const quest = await prisma.quest.findUnique({
    where: { id },
    include: {
      _count: { select: { completions: true } },
    },
  });

  if (!quest || quest.deletedAt) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ quest });
}

// PATCH /api/quests/[id] — update quest (CORE only)
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
    "title", "description", "type", "category", "xpReward", "pointsReward",
    "audience", "status", "maxCompletions", "proofRequired", "proofDescription",
    "startDate", "endDate",
  ];

  const data: any = {};
  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      if (field === "startDate" || field === "endDate") {
        data[field] = body[field] ? new Date(body[field]) : null;
      } else {
        data[field] = body[field];
      }
    }
  }

  const quest = await prisma.quest.update({
    where: { id },
    data,
  });

  return NextResponse.json({ quest });
}

// DELETE /api/quests/[id] — soft delete (CORE only)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || (session.user as any)?.role !== "CORE") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  await prisma.quest.update({
    where: { id },
    data: { deletedAt: new Date(), status: "closed" },
  });

  return NextResponse.json({ success: true });
}
