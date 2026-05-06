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

// Event application notification template
export function getEventApplicationEmailTemplate(
    recipientName: string,
    applicantName: string,
    eventTitle: string,
    formData: Record<string, any>,
    submittedAt: string
) {
    // Format form fields professionally
    const formFieldsHtml = Object.entries(formData)
        .map(([key, value]) => {
            // Skip internal fields
            if (key === 'submittedAt') return '';
            
            // Capitalize field names properly
            const label = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');
            
            return `${label}: ${value}`;
        })
        .filter(Boolean)
        .join('\n');

    return `Hey ${recipientName},

${applicantName} has submitted an application for the ${eventTitle} event.

Here are the details:

${formFieldsHtml}

Submitted on: ${submittedAt}

---
This is an automated notification from Team1 India.`;
}

// Welcome email template (when superadmin adds a member)
export function getWelcomeEmailTemplate(name: string) {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #ffffff; color: #000000;">
    <div style="padding: 40px 20px; max-width: 600px; margin: 0 auto;">
        <h1 style="margin: 0 0 20px; font-size: 24px; font-weight: bold;">Welcome to Team1 India 🎉</h1>
        
        <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6;">
            Hi ${name},
        </p>
        
        <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6;">
            Welcome to Team1 India 👋
        </p>
        
        <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6;">
            We're excited to have you onboard as part of our community.
        </p>
        
        <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6;">
            To get started, please complete your profile on our platform within 7 days or your account will be removed from the system:
        </p>
        
        <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6;">
            Visit: <a href="https://team1india.vercel.app" style="color: #0066cc;">https://team1india.vercel.app</a>
        </p>
        
        <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6;">
            Once your profile is complete, you'll be able to:
        </p>
        
        <ul style="margin: 0 0 16px; padding-left: 20px; font-size: 16px; line-height: 1.6;">
            <li>Access members-only playbooks</li>
            <li>Apply to host events</li>
            <li>Apply for programs</li>
            <li>Stay updated with all our latest initiatives, opportunities, and announcements</li>
        </ul>
        
        <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6;">
            Team1 India is all about builders, contributors, and ecosystem leaders growing together. We're looking forward to seeing you participate and build with us.
        </p>
        
        <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6;">
            If you have any questions or need help getting started, feel free to reply to this email. Welcome aboard 🚀
        </p>
        
        <p style="margin: 24px 0 16px; font-size: 16px; line-height: 1.6; font-weight: bold;">
            🔐 Security Notice:
        </p>
        
        <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6;">
            Team1 India will not reach out individually regarding rejected applications. If anyone claims otherwise, you can verify official members and contacts here:
        </p>
        
        <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6;">
            <a href="https://team1india.vercel.app/public#contact" style="color: #0066cc;">https://team1india.vercel.app/public#contact</a>
        </p>
        
        <p style="margin: 24px 0 0; font-size: 16px; line-height: 1.6;">
            Sarnavo<br>
            Team1 India
        </p>
    </div>
</body>
</html>
    `;
}

// Email template for application approval
export function getApprovalEmailTemplate(applicantName: string, programTitle: string) {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #ffffff; color: #000000;">
    <div style="padding: 40px 20px; max-width: 600px; margin: 0 auto;">
        <h1 style="margin: 0 0 20px; font-size: 24px; font-weight: bold;">Your ${programTitle} Application Has Been Approved</h1>
        
        <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6;">
                                Hi ${applicantName},
                            </p>

        <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6;">
            We're pleased to inform you that your application for ${programTitle} with Team1 India has been approved.
        </p>
        
        <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6;">
            Our team will connect with you via Telegram using the ID you provided during the application process. Please keep an eye on your Telegram messages for further communication and next steps.
        </p>
        
        <p style="margin: 24px 0 16px; font-size: 16px; line-height: 1.6; font-weight: bold;">
            🔐 Verification Notice:
        </p>
        
        <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6;">
            If anyone contacts you claiming to represent Team1 India, you can verify whether they are an official member or representative through our Member Verification section:
        </p>
        
        <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6;">
            <a href="https://team1india.vercel.app/public#contact" style="color: #0066cc;">https://team1india.vercel.app/public#contact</a>
        </p>
        
        <p style="margin: 24px 0 0; font-size: 16px; line-height: 1.6;">
            Thank you for your interest and engagement with Team1 India.
        </p>
        
        <p style="margin: 16px 0 0; font-size: 16px; line-height: 1.6;">
            Sarnavo<br>
            Team1 India Team
        </p>
    </div>
</body>
</html>
    `;
}

