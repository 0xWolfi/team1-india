import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { sendNotification } from "@/lib/notify";

// Auto-hide threshold: when this many distinct reporters report the same
// project (and none have been triaged away), the project is moved out of the
// public list to `reported` for CORE review. A single bad-faith report can no
// longer take a project offline.
const AUTO_HIDE_REPORT_THRESHOLD = 3;
const MAX_REASON_LENGTH = 1000;

// POST /api/projects/[id]/report — flag for moderation
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const reporterEmail = session.user.email;

    const { id } = await params;

    let body: { reason?: unknown } = {};
    try {
      body = await request.json();
    } catch {
      // empty/invalid body — reason stays undefined
    }
    const reason =
      typeof body.reason === "string"
        ? body.reason.trim().slice(0, MAX_REASON_LENGTH) || null
        : null;

    const project = await prisma.userProject.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        status: true,
        ownerEmail: true,
        teamEmails: true,
        deletedAt: true,
      },
    });
    if (!project || project.deletedAt) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Don't accept reports from the team itself — reduces self-vandalism noise
    // and prevents a teammate dispute from being weaponized via the report API.
    if (
      project.ownerEmail === reporterEmail ||
      project.teamEmails.includes(reporterEmail)
    ) {
      return NextResponse.json(
        { error: "You cannot report your own project" },
        { status: 403 }
      );
    }

    // Insert the report. Unique (projectId, reporterEmail) makes this
    // idempotent — duplicate reports from the same user are treated as success.
    try {
      await prisma.projectReport.create({
        data: {
          projectId: project.id,
          reporterEmail,
          reason,
        },
      });
    } catch (e: any) {
      if (e?.code === "P2002") {
        // Already reported by this user — idempotent success.
        return NextResponse.json({ success: true, alreadyReported: true });
      }
      throw e;
    }

    // Threshold-based auto-hide: only flip status after N distinct reporters
    // have flagged the project, and only if a CORE admin hasn't already
    // triaged the existing reports away (reviewedAt IS NULL).
    if (project.status === "published") {
      const pendingCount = await prisma.projectReport.count({
        where: { projectId: project.id, reviewedAt: null },
      });

      if (pendingCount >= AUTO_HIDE_REPORT_THRESHOLD) {
        await prisma.userProject.update({
          where: { id: project.id },
          data: { status: "reported" },
        });
      }
    }

    // Notify all CORE admins — fire-and-forget so a notification failure
    // never breaks the report itself.
    prisma.member
      .findMany({
        where: { status: "active", deletedAt: null },
        select: { email: true },
      })
      .then((admins) => {
        for (const admin of admins) {
          sendNotification(
            admin.email,
            "project_reported",
            "Project Reported",
            `"${project.title}" was reported by ${reporterEmail}. Reason: ${reason || "No reason given"}`,
            `/core/projects`
          ).catch(() => {});
        }
      })
      .catch(() => {});

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("POST /api/projects/[id]/report failed", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
