import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";
import { sanitizeText, isHoneypotFilled } from "@/lib/sanitize";
import { checkRateLimit } from "@/lib/rate-limit";

// POST /api/public/contact — contact form (public, rate limited)
export async function POST(request: NextRequest) {
  // Rate limit: 3 per minute per IP
  const rateCheck = await checkRateLimit(request, 3, 60000);
  if (!rateCheck.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const body = await request.json();
  const { name, email, message, website } = body;

  // Honeypot check
  if (isHoneypotFilled(website)) {
    return NextResponse.json({ success: true }); // fake success for bots
  }

  if (!name || !email || !message) {
    return NextResponse.json({ error: "name, email, and message required" }, { status: 400 });
  }

  const safeName = sanitizeText(name, 100);
  const safeEmail = sanitizeText(email, 200);
  const safeMessage = sanitizeText(message, 2000);

  try {
    await sendEmail({
      to: process.env.CONTACT_EMAIL || "hello@team1india.com",
      subject: `Contact Form: ${safeName}`,
      html: `
        <h3>New Contact Form Submission</h3>
        <p><strong>Name:</strong> ${safeName}</p>
        <p><strong>Email:</strong> ${safeEmail}</p>
        <p><strong>Message:</strong></p>
        <p>${safeMessage.replace(/\n/g, "<br>")}</p>
      `,
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to send" }, { status: 500 });
  }
}
