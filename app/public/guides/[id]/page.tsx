import { prisma } from "@/lib/prisma";
import { safeBuildFetch } from "@/lib/safeStaticParams";
import { DataLoadError } from "@/components/public/DataLoadError";
import { notFound } from "next/navigation";
import PublicGuideClient from "@/components/public/PublicGuideClient";
import { GuideBody } from "@/types/public";

export const revalidate = 300; // ISR: revalidate every 5 minutes

export async function generateStaticParams() {
    const items = await safeBuildFetch(
        () =>
            prisma.guide.findMany({
                where: { visibility: "PUBLIC", deletedAt: null },
                select: { id: true },
            }),
        "guides generateStaticParams"
    );
    return items.map((item) => ({ id: item.id }));
}

type GuideLoadResult =
    | { kind: "ok"; guide: NonNullable<Awaited<ReturnType<typeof loadGuide>>> }
    | { kind: "missing" }
    | { kind: "error"; message: string };

async function loadGuide(id: string) {
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

async function getGuide(id: string): Promise<GuideLoadResult> {
    try {
        const guide = await loadGuide(id);
        if (!guide) return { kind: "missing" };
        return { kind: "ok", guide };
    } catch (err) {
        return {
            kind: "error",
            message: err instanceof Error ? err.message : String(err),
        };
    }
}

type Props = {
    params: Promise<{ id: string }>;
};

export default async function PublicGuidePage({ params }: Props) {
    const { id } = await params;
    const result = await getGuide(id);

    if (result.kind === "error") {
        return (
            <DataLoadError
                title="Couldn't load this guide"
                description="We hit a snag fetching this guide. Please try again in a moment."
                detail={result.message}
                backHref="/public"
                backLabel="Back to home"
            />
        );
    }
    if (result.kind === "missing") notFound();

    return <PublicGuideClient guide={result.guide} />;
}
