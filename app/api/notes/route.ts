import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";

// Handles Meeting Notes using ContentResource
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // @ts-ignore
        const role = session.user.role;
        if (role !== 'CORE') {
            return NextResponse.json({ error: "Forbidden. Core access required." }, { status: 403 });
        }
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
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // @ts-ignore
        const role = session.user.role;
        if (role !== 'CORE') {
            return NextResponse.json({ error: "Forbidden. Core access required." }, { status: 403 });
        }

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
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // @ts-ignore
        const role = session.user.role;
        if (role !== 'CORE') {
            return NextResponse.json({ error: "Forbidden. Core access required." }, { status: 403 });
        }

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
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