// Event approval email template with custom body (superadmin-written)
export function getCustomApprovalEmailTemplate(
    applicantName: string,
    programTitle: string,
    customBody: string
) {
    const safeBody = (customBody || '').trim();

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #ffffff; color: #000000;">
    <div style="padding: 40px 20px; max-width: 600px; margin: 0 auto;">
        <h1 style="margin: 0 0 20px; font-size: 24px; font-weight: bold;">Your ${programTitle} Application Has Been Approved</h1>
        
        <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6;">
            Hi ${applicantName},
        </p>

        <div style="margin: 0 0 16px; font-size: 16px; line-height: 1.6; white-space: pre-wrap;">
            ${safeBody || `We're pleased to inform you that your application for ${programTitle} with Team1 India has been approved.`}
        </div>
        
        <p style="margin: 24px 0 16px; font-size: 16px; line-height: 1.6; font-weight: bold;">
            🔐 Verification Notice:
        </p>
        
        <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6;">
            If anyone contacts you claiming to represent Team1 India, you can verify whether they are an official member or representative through our Member Verification section:
        </p>
        
        <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6;">
            <a href="https://team1india.vercel.app/public#contact" style="color: #0066cc;">https://team1india.vercel.app/public#contact</a>
        </p>
        
        <p style="margin: 24px 0 0; font-size: 16px; line-height: 1.6;">
            Thank you for your interest and engagement with Team1 India.
        </p>
        
        <p style="margin: 16px 0 0; font-size: 16px; line-height: 1.6;">
            Sarnavo<br>
            Team1 India Team
        </p>
    </div>
</body>
</html>
    `;
}

// Event rejection email template with custom body (superadmin-written)
export function getCustomRejectionEmailTemplate(
    applicantName: string,
    programTitle: string,
    customBody: string
) {
    const safeBody = (customBody || '').trim();

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #ffffff; color: #000000;">
    <div style="padding: 40px 20px; max-width: 600px; margin: 0 auto;">
        <h1 style="margin: 0 0 20px; font-size: 24px; font-weight: bold;">Update on Your ${programTitle} Application</h1>
        
        <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6;">
            Hi ${applicantName},
        </p>

        <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6;">
            Thank you for applying for ${programTitle} with Team1 India.
        </p>

        <div style="margin: 0 0 16px; font-size: 16px; line-height: 1.6; white-space: pre-wrap;">
            ${safeBody || `After careful review, we regret to inform you that your application was not approved at this time.`}
        </div>
        
        <p style="margin: 24px 0 16px; font-size: 16px; line-height: 1.6; font-weight: bold;">
            🔐 Security Notice:
        </p>
        
        <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6;">
            Team1 India will not reach out individually regarding rejected applications. If anyone claims otherwise, you can verify official members and contacts here:
        </p>
        
        <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6;">
            <a href="https://team1india.vercel.app/public#contact" style="color: #0066cc;">https://team1india.vercel.app/public#contact</a>
        </p>
        
        <p style="margin: 24px 0 0; font-size: 16px; line-height: 1.6;">
            Thank you for your interest and understanding.
        </p>
        
        <p style="margin: 16px 0 0; font-size: 16px; line-height: 1.6;">
            Sarnavo<br>
            Team1 India Team
        </p>
    </div>
</body>
</html>
    `;
}

