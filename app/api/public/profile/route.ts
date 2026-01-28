import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Schema for profile update
const profileSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters").max(50).optional(),
  bio: z.string().max(500).optional(),
  location: z.string().max(100).optional(),
  city: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
  roles: z.array(z.string()).optional(),
  interests: z.array(z.string()).optional(),
  skills: z.array(z.string()).optional(),
  currentProject: z.string().max(100).optional(),
  availability: z.string().optional(),
  socialProfiles: z.array(z.object({
      name: z.string(),
      url: z.string().url()
  })).optional(),
  profileImage: z.union([z.string().url(), z.literal("")]).optional(),
  consentNewsletter: z.boolean().optional(),
  consentLegal: z.boolean().optional(),
});

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  // @ts-ignore
  const role = session.user.role;
  // @ts-ignore
  const userId = session.user.id;

  if (role !== 'PUBLIC') {
      return new NextResponse("Forbidden: Access restricted to public users", { status: 403 });
  }

  try {
    const publicUser = await prisma.publicUser.findUnique({
      where: { id: userId },
      select: {
          fullName: true,
          email: true,
          profileImage: true,
          bio: true,
          location: true,
          city: true, 
          country: true,
          roles: true,
          interests: true,
          skills: true,
          currentProject: true,
          availability: true,
          preferredChains: true, 
          socialProfiles: true,
          consentNewsletter: true,
          consentLegal: true,
          createdAt: true
      }
    });

    if (!publicUser) {
      return new NextResponse("User not found", { status: 404 });
    }

    return NextResponse.json(publicUser);
  } catch (error) {
    console.error("Profile Fetch Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // @ts-ignore
  const role = session.user.role;
  // @ts-ignore
  const userId = session.user.id;

  if (!userId) {
    return NextResponse.json({ error: "User ID not found in session" }, { status: 401 });
  }

  if (role !== 'PUBLIC') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const validatedData = profileSchema.parse(body);

    // Prepare update data
    const updateData: any = {};
    if (validatedData.fullName !== undefined) updateData.fullName = validatedData.fullName;
    if (validatedData.bio !== undefined) updateData.bio = validatedData.bio;
    if (validatedData.location !== undefined) updateData.location = validatedData.location;
    if (validatedData.city !== undefined) updateData.city = validatedData.city;
    if (validatedData.country !== undefined) updateData.country = validatedData.country;
    if (validatedData.roles !== undefined) updateData.roles = validatedData.roles;
    if (validatedData.interests !== undefined) updateData.interests = validatedData.interests;
    if (validatedData.skills !== undefined) updateData.skills = validatedData.skills;
    if (validatedData.currentProject !== undefined) updateData.currentProject = validatedData.currentProject;
    if (validatedData.availability !== undefined) updateData.availability = validatedData.availability;
    if (validatedData.socialProfiles !== undefined) updateData.socialProfiles = validatedData.socialProfiles;
    // Handle profileImage: empty string becomes null, valid URL stays as is
    if (validatedData.profileImage !== undefined) {
      updateData.profileImage = validatedData.profileImage === "" ? null : validatedData.profileImage;
    }
    
    // Handle Consent
    if (validatedData.consentNewsletter !== undefined) updateData.consentNewsletter = validatedData.consentNewsletter;
    if (validatedData.consentLegal !== undefined) {
        updateData.consentLegal = validatedData.consentLegal;
        if (validatedData.consentLegal === true) {
            updateData.consentVersion = "v1.0";
            updateData.consentTimestamp = new Date();
        }
    }

    const updatedUser = await prisma.publicUser.update({
      where: { id: userId },
      data: updateData
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("Validation Error:", error.errors);
      return NextResponse.json({ 
        error: "Invalid request data", 
        details: error.errors 
      }, { status: 400 });
    }
    console.error("Profile Update Error:", error);
    return NextResponse.json({ 
      error: "Internal Server Error",
      message: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}
