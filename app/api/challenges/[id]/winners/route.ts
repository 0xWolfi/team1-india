import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";

// POST /api/challenges/[id]/winners — select winner (CORE)
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || (session.user as any)?.role !== "CORE") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const { submissionId, projectId, teamEmail, trackId, position, prizeAmount, xpAwarded, pointsAwarded } = await request.json();
  if (!teamEmail || !position) return NextResponse.json({ error: "teamEmail and position required" }, { status: 400 });

  const winner = await prisma.challengeWinner.create({
    data: { challengeId: id, submissionId, projectId, teamEmail, trackId, position, prizeAmount, xpAwarded: xpAwarded ?? 0, pointsAwarded: pointsAwarded ?? 0 },
  });
  return NextResponse.json({ winner }, { status: 201 });
}

// GET /api/challenges/[id]/winners — public (published only) or admin (all)
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  const isCore = (session?.user as any)?.role === "CORE";
  const { id } = await params;

  const where: any = { challengeId: id };
  if (!isCore) where.isPublished = true;

  const winners = await prisma.challengeWinner.findMany({ where, orderBy: { position: "asc" } });
  return NextResponse.json({ winners });
}
