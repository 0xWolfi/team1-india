import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options"; 
import { prisma } from "@/lib/prisma";
import { checkCoreAccess } from "@/lib/permissions";
import { sendEmail, getContributionApprovalEmailTemplate, getContributionRejectionEmailTemplate } from "@/lib/email";

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    const access = checkCoreAccess(session);
    if (!access.authorized) return access.response!;

    // @ts-ignore
    const userPermissions = session.user.permissions || {};
    const isSuperAdmin = userPermissions['*'] === 'FULL_ACCESS';

    if (!isSuperAdmin) {
        return new NextResponse("Only Superadmins can approve/reject contributions", { status: 403 });
    }

    try {
        const { id } = await params;
        const body = await request.json();
        const { status } = body;

        if (!status || (status !== 'approved' && status !== 'rejected' && status !== 'pending')) {
            return new NextResponse("Invalid status. Must be 'approved', 'rejected', or 'pending'", { status: 400 });
        }

        // Get contribution details before updating
        const contribution = await prisma.contribution.findUnique({
            where: { id },
            select: {
                id: true,
                type: true,
                name: true,
                email: true,
                status: true,
                submittedAt: true,
                eventDate: true,
                eventLocation: true,
                contentUrl: true,
                programId: true,
                internalWorksDescription: true
            }
        });

        if (!contribution) {
            return new NextResponse("Contribution not found", { status: 404 });
        }

        const updatedContribution = await prisma.contribution.update({
            where: { id },
            data: { status },
            select: {
                id: true,
                type: true,
                name: true,
                email: true,
                status: true,
                submittedAt: true,
                eventDate: true,
                eventLocation: true,
                contentUrl: true,
                programId: true,
                internalWorksDescription: true
            }
        });

        // Send email notification
        try {
            const contributorName = contribution.name || contribution.email.split('@')[0];
            let emailHtml = '';
            let emailSubject = '';

            if (status === 'approved') {
                emailHtml = getContributionApprovalEmailTemplate(contributorName, contribution.type);
                emailSubject = 'Your Contribution Has Been Approved';
            } else if (status === 'rejected') {
                emailHtml = getContributionRejectionEmailTemplate(contributorName, contribution.type);
                emailSubject = 'Update on Your Contribution';
            }

            if (emailHtml && emailSubject) {
                await sendEmail({
                    to: contribution.email,
                    subject: emailSubject,
                    html: emailHtml
                });
            }
        } catch (emailError) {
            console.error("Failed to send contribution status email:", emailError);
            // Don't fail the request if email fails
        }

        return NextResponse.json(updatedContribution);
    } catch (error) {
        console.error("Contribution Update Error", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
