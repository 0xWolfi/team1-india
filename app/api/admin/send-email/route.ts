import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-options';

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== 'CORE') {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const { to, subject, body } = await request.json();

    // Create SMTP transporter using existing env vars
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    // Recipients
    const recipients = [
      'sarnavo@team1.network',
      'sarnavoss.dev@gmail.com',
      'abhishekt.team1@gmail.com',
    ];

    // Send email
    await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME || 'Team1 PWA Alerts'}" <${process.env.SMTP_USER}>`,
      to: recipients.join(', '),
      subject,
      html: body,
    });

    console.log(`✅ Email sent: ${subject}`);

    return Response.json({ success: true });
  } catch (error) {
    console.error('Failed to send email:', error);
    return Response.json(
      { error: 'Failed to send email', details: (error as Error).message },
      { status: 500 }
    );
  }
}
