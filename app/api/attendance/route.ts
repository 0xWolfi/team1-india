import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";

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
        
        if (searchParams.get('history') === 'true') {
            const records = await prisma.attendanceRecord.findMany({
                orderBy: { date: 'desc' },
                where: { deletedAt: null }
            });
            return NextResponse.json(records);
        }

        // Fetch all active members to populate the list (both core and community)
        const [coreMembers, communityMembers] = await Promise.all([
            prisma.member.findMany({ 
                where: {
                    status: 'active',
                    deletedAt: null
                },
                select: { id: true, name: true, email: true, xHandle: true, customFields: true }
            }),
            prisma.communityMember.findMany({
                where: {
                    status: 'active'
                },
                select: { id: true, name: true, email: true, xHandle: true, customFields: true }
            })
        ]);

        const allMembers = [
            ...coreMembers.map((m: any) => ({
                id: m.id,
                name: m.name,
                email: m.email,
                xHandle: m.xHandle,
                discord: (m.customFields as any)?.discord || '',
                type: 'CORE',
                role: 'CORE'
            })),
            ...communityMembers.map((m: any) => ({
                id: m.id,
                name: m.name,
                email: m.email,
                xHandle: m.xHandle,
                discord: (m.customFields as any)?.discord || '',
                type: 'COMMUNITY',
                role: 'MEMBER'
            }))
        ];

        return NextResponse.json(allMembers);
    } catch (error) {
        console.error("GET /api/attendance error:", error);
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
            return NextResponse.json({ error: "Missing ID" }, { status: 400 });
        }

        await prisma.attendanceRecord.update({
            where: { id },
            data: { deletedAt: new Date() }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("DELETE /api/attendance error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