// Email template for application rejection
export function getRejectionEmailTemplate(applicantName: string, programTitle: string) {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #ffffff; color: #000000;">
    <div style="padding: 40px 20px; max-width: 600px; margin: 0 auto;">
        <h1 style="margin: 0 0 20px; font-size: 24px; font-weight: bold;">Update on Your ${programTitle} Application</h1>
        
        <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6;">
            Hi ${applicantName},
        </p>
        
        <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6;">
            Thank you for applying for ${programTitle} with Team1 India.
        </p>
        
        <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6;">
            After careful review, we regret to inform you that your application was not approved at this time.
        </p>
        
        <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6;">
            Due to current selection criteria and capacity, we're unable to move forward right now. We encourage you to stay engaged with Team1 India and apply again for future opportunities.
        </p>
        
        <p style="margin: 24px 0 16px; font-size: 16px; line-height: 1.6; font-weight: bold;">
            🔐 Security Notice:
        </p>
        
        <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6;">
            Team1 India will not reach out individually regarding rejected applications. If anyone claims otherwise, you can verify official members and contacts here:
        </p>
        
        <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6;">
            <a href="https://team1india.vercel.app/public#contact" style="color: #0066cc;">https://team1india.vercel.app/public#contact</a>
        </p>
        
        <p style="margin: 24px 0 0; font-size: 16px; line-height: 1.6;">
            Thank you for your interest and understanding.
        </p>
        
        <p style="margin: 16px 0 0; font-size: 16px; line-height: 1.6;">
            Sarnavo<br>
            Team1 India Team
        </p>
                            </div>
</body>
</html>
    `;
}

// Email template for application under discussion (sent when user submits form)
// Simple confirmation email for application submission
export function getApplicationSubmittedEmailTemplate(applicantName: string, programTitle: string) {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #ffffff; color: #000000;">
    <div style="padding: 40px 20px; max-width: 600px; margin: 0 auto;">
        <h1 style="margin: 0 0 20px; font-size: 24px; font-weight: bold;">Application Submitted Successfully ✓</h1>
        
        <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6;">
            Hi ${applicantName},
        </p>

        <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6;">
            Thank you for submitting your application for <strong>${programTitle}</strong> with Team1 India.
        </p>
        
        <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6;">
            We have successfully received your application and it has been submitted to our team.
        </p>
        
        <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6;">
            Our team may reach out to you via Telegram using the ID you provided if needed. Please keep an eye on your Telegram messages.
        </p>
        
        <p style="margin: 24px 0 16px; font-size: 16px; line-height: 1.6; font-weight: bold;">
            🔐 Verification Notice:
        </p>
        
        <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6;">
            If anyone contacts you claiming to represent Team1 India, you can verify official members and representatives through our Member Verification section:
        </p>
        
        <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6;">
            <a href="https://team1india.vercel.app/public#contact" style="color: #0066cc;">https://team1india.vercel.app/public#contact</a>
        </p>
        
        <p style="margin: 24px 0 0; font-size: 16px; line-height: 1.6;">
            Thank you for your interest in Team1 India.
        </p>
        
        <p style="margin: 16px 0 0; font-size: 16px; line-height: 1.6;">
            Sarnavo<br>
            Team1 India Team
        </p>
    </div>
</body>
</html>
    `;
}

