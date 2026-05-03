import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { checkSpeedrunAccess } from "@/lib/permissions";
import { setCurrentRun } from "@/lib/speedrun";
import { logAudit } from "@/lib/audit";

// POST /api/speedrun/runs/[slug]/set-current — atomically promote a run
// to "current" (clears the flag on every other run in the same transaction).
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await getServerSession(authOptions);
  const access = checkSpeedrunAccess(session, "WRITE");
  if (!access.authorized) return access.response!;

  const { slug } = await params;
  try {
    await setCurrentRun(slug);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const actorId = (session?.user as any)?.id ?? session?.user?.email ?? "unknown";
    await logAudit({
      action: "UPDATE",
      resource: "SPEEDRUN_RUN",
      actorId,
      metadata: { slug, change: "set_as_current" },
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to set current run";
    return NextResponse.json({ error: message }, { status: 404 });
  }
}
