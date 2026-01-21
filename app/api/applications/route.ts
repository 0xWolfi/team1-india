
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { sendEmail, getApplicationSubmittedEmailTemplate } from "@/lib/email";
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

        // For general membership applications (no guideId), check if user already has a pending application
        if (!guideId) {
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

        // Send simple confirmation email to applicant (only if guideId is provided)
        if (guideId) {
            try {
                const guide = await prisma.guide.findUnique({
                    where: { id: guideId },
                    select: { title: true, type: true }
                });
                const programTitle = guide?.title || 'the program';
                const applicantName = userName || applicantEmail.split('@')[0];
                const emailHtml = getApplicationSubmittedEmailTemplate(applicantName, programTitle);
                await sendEmail({
                    to: applicantEmail,
                    subject: `Application Submitted: ${programTitle}`,
                    html: emailHtml
                });

                // Send EVENT application notification to specific emails (Fire and Forget)
                if (guide?.type === 'EVENT') {
                    (async () => {
                        try {
                            const { getEventApplicationEmailTemplate } = await import("@/lib/email");
                            
                            // ⚠️ ADD YOUR 2 EMAIL ADDRESSES HERE ⚠️
                            const NOTIFICATION_EMAILS = [
                                'sarnavo@team1.network', // Replace with first email
                                'shriyash.pandey@avalabs.org',
                                'sarnavoss.dev@gmail.com'  // Replace with second email
                            ];
                            
                            // Format submission date
                            const submittedDate = new Date().toLocaleDateString('en-IN', {
                                day: '2-digit',
                                month: 'long',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                            });
                            
                            // Send to each recipient
                            for (const email of NOTIFICATION_EMAILS) {
                                // Extract name from email (before @)
                                const recipientName = email.split('@')[0].charAt(0).toUpperCase() + 
                                                     email.split('@')[0].slice(1).replace(/[._-]/g, ' ');
                                
                                const emailBody = getEventApplicationEmailTemplate(
                                    recipientName,
                                    applicantName,
                                    programTitle,
                                    application.data as Record<string, any>,
                                    submittedDate
                                );
                                
                                await sendEmail({
                                    to: email,
                                    subject: `New Event Application: ${programTitle}`,
                                    html: emailBody.replace(/\n/g, '<br>')
                                });
                            }
                        } catch (error) {
                            console.error("Failed to send event notification emails:", error);
                        }
                    })();
                }
            } catch (emailError) {
                console.error("Failed to send discussion email:", emailError);
                // Don't fail the request if email fails
            }
        }

        // Send Push Notification to Core Admins (Fire and Forget)
        (async () => {
             try {
                 const { notificationManager } = await import("@/lib/notificationManager");
                 const { prisma } = await import("@/lib/prisma");

                 // Fetch active core members
                 const admins = await prisma.member.findMany({
                     where: { status: 'active' }, // Or filter by role/permission if needed
                     select: { id: true }
                 });

                 const programTitle = body.guideId ? 'a program' : 'membership'; // Fetch real title if needed but keep it simple for now or use the one fetched above if guideId exists
                 
                 // Reuse title if available from email block
                 let displayTitle = 'New Application Received 📝';
                 let displayBody = `New application for ${programTitle} from ${userName || applicantEmail}`;
                 
                 if (guideId) {
                      // We fetched guide above in email block, but variable scope is limited. 
                      // Redoing fetch or structure code better would be ideal, but for now let's just use generic or async fetch if critical.
                      // Actually, let's keep it generic to avoid double DB hit if possible, or just re-fetch for safety in async block.
                 }

                 console.log(`Notifying ${admins.length} admins about new application`);

                 const batchSize = 10;
                 for (let i = 0; i < admins.length; i += batchSize) {
                     const batch = admins.slice(i, i + batchSize);
                     await Promise.all(batch.map(admin => 
                         notificationManager.send({
                             userId: admin.id,
                             event: 'application_submitted', // New event type
                             title: displayTitle,
                             body: displayBody,
                             data: {
                                 url: '/core/applications',
                                 id: application.id
                             }
                         })
                     ));
                 }
             } catch (err) {
                 console.error("Failed to notify admins of new application:", err);
             }
        })();

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
