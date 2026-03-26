import { NextResponse } from "next/server";
import { syncLumaEvents } from "@/lib/luma";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
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
