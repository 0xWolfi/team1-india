import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import PublicPlaybookClient from "@/components/public/PublicPlaybookClient";

export const revalidate = 300; // ISR: revalidate every 5 minutes

export async function generateStaticParams() {
    const items = await prisma.playbook.findMany({
        where: { visibility: "PUBLIC", deletedAt: null },
        select: { id: true },
    });
    return items.map((item) => ({ id: item.id }));
}

async function getPlaybook(id: string) {
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

type Props = {
    params: Promise<{ id: string }>;
};

export default async function PublicPlaybookPage({ params }: Props) {
    const { id } = await params;
    const playbook = await getPlaybook(id);

    if (!playbook) {
        notFound();
    }

    return <PublicPlaybookClient playbook={playbook} />;
}
