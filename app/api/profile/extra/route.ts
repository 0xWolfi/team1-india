import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const SocialProfileSchema = z.object({
  name: z.string().min(1).max(60),
  url: z.string().min(1).max(2000),
});

const ExtraProfileSchema = z.object({
  availability: z.string().max(60).optional().nullable(),
  currentProject: z.string().max(300).optional().nullable(),
  country: z.string().max(120).optional().nullable(),
  city: z.string().max(120).optional().nullable(),
  roles: z.array(z.string().max(60)).max(3).optional(),
  interests: z.array(z.string().max(60)).max(10).optional(),
  skills: z.array(z.string().max(60)).max(50).optional(),
  socialProfiles: z.array(SocialProfileSchema).max(20).optional(),
});

function normalizeArray(value: any): string[] {
  return Array.isArray(value) ? value.map(String) : [];
}

function normalizeSocialProfiles(value: any): Array<{ name: string; url: string }> {
  if (Array.isArray(value)) {
    return value
      .map((v) => ({ name: String(v?.name || ""), url: String(v?.url || "") }))
      .filter((v) => v.name && v.url);
  }
  return [];
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // @ts-ignore
  const role = session.user.role;
  if (role !== "CORE" && role !== "MEMBER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    if (role === "CORE") {
      const member = await prisma.member.findUnique({
        where: { email: session.user.email },
        select: { id: true },
      });
      if (!member) return NextResponse.json({ error: "User not found" }, { status: 404 });

      const extra = await prisma.memberExtraProfile.findFirst({
        where: { memberId: member.id, deletedAt: null },
      });

      return NextResponse.json({
        availability: extra?.availability || "Just Exploring",
        currentProject: extra?.currentProject || "",
        country: extra?.country || "",
        city: extra?.city || "",
        roles: normalizeArray(extra?.roles),
        interests: normalizeArray(extra?.interests),
        skills: normalizeArray(extra?.skills),
        socialProfiles: normalizeSocialProfiles(extra?.socialProfiles),
      });
    }

    // MEMBER (CommunityMember)
    const communityMember = await prisma.communityMember.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });
    if (!communityMember) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const extra = await prisma.memberExtraProfile.findFirst({
      where: { communityMemberId: communityMember.id, deletedAt: null },
    });

    return NextResponse.json({
      availability: extra?.availability || "Just Exploring",
      currentProject: extra?.currentProject || "",
      country: extra?.country || "",
      city: extra?.city || "",
      roles: normalizeArray(extra?.roles),
      interests: normalizeArray(extra?.interests),
      skills: normalizeArray(extra?.skills),
      socialProfiles: normalizeSocialProfiles(extra?.socialProfiles),
    });
  } catch (error) {
    console.error("GET /api/profile/extra error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // @ts-ignore
  const role = session.user.role;
  if (role !== "CORE" && role !== "MEMBER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = ExtraProfileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const data = parsed.data;

    if (role === "CORE") {
      const member = await prisma.member.findUnique({
        where: { email: session.user.email },
        select: { id: true },
      });
      if (!member) return NextResponse.json({ error: "User not found" }, { status: 404 });

      const upserted = await prisma.memberExtraProfile.upsert({
        where: { memberId: member.id },
        update: {
          ...(data.availability !== undefined && { availability: data.availability || null }),
          ...(data.currentProject !== undefined && { currentProject: data.currentProject || null }),
          ...(data.country !== undefined && { country: data.country || null }),
          ...(data.city !== undefined && { city: data.city || null }),
          ...(data.roles !== undefined && { roles: data.roles }),
          ...(data.interests !== undefined && { interests: data.interests }),
          ...(data.skills !== undefined && { skills: data.skills }),
          ...(data.socialProfiles !== undefined && { socialProfiles: data.socialProfiles }),
          deletedAt: null,
        },
        create: {
          memberId: member.id,
          availability: data.availability || "Just Exploring",
          currentProject: data.currentProject || null,
          country: data.country || null,
          city: data.city || null,
          roles: data.roles || [],
          interests: data.interests || [],
          skills: data.skills || [],
          socialProfiles: data.socialProfiles || [],
        },
      });

      return NextResponse.json(upserted);
    }

    const communityMember = await prisma.communityMember.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });
    if (!communityMember) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const upserted = await prisma.memberExtraProfile.upsert({
      where: { communityMemberId: communityMember.id },
      update: {
        ...(data.availability !== undefined && { availability: data.availability || null }),
        ...(data.currentProject !== undefined && { currentProject: data.currentProject || null }),
        ...(data.country !== undefined && { country: data.country || null }),
        ...(data.city !== undefined && { city: data.city || null }),
        ...(data.roles !== undefined && { roles: data.roles }),
        ...(data.interests !== undefined && { interests: data.interests }),
        ...(data.skills !== undefined && { skills: data.skills }),
        ...(data.socialProfiles !== undefined && { socialProfiles: data.socialProfiles }),
        deletedAt: null,
      },
      create: {
        communityMemberId: communityMember.id,
        availability: data.availability || "Just Exploring",
        currentProject: data.currentProject || null,
        country: data.country || null,
        city: data.city || null,
        roles: data.roles || [],
        interests: data.interests || [],
        skills: data.skills || [],
        socialProfiles: data.socialProfiles || [],
      },
    });

    return NextResponse.json(upserted);
  } catch (error) {
    console.error("PATCH /api/profile/extra error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

