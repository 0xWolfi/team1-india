import { NextRequest, NextResponse } from "next/server";
import { expirePoints } from "@/lib/wallet";
import { verifyCronAuth } from "@/lib/cronAuth";

// POST /api/cron/expire-points — daily cron to expire old points
// Protect with CRON_SECRET env var (Vercel Cron or external scheduler)
export async function POST(request: NextRequest) {
  const authError = verifyCronAuth(request);
  if (authError) {
    return NextResponse.json({ error: authError }, { status: 401 });
  }

  try {
    const totalExpired = await expirePoints();

    return NextResponse.json({
      success: true,
      totalExpired,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Expire points cron error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Also allow GET for Vercel Cron (which sends GET requests)
export async function GET(request: NextRequest) {
  return POST(request);
}
