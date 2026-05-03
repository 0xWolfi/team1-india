import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { checkSpeedrunAccess } from "@/lib/permissions";
import { getRunBySlug, validateTrackIconOrThrow } from "@/lib/speedrun";
import { logAudit } from "@/lib/audit";

// POST /api/speedrun/runs/[slug]/tracks — add a track to a run
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await getServerSession(authOptions);
  const access = checkSpeedrunAccess(session, "WRITE");
  if (!access.authorized) return access.response!;

  const { slug } = await params;
  const run = await getRunBySlug(slug);
  if (!run) return NextResponse.json({ error: "Run not found" }, { status: 404 });

  const body = await request.json();
  const { name, tagline, iconKey, description, sortOrder } = body || {};

  if (!name || typeof name !== "string") {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }
  if (!tagline || typeof tagline !== "string") {
    return NextResponse.json({ error: "tagline is required" }, { status: 400 });
  }

  let validatedIcon: string | null;
  try {
    validatedIcon = validateTrackIconOrThrow(iconKey);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Invalid icon" },
      { status: 400 }
    );
  }

  try {
    const track = await prisma.speedrunTrack.create({
      data: {
        runId: run.id,
        name: name.trim(),
        tagline: tagline.trim(),
        iconKey: validatedIcon,
        description: description ?? null,
        sortOrder: typeof sortOrder === "number" ? sortOrder : 0,
      },
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const actorId = (session?.user as any)?.id ?? session?.user?.email ?? "unknown";
    await logAudit({
      action: "CREATE",
      resource: "SPEEDRUN_TRACK",
      resourceId: track.id,
      actorId,
      metadata: { runSlug: run.slug, name: track.name },
    });
    return NextResponse.json({ track }, { status: 201 });
  } catch (err) {
    // Likely a unique-constraint violation on (runId, name).
    const message = err instanceof Error ? err.message : "Failed to create track";
    return NextResponse.json({ error: message }, { status: 409 });
  }
}
