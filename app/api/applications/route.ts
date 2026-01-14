
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { sendEmail, getDiscussionEmailTemplate } from "@/lib/email";

const prisma = new PrismaClient();

export async function POST(req: Request) {
    try {
        // Verify Authentication
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "You must be logged in to apply." }, { status: 401 });
        }

        const body = await req.json();

        // Basic validation
        if (!body.guideId) {
            return NextResponse.json({ error: "Guide ID is required" }, { status: 400 });
        }

        // Use session email (trusted) instead of body email
        const applicantEmail = session.user.email;
        
        // Fetch user name from database
        let userName = session.user.name || body.data?.name || body.name || '';
        try {
            const memberRecord = await prisma.member.findUnique({ 
                where: { email: applicantEmail },
                select: { name: true }
            });
            
            if (memberRecord?.name) {
                userName = memberRecord.name;
            } else {
                // Check CommunityMember table
                const communityMember = await prisma.communityMember.findUnique({
                    where: { email: applicantEmail },
                    select: { name: true }
                });
                
                if (communityMember?.name) {
                    userName = communityMember.name;
                }
            }
        } catch (error) {
            console.error("Error fetching user name from database:", error);
        }

        // Check for existing submission within last 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const existingApplication = await prisma.application.findFirst({
            where: {
                guideId: body.guideId,
                applicantEmail: applicantEmail,
                submittedAt: {
                    gte: sevenDaysAgo
                },
                deletedAt: null
            },
            orderBy: { submittedAt: 'desc' }
        });

        if (existingApplication) {
            const daysSinceSubmission = Math.floor(
                (Date.now() - new Date(existingApplication.submittedAt).getTime()) / (1000 * 60 * 60 * 24)
            );
            const daysRemaining = 7 - daysSinceSubmission;

            return NextResponse.json({
                error: "You have already submitted an application for this event",
                message: `You can submit again in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}`,
                canReapplyAt: new Date(new Date(existingApplication.submittedAt).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()
            }, { status: 429 });
        }

        const application = await prisma.application.create({
            data: {
                guideId: body.guideId,
                applicantEmail: applicantEmail, // Use trusted session email
                status: "pending",
                data: {
                    name: userName, // Use database name
                    email: applicantEmail, // Use trusted session email
                    ...body.data,
                    submittedAt: new Date().toISOString()
                }
            }
        });

        // Send discussion email to applicant
        try {
            const guide = await prisma.guide.findUnique({
                where: { id: body.guideId },
                select: { title: true }
            });
            const programTitle = guide?.title || 'the program';
            const applicantName = userName || applicantEmail.split('@')[0];
            const emailHtml = getDiscussionEmailTemplate(applicantName, programTitle);
            await sendEmail({
                to: applicantEmail,
                subject: `Your ${programTitle} Application Is Under Discussion`,
                html: emailHtml
            });
        } catch (emailError) {
            console.error("Failed to send discussion email:", emailError);
            // Don't fail the request if email fails
        }

        return NextResponse.json({ success: true, id: application.id });
    } catch (error) {
        console.error("Application Submit Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function GET(req: Request) {
    // SECURITY: This should be protected in production (check session). 
    // Assuming this route is for the admin panel which is protected or checking auth here.
    // For now, fetching all pending applications.
    try {
        const applications = await prisma.application.findMany({
            orderBy: { submittedAt: 'desc' },
            include: {
                guide: { select: { title: true, type: true } }
            }
        });
        return NextResponse.json(applications);
    } catch (error) {
        return NextResponse.json({ error: "Error fetching applications" }, { status: 500 });
    }
}
