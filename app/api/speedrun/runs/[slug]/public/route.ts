import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { firstNameFrom } from "@/lib/speedrun";

// GET /api/speedrun/runs/[slug]/public — public details for a single run.
// Includes tracks, submitted projects, and a privacy-filtered team list
// (Team1 ID + first name only; emails always hidden; socials only if the
// registrant opted in via showSocials).
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const run = await prisma.speedrunRun.findFirst({
    where: { slug, deletedAt: null },
    include: {
      tracks: { orderBy: { sortOrder: "asc" } },
    },
  });
  if (!run) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Soft-hide upcoming runs from the public details page until the operator
  // promotes them. Admin pages use the non-`/public` endpoint.
  if (run.status === "upcoming") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Surface only published projects mapped to this run. Note: emails are
  // intentionally excluded — UI uses Team1 IDs as identity. teamEmailHash
  // (length only) is included so the UI can render member-count badges
  // without exposing addresses.
  const projectsRaw = await prisma.userProject.findMany({
    where: {
      speedrunRunId: run.id,
      status: "published",
      deletedAt: null,
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      slug: true,
      title: true,
      description: true,
      coverImage: true,
      images: true,
      demoUrl: true,
      repoUrl: true,
      videoUrl: true,
      socialPostUrl: true,
      techStack: true,
      tags: true,
      teamEmails: true, // dropped before sending — only used for memberCount
      viewCount: true,
      likeCount: true,
      commentCount: true,
      createdAt: true,
      speedrunTrack: { select: { id: true, name: true, iconKey: true } },
      speedrunTeam: { select: { id: true, code: true } },
    },
  });
  const projects = projectsRaw.map(({ teamEmails, speedrunTeam, ...p }) => ({
    ...p,
    memberCount: teamEmails?.length ?? 0,
    team: speedrunTeam ? { id: speedrunTeam.id, team1Id: speedrunTeam.code } : null,
  }));

  // Build the public team list — Team1 ID, first names, optional socials.
  const teams = await prisma.speedrunTeam.findMany({
    where: { runId: run.id },
    include: {
      members: { orderBy: { joinedAt: "asc" } },
      registrations: {
        select: {
          userEmail: true,
          fullName: true,
          city: true,
          primaryRole: true,
          twitterHandle: true,
          githubHandle: true,
          showSocials: true,
        },
      },
    },
  });

  const publicTeams = teams.map((team) => {
    // Index registrations by email for fast lookup. Teammates without a
    // registration row (shouldn't happen but be defensive) get a stub entry.
    const byEmail = new Map(team.registrations.map((r) => [r.userEmail, r]));
    return {
      id: team.id,
      team1Id: team.code,
      memberCount: team.members.length,
      members: team.members.map((m) => {
        const reg = byEmail.get(m.email);
        const showSocials = reg?.showSocials ?? false;
        return {
          team1Id: team.code,
          firstName: firstNameFrom(reg?.fullName),
          city: reg?.city ?? null,
          primaryRole: reg?.primaryRole ?? null,
          isCaptain: m.role === "captain",
          twitterHandle: showSocials ? reg?.twitterHandle ?? null : null,
          githubHandle: showSocials ? reg?.githubHandle ?? null : null,
        };
      }),
    };
  });

  return NextResponse.json({
    run: {
      id: run.id,
      slug: run.slug,
      monthLabel: run.monthLabel,
      theme: run.theme,
      themeDescription: run.themeDescription,
      status: run.status,
      startDate: run.startDate,
      endDate: run.endDate,
      registrationDeadline: run.registrationDeadline,
      submissionOpenDate: run.submissionOpenDate,
      irlEventDate: run.irlEventDate,
      winnersDate: run.winnersDate,
      sponsors: run.sponsors,
      prizePool: run.prizePool,
      hostCities: run.hostCities,
      faq: run.faq,
      isCurrent: run.isCurrent,
      tracks: run.tracks,
    },
    projects,
    teams: publicTeams,
  });
}
