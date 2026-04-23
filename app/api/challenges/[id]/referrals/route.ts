import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

// POST /api/challenges/[id]/referrals — generate referral code
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const code = crypto.randomBytes(4).toString("hex").toUpperCase();
  const referral = await prisma.referralCode.create({ data: { challengeId: id, code, createdBy: session.user.email } });
  return NextResponse.json({ referral }, { status: 201 });
}

// GET /api/challenges/[id]/referrals — admin analytics (CORE)
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || (session.user as any)?.role !== "CORE") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const referrals = await prisma.referralCode.findMany({ where: { challengeId: id }, orderBy: { conversions: "desc" } });
  return NextResponse.json({ referrals });
}
