import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";

// POST /api/challenges/[id]/submissions — submit project
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const { projectId, trackId, demoUrl, repoUrl, presentationUrl, description } = await request.json();

  const challenge = await prisma.challenge.findUnique({ where: { id } });
  if (!challenge || !["in_progress", "registration_open"].includes(challenge.status)) {
    return NextResponse.json({ error: "Submissions not open" }, { status: 400 });
  }
  if (challenge.submissionDeadline && new Date() > challenge.submissionDeadline) {
    return NextResponse.json({ error: "Submission deadline passed" }, { status: 400 });
  }

  const registration = await prisma.challengeRegistration.findUnique({
    where: { challengeId_captainEmail: { challengeId: id, captainEmail: session.user.email } },
  });

  const submission = await prisma.challengeSubmission.create({
    data: {
      challengeId: id, registrationId: registration?.id, projectId, teamEmail: session.user.email,
      trackId, demoUrl, repoUrl, presentationUrl, description,
    },
  });

  // Link project to challenge if provided
  if (projectId) {
    await prisma.userProject.update({ where: { id: projectId }, data: { challengeId: id } }).catch(() => {});
  }

  return NextResponse.json({ submission }, { status: 201 });
}

// GET /api/challenges/[id]/submissions — admin view (CORE)
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || (session.user as any)?.role !== "CORE") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const submissions = await prisma.challengeSubmission.findMany({
    where: { challengeId: id },
    orderBy: { submittedAt: "desc" },
  });
  return NextResponse.json({ submissions });
}
