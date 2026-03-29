import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { sendEmail } from "@/lib/email";

// POST — send feedback form email to host
export async function POST(request: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // @ts-ignore
    const role = session.user.role;
    if (role !== 'CORE') {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        const { to, subject, body } = await request.json();

        if (!to || !subject || !body) {
            return NextResponse.json({ error: "Missing required fields: to, subject, body" }, { status: 400 });
        }

        const result = await sendEmail({
            to,
            subject,
            html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #ffffff; color: #000000;">
    <div style="padding: 40px 20px; max-width: 600px; margin: 0 auto;">
        <div style="margin: 0 0 16px; font-size: 16px; line-height: 1.6; white-space: pre-wrap;">${body}</div>
        <p style="margin: 24px 0 0; font-size: 16px; line-height: 1.6;">
            Sarnavo<br>
            Team1 India
        </p>
    </div>
</body>
</html>`,
        });

        if (result.success) {
            return NextResponse.json({ success: true });
        } else {
            return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
        }
    } catch (error) {
        console.error('Failed to send feedback email:', error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
