import React from "react";
import { MemberWrapper } from "@/components/member/MemberWrapper";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { MemberDashboard } from "@/components/member/MemberDashboard";
import { Program, Event, Guide } from "@/types/public";

// Helper to determine type of guide
const bucketGuides = (guides: any[]) => {
    const programs: Program[] = [];
    const events: Event[] = [];
    const content: Guide[] = [];

    guides.forEach((g) => {
        const item = {
             id: g.id,
             title: g.title,
             coverImage: g.coverImage,
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

    // Parallel Data Fetching
    const [playbooks, rawGuides, experiments, communityMembers] = await Promise.all([
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
                discord: true,
                tags: true
            }
        })
    ]);

    const { programs, events, content } = bucketGuides(rawGuides);

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
            />
        </MemberWrapper>
    );
}
