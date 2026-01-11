import nodemailer from 'nodemailer';

// Email configuration
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
    },
});

interface EmailOptions {
    to: string;
    subject: string;
    html: string;
}

export async function sendEmail({ to, subject, html }: EmailOptions) {
    try {
        const info = await transporter.sendMail({
            from: `"${process.env.SMTP_FROM_NAME || 'Team1India'}" <${process.env.SMTP_USER}>`,
            to,
            subject,
            html,
        });

        console.log('Email sent successfully:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Failed to send email:', error);
        return { success: false, error };
    }
}

// Email template for application approval
export function getApprovalEmailTemplate(applicantName: string, programTitle: string, additionalInfo?: string) {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Application Approved</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #000000; color: #ffffff;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #000000;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #18181b; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 16px; overflow: hidden;">

                    <!-- Header with gradient -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 30px; text-align: center;">
                            <div style="width: 64px; height: 64px; margin: 0 auto 20px; background-color: rgba(255, 255, 255, 0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                                <span style="font-size: 32px;">✓</span>
                            </div>
                            <h1 style="margin: 0; font-size: 32px; font-weight: bold; color: #ffffff;">Congratulations! 🎉</h1>
                        </td>
                    </tr>

                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #e4e4e7;">
                                Hi ${applicantName},
                            </p>

                            <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #e4e4e7;">
                                We're excited to inform you that your application for <strong style="color: #ffffff;">${programTitle}</strong> has been <strong style="color: #10b981;">approved</strong>!
                            </p>

                            ${additionalInfo ? `
                            <div style="background-color: rgba(16, 185, 129, 0.1); border-left: 4px solid #10b981; padding: 16px; margin: 24px 0; border-radius: 8px;">
                                <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #d4d4d8;">
                                    ${additionalInfo}
                                </p>
                            </div>
                            ` : ''}

                            <p style="margin: 24px 0 0; font-size: 16px; line-height: 1.6; color: #e4e4e7;">
                                We'll be in touch with next steps soon. If you have any questions, feel free to reach out to us.
                            </p>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #09090b; padding: 30px; text-align: center; border-top: 1px solid rgba(255, 255, 255, 0.1);">
                            <p style="margin: 0 0 10px; font-size: 14px; color: #71717a;">
                                Best regards,<br>
                                <strong style="color: #ffffff;">Team1India Team</strong>
                            </p>
                            <p style="margin: 16px 0 0; font-size: 12px; color: #52525b;">
                                This is an automated message. Please do not reply to this email.
                            </p>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `;
}

// Email template for application rejection
export function getRejectionEmailTemplate(applicantName: string, programTitle: string, reason?: string) {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Application Status Update</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #000000; color: #ffffff;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #000000;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #18181b; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 16px; overflow: hidden;">

                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #27272a 0%, #18181b 100%); padding: 40px 30px; text-align: center;">
                            <div style="width: 64px; height: 64px; margin: 0 auto 20px; background-color: rgba(239, 68, 68, 0.1); border: 2px solid rgba(239, 68, 68, 0.3); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                                <span style="font-size: 32px; color: #ef4444;">✕</span>
                            </div>
                            <h1 style="margin: 0; font-size: 28px; font-weight: bold; color: #ffffff;">Application Status Update</h1>
                        </td>
                    </tr>

                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #e4e4e7;">
                                Hi ${applicantName},
                            </p>

                            <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #e4e4e7;">
                                Thank you for your interest in <strong style="color: #ffffff;">${programTitle}</strong>. After careful consideration, we regret to inform you that we are unable to approve your application at this time.
                            </p>

                            ${reason ? `
                            <div style="background-color: rgba(239, 68, 68, 0.05); border-left: 4px solid #ef4444; padding: 16px; margin: 24px 0; border-radius: 8px;">
                                <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #d4d4d8;">
                                    <strong style="color: #ffffff;">Note:</strong> ${reason}
                                </p>
                            </div>
                            ` : ''}

                            <p style="margin: 24px 0 0; font-size: 16px; line-height: 1.6; color: #e4e4e7;">
                                We appreciate your interest and encourage you to stay connected with us for future opportunities.
                            </p>

                            <p style="margin: 16px 0 0; font-size: 16px; line-height: 1.6; color: #e4e4e7;">
                                If you have any questions, please don't hesitate to reach out.
                            </p>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #09090b; padding: 30px; text-align: center; border-top: 1px solid rgba(255, 255, 255, 0.1);">
                            <p style="margin: 0 0 10px; font-size: 14px; color: #71717a;">
                                Best regards,<br>
                                <strong style="color: #ffffff;">Team1India Team</strong>
                            </p>
                            <p style="margin: 16px 0 0; font-size: 12px; color: #52525b;">
                                This is an automated message. Please do not reply to this email.
                            </p>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `;
}
