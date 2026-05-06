import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";

// GET /api/speedrun/registrations/export?runId=...&status=...
// CORE-only CSV export of registrations for ops handling.
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const role = (session?.user as any)?.role;
  if (role !== "CORE") {
    return new Response("Forbidden", { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const runId = searchParams.get("runId");
  const status = searchParams.get("status");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};
  if (runId) where.runId = runId;
  if (status) where.status = status;

  const registrations = await prisma.speedrunRegistration.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      team: { select: { code: true, captainEmail: true } },
      run: { select: { slug: true, monthLabel: true } },
    },
  });

  const headers = [
    "createdAt",
    "runSlug",
    "runLabel",
    "fullName",
    "email",
    "phone",
    "city",
    "twitter",
    "github",
    "primaryRole",
    "experience",
    "techStack",
    "teamMode",
    "team1Id",
    "captainEmail",
    "trackPreference",
    "projectIdea",
    "whyJoin",
    "showSocials",
    "status",
    "referralCode",
    "utmSource",
    "utmMedium",
    "utmCampaign",
  ];

  const rows = registrations.map((r) => [
    r.createdAt.toISOString(),
    r.run.slug,
    r.run.monthLabel,
    r.fullName,
    r.userEmail,
    r.phone ?? "",
    r.city ?? "",
    r.twitterHandle ? `@${r.twitterHandle}` : "",
    r.githubHandle ? `@${r.githubHandle}` : "",
    r.primaryRole,
    r.experience,
    (r.techStack ?? []).join("; "),
    r.teamMode,
    r.team?.code ?? "",
    r.team?.captainEmail ?? "",
    r.trackPreference ?? "",
    r.projectIdea ?? "",
    r.whyJoin ?? "",
    String(r.showSocials),
    r.status,
    r.referralCode ?? "",
    r.utmSource ?? "",
    r.utmMedium ?? "",
    r.utmCampaign ?? "",
  ]);

  const csv = [headers, ...rows].map(toCsvRow).join("\n");

  // Build a date-stamped filename for ops.
  const dateStamp = new Date().toISOString().slice(0, 10);
  const filename = `speedrun-registrations-${dateStamp}.csv`;

  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      // Prevent any caching of PII.
      "Cache-Control": "no-store, max-age=0",
    },
  });
}

/** RFC-4180-compatible CSV escaping. */
function toCsvRow(values: (string | number)[]): string {
  return values
    .map((v) => {
      const s = String(v ?? "");
      if (s.includes(",") || s.includes("\"") || s.includes("\n") || s.includes("\r")) {
        return `"${s.replace(/"/g, '""')}"`;
      }
      return s;
    })
    .join(",");
}
