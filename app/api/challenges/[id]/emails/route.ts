import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";

// GET /api/challenges/[id]/emails — list scheduled emails (CORE)
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || (session.user as any)?.role !== "CORE") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const emails = await prisma.scheduledEmail.findMany({ where: { challengeId: id }, orderBy: { scheduledFor: "asc" } });
  return NextResponse.json({ emails });
}

// POST /api/challenges/[id]/emails — schedule email (CORE)
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || (session.user as any)?.role !== "CORE") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const { subject, body, recipientType, customEmails, scheduledFor } = await request.json();
  if (!subject || !body || !recipientType || !scheduledFor) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const email = await prisma.scheduledEmail.create({
    data: { challengeId: id, subject, body, recipientType, customEmails: customEmails ?? [], scheduledFor: new Date(scheduledFor), createdBy: session.user.email },
  });
  return NextResponse.json({ email }, { status: 201 });
}
