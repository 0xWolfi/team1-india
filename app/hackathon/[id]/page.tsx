import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { CampaignClient } from "@/app/campaign/[id]/CampaignClient";

export const revalidate = 60;

async function getHackathon(idOrSlug: string) {
    let guide = await prisma.guide.findFirst({
        where: { slug: idOrSlug, deletedAt: null, type: 'HACKATHON' },
    });

    if (!guide) {
        guide = await prisma.guide.findFirst({
            where: { id: idOrSlug, deletedAt: null, type: 'HACKATHON' },
        });
    }

    if (!guide) return null;

    const body = (guide.body as any) || {};
    return {
        id: guide.id,
        title: guide.title || "Untitled",
        type: guide.type || "HACKATHON",
        coverImage: guide.coverImage,
        city: body.city || '',
        description: body.description || '',
        markdown: body.markdown || '',
        formSchema: guide.formSchema,
    };
}

type Props = { params: Promise<{ id: string }> };

export default async function HackathonPage({ params }: Props) {
    const { id } = await params;
    const campaign = await getHackathon(id);
    if (!campaign) notFound();
    return <CampaignClient campaign={campaign} />;
}
