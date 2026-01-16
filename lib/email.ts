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
            To get started, please complete your profile on our platform:
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
        <h1 style="margin: 0 0 20px; font-size: 24px; font-weight: bold;">Your ${programTitle} Application Is Under Discussion</h1>
        
        <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6;">
            Hi ${applicantName},
        </p>
        
        <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6;">
            Thank you for submitting your application for ${programTitle} with Team1 India.
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
