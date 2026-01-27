import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { checkCoreAccess } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { createGoogleMeetEvent } from "@/lib/google-calendar";
import { sendEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
    // Check authentication and core access
    const session = await getServerSession(authOptions);
    const access = checkCoreAccess(session);
    if (!access.authorized) return access.response!;

    // Check if user is superadmin or has operations permission
    // @ts-ignore
    const userPermissions = session.user?.permissions || {};
    // @ts-ignore
    const isSuperAdmin = userPermissions['*'] === 'FULL_ACCESS';
    const hasOperationsAccess = userPermissions['operations'] === 'WRITE' || 
                                userPermissions['operations'] === 'FULL_ACCESS' ||
                                isSuperAdmin;

    if (!hasOperationsAccess) {
        return NextResponse.json(
            { error: "Forbidden. Superadmin or core user with operations access required." },
            { status: 403 }
        );
    }

    try {
        const body = await req.json();
        const { title, description, date, time, duration, memberSelection, selectedMemberIds } = body;

        // Validation
        if (!title || !date || !time || !duration) {
            return NextResponse.json(
                { error: "Missing required fields: title, date, time, and duration are required" },
                { status: 400 }
            );
        }

        if (memberSelection !== 'all' && memberSelection !== 'individual') {
            return NextResponse.json(
                { error: "memberSelection must be 'all' or 'individual'" },
                { status: 400 }
            );
        }

        if (memberSelection === 'individual' && (!selectedMemberIds || selectedMemberIds.length === 0)) {
            return NextResponse.json(
                { error: "selectedMemberIds required when memberSelection is 'individual'" },
                { status: 400 }
            );
        }

        // Parse date and time
        const startDateTime = new Date(`${date}T${time}`);
        const durationMinutes = parseInt(duration);
        const endDateTime = new Date(startDateTime.getTime() + durationMinutes * 60 * 1000);

        // Validate dates
        if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
            return NextResponse.json(
                { error: "Invalid date or time format" },
                { status: 400 }
            );
        }

        // Get attendees based on selection
        let attendeeEmails: string[] = [];
        
        if (memberSelection === 'all') {
            // Get all active members
            const allMembers = await prisma.member.findMany({
                where: {
                    status: 'active',
                    deletedAt: null
                },
                select: {
                    email: true
                }
            });
            attendeeEmails = allMembers.map(m => m.email).filter(Boolean);
        } else {
            // Get selected members
            const selectedMembers = await prisma.member.findMany({
                where: {
                    id: { in: selectedMemberIds },
                    deletedAt: null
                },
                select: {
                    email: true
                }
            });
            attendeeEmails = selectedMembers.map(m => m.email).filter(Boolean);
        }

        if (attendeeEmails.length === 0) {
            return NextResponse.json(
                { error: "No attendees found" },
                { status: 400 }
            );
        }

        // Create Google Meet event
        const meetEvent = await createGoogleMeetEvent({
            title,
            description: description || '',
            startTime: startDateTime,
            endTime: endDateTime,
            attendees: attendeeEmails
        });

        // Get current user (session is guaranteed to exist after checkCoreAccess)
        if (!session?.user?.email) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const user = await prisma.member.findUnique({
            where: { email: session.user.email }
        });

        if (!user) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        // Create operation record
        const operation = await prisma.operation.create({
            data: {
                title,
                type: 'meeting',
                status: 'todo',
                dueDate: startDateTime,
                calendarEventId: meetEvent.eventId,
                links: [meetEvent.meetLink],
                assigneeId: user.id
            }
        });

        // Send email notifications to all attendees
        const emailPromises = attendeeEmails.map(email => {
            const emailHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #ffffff; color: #000000;">
    <div style="padding: 40px 20px; max-width: 600px; margin: 0 auto;">
        <h1 style="margin: 0 0 20px; font-size: 24px; font-weight: bold;">Meeting Scheduled: ${title}</h1>
        
        <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6;">
            You have been invited to a meeting scheduled by Team1 India.
        </p>
        
        <div style="background-color: #f5f5f5; border-radius: 8px; padding: 20px; margin: 24px 0;">
            <p style="margin: 0 0 12px; font-size: 16px; line-height: 1.6;">
                <strong>Title:</strong> ${title}
            </p>
            ${description ? `<p style="margin: 0 0 12px; font-size: 16px; line-height: 1.6;"><strong>Description:</strong> ${description}</p>` : ''}
            <p style="margin: 0 0 12px; font-size: 16px; line-height: 1.6;">
                <strong>Date & Time:</strong> ${startDateTime.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'long', timeStyle: 'short' })}
            </p>
            <p style="margin: 0 0 12px; font-size: 16px; line-height: 1.6;">
                <strong>Duration:</strong> ${durationMinutes} minutes
            </p>
        </div>
        
        <div style="margin: 24px 0; text-align: center;">
            <a href="${meetEvent.meetLink}" style="display: inline-block; background-color: #0066cc; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; font-size: 16px;">
                Join Google Meet
            </a>
        </div>
        
        <p style="margin: 24px 0 0; font-size: 14px; line-height: 1.6; color: #666666;">
            This meeting has been added to your Google Calendar. You can also join using the link above.
        </p>
        
        <p style="margin: 16px 0 0; font-size: 14px; line-height: 1.6; color: #666666;">
            Team1 India
        </p>
    </div>
</body>
</html>
            `;
            
            return sendEmail({
                to: email,
                subject: `Meeting Invitation: ${title}`,
                html: emailHtml
            });
        });

        // Send emails (don't wait for all to complete)
        Promise.all(emailPromises).catch(err => {
            console.error('Error sending meeting emails:', err);
        });

        // Audit log
        const { logAudit } = await import('@/lib/audit');
        await logAudit({
            action: 'CREATE',
            resource: 'OPERATION',
            resourceId: operation.id,
            actorId: user.id,
            metadata: { 
                title: operation.title, 
                type: 'meeting',
                meetLink: meetEvent.meetLink,
                attendeesCount: attendeeEmails.length
            }
        });

        return NextResponse.json({
            success: true,
            operation,
            meetEvent: {
                eventId: meetEvent.eventId,
                meetLink: meetEvent.meetLink,
                htmlLink: meetEvent.htmlLink
            },
            attendeesCount: attendeeEmails.length
        });

    } catch (error: any) {
        console.error("Schedule meeting error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to schedule meeting" },
            { status: 500 }
        );
    }
}
