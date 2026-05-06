import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import {
  canRegisterForRun,
  generateUniqueTeamCode,
  getRunBySlug,
  MAX_TEAM_SIZE,
} from "@/lib/speedrun";
import {
  sendEmail,
  getSpeedrunRegistrationEmail,
  getSpeedrunTeammateJoinedEmail,
} from "@/lib/email";

// POST /api/speedrun/runs/[slug]/register
// Slug-scoped registration. Same payload as the legacy /api/speedrun/register
// but resolves the run from the URL and gates on run.status.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userEmail = session.user.email;

  const { slug } = await params;
  const run = await getRunBySlug(slug);
  if (!run) {
    return NextResponse.json({ error: "Run not found" }, { status: 404 });
  }
  if (!canRegisterForRun(run.status)) {
    return NextResponse.json(
      { error: "Registration is closed for this run" },
      { status: 409 }
    );
  }
  // Hard cutoff if a deadline is set and has passed.
  if (run.registrationDeadline && new Date(run.registrationDeadline) < new Date()) {
    return NextResponse.json(
      { error: "Registration deadline has passed" },
      { status: 410 }
    );
  }

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
    teamCode, // when join
    trackPreference,
    projectIdea,
    whyJoin,
    consent,
    showSocials,
    referralCode,
    utmSource,
    utmMedium,
    utmCampaign,
  } = body || {};

  if (!fullName || !primaryRole || !experience || !teamMode) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
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

  const existing = await prisma.speedrunRegistration.findUnique({
    where: { runId_userEmail: { runId: run.id, userEmail } },
  });
  if (existing) {
    return NextResponse.json(
      { error: "You have already registered for this Speedrun" },
      { status: 409 }
    );
  }

  // Team handling — `create` auto-generates a Team1 ID; no user-supplied name.
  let teamId: string | null = null;
  let createdTeamCode: string | null = null;
  let joinedTeamCaptainEmail: string | null = null;
  let joinedTeamCode: string | null = null;

  if (teamMode === "create") {
    const code = await generateUniqueTeamCode();
    const team = await prisma.speedrunTeam.create({
      data: {
        runId: run.id,
        code,
        captainEmail: userEmail,
        members: { create: { email: userEmail, role: "captain" } },
      },
    });
    teamId = team.id;
    createdTeamCode = team.code;
  } else if (teamMode === "join") {
    if (!teamCode || typeof teamCode !== "string") {
      return NextResponse.json({ error: "Team code is required" }, { status: 400 });
    }
    const normalized = teamCode.trim().toUpperCase();
    const team = await prisma.speedrunTeam.findUnique({
      where: { code: normalized },
      include: { _count: { select: { members: true } } },
    });
    if (!team || team.runId !== run.id) {
      return NextResponse.json({ error: "Invalid team code" }, { status: 404 });
    }
    if (team._count.members >= MAX_TEAM_SIZE) {
      return NextResponse.json(
        { error: `This team is full (max ${MAX_TEAM_SIZE} members)` },
        { status: 409 }
      );
    }
    await prisma.speedrunTeamMember.upsert({
      where: { teamId_email: { teamId: team.id, email: userEmail } },
      create: { teamId: team.id, email: userEmail, role: "member" },
      update: {},
    });
    teamId = team.id;
    joinedTeamCaptainEmail = team.captainEmail;
    joinedTeamCode = team.code;
  }

  // Resolve referral (validate exists and isn't self-referral)
  let resolvedReferralCode: string | null = null;
  if (referralCode && typeof referralCode === "string") {
    const code = referralCode.trim().toUpperCase();
    if (code) {
      const ref = await prisma.speedrunReferralCode.findUnique({
        where: { code },
        select: { code: true, userEmail: true },
      });
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
      techStack: Array.isArray(techStack)
        ? techStack.filter((t: unknown) => typeof t === "string")
        : [],
      experience: String(experience),
      teamMode: String(teamMode),
      trackPreference: trackPreference ? String(trackPreference).trim() : null,
      projectIdea: projectIdea ? String(projectIdea).trim() : null,
      whyJoin: whyJoin ? String(whyJoin).trim() : null,
      consent: Boolean(consent),
      showSocials: showSocials !== false, // default true if not provided
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

  if (resolvedReferralCode) {
    await prisma.speedrunReferralCode
      .update({
        where: { code: resolvedReferralCode },
        data: { conversions: { increment: 1 } },
      })
      .catch(() => {});
  }

  // Fire-and-forget confirmation email
  const finalTeamCode = createdTeamCode || registration.team?.code || null;
  const finalTeamLabel = registration.team?.name || finalTeamCode;
  const mode = registration.teamMode as "solo" | "create" | "join";
  const emailContent = getSpeedrunRegistrationEmail({
    fullName: registration.fullName,
    runSlug: registration.run.slug,
    runLabel: registration.run.monthLabel,
    teamMode: mode === "create" || mode === "join" ? mode : "solo",
    teamName: finalTeamLabel,
    teamCode: finalTeamCode,
  });
  sendEmail({
    to: registration.userEmail,
    subject: emailContent.subject,
    html: emailContent.html,
  }).catch((err) => {
    console.error("[speedrun] failed to send registration email:", err);
  });

  // Captain notification on JOIN
  if (
    mode === "join" &&
    joinedTeamCaptainEmail &&
    joinedTeamCode &&
    joinedTeamCaptainEmail !== userEmail
  ) {
    prisma.speedrunRegistration
      .findUnique({
        where: { runId_userEmail: { runId: run.id, userEmail: joinedTeamCaptainEmail } },
        select: { fullName: true },
      })
      .then((captainReg) => {
        const captainName = captainReg?.fullName || joinedTeamCaptainEmail!.split("@")[0];
        const captainEmailContent = getSpeedrunTeammateJoinedEmail({
          captainName,
          teamName: joinedTeamCode!,
          runSlug: registration.run.slug,
          runLabel: registration.run.monthLabel,
          newMemberName: registration.fullName,
          newMemberEmail: registration.userEmail,
        });
        return sendEmail({
          to: joinedTeamCaptainEmail!,
          subject: captainEmailContent.subject,
          html: captainEmailContent.html,
        });
      })
      .catch((err) => {
        console.error("[speedrun] failed to send captain notification email:", err);
      });
  }

  return NextResponse.json({ registration, teamCode: finalTeamCode }, { status: 201 });
}