// Discussion email template (for experiments/proposals)
export function getDiscussionEmailTemplate(applicantName: string, programTitle: string) {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #ffffff; color: #000000;">
    <div style="padding: 40px 20px; max-width: 600px; margin: 0 auto;">
        <h1 style="margin: 0 0 20px; font-size: 24px; font-weight: bold;">Your ${programTitle} Proposal Is Under Discussion</h1>
        
        <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6;">
            Hi ${applicantName},
        </p>

        <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6;">
            Thank you for submitting your proposal for ${programTitle} with Team1 India.
        </p>
        
        <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6;">
            We'd like to inform you that your proposal has been moved to the discussion stage. This means it is currently under internal review and conversation.
        </p>
        
        <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6;">
            Our team may reach out to you via Telegram using the ID you provided, should any clarification or discussion be required. Please keep an eye on your Telegram messages.
        </p>
        
        <p style="margin: 24px 0 16px; font-size: 16px; line-height: 1.6; font-weight: bold;">
            🔐 Verification Notice:
        </p>
        
        <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6;">
            If anyone contacts you claiming to represent Team1 India, you can verify official members and representatives through our Member Verification section:
        </p>
        
        <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6;">
            <a href="https://team1india.vercel.app/public#contact" style="color: #0066cc;">https://team1india.vercel.app/public#contact</a>
        </p>
        
        <p style="margin: 24px 0 0; font-size: 16px; line-height: 1.6;">
            We appreciate your patience and interest. Further updates will be shared once a decision is made.
        </p>
        
        <p style="margin: 16px 0 0; font-size: 16px; line-height: 1.6;">
            Sarnavo<br>
            Team1 India Team
        </p>
    </div>
</body>
</html>
    `;
}

// Contribution approval email template
export function getContributionApprovalEmailTemplate(contributorName: string, contributionType: string) {
    const typeLabel = contributionType === 'event-host' ? 'Event Host' : 'Content';
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #ffffff; color: #000000;">
    <div style="padding: 40px 20px; max-width: 600px; margin: 0 auto;">
        <h1 style="margin: 0 0 20px; font-size: 24px; font-weight: bold;">Your Contribution Has Been Approved</h1>
        
        <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6;">
            Hi ${contributorName},
        </p>
        
        <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6;">
            We're pleased to inform you that your ${typeLabel} contribution to Team1 India has been approved.
        </p>
        
        <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6;">
            Thank you for your valuable contribution to our community. We appreciate your efforts and look forward to more contributions from you.
        </p>
        
        <p style="margin: 24px 0 16px; font-size: 16px; line-height: 1.6; font-weight: bold;">
            🔐 Verification Notice:
        </p>
        
        <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6;">
            If anyone contacts you claiming to represent Team1 India, you can verify whether they are an official member or representative through our Member Verification section:
        </p>
        
        <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6;">
            <a href="https://team1india.vercel.app/public#contact" style="color: #0066cc;">https://team1india.vercel.app/public#contact</a>
        </p>
        
        <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6;">
            Thank you for your interest and engagement with Team1 India.
        </p>
        
        <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6;">
            Sarnavo<br>
            Team1 India Team
        </p>
    </div>
</body>
</html>
    `;
}

