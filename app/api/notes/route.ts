import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Handles Notes
export async function GET(req: NextRequest) {
    try {
        // Fetch the latest note to display
        const note = await prisma.meetingNote.findFirst({
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json(note || { content: "" });
    } catch (error) {
        console.error("GET /api/notes error:", error);
        return NextResponse.json({ error: "Failed to fetch note", details: String(error) }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { content } = body;
        
        // We could update the latest or create new. 
        // Let's create new if it's been a while, or update if recent? 
        // For simplicity, let's just create a new record every save, acting like a log, 
        // OR just have one singleton note for "Today". 
        // Let's go with: Update latest if created today, else create new.
        
        const today = new Date();
        today.setHours(0,0,0,0);
        
        const existing = await prisma.meetingNote.findFirst({
            where: { createdAt: { gte: today } },
            orderBy: { createdAt: 'desc' }
        });

        if (existing) {
            const updated = await prisma.meetingNote.update({
                where: { id: existing.id },
                data: { content }
            });
            return NextResponse.json(updated);
        } else {
            const created = await prisma.meetingNote.create({
                data: { content }
            });
            return NextResponse.json(created);
        }
    } catch (error) {
        console.error("POST /api/notes error:", error);
        return NextResponse.json({ error: "Failed to save note", details: String(error) }, { status: 500 });
    }
}
