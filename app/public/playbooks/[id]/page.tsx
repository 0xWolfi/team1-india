import { prisma } from "@/lib/prisma";
import { safeBuildFetch } from "@/lib/safeStaticParams";
import { DataLoadError } from "@/components/public/DataLoadError";
import { notFound } from "next/navigation";
import PublicPlaybookClient from "@/components/public/PublicPlaybookClient";

export const revalidate = 300; // ISR: revalidate every 5 minutes

export async function generateStaticParams() {
    const items = await safeBuildFetch(
        () =>
            prisma.playbook.findMany({
                where: { visibility: "PUBLIC", deletedAt: null },
                select: { id: true },
            }),
        "playbooks generateStaticParams"
    );
    return items.map((item) => ({ id: item.id }));
}

type PlaybookLoadResult =
    | { kind: "ok"; playbook: NonNullable<Awaited<ReturnType<typeof loadPlaybook>>> }
    | { kind: "missing" }
    | { kind: "error"; message: string };

async function loadPlaybook(id: string) {
    const playbook = await prisma.playbook.findFirst({
        where: {
            id,
            deletedAt: null,
            visibility: "PUBLIC",
        },
        include: {
            createdBy: { select: { email: true, id: true } },
        },
    });
    if (!playbook) return null;
    return {
        id: playbook.id,
        title: playbook.title,
        body: typeof playbook.body === "string" ? playbook.body : JSON.stringify(playbook.body),
        updatedAt: playbook.updatedAt.toISOString(),
        createdBy: playbook.createdBy ? { email: playbook.createdBy.email } : undefined,
        visibility: playbook.visibility as "PUBLIC" | "MEMBERS" | "CORE",
        coverImage: playbook.coverImage || undefined,
    };
}

async function getPlaybook(id: string): Promise<PlaybookLoadResult> {
    try {
        const playbook = await loadPlaybook(id);
        if (!playbook) return { kind: "missing" };
        return { kind: "ok", playbook };
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

export default async function PublicPlaybookPage({ params }: Props) {
    const { id } = await params;
    const result = await getPlaybook(id);

    if (result.kind === "error") {
        return (
            <DataLoadError
                title="Couldn't load this playbook"
                description="We hit a snag fetching this playbook. Please try again in a moment."
                detail={result.message}
                backHref="/public/playbooks"
                backLabel="All playbooks"
            />
        );
    }
    if (result.kind === "missing") notFound();

    return <PublicPlaybookClient playbook={result.playbook} />;
}
