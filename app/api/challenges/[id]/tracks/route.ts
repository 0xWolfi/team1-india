import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";

// GET /api/challenges/[id]/tracks
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tracks = await prisma.challengeTrack.findMany({ where: { challengeId: id }, orderBy: { sortOrder: "asc" } });
  return NextResponse.json({ tracks });
}

// POST /api/challenges/[id]/tracks — add track (CORE)
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || (session.user as any)?.role !== "CORE") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const { name, description, prizeAmount, sortOrder } = await request.json();
  if (!name) return NextResponse.json({ error: "name required" }, { status: 400 });
  const track = await prisma.challengeTrack.create({ data: { challengeId: id, name, description, prizeAmount, sortOrder: sortOrder ?? 0 } });
  return NextResponse.json({ track }, { status: 201 });
}
