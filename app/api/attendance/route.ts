import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        
        if (searchParams.get('history') === 'true') {
            const records = await prisma.attendanceRecord.findMany({
                orderBy: { date: 'desc' },
                where: { deletedAt: null }
            });
            return NextResponse.json(records);
        }

        // Fetch all members to populate the list
        const [coreMembers, communityMembers] = await Promise.all([
            prisma.member.findMany({ 
                select: { id: true, name: true, email: true, xHandle: true }
            }),
            prisma.communityMember.findMany({
                select: { id: true, name: true, email: true, xHandle: true }
            })
        ]);

        const allMembers = [
            ...coreMembers.map((m: any) => ({ ...m, type: 'CORE', role: 'CORE' })),
            ...communityMembers.map((m: any) => ({ ...m, type: 'COMMUNITY', role: 'MEMBER' }))
        ];

        return NextResponse.json(allMembers);
    } catch (error) {
        console.error("GET /api/attendance error:", error);
        return NextResponse.json({ error: "Failed to fetch data", details: String(error) }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const { date, presentIds, note } = await req.json();

        const record = await prisma.attendanceRecord.create({
            data: {
                date: new Date(date),
                presentMemberIds: presentIds,
                note
            }
        });

        return NextResponse.json(record);
    } catch (error) {
        console.error("POST /api/attendance error:", error);
        return NextResponse.json({ error: "Failed to save attendance", details: String(error) }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: "Missing ID" }, { status: 400 });
        }

        await prisma.attendanceRecord.update({
            where: { id },
            data: { deletedAt: new Date() }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("DELETE /api/attendance error:", error);
        return NextResponse.json({ error: "Failed to delete log", details: String(error) }, { status: 500 });
    }
}
