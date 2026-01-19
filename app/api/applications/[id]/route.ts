import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { sendEmail, getApprovalEmailTemplate, getRejectionEmailTemplate } from "@/lib/email";
import { notificationManager } from "@/lib/notificationManager";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    // Ensure user is admin/core
    if (!session?.user?.id || session.user.role !== 'CORE') {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { status } = await req.json();

    if (!['PENDING', 'APPROVED', 'REJECTED'].includes(status)) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    // Get application with guide details before updating
    const existingApplication = await prisma.application.findUnique({
      where: { id },
      include: {
        guide: {
          select: { title: true, type: true }
        }
      }
    });

    if (!existingApplication) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    // Update application status
    const application = await prisma.application.update({
      where: { id },
      data: { status }
    });

    // Send email notification if status changed to APPROVED or REJECTED
    if (status === 'APPROVED' || status === 'REJECTED') {
      const applicantEmail = application.applicantEmail;
      const applicantData = application.data as any;
      const applicantName = applicantData?.name || applicantData?.fullName || 'there';
      const programTitle = existingApplication.guide?.title || 'our program';

      if (applicantEmail) {
        // 1. Send Email
        if (status === 'APPROVED') {
          const emailHtml = getApprovalEmailTemplate(applicantName, programTitle);

          await sendEmail({
            to: applicantEmail,
            subject: `Your ${programTitle} Application Has Been Approved`,
            html: emailHtml
          });
        } else if (status === 'REJECTED') {
          const emailHtml = getRejectionEmailTemplate(applicantName, programTitle);

          await sendEmail({
            to: applicantEmail,
            subject: `Update on Your ${programTitle} Application`,
            html: emailHtml
          });
        }

        console.log(`Email sent to ${applicantEmail} for status: ${status}`);

        // 2. Send Push Notification
        try {
          // Find member by email to get ID
          const member = await prisma.member.findUnique({
            where: { email: applicantEmail },
            select: { id: true }
          });

          if (member) {
            const event = status === 'APPROVED' ? 'application_approved' : 'application_rejected';
            const title = status === 'APPROVED' ? 'Application Approved! 🎉' : 'Application Update';
            const body = status === 'APPROVED' 
              ? `Congratulations! Your application for ${programTitle} has been approved.`
              : `There is an update on your application for ${programTitle}. Check your email for details.`;

            await notificationManager.send({
              userId: member.id,
              event,
              title,
              body,
              data: {
                id: application.id,
                url: `/member/programs/${existingApplication.guideId || ''}` // Redirect to program page
              }
            });
            console.log(`Push notification sent to ${member.id}`);
          }
        } catch (pushError) {
          console.error("Failed to send push notification:", pushError);
          // Don't block response
        }
      }
    }

    return NextResponse.json(application);
  } catch (error) {
    console.error("Failed to update application:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