// Contribution rejection email template
export function getContributionRejectionEmailTemplate(contributorName: string, contributionType: string) {
    const typeLabel = contributionType === 'event-host' ? 'Event Host' : 'Content';
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #ffffff; color: #000000;">
    <div style="padding: 40px 20px; max-width: 600px; margin: 0 auto;">
        <h1 style="margin: 0 0 20px; font-size: 24px; font-weight: bold;">Update on Your Contribution</h1>
        
        <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6;">
            Hi ${contributorName},
        </p>
        
        <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6;">
            Thank you for submitting your ${typeLabel} contribution to Team1 India.
        </p>
        
        <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6;">
            After careful review, we regret to inform you that your contribution was not approved at this time. Due to current selection criteria and capacity, we're unable to move forward right now.
        </p>
        
        <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6;">
            We encourage you to stay engaged with Team1 India and submit contributions again for future opportunities.
        </p>
        
        <p style="margin: 24px 0 16px; font-size: 16px; line-height: 1.6; font-weight: bold;">
            🔐 Security Notice:
        </p>
        
        <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6;">
            Team1 India will not reach out individually regarding rejected contributions. If anyone claims otherwise, you can verify official members and contacts here:
        </p>
        
        <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6;">
            <a href="https://team1india.vercel.app/public#contact" style="color: #0066cc;">https://team1india.vercel.app/public#contact</a>
        </p>
        
        <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6;">
            Thank you for your interest and understanding.
        </p>
        
        <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6;">
            Sarnavo<br>
            Team1 India Team
                                </p>
                            </div>
</body>
</html>
    `;
}

// Member removal email template
export function getMemberRemovalEmailTemplate(memberName: string) {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #ffffff; color: #000000;">
    <div style="padding: 40px 20px; max-width: 600px; margin: 0 auto;">
        <h1 style="margin: 0 0 20px; font-size: 24px; font-weight: bold;">Membership Update - Team1 India</h1>
        
        <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6;">
            Hi ${memberName},
        </p>
        
        <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6;">
            We're writing to inform you that due to inactivity, the system has decided to remove you from Team1 India membership.
        </p>
        
        <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6;">
            If you would like to rejoin or have any questions about this decision, please reply to this email.
        </p>

        <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6;">
            Thank you for your understanding.
        </p>

        <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6;">
            Sarnavo<br>
            Team1 India Team
        </p>
    </div>
</body>
</html>
    `;
}

// ═══════════════════════════════════════════
// SPEEDRUN EMAILS
// ═══════════════════════════════════════════

interface SpeedrunRegistrationEmailParams {
  fullName: string;
  runSlug: string; // "may-26" — used to build slug-scoped URLs
  runLabel: string; // "MAY 2026"
  teamMode: "solo" | "create" | "join";
  teamName?: string | null;
  teamCode?: string | null;
  appUrl?: string;
}

/**
 * Email shown to a user after they register via the slug-scoped run endpoint.
 * One template, three teamMode flavors:
 *  - solo:   "You're in. We'll email when the theme drops."
 *  - create: "You're in. Here's your team code — share it."
 *  - join:   "You're in. You joined Team X."
 */
