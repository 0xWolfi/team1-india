import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import PublicGuideClient from "@/components/public/PublicGuideClient";
import { GuideBody } from "@/types/public";

export const revalidate = 300; // ISR: revalidate every 5 minutes

export async function generateStaticParams() {
    const items = await prisma.guide.findMany({
        where: { visibility: "PUBLIC", deletedAt: null },
        select: { id: true },
    });
    return items.map((item) => ({ id: item.id }));
}

async function getGuide(id: string) {
    const guide = await prisma.guide.findUnique({
        where: {
            id,
            visibility: "PUBLIC",
            deletedAt: null,
        },
        include: {
            createdBy: {
                select: {
                    name: true,
                    email: true,
                },
            },
        },
    });

    if (!guide) return null;

    const body = (guide.body as unknown as GuideBody) || { description: "" };

    return {
        id: guide.id,
        title: guide.title || "Untitled Guide",
        type: guide.type || "GUIDE",
        coverImage: guide.coverImage,
        createdAt: guide.createdAt.toISOString(),
        updatedAt: guide.updatedAt.toISOString(),
        visibility: guide.visibility as "PUBLIC" | "MEMBER" | "CORE",
        createdBy: guide.createdBy,
        formSchema: guide.formSchema,
        body,
    };
}

type Props = {
    params: Promise<{ id: string }>;
};

export default async function PublicGuidePage({ params }: Props) {
    const { id } = await params;
    const guide = await getGuide(id);

    if (!guide) {
        notFound();
    }

    return <PublicGuideClient guide={guide} />;
}
