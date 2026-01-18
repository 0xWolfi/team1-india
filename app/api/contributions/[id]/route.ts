import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options"; 
import { prisma } from "@/lib/prisma";
import { checkCoreAccess } from "@/lib/permissions";
import { sendEmail, getContributionApprovalEmailTemplate, getContributionRejectionEmailTemplate } from "@/lib/email";
import { log } from "@/lib/logger";
import { z } from "zod";

// Zod validation schema
const ContributionStatusSchema = z.object({
    status: z.enum(["approved", "rejected", "pending"])
});

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
        
        // Validate input with Zod
        const validationResult = ContributionStatusSchema.safeParse(body);
        if (!validationResult.success) {
            log("WARN", "Invalid contribution status update", "CONTRIBUTIONS", { 
                contributionId: id,
                email: session?.user?.email || "unknown",
                errors: validationResult.error.flatten()
            });
            return new NextResponse("Invalid status. Must be 'approved', 'rejected', or 'pending'", { status: 400 });
        }

        const { status } = validationResult.data;

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
                log("INFO", "Contribution status email sent", "CONTRIBUTIONS", { 
                    contributionId: id,
                    status,
                    recipientEmail: contribution.email
                });
            }
        } catch (emailError) {
            log("ERROR", "Failed to send contribution status email", "CONTRIBUTIONS", { 
                contributionId: id,
                recipientEmail: contribution.email
            }, emailError instanceof Error ? emailError : new Error(String(emailError)));
            // Don't fail the request if email fails
        }

        log("INFO", "Contribution status updated", "CONTRIBUTIONS", { 
            contributionId: id,
            status,
            updatedBy: session?.user?.email || "unknown"
        });

        return NextResponse.json(updatedContribution);
    } catch (error) {
        const contributionId = (await params).id;
        log("ERROR", "Contribution update failed", "CONTRIBUTIONS", { 
            contributionId,
            email: session?.user?.email || "unknown"
        }, error instanceof Error ? error : new Error(String(error)));
        return new NextResponse("Internal Error", { status: 500 });
    }
}
