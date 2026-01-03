import { NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/logger";

export async function GET(request: Request) {
    // Basic authorization check - Vercel Cron uses this header
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    try {
        // Deprecated: Soft delete removed. Hard delete is now used.
        return NextResponse.json({ message: "Cleanup deprecated. Soft delete removed.", count: 0 });

    } catch (error) {
        console.error("Cleanup job failed", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
