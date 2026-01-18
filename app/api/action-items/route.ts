import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { checkCoreAccess } from "@/lib/permissions";

export async function GET(req: NextRequest) {
    // CRITICAL SECURITY FIX: Require authentication
    const session = await getServerSession(authOptions);
    const access = checkCoreAccess(session);
    if (!access.authorized) return access.response!;

    try {
        const items = await prisma.actionItem.findMany({
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json(items);
    } catch (error) {
        console.error("GET /api/action-items error:", error);
        return NextResponse.json({ error: "Failed to fetch items" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    // CRITICAL SECURITY FIX: Require authentication
    const session = await getServerSession(authOptions);
    const access = checkCoreAccess(session);
    if (!access.authorized) return access.response!;

    try {
        const { text } = await req.json();
        const item = await prisma.actionItem.create({
            data: { text }
        });
        return NextResponse.json(item);
    } catch (error) {
        console.error("POST /api/action-items error:", error);
        return NextResponse.json({ error: "Failed to create item" }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    // CRITICAL SECURITY FIX: Require authentication
    const session = await getServerSession(authOptions);
    const access = checkCoreAccess(session);
    if (!access.authorized) return access.response!;

    try {
        const { id, isDone } = await req.json();
        const item = await prisma.actionItem.update({
            where: { id },
            data: { isDone }
        });
        return NextResponse.json(item);
    } catch (error) {
        console.error("PATCH /api/action-items error:", error);
        return NextResponse.json({ error: "Failed to update item" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    // CRITICAL SECURITY FIX: Require authentication
    const session = await getServerSession(authOptions);
    const access = checkCoreAccess(session);
    if (!access.authorized) return access.response!;

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
        return NextResponse.json({ error: "Failed to delete item" }, { status: 500 });
    }
}
