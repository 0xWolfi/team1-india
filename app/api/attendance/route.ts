import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
    try {
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
        return NextResponse.json({ error: "Failed to fetch members", details: String(error) }, { status: 500 });
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
