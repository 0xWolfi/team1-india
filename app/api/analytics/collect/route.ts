import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";

// POST /api/analytics/collect — receive events (public, rate limited: 60/min)
export async function POST(request: NextRequest) {
  const rateCheck = await checkRateLimit(request, 60, 60000);
  if (!rateCheck.allowed) return NextResponse.json({ ok: true }); // silent fail for analytics
  try {
    const body = await request.json();
    const { type, name, path, referrer, sessionId, data, utmSource, utmMedium, utmCampaign } = body;

    if (!type || !name || !sessionId) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // Parse device info from user-agent
    const ua = request.headers.get("user-agent") || "";
    const device = /mobile|android|iphone/i.test(ua) ? "mobile" : /tablet|ipad/i.test(ua) ? "tablet" : "desktop";
    const browser = /chrome/i.test(ua) ? "chrome" : /safari/i.test(ua) ? "safari" : /firefox/i.test(ua) ? "firefox" : "other";
    const os = /android/i.test(ua) ? "android" : /iphone|ipad/i.test(ua) ? "ios" : /mac/i.test(ua) ? "macos" : /windows/i.test(ua) ? "windows" : /linux/i.test(ua) ? "linux" : "other";

    // Country from Vercel geo headers
    const country = request.headers.get("x-vercel-ip-country") || null;

    // Non-blocking create
    prisma.analyticsEvent.create({
      data: {
        type, name, path, referrer, sessionId,
        data: data || undefined,
        device, browser, os, country,
        utmSource, utmMedium, utmCampaign,
      },
    }).catch(() => {});

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true }); // never fail for analytics
  }
}
