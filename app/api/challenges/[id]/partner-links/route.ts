import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

// POST /api/challenges/[id]/partner-links — generate (CORE)
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || (session.user as any)?.role !== "CORE") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const { partnerName, partnerEmail, expiresInDays } = await request.json();
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + (expiresInDays ?? 7));
  const link = await prisma.partnerReviewLink.create({ data: { challengeId: id, token, partnerName, partnerEmail, expiresAt } });
  return NextResponse.json({ link, url: `/api/partner-review/${token}` }, { status: 201 });
}

// GET /api/challenges/[id]/partner-links — list (CORE)
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || (session.user as any)?.role !== "CORE") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const links = await prisma.partnerReviewLink.findMany({ where: { challengeId: id }, orderBy: { createdAt: "desc" } });
  return NextResponse.json({ links });
}
