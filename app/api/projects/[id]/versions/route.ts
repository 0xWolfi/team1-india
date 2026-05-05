import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";

// GET /api/projects/[id]/versions — version timeline
// Authorized viewers (owner, teammate, CORE) only. Editor emails (`createdBy`)
// are PII and must not be exposed to the public.
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const project = await prisma.userProject.findFirst({
      where: { OR: [{ id }, { slug: id }], deletedAt: null },
      select: { id: true, ownerEmail: true, teamEmails: true },
    });

    if (!project) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const callerEmail = session.user.email;
    const isCore = (session.user as any)?.role === "CORE";
    const isTeam =
      project.ownerEmail === callerEmail || project.teamEmails.includes(callerEmail);

    if (!isTeam && !isCore) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const versions = await prisma.projectVersion.findMany({
      where: { projectId: project.id },
      orderBy: { versionNum: "desc" },
      select: {
        id: true,
        versionNum: true,
        title: true,
        changes: true,
        createdBy: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ versions });
  } catch (err) {
    console.error("GET /api/projects/[id]/versions failed", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
