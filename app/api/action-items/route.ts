import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
    try {
        const items = await prisma.actionItem.findMany({
            orderBy: { createdAt: 'desc' } // or asc?
        });
        return NextResponse.json(items);
    } catch (error) {
        console.error("GET /api/action-items error:", error);
        return NextResponse.json({ error: "Failed to fetch items", details: String(error) }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const { text } = await req.json();
        const item = await prisma.actionItem.create({
            data: { text }
        });
        return NextResponse.json(item);
    } catch (error) {
        console.error("POST /api/action-items error:", error);
        return NextResponse.json({ error: "Failed to create item", details: String(error) }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    try {
        const { id, isDone } = await req.json();
        const item = await prisma.actionItem.update({
            where: { id },
            data: { isDone }
        });
        return NextResponse.json(item);
    } catch (error) {
        console.error("PATCH /api/action-items error:", error);
        return NextResponse.json({ error: "Failed to update item", details: String(error) }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

        await prisma.actionItem.delete({
            where: { id }
        });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("DELETE /api/action-items error:", error);
        return NextResponse.json({ error: "Failed to delete item", details: String(error) }, { status: 500 });
    }
}