export function getSpeedrunRegistrationEmail(p: SpeedrunRegistrationEmailParams) {
  const base = p.appUrl || process.env.NEXTAUTH_URL || "https://team1india.com";
  const statusUrl = `${base.replace(/\/$/, "")}/speedrun/${encodeURIComponent(p.runSlug)}/registration`;

  const teamBlock = (() => {
    if (p.teamMode === "create" && p.teamCode) {
      return `
        <div style="margin:24px 0; padding:20px; background:#fff5f6; border:1px solid #ff394a; border-radius:12px;">
          <p style="margin:0 0 8px; font-size:11px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; color:#ff394a;">
            Your Team Code${p.teamName ? " · " + escapeHtml(p.teamName) : ""}
          </p>
          <p style="margin:0 0 12px; font-family:Menlo,Consolas,monospace; font-size:28px; font-weight:900; color:#000;">
            ${escapeHtml(p.teamCode)}
          </p>
          <p style="margin:0; font-size:14px; line-height:1.5; color:#444;">
            Share this code with your teammate. They enter it on the registration form to join your team. (Max 2 builders per team.)
          </p>
        </div>`;
    }
    if (p.teamMode === "join" && p.teamName) {
      return `
        <div style="margin:24px 0; padding:20px; background:#fff5f6; border:1px solid #ff394a; border-radius:12px;">
          <p style="margin:0 0 8px; font-size:11px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; color:#ff394a;">
            You're on a team
          </p>
          <p style="margin:0; font-size:18px; font-weight:700; color:#000;">${escapeHtml(p.teamName)}</p>
        </div>`;
    }
    return `
      <div style="margin:24px 0; padding:20px; background:#f6f6f7; border:1px solid #e0e0e2; border-radius:12px;">
        <p style="margin:0 0 8px; font-size:11px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; color:#666;">
          Solo Builder
        </p>
        <p style="margin:0; font-size:14px; line-height:1.5; color:#444;">
          You registered as a solo builder. You can find a team in the community channel before submissions open.
        </p>
      </div>`;
  })();

  const subject =
    p.teamMode === "create"
      ? `You're in for ${p.runLabel} — here's your team code`
      : p.teamMode === "join"
      ? `You're in for ${p.runLabel} — welcome to ${p.teamName || "your team"}`
      : `You're in for ${p.runLabel}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0; padding:0; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif; background:#fafafa; color:#000;">
  <div style="max-width:600px; margin:0 auto; padding:40px 20px;">
    <div style="background:#000; padding:32px 28px; border-radius:16px 16px 0 0; text-align:center;">
      <p style="margin:0 0 6px; font-size:11px; font-weight:700; letter-spacing:2px; text-transform:uppercase; color:#ff394a;">Team1 Presents</p>
      <h1 style="margin:0; font-size:48px; font-weight:900; font-style:italic; letter-spacing:-2px; color:#ff394a;">SPEEDRUN</h1>
    </div>
    <div style="background:#fff; padding:32px 28px; border:1px solid #e0e0e2; border-top:none; border-radius:0 0 16px 16px;">
      <p style="margin:0 0 8px; font-size:11px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; color:#ff394a;">You're In · ${escapeHtml(p.runLabel)}</p>
      <h2 style="margin:0 0 20px; font-size:28px; font-weight:900; font-style:italic; letter-spacing:-1px; color:#000;">Welcome to Speedrun.</h2>
      <p style="margin:0 0 16px; font-size:16px; line-height:1.6; color:#222;">Hi ${escapeHtml(p.fullName)},</p>
      <p style="margin:0 0 16px; font-size:16px; line-height:1.6; color:#222;">
        You're registered for the ${escapeHtml(p.runLabel)} run of Speedrun — the monthly themed build sprint. The theme drops on Day 1 of the run and you'll have 2 weeks to ship.
      </p>
      ${teamBlock}
      <p style="margin:0 0 24px; font-size:16px; line-height:1.6; color:#222;">
        We'll email you when the theme drops. Until then, build something. Sharpen your stack. Find a teammate if you went solo.
      </p>
      <p style="margin:0 0 32px;">
        <a href="${statusUrl}" style="display:inline-block; padding:12px 24px; background:#ff394a; color:#fff; font-size:14px; font-weight:700; letter-spacing:1px; text-transform:uppercase; text-decoration:none; border-radius:10px;">
          View My Registration
        </a>
      </p>
      <p style="margin:0; font-size:13px; line-height:1.6; color:#666;">— Team1 India</p>
    </div>
  </div>
</body>
</html>`;

  return { subject, html };
}

interface SpeedrunLeaveTeamEmailParams {
  fullName: string;
  runSlug: string;
  runLabel: string;
  teamName: string;
  appUrl?: string;
}

/**
 * Email shown to a user after they leave their team via the slug-scoped
 * leave-team endpoint. Confirms they left and are now a solo builder.
 */
