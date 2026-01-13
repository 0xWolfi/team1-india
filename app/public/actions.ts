"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

export async function applyToProgram(programId: string, formData: FormData) {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;

  if (!email) {
    return { success: false, message: "Email is required" };
  }

    // Verify Authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return { success: false, message: "You must be logged in to apply." };
    }

    const userEmail = session.user.email;
    
    // Fetch user name from database (Member or CommunityMember)
    let userName = session.user.name || name;
    try {
        const memberRecord = await prisma.member.findUnique({ 
            where: { email: userEmail },
            select: { name: true }
        });
        
        if (memberRecord?.name) {
            userName = memberRecord.name;
        } else {
            // Check CommunityMember table
            const communityMember = await prisma.communityMember.findUnique({
                where: { email: userEmail },
                select: { name: true }
            });
            
            if (communityMember?.name) {
                userName = communityMember.name;
            }
        }
    } catch (error) {
        console.error("Error fetching user name from database:", error);
        // Fallback to session name or form name
    }

    // Fetch Guide limits
    try {
    const guide = await prisma.guide.findUnique({
        where: { id: programId }
    }) as any;

    if (!guide) {
        return { success: false, message: "Program not found." };
    }

    // Determine limit based on user type
    const memberRecord = await prisma.member.findUnique({ where: { email: userEmail }});
    const limit = memberRecord ? (guide.maxSubmissionsMember || 10) : (guide.maxSubmissionsPublic || 1);

    // Check existing submissions
    const submissionCount = await prisma.application.count({
        where: { 
            guideId: programId,
            applicantEmail: userEmail
        }
    });

    if (submissionCount >= limit) {
        return { success: false, message: `Submission limit reached (${limit} max).` };
    }

    await prisma.application.create({
      // @ts-ignore
      data: {
        applicantEmail: userEmail, // Use trusted session email
        data: { name: userName, ...Object.fromEntries(formData) }, // Store all form data
        status: "pending",
        guideId: programId
      }
    });

    return { success: true, message: "Application submitted successfully!" };
  } catch (error) {
    console.error("Application error:", error);
    return { success: false, message: "Failed to submit application." };
  }
}
