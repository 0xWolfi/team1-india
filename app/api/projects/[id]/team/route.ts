import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { sendNotification } from "@/lib/notify";

// PATCH /api/projects/[id]/team — add/remove team members (owner only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const project = await prisma.userProject.findUnique({ where: { id } });

  if (!project || project.ownerEmail !== session.user.email) {
    return NextResponse.json({ error: "Only owner can manage team" }, { status: 403 });
  }

  const body = await request.json();
  const { add, remove } = body as { add?: string[]; remove?: string[] };

  let teamEmails = [...project.teamEmails];

  if (remove?.length) {
    // Can't remove owner
    const toRemove = remove.filter((e) => e !== project.ownerEmail);
    teamEmails = teamEmails.filter((e) => !toRemove.includes(e));
  }

  if (add?.length) {
    for (const email of add) {
      if (!teamEmails.includes(email)) {
        teamEmails.push(email);
        // Notify new member
        sendNotification(
          email,
          "project_team_add",
          "Added to Project",
          `You were added to "${project.title}" by ${session.user.name || session.user.email}`,
          `/public/projects/${project.slug}`
        ).catch(() => {});
      }
    }
  }

  await prisma.userProject.update({
    where: { id },
    data: { teamEmails },
  });

  return NextResponse.json({ teamEmails });
}

// POST /api/projects/[id]/team — member leaves project
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

  if (body.action !== "leave") {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const project = await prisma.userProject.findUnique({ where: { id } });
  if (!project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (project.ownerEmail === session.user.email) {
    return NextResponse.json({ error: "Owner cannot leave — transfer ownership first" }, { status: 400 });
  }

  const teamEmails = project.teamEmails.filter((e) => e !== session.user.email);
  await prisma.userProject.update({ where: { id }, data: { teamEmails } });

  return NextResponse.json({ success: true });
}
