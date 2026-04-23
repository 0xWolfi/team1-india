import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/partner-review/[token] — token-based submission view
export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const link = await prisma.partnerReviewLink.findUnique({ where: { token } });

  if (!link) return NextResponse.json({ error: "Invalid token" }, { status: 404 });
  if (new Date() > link.expiresAt) return NextResponse.json({ error: "Link expired" }, { status: 410 });

  // Increment access count
  await prisma.partnerReviewLink.update({ where: { id: link.id }, data: { accessCount: { increment: 1 } } });

  const submissions = await prisma.challengeSubmission.findMany({
    where: { challengeId: link.challengeId },
    orderBy: { submittedAt: "desc" },
    select: { id: true, teamEmail: true, trackId: true, demoUrl: true, repoUrl: true, presentationUrl: true, description: true, status: true, submittedAt: true },
  });

  const challenge = await prisma.challenge.findUnique({
    where: { id: link.challengeId },
    select: { title: true, judgingCriteria: true },
  });

  return NextResponse.json({ challenge, submissions, partnerName: link.partnerName });
}
