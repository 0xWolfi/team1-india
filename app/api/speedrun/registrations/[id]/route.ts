import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";

// GET /api/speedrun/registrations/[id] — admin detail (CORE-only)
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const role = (session?.user as any)?.role;
  if (role !== "CORE") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;

  const registration = await prisma.speedrunRegistration.findUnique({
    where: { id },
    include: {
      team: {
        include: {
          members: { orderBy: { joinedAt: "asc" } },
        },
      },
      run: true,
    },
  });

  if (!registration) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Pull other registrations on the same team (so admin sees all teammates' submissions)
  const teammates = registration.teamId
    ? await prisma.speedrunRegistration.findMany({
        where: { teamId: registration.teamId, id: { not: registration.id } },
        select: { id: true, fullName: true, userEmail: true, primaryRole: true, createdAt: true },
      })
    : [];

  return NextResponse.json({ registration, teammates });
}

// PATCH /api/speedrun/registrations/[id] — update status / adminNotes (CORE-only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const role = (session?.user as any)?.role;
  if (role !== "CORE") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  const body = await request.json();
  const { status, adminNotes } = body || {};

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any = {};
  if (status !== undefined) {
    if (!["registered", "confirmed", "withdrawn", "rejected"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    data.status = status;
  }
  if (adminNotes !== undefined) data.adminNotes = adminNotes;

  const updated = await prisma.speedrunRegistration.update({
    where: { id },
    data,
    include: {
      team: { select: { id: true, name: true, code: true } },
      run: { select: { id: true, slug: true, monthLabel: true } },
    },
  });

  return NextResponse.json({ registration: updated });
}
