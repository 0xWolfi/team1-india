import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/speedrun/runs/public — public list of runs for the landing page.
// No PII; only the fields needed for the Live + Past archive UI.
//
// Query params:
//   ?scope=live    → only the current run (1 row, or empty if none)
//   ?scope=past    → all completed runs, newest first
//   (default)      → both, with the current run first
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const scope = searchParams.get("scope");

  // Only surface runs that are far enough along to be worth showing publicly.
  // `upcoming` runs without a startDate are still hidden — operators can flip
  // status to `registration_open` when ready.
  const visibleStatuses = [
    "registration_open",
    "submissions_open",
    "submissions_closed",
    "irl_event",
    "judging",
    "completed",
  ];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = { deletedAt: null };
  if (scope === "live") {
    where.isCurrent = true;
    where.status = { in: visibleStatuses };
  } else if (scope === "past") {
    where.status = "completed";
    where.isCurrent = false;
  } else {
    where.status = { in: visibleStatuses };
  }

  const runs = await prisma.speedrunRun.findMany({
    where,
    orderBy: [{ isCurrent: "desc" }, { startDate: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      slug: true,
      monthLabel: true,
      theme: true,
      status: true,
      startDate: true,
      endDate: true,
      registrationDeadline: true,
      submissionOpenDate: true,
      irlEventDate: true,
      winnersDate: true,
      prizePool: true,
      hostCities: true,
      isCurrent: true,
      _count: { select: { registrations: true, projects: true } },
    },
  });

  return NextResponse.json({ runs });
}
