import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";

// GET /api/challenges/[id]/export/submissions — CSV export (CORE)
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || (session.user as any)?.role !== "CORE") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;

  const submissions = await prisma.challengeSubmission.findMany({
    where: { challengeId: id },
    orderBy: { submittedAt: "asc" },
  });

  const header = "Team Email,Track,Demo URL,Repo URL,Presentation,Status,Submitted At\n";
  const rows = submissions.map((s) =>
    `"${s.teamEmail}","${s.trackId || ""}","${s.demoUrl || ""}","${s.repoUrl || ""}","${s.presentationUrl || ""}","${s.status}","${s.submittedAt.toISOString()}"`
  ).join("\n");

  return new Response(header + rows, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="submissions-${id}.csv"`,
    },
  });
}
