import { NextResponse } from "next/server";
import { syncLumaEvents } from "@/lib/luma";
import crypto from "crypto";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization") ?? "";
  const secret = process.env.CRON_SECRET;
  const expected = `Bearer ${secret}`;
  if (
    !secret ||
    authHeader.length !== expected.length ||
    !crypto.timingSafeEqual(Buffer.from(authHeader), Buffer.from(expected))
  ) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const result = await syncLumaEvents();
    return NextResponse.json({
      message: "Luma events synced",
      ...result,
    });
  } catch (error) {
    console.error("Luma sync cron failed:", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