export function getSpeedrunLeaveTeamEmail(p: SpeedrunLeaveTeamEmailParams) {
  const base = p.appUrl || process.env.NEXTAUTH_URL || "https://team1india.com";
  const statusUrl = `${base.replace(/\/$/, "")}/speedrun/${encodeURIComponent(p.runSlug)}/registration`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0; padding:0; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif; background:#fafafa; color:#000;">
  <div style="max-width:600px; margin:0 auto; padding:40px 20px;">
    <div style="background:#000; padding:32px 28px; border-radius:16px 16px 0 0; text-align:center;">
      <p style="margin:0 0 6px; font-size:11px; font-weight:700; letter-spacing:2px; text-transform:uppercase; color:#ff394a;">Speedrun</p>
      <h1 style="margin:0; font-size:32px; font-weight:900; font-style:italic; letter-spacing:-1px; color:#fff;">Going It Alone.</h1>
    </div>
    <div style="background:#fff; padding:32px 28px; border:1px solid #e0e0e2; border-top:none; border-radius:0 0 16px 16px;">
      <p style="margin:0 0 8px; font-size:11px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; color:#ff394a;">Solo Builder · ${escapeHtml(p.runLabel)}</p>
      <h2 style="margin:0 0 20px; font-size:24px; font-weight:900; font-style:italic; letter-spacing:-0.5px; color:#000;">You left ${escapeHtml(p.teamName)}.</h2>
      <p style="margin:0 0 16px; font-size:16px; line-height:1.6; color:#222;">Hi ${escapeHtml(p.fullName)},</p>
      <p style="margin:0 0 16px; font-size:16px; line-height:1.6; color:#222;">
        Just confirming — you've left <strong>${escapeHtml(p.teamName)}</strong> and you're now registered as a solo builder for ${escapeHtml(p.runLabel)}.
      </p>
      <p style="margin:0 0 16px; font-size:16px; line-height:1.6; color:#222;">
        You can still find a team later in the community channel before submissions open. Or just keep building solo — that works too.
      </p>
      <p style="margin:0 0 32px;">
        <a href="${statusUrl}" style="display:inline-block; padding:12px 24px; background:#ff394a; color:#fff; font-size:14px; font-weight:700; letter-spacing:1px; text-transform:uppercase; text-decoration:none; border-radius:10px;">
          View My Registration
        </a>
      </p>
      <p style="margin:0; font-size:13px; line-height:1.6; color:#666;">— Team1 India</p>
    </div>
  </div>
</body>
</html>`;

  return { subject: `You left ${p.teamName} — solo for ${p.runLabel}`, html };
}

interface SpeedrunTeammateJoinedEmailParams {
  captainName: string; // captain's full name (best effort — falls back to email)
  teamName: string;
  runSlug: string;
  runLabel: string;
  newMemberName: string;
  newMemberEmail: string;
  appUrl?: string;
}

/**
 * Email to the team captain when a new member joins their team via the team code.
 */
export function getSpeedrunTeammateJoinedEmail(p: SpeedrunTeammateJoinedEmailParams) {
  const base = p.appUrl || process.env.NEXTAUTH_URL || "https://team1india.com";
  const statusUrl = `${base.replace(/\/$/, "")}/speedrun/${encodeURIComponent(p.runSlug)}/registration`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0; padding:0; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif; background:#fafafa; color:#000;">
  <div style="max-width:600px; margin:0 auto; padding:40px 20px;">
    <div style="background:#000; padding:32px 28px; border-radius:16px 16px 0 0; text-align:center;">
      <p style="margin:0 0 6px; font-size:11px; font-weight:700; letter-spacing:2px; text-transform:uppercase; color:#ff394a;">Speedrun</p>
      <h1 style="margin:0; font-size:32px; font-weight:900; font-style:italic; letter-spacing:-1px; color:#fff;">Squad Loaded.</h1>
    </div>
    <div style="background:#fff; padding:32px 28px; border:1px solid #e0e0e2; border-top:none; border-radius:0 0 16px 16px;">
      <p style="margin:0 0 8px; font-size:11px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; color:#ff394a;">New Teammate · ${escapeHtml(p.runLabel)}</p>
      <h2 style="margin:0 0 20px; font-size:24px; font-weight:900; font-style:italic; letter-spacing:-0.5px; color:#000;">Someone joined ${escapeHtml(p.teamName)}.</h2>

      <p style="margin:0 0 16px; font-size:16px; line-height:1.6; color:#222;">Hi ${escapeHtml(p.captainName)},</p>

      <p style="margin:0 0 16px; font-size:16px; line-height:1.6; color:#222;">
        Heads up — <strong>${escapeHtml(p.newMemberName)}</strong> just used your team code and joined <strong>${escapeHtml(p.teamName)}</strong> for ${escapeHtml(p.runLabel)}.
      </p>

      <div style="margin:24px 0; padding:16px 20px; background:#fff5f6; border:1px solid #ff394a; border-radius:12px;">
        <p style="margin:0 0 4px; font-size:11px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; color:#ff394a;">
          New Member
        </p>
        <p style="margin:0 0 2px; font-size:16px; font-weight:700; color:#000;">${escapeHtml(p.newMemberName)}</p>
        <p style="margin:0; font-size:13px; color:#666;">${escapeHtml(p.newMemberEmail)}</p>
      </div>

      <p style="margin:0 0 16px; font-size:16px; line-height:1.6; color:#222;">
        Your team is now full (max 2 builders). Sync up, line up your stack, and get ready to ship when the theme drops on Day 1.
      </p>

      <p style="margin:0 0 32px;">
        <a href="${statusUrl}" style="display:inline-block; padding:12px 24px; background:#ff394a; color:#fff; font-size:14px; font-weight:700; letter-spacing:1px; text-transform:uppercase; text-decoration:none; border-radius:10px;">
          View My Team
        </a>
      </p>

      <p style="margin:0; font-size:13px; line-height:1.6; color:#666;">— Team1 India</p>
    </div>
  </div>
</body>
</html>`;

  return {
    subject: `${p.newMemberName} joined ${p.teamName} — Speedrun ${p.runLabel}`,
    html,
  };
}

