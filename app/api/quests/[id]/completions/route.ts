import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { earnReward } from "@/lib/wallet";
import { sendNotification } from "@/lib/notify";
import { checkRateLimit } from "@/lib/rate-limit";

// POST /api/quests/[id]/completions — submit quest completion (rate limited: 5/min)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateCheck = await checkRateLimit(request, 5, 60000);
  if (!rateCheck.allowed) return NextResponse.json({ error: "Too many submissions" }, { status: 429 });

  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: questId } = await params;
  const body = await request.json();
  const { proofUrl, proofNote } = body;

  // Fetch quest
  const quest = await prisma.quest.findUnique({ where: { id: questId } });
  if (!quest || quest.deletedAt || quest.status !== "active") {
    return NextResponse.json({ error: "Quest not available" }, { status: 404 });
  }

  // Check audience
  const role = (session.user as any)?.role;
  if (quest.audience === "member" && role !== "MEMBER" && role !== "CORE") {
    return NextResponse.json({ error: "Member-only quest" }, { status: 403 });
  }

  // Check max completions
  if (quest.maxCompletions && quest.totalCompletions >= quest.maxCompletions) {
    return NextResponse.json({ error: "Quest fully completed" }, { status: 400 });
  }

  // Check end date
  if (quest.endDate && new Date() > quest.endDate) {
    return NextResponse.json({ error: "Quest has ended" }, { status: 400 });
  }

  // Check proof required
  if (quest.proofRequired && !proofUrl) {
    return NextResponse.json({ error: "Proof is required" }, { status: 400 });
  }

  // Check duplicate (for one-time quests)
  if (quest.type === "one-time") {
    const existing = await prisma.questCompletion.findUnique({
      where: { questId_userEmail: { questId, userEmail: session.user.email } },
    });
    if (existing) {
      return NextResponse.json({ error: "Already completed" }, { status: 409 });
    }
  }

  // Create completion
  const completion = await prisma.questCompletion.create({
    data: {
      questId,
      userEmail: session.user.email,
      proofUrl,
      proofNote,
      status: quest.proofRequired ? "pending" : "approved",
    },
  });

  // If no proof required, auto-approve and award
  if (!quest.proofRequired) {
    await earnReward(
      session.user.email,
      quest.xpReward,
      quest.pointsReward,
      "quest_reward",
      questId,
      `Quest: ${quest.title}`
    );
    await prisma.quest.update({
      where: { id: questId },
      data: { totalCompletions: { increment: 1 } },
    });
    await prisma.questCompletion.update({
      where: { id: completion.id },
      data: {
        status: "approved",
        xpAwarded: quest.xpReward,
        pointsAwarded: quest.pointsReward,
        reviewedAt: new Date(),
      },
    });
  }

  return NextResponse.json({ completion }, { status: 201 });
}

// GET /api/quests/[id]/completions — list completions (CORE: admin review)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || (session.user as any)?.role !== "CORE") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id: questId } = await params;
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  const where: any = { questId };
  if (status) where.status = status;

  const completions = await prisma.questCompletion.findMany({
    where,
    orderBy: { submittedAt: "desc" },
  });

  return NextResponse.json({ completions });
}
