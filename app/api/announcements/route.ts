import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const audience = searchParams.get('audience')?.toUpperCase(); // PUBLIC, MEMBER, ALL

        let whereClause: any = {};

        // 1. Filter by Audience (if provided) & Expiration
        if (audience) {
            whereClause.audience = {
                in: audience === 'PUBLIC' ? ['PUBLIC', 'ALL'] : ['MEMBER', 'ALL']
            };
            
            // Active Cleanup: Hard Delete expired items before fetching
            await prisma.announcement.deleteMany({
                 where: { expiresAt: { lt: new Date() } }
            });

            // Filter out any that might have just expired or have no expiration
            whereClause.OR = [
                { expiresAt: null },
                { expiresAt: { gt: new Date() } }
            ];
        }
        // If no audience specified or ALL, return everything (Admin view)
        
        const announcements = await prisma.announcement.findMany({
            where: whereClause,
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(announcements);
    } catch (error) {
        console.error("GET /api/announcements error:", error);
        return NextResponse.json({ error: "Failed to fetch announcements", details: String(error) }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { title, link, audience, expiresAt } = body;

        if (!title) {
            return NextResponse.json({ error: "Title is required" }, { status: 400 });
        }

        // Check Limit (Max 6 active items per view)
        const targetAudience = audience || 'ALL';
        const viewsToCheck = targetAudience === 'ALL' ? ['PUBLIC', 'MEMBER'] : [targetAudience];
        
        for (const view of viewsToCheck) {
             const count = await prisma.announcement.count({
                where: {
                    audience: { in: [view, 'ALL'] },
                    OR: [
                        { expiresAt: null },
                        { expiresAt: { gt: new Date() } }
                    ]
                }
            });
            
            if (count >= 6) {
                 const existingItems = await prisma.announcement.findMany({
                    where: {
                        audience: { in: [view, 'ALL'] },
                        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }]
                    },
                    orderBy: { createdAt: 'desc' }
                 });
                 
                 return NextResponse.json({ 
                     error: "Limit Reached", 
                     details: `The ${view} list already has 6 announcements.`,
                     existingItems 
                 }, { status: 409 });
            }
        }

        const announcement = await prisma.announcement.create({
            data: {
                title,
                link,
                audience: targetAudience,
                expiresAt: expiresAt ? new Date(expiresAt) : null
            }
        });

        return NextResponse.json(announcement);
    } catch (error) {
        console.error("POST /api/announcements error:", error);
        return NextResponse.json({ error: "Failed to create announcement", details: String(error) }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

        await prisma.announcement.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("DELETE /api/announcements error:", error);
        return NextResponse.json({ error: "Failed to delete announcement", details: String(error) }, { status: 500 });
    }
}
