import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { notificationManager } from "@/lib/notificationManager";

export async function GET(req: NextRequest) {
    // CRITICAL SECURITY FIX: Require authentication for internal API
    // Public announcements should use /api/public/announcements if needed
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const audience = searchParams.get('audience')?.toUpperCase(); // PUBLIC, MEMBER, ALL

        // @ts-ignore
        const role = session.user.role;

        let whereClause: any = {};

        // 1. Filter by Audience (if provided) & Expiration
        if (audience) {
            whereClause.audience = {
                in: audience === 'PUBLIC' ? ['PUBLIC', 'ALL'] : ['MEMBER', 'ALL']
            };
            
            // Filter out expired announcements (cleanup handled by cron)
            whereClause.OR = [
                { expiresAt: null },
                { expiresAt: { gt: new Date() } }
            ];
        } else {
            // If no audience specified, filter based on role
            // CORE can see all, MEMBER can only see MEMBER/PUBLIC
            if (role === 'MEMBER') {
                whereClause.audience = { in: ['MEMBER', 'ALL'] };
            }
            // CORE can see all (no additional filter)
        }
        
        const announcements = await prisma.announcement.findMany({
            where: whereClause,
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(announcements);
    } catch (error) {
        console.error("GET /api/announcements error:", error);
        return NextResponse.json({ error: "Failed to fetch announcements" }, { status: 500 });
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

        // Send Push Notifications (Fire and Forget)
        (async () => {
             try {
                // Broadcast Logic
                let recipients: { id: string }[] = [];

                // 1. Audience 'MEMBER' -> ONLY CommunityMembers
                if (targetAudience === 'MEMBER') {
                     // @ts-ignore
                     const communityMembers = await prisma.communityMember.findMany({
                         where: { status: 'active' },
                         select: { id: true }
                     });
                     recipients = [...recipients, ...communityMembers];
                }

                // 2. Audience 'ALL' or 'PUBLIC' -> CommunityMembers + CoreMembers
                if (targetAudience === 'ALL' || targetAudience === 'PUBLIC') {
                     // @ts-ignore
                     const communityMembers = await prisma.communityMember.findMany({
                         where: { status: 'active' },
                         select: { id: true }
                     });
                     
                     const coreMembers = await prisma.member.findMany({
                         where: { status: 'active' },
                         select: { id: true }
                     });

                     recipients = [...recipients, ...communityMembers, ...coreMembers];
                }

                if (recipients.length > 0) {
                    console.log(`Broadcasting announcement to ${recipients.length} users`);

                    // Deduplicate IDs just in case
                    const uniqueIds = Array.from(new Set(recipients.map(r => r.id)));

                    // Send in parallel batches
                    const batchSize = 10;
                    for (let i = 0; i < uniqueIds.length; i += batchSize) {
                        const batch = uniqueIds.slice(i, i + batchSize);
                        await Promise.all(batch.map(userId => 
                             notificationManager.send({
                                userId,
                                event: 'admin_announcement',
                                title: 'New Announcement',
                                body: title,
                                data: {
                                    url: link || '/member/announcements',
                                    id: announcement.id
                                }
                            })
                        ));
                    }
                }
             } catch (err) {
                 console.error("Failed to broadcast announcement push:", err);
             }
        })();

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
