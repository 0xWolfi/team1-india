import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Handles Meeting Notes using ContentResource
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (id) {
            const note = await prisma.contentResource.findUnique({
                where: { id }
            });
            return NextResponse.json(note);
        }

        // Fetch all meeting notes
        const notes = await prisma.contentResource.findMany({
            where: { 
                type: 'MEETING_NOTE',
                deletedAt: null
            },
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json(notes);
    } catch (error) {
        console.error("GET /api/notes error:", error);
        return NextResponse.json({ error: "Failed to fetch notes", details: String(error) }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { title, date, visibility, content } = body;

        // Validation
        if (!title || !date) {
            return NextResponse.json({ error: "Title and Date are required" }, { status: 400 });
        }

        const note = await prisma.contentResource.create({
            data: {
                title,
                type: 'MEETING_NOTE',
                content: content || "",
                status: 'published', // Default status
                customFields: {
                    date,
                    visibility: visibility || 'CORE'
                }
            }
        });

        return NextResponse.json(note);
    } catch (error) {
        console.error("POST /api/notes error:", error);
        return NextResponse.json({ error: "Failed to save note", details: String(error) }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: "ID is required" }, { status: 400 });
        }

        await prisma.contentResource.update({
            where: { id },
            data: { deletedAt: new Date() }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("DELETE /api/notes error:", error);
        return NextResponse.json({ error: "Failed to delete note", details: String(error) }, { status: 500 });
    }
}
