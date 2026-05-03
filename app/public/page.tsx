import { prisma } from "@/lib/prisma";
import { safeBuildFetch } from "@/lib/safeStaticParams";
import { getAllEvents } from "@/lib/luma";
import type { LumaEventData } from "@/lib/luma";
import PublicPageClient from "@/components/public/PublicPageClient";

export const revalidate = 300;

function categorizeEvents(events: LumaEventData[]) {
    const now = new Date();
    const live: LumaEventData[] = [], upcoming: LumaEventData[] = [], past: LumaEventData[] = [];
    events.forEach((entry) => {
        const startAt = new Date(entry.event.start_at);
        const endAt = entry.event.end_at ? new Date(entry.event.end_at) : null;
        if (startAt <= now && endAt && endAt > now) live.push(entry);
        else if (startAt > now) upcoming.push(entry);
        else past.push(entry);
    });
    upcoming.sort((a, b) => new Date(a.event.start_at).getTime() - new Date(b.event.start_at).getTime());
    past.sort((a, b) => new Date(b.event.start_at).getTime() - new Date(a.event.start_at).getTime());
    return { live, upcoming, past };
}

export default async function PublicPage() {
    // Each Prisma call is wrapped so the public landing degrades gracefully
    // when the DB is unreachable (missing DATABASE_URL during build, transient
    // outage at request time). Page renders with empty sections instead of 500.
    const [playbooks, publicGuides, resources, lumaEvents, bounties, questCount, projectCount, activeQuests, featuredProjects] = await Promise.all([
        safeBuildFetch(
            () =>
                prisma.playbook.findMany({
                    where: { visibility: "PUBLIC", deletedAt: null },
                    orderBy: { createdAt: "desc" },
                    take: 6,
                    select: { id: true, title: true, description: true, coverImage: true },
                }),
            "public landing playbooks"
        ),
        safeBuildFetch(
            () =>
                prisma.guide.findMany({
                    where: { visibility: "PUBLIC", deletedAt: null },
                    orderBy: { createdAt: "desc" },
                    select: {
                        id: true, title: true, type: true, coverImage: true,
                        body: true, createdAt: true, updatedAt: true, visibility: true,
                    },
                }),
            "public landing guides"
        ),
        safeBuildFetch(
            () =>
                prisma.contentResource.findMany({
                    where: {
                        type: { in: ["BRAND_ASSET", "FILE", "BIO"] },
                        status: "published",
                        deletedAt: null,
                    },
                    take: 6,
                    orderBy: { createdAt: "desc" },
                    select: { id: true, title: true, content: true, customFields: true },
                }),
            "public landing resources"
        ),
        getAllEvents().catch(() => [] as LumaEventData[]),
        prisma.bounty.count({ where: { status: "active", deletedAt: null } }).catch(() => 0),
        prisma.quest.count({ where: { status: "active", deletedAt: null } }).catch(() => 0),
        prisma.userProject.count({ where: { status: "published", deletedAt: null } }).catch(() => 0),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        prisma.quest.findMany({ where: { status: "active", deletedAt: null, audience: { in: ["all", "public"] } }, orderBy: { createdAt: "desc" }, take: 6, select: { id: true, title: true, description: true, xpReward: true, pointsReward: true, type: true, category: true } }).catch(() => [] as any[]),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        prisma.userProject.findMany({ where: { status: "published", deletedAt: null }, orderBy: { likeCount: "desc" }, take: 6, select: { id: true, title: true, slug: true, description: true, coverImage: true, techStack: true, likeCount: true } }).catch(() => [] as any[]),
    ]);

    // Bucket guides by type
    const programs: any[] = [];
    const events: any[] = [];
    const guides: any[] = [];

    publicGuides.forEach((g: any) => {
        const common = {
            id: g.id,
            title: g.title,
            coverImage: g.coverImage,
            createdAt: g.createdAt,
            updatedAt: g.updatedAt || g.createdAt,
            visibility: g.visibility,
            description: g.body?.description || "",
        };

        const type = g.type?.toUpperCase();
        if (type === "PROGRAM") {
            programs.push({ ...common, type: "PROGRAM", status: "active", body: g.body });
        } else if (type === "EVENT") {
            events.push({ ...common, type: "EVENT", status: "planned", date: g.body?.date || g.createdAt, location: g.body?.location || "", body: g.body });
        } else {
            guides.push({ ...common, type: g.type || "CONTENT", body: g.body });
        }
    });

    // Filter sensitive data from resources
    const mediaItems = resources.map((res: any) => {
        const safeCustomFields = res.customFields || {};
        const publicFields: any = {};
        if (safeCustomFields.description) {
            publicFields.description = safeCustomFields.description;
        }
        return {
            id: res.id,
            title: res.title,
            links: [res.content || "#"],
            description: publicFields.description || "",
        };
    });

    const categorizedEvents = categorizeEvents(lumaEvents);

    return (
        <PublicPageClient
            data={{
                playbooks,
                programs,
                guides,
                events,
                upcomingEvents: lumaEvents,
                mediaItems,
                bountyCount: bounties,
                questCount,
                projectCount,
                activeQuests,
                featuredProjects,
                categorizedEvents,
            }}
        />
    );
}
