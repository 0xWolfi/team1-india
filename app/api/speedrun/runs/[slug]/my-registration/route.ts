import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { getRunBySlug } from "@/lib/speedrun";

// GET /api/speedrun/runs/[slug]/my-registration
//
// Slug-scoped equivalent of /api/speedrun/registrations/my. Returns the
// caller's registration for the named run, or { registered: false } if they
// haven't registered (or aren't signed in).
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const run = await getRunBySlug(slug);
  if (!run) {
    return NextResponse.json({ registered: false, run: null }, { status: 404 });
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({
      registered: false,
      run: {
        id: run.id,
        slug: run.slug,
        monthLabel: run.monthLabel,
        status: run.status,
      },
    });
  }

  const reg = await prisma.speedrunRegistration.findUnique({
    where: { runId_userEmail: { runId: run.id, userEmail: session.user.email } },
    include: {
      team: {
        select: {
          id: true,
          name: true,
          code: true,
          captainEmail: true,
          members: { select: { email: true, role: true, joinedAt: true } },
        },
      },
      run: { select: { id: true, slug: true, monthLabel: true, status: true } },
    },
  });

  return NextResponse.json({
    registered: !!reg,
    run: {
      id: run.id,
      slug: run.slug,
      monthLabel: run.monthLabel,
      status: run.status,
    },
    registration: reg,
  });
}

// PATCH /api/speedrun/runs/[slug]/my-registration
//
// Self-serve update for fields the registrant controls — currently just the
// `showSocials` opt-in. Admin status changes go through
// /api/speedrun/registrations/[id] (CORE-only).
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { slug } = await params;
  const run = await getRunBySlug(slug);
  if (!run) return NextResponse.json({ error: "Run not found" }, { status: 404 });

  const body = await request.json();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any = {};
  if (typeof body.showSocials === "boolean") {
    data.showSocials = body.showSocials;
  }
  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const reg = await prisma.speedrunRegistration.findUnique({
    where: { runId_userEmail: { runId: run.id, userEmail: session.user.email } },
    select: { id: true },
  });
  if (!reg) {
    return NextResponse.json({ error: "Not registered for this run" }, { status: 404 });
  }

  const updated = await prisma.speedrunRegistration.update({
    where: { id: reg.id },
    data,
    select: { id: true, showSocials: true },
  });
  return NextResponse.json({ registration: updated });
}
