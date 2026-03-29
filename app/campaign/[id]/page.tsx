import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { CampaignClient } from "./CampaignClient";

export const revalidate = 60;

async function getCampaign(idOrSlug: string) {
    // Try by slug first, then by id
    let guide = await prisma.guide.findFirst({
        where: {
            slug: idOrSlug,
            deletedAt: null,
            type: { in: ['WORKSHOP', 'HACKATHON', 'EVENT_FEEDBACK'] },
        },
    });

    if (!guide) {
        guide = await prisma.guide.findFirst({
            where: {
                id: idOrSlug,
                deletedAt: null,
                type: { in: ['WORKSHOP', 'HACKATHON', 'EVENT_FEEDBACK'] },
            },
        });
    }

    if (!guide) return null;

    const body = (guide.body as any) || {};

    return {
        id: guide.id,
        title: guide.title || "Untitled",
        type: guide.type || "WORKSHOP",
        coverImage: guide.coverImage,
        city: body.city || '',
        description: body.description || '',
        markdown: body.markdown || '',
        formSchema: guide.formSchema,
    };
}

type Props = {
    params: Promise<{ id: string }>;
};

export default async function CampaignPage({ params }: Props) {
    const { id } = await params;
    const campaign = await getCampaign(id);

    if (!campaign) {
        notFound();
    }

    return <CampaignClient campaign={campaign} />;
}
