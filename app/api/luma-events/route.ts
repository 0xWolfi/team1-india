import { NextResponse } from "next/server";
import { getAllEvents } from "@/lib/luma";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const events = await getAllEvents();
    return NextResponse.json(events, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200'
      }
    });
  } catch (error) {
    console.error("API route error:", error);
    return NextResponse.json([], { status: 500 });
  }
}
