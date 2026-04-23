import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { sendNotification } from "@/lib/notify";

// POST /api/projects/[id]/report — flag for moderation
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const { reason } = body;

  const project = await prisma.userProject.findUnique({ where: { id } });
  if (!project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.userProject.update({
    where: { id },
    data: { status: "reported" },
  });

  // Notify all CORE admins
  const coreMembers = await prisma.member.findMany({
    where: { status: "active", deletedAt: null },
    select: { email: true },
  });

  for (const admin of coreMembers) {
    sendNotification(
      admin.email,
      "project_reported",
      "Project Reported",
      `"${project.title}" was reported by ${session.user.email}. Reason: ${reason || "No reason given"}`,
      `/core/projects`
    ).catch(() => {});
  }

  return NextResponse.json({ success: true });
}
