import React from "react";
import { MemberWrapper } from "@/components/member/MemberWrapper";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { MemberDashboard } from "@/components/member/MemberDashboard";
import { Program, Event, Guide } from "@/types/public";
import { getAllEvents } from "@/lib/luma";

// Helper to determine type of guide
const bucketGuides = (guides: any[]) => {
    const programs: Program[] = [];
    const events: Event[] = [];
    const content: Guide[] = [];

    guides.forEach((g) => {
        const body = g.body as any;
        const normalizedCoverImage =
            g.coverImage || body?.coverImage || body?.customFields?.coverImage || null;

        const item = {
             id: g.id,
             title: g.title,
             coverImage: normalizedCoverImage,
             createdAt: g.createdAt,
             updatedAt: g.updatedAt || g.createdAt,
             visibility: g.visibility,
             description: g.body?.description || "",
             type: g.type,
             // Add other fields as needed for specific types if strictly typed
        };
        
        const type = g.type?.toUpperCase();
        if (type === 'PROGRAM') programs.push(item as any);
        else if (type === 'EVENT') events.push(item as any);
        else content.push(item as any);
    });

    return { programs, events, content };
};

export default async function MemberPage() {
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect('/public');
    }

    // Check if user has MEMBER or CORE role
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userRole = (session.user as any)?.role;
    if (userRole !== 'MEMBER' && userRole !== 'CORE') {
        redirect('/public?error=access_denied');
    }

    // Get user's email for profile check
    const userEmail = session.user?.email;

    // Parallel Data Fetching
    const [playbooks, rawGuides, experiments, communityMembers, userProfile, allLumaEvents, totalMemberCount] = await Promise.all([
        prisma.playbook.findMany({
            where: {
                visibility: { in: ["PUBLIC", "MEMBER"] },
                deletedAt: null
            },
            orderBy: { createdAt: "desc" },
            take: 10,
            select: { id: true, title: true, description: true, coverImage: true, visibility: true }
        }),
        prisma.guide.findMany({
            where: {
                visibility: { in: ["PUBLIC", "MEMBER"] },
                deletedAt: null
            },
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                title: true,
                coverImage: true,
                type: true,
                visibility: true,
                body: true,
                createdAt: true,
                updatedAt: true,
            }
        }),
        prisma.experiment.findMany({
            where: { deletedAt: null },
            orderBy: { createdAt: "desc" },
            take: 20
        }),
        prisma.communityMember.findMany({
            where: { status: 'active' },
            orderBy: { createdAt: "desc" },
            take: 10,
            select: {
                id: true,
                name: true,
                email: true,
                xHandle: true,
                telegram: true,
                tags: true
            }
        }),
        // Fetch current user's profile to check completeness
        userRole === 'CORE'
            ? prisma.member.findUnique({
                where: { email: userEmail || '' },
                select: { name: true, xHandle: true, customFields: true }
            })
            : prisma.communityMember.findUnique({
                where: { email: userEmail || '' },
                select: { name: true, xHandle: true, telegram: true, customFields: true }
            }),
        // Luma events
        getAllEvents(),
        // Total community members count
        prisma.communityMember.count({ where: { status: 'active' } }),
    ]);

    const { programs, events, content } = bucketGuides(rawGuides);

    // Compute Luma metrics
    const totalEventsHosted = allLumaEvents.length;
    const citiesReached = [...new Set(
        allLumaEvents
            .map(e => e.event.geo_address_json?.city)
            .filter(Boolean)
    )].length;

    // Check if profile is complete
    const customFields = (userProfile?.customFields as any) || {};
    const isProfileComplete = Boolean(
        userProfile?.name &&
        userProfile?.xHandle &&
        (userRole === 'CORE' || (userProfile as any)?.telegram) &&
        customFields.wallet
    );

    return (
        <MemberWrapper>
            <MemberDashboard
                user={session.user}
                playbooks={playbooks}
                programs={programs}
                events={events}
                content={content}
                experiments={experiments}
                members={communityMembers}
                isProfileComplete={isProfileComplete}
                communityPulse={{
                    totalMembers: totalMemberCount,
                    eventsHosted: totalEventsHosted,
                    citiesReached: citiesReached,
                }}
                lumaEvents={allLumaEvents}
            />
        </MemberWrapper>
    );
}
