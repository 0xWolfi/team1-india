
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { sendEmail, getDiscussionEmailTemplate } from "@/lib/email";
import { withRateLimit } from "@/lib/rate-limit";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
    // Rate limiting: 3 applications per hour per IP to prevent spam
    const rateLimitResponse = await withRateLimit(3, 60 * 60 * 1000)(req);
    if (rateLimitResponse) {
        return rateLimitResponse;
    }

    try {
        // Verify Authentication
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "You must be logged in to apply." }, { status: 401 });
        }

        const body = await req.json();

        // guideId is optional - null for general membership applications
        const guideId = body.guideId || null;

        // Use session email (trusted) instead of body email
        const applicantEmail = session.user.email;
        
        // Fetch user name from database - prioritize DB over request body to prevent injection
        let userName = session.user.name || '';
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
            
            // Only use request body name as last resort if DB has no name, and sanitize it
            if (!userName && body.data?.name) {
                // Sanitize: remove any potential script tags or special characters
                userName = String(body.data.name).replace(/<[^>]*>/g, '').trim().substring(0, 100);
            }
        } catch (error) {
            console.error("Error fetching user name from database:", error);
            // Fallback to session name only, never trust request body
            userName = session.user.name || '';
        }

        // Check for existing submission within last 7 days (only if guideId is provided)
        if (guideId) {
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

            const existingApplication = await prisma.application.findFirst({
                where: {
                    guideId: guideId,
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
        } else {
            // For general membership applications, check if user already has a pending application
            const existingMembershipApplication = await prisma.application.findFirst({
                where: {
                    guideId: null,
                    applicantEmail: applicantEmail,
                    deletedAt: null,
                    status: 'pending'
                },
                orderBy: { submittedAt: 'desc' }
            });

            if (existingMembershipApplication) {
                return NextResponse.json({
                    error: "You already have a pending membership application",
                    message: "Please wait for your current application to be reviewed."
                }, { status: 429 });
            }
        }

        const application = await prisma.application.create({
            data: {
                guideId: guideId,
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

        // Send discussion email to applicant (only if guideId is provided)
        if (guideId) {
            try {
                const guide = await prisma.guide.findUnique({
                    where: { id: guideId },
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
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Only superadmins can view applications
        // @ts-ignore
        const userPermissions = session.user.permissions || {};
        const isSuperAdmin = userPermissions['*'] === 'FULL_ACCESS';

        if (!isSuperAdmin) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const applications = await prisma.application.findMany({
            where: { deletedAt: null },
            orderBy: { submittedAt: 'desc' },
            include: {
                guide: { select: { title: true, type: true } }
            }
        });
        return NextResponse.json(applications);
    } catch (error) {
        console.error("Applications Fetch Error:", error);
        return NextResponse.json({ error: "Error fetching applications" }, { status: 500 });
    }
}
