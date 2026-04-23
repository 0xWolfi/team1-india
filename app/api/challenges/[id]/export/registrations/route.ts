import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";

// GET /api/challenges/[id]/export/registrations — CSV export (CORE)
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || (session.user as any)?.role !== "CORE") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;

  const registrations = await prisma.challengeRegistration.findMany({
    where: { challengeId: id },
    include: { teamMembers: true },
    orderBy: { createdAt: "asc" },
  });

  const header = "Captain Email,Team Name,Track,Status,Members,Referral Code,UTM Source,Registered At\n";
  const rows = registrations.map((r) => {
    const members = r.teamMembers.map((m) => `${m.email}(${m.status})`).join("; ");
    return `"${r.captainEmail}","${r.teamName || ""}","${r.trackId || ""}","${r.status}","${members}","${r.referralCode || ""}","${r.utmSource || ""}","${r.createdAt.toISOString()}"`;
  }).join("\n");

  return new Response(header + rows, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="registrations-${id}.csv"`,
    },
  });
}
