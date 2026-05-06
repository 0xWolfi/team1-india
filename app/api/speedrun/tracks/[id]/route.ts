import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { checkSpeedrunAccess } from "@/lib/permissions";
import { validateTrackIconOrThrow } from "@/lib/speedrun";
import { logAudit } from "@/lib/audit";

// PATCH /api/speedrun/tracks/[id] — edit a track
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const access = checkSpeedrunAccess(session, "WRITE");
  if (!access.authorized) return access.response!;

  const { id } = await params;
  const body = await request.json();

  const existing = await prisma.speedrunTrack.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any = {};
  if (body.name !== undefined) data.name = String(body.name).trim();
  if (body.tagline !== undefined) data.tagline = String(body.tagline).trim();
  if (body.iconKey !== undefined) {
    try {
      data.iconKey = validateTrackIconOrThrow(body.iconKey);
    } catch (err) {
      return NextResponse.json(
        { error: err instanceof Error ? err.message : "Invalid icon" },
        { status: 400 }
      );
    }
  }
  if (body.description !== undefined) data.description = body.description || null;
  if (body.sortOrder !== undefined) data.sortOrder = Number(body.sortOrder) || 0;

  const track = await prisma.speedrunTrack.update({ where: { id }, data });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const actorId = (session?.user as any)?.id ?? session?.user?.email ?? "unknown";
  await logAudit({
    action: "UPDATE",
    resource: "SPEEDRUN_TRACK",
    resourceId: track.id,
    actorId,
    metadata: { changedKeys: Object.keys(data) },
  });

  return NextResponse.json({ track });
}

// DELETE /api/speedrun/tracks/[id] — remove a track
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const access = checkSpeedrunAccess(session, "WRITE");
  if (!access.authorized) return access.response!;

  const { id } = await params;
  const deleted = await prisma.speedrunTrack
    .delete({ where: { id }, select: { id: true, name: true, runId: true } })
    .catch(() => null);

  if (deleted) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const actorId = (session?.user as any)?.id ?? session?.user?.email ?? "unknown";
    await logAudit({
      action: "DELETE",
      resource: "SPEEDRUN_TRACK",
      resourceId: deleted.id,
      actorId,
      metadata: { name: deleted.name, runId: deleted.runId },
    });
  }

  return NextResponse.json({ ok: true });
}