interface SpeedrunBroadcastEmailParams {
  runSlug: string;
  runLabel: string;
  /** Big bold line at the top of the email card (e.g. "Theme drops."). */
  headline: string;
  /** One-paragraph body explaining the news. */
  body: string;
  /** Optional CTA label — defaults to "View Run". */
  ctaLabel?: string;
  appUrl?: string;
}

/**
 * Generic Speedrun broadcast email — used for theme reveals, status
 * transitions, and any other event where we email all registrants.
 *
 * Visual style mirrors the registration confirmation so they read as a series.
 */
export function getSpeedrunBroadcastEmail(p: SpeedrunBroadcastEmailParams) {
  const base = p.appUrl || process.env.NEXTAUTH_URL || "https://team1india.com";
  const runUrl = `${base.replace(/\/$/, "")}/speedrun/${encodeURIComponent(p.runSlug)}`;
  const ctaLabel = p.ctaLabel || "View Run";

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0; padding:0; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif; background:#fafafa; color:#000;">
  <div style="max-width:600px; margin:0 auto; padding:40px 20px;">
    <div style="background:#000; padding:32px 28px; border-radius:16px 16px 0 0; text-align:center;">
      <p style="margin:0 0 6px; font-size:11px; font-weight:700; letter-spacing:2px; text-transform:uppercase; color:#ff394a;">Speedrun ${escapeHtml(p.runLabel)}</p>
      <h1 style="margin:0; font-size:32px; font-weight:900; font-style:italic; letter-spacing:-1px; color:#ff394a;">${escapeHtml(p.headline)}</h1>
    </div>
    <div style="background:#fff; padding:32px 28px; border:1px solid #e0e0e2; border-top:none; border-radius:0 0 16px 16px;">
      <p style="margin:0 0 16px; font-size:16px; line-height:1.6; color:#222;">
        ${escapeHtml(p.body)}
      </p>
      <p style="margin:0 0 32px;">
        <a href="${runUrl}" style="display:inline-block; padding:12px 24px; background:#ff394a; color:#fff; font-size:14px; font-weight:700; letter-spacing:1px; text-transform:uppercase; text-decoration:none; border-radius:10px;">
          ${escapeHtml(ctaLabel)}
        </a>
      </p>
      <p style="margin:0; font-size:13px; line-height:1.6; color:#666;">— Team1 India</p>
    </div>
  </div>
</body>
</html>`;

  return { subject: `${p.headline} — Speedrun ${p.runLabel}`, html };
}

function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
