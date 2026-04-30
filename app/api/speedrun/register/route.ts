import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { getCurrentRun, generateUniqueTeamCode } from "@/lib/speedrun";

// POST /api/speedrun/register — create a registration (auth-required)
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userEmail = session.user.email;

  const body = await request.json();
  const {
    fullName,
    phone,
    city,
    twitterHandle,
    githubHandle,
    primaryRole,
    techStack,
    experience,
    teamMode, // solo | create | join
    teamName, // when create
    teamCode, // when join
    trackPreference,
    projectIdea,
    whyJoin,
    consent,
    referralCode, // optional referral code captured from ?ref=
    utmSource,
    utmMedium,
    utmCampaign,
  } = body || {};

  // Required field validation
  if (!fullName || !primaryRole || !experience || !teamMode) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }
  if (!consent) {
    return NextResponse.json(
      { error: "You must accept the code of conduct to register" },
      { status: 400 }
    );
  }
  if (!["solo", "create", "join"].includes(teamMode)) {
    return NextResponse.json({ error: "Invalid teamMode" }, { status: 400 });
  }

  const run = await getCurrentRun();

  // Already registered for this run?
  const existing = await prisma.speedrunRegistration.findUnique({
    where: { runId_userEmail: { runId: run.id, userEmail } },
  });
  if (existing) {
    return NextResponse.json(
      { error: "You have already registered for this Speedrun" },
      { status: 409 }
    );
  }

  // Team handling
  let teamId: string | null = null;
  let createdTeamCode: string | null = null;

  if (teamMode === "create") {
    if (!teamName || typeof teamName !== "string" || teamName.trim().length < 2) {
      return NextResponse.json(
        { error: "Team name is required (min 2 chars)" },
        { status: 400 }
      );
    }
    const code = await generateUniqueTeamCode();
    const team = await prisma.speedrunTeam.create({
      data: {
        runId: run.id,
        name: teamName.trim(),
        code,
        captainEmail: userEmail,
        members: {
          create: { email: userEmail, role: "captain" },
        },
      },
    });
    teamId = team.id;
    createdTeamCode = team.code;
  } else if (teamMode === "join") {
    if (!teamCode || typeof teamCode !== "string") {
      return NextResponse.json(
        { error: "Team code is required" },
        { status: 400 }
      );
    }
    const normalized = teamCode.trim().toUpperCase();
    const team = await prisma.speedrunTeam.findUnique({
      where: { code: normalized },
      include: { _count: { select: { members: true } } },
    });
    if (!team || team.runId !== run.id) {
      return NextResponse.json(
        { error: "Invalid team code" },
        { status: 404 }
      );
    }
    if (team._count.members >= 5) {
      return NextResponse.json(
        { error: "This team is full (max 5 members)" },
        { status: 409 }
      );
    }
    // Add as team member (idempotent on the unique constraint)
    await prisma.speedrunTeamMember.upsert({
      where: { teamId_email: { teamId: team.id, email: userEmail } },
      create: { teamId: team.id, email: userEmail, role: "member" },
      update: {},
    });
    teamId = team.id;
  }

  // Resolve referral code (validate exists and isn't self-referral)
  let resolvedReferralCode: string | null = null;
  if (referralCode && typeof referralCode === "string") {
    const code = referralCode.trim().toUpperCase();
    if (code) {
      const ref = await prisma.speedrunReferralCode.findUnique({
        where: { code },
        select: { code: true, userEmail: true },
      });
      // Ignore self-referrals — a user can't refer themselves
      if (ref && ref.userEmail !== userEmail) {
        resolvedReferralCode = ref.code;
      }
    }
  }

  const registration = await prisma.speedrunRegistration.create({
    data: {
      runId: run.id,
      teamId,
      userEmail,
      fullName: String(fullName).trim(),
      phone: phone ? String(phone).trim() : null,
      city: city ? String(city).trim() : null,
      twitterHandle: twitterHandle ? String(twitterHandle).trim().replace(/^@/, "") : null,
      githubHandle: githubHandle ? String(githubHandle).trim().replace(/^@/, "") : null,
      primaryRole: String(primaryRole),
      techStack: Array.isArray(techStack) ? techStack.filter((t) => typeof t === "string") : [],
      experience: String(experience),
      teamMode: String(teamMode),
      trackPreference: trackPreference ? String(trackPreference).trim() : null,
      projectIdea: projectIdea ? String(projectIdea).trim() : null,
      whyJoin: whyJoin ? String(whyJoin).trim() : null,
      consent: Boolean(consent),
      status: "registered",
      referralCode: resolvedReferralCode,
      utmSource: utmSource ? String(utmSource).trim().slice(0, 80) : null,
      utmMedium: utmMedium ? String(utmMedium).trim().slice(0, 80) : null,
      utmCampaign: utmCampaign ? String(utmCampaign).trim().slice(0, 80) : null,
    },
    include: {
      team: { select: { id: true, name: true, code: true } },
      run: { select: { id: true, slug: true, monthLabel: true } },
    },
  });

  // Increment conversion counter on the referrer's code
  if (resolvedReferralCode) {
    await prisma.speedrunReferralCode.update({
      where: { code: resolvedReferralCode },
      data: { conversions: { increment: 1 } },
    }).catch(() => {});
  }

  return NextResponse.json(
    {
      registration,
      teamCode: createdTeamCode || registration.team?.code || null,
    },
    { status: 201 }
  );
}
