import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";

// GET /api/challenges — list challenges
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  const where: any = { deletedAt: null };
  if (status) where.status = status;

  const challenges = await prisma.challenge.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      tracks: { select: { id: true, name: true }, orderBy: { sortOrder: "asc" } },
      _count: { select: { registrations: true, submissions: true, winners: true } },
    },
  });

  return NextResponse.json({ challenges });
}

// POST /api/challenges — create (CORE only)
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || (session.user as any)?.role !== "CORE") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { title, description, coverImage, body: richBody, startDate, endDate, registrationDeadline, submissionDeadline, maxTeamSize, minTeamSize, allowSolo, prizePool, rules, judgingCriteria } = body;

  if (!title) return NextResponse.json({ error: "title required" }, { status: 400 });

  const baseSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const existing = await prisma.challenge.findUnique({ where: { slug: baseSlug } });
  const slug = existing ? `${baseSlug}-${Date.now().toString(36)}` : baseSlug;

  const challenge = await prisma.challenge.create({
    data: {
      title, slug, description, coverImage, body: richBody,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      registrationDeadline: registrationDeadline ? new Date(registrationDeadline) : null,
      submissionDeadline: submissionDeadline ? new Date(submissionDeadline) : null,
      maxTeamSize: maxTeamSize ?? 4, minTeamSize: minTeamSize ?? 1,
      allowSolo: allowSolo ?? true, prizePool, rules, judgingCriteria,
      createdBy: session.user.email,
    },
  });

  return NextResponse.json({ challenge }, { status: 201 });
}
