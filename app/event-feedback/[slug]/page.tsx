import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { CampaignClient } from "@/app/campaign/[id]/CampaignClient";

export const revalidate = 60;

async function getFeedbackGuide(slugOrId: string) {
    let guide = await prisma.guide.findFirst({
        where: { slug: slugOrId, deletedAt: null, type: 'EVENT_FEEDBACK' },
    });

    if (!guide) {
        guide = await prisma.guide.findFirst({
            where: { id: slugOrId, deletedAt: null, type: 'EVENT_FEEDBACK' },
        });
    }

    if (!guide) return null;

    const body = (guide.body as any) || {};
    return {
        id: guide.id,
        title: guide.title || "Event Feedback",
        type: guide.type || "EVENT_FEEDBACK",
        coverImage: guide.coverImage,
        city: body.city || '',
        description: body.description || '',
        markdown: body.markdown || '',
        formSchema: guide.formSchema,
    };
}

type Props = { params: Promise<{ slug: string }> };

export default async function EventFeedbackPage({ params }: Props) {
    const { slug } = await params;
    const campaign = await getFeedbackGuide(slug);
    if (!campaign) notFound();
    return <CampaignClient campaign={campaign} />;
}
