import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { safeBuildFetch } from "@/lib/safeStaticParams";
import { Footer } from "@/components/website/Footer";
import PlaybooksClient from "@/components/public/PlaybooksClient";

export const revalidate = 300; // ISR: revalidate every 5 minutes

async function getPlaybooks() {
  const playbooks = await safeBuildFetch(
    () =>
      prisma.playbook.findMany({
        where: {
          visibility: "PUBLIC",
          deletedAt: null,
        },
        orderBy: { updatedAt: "desc" },
        select: {
          id: true,
          title: true,
          description: true,
          coverImage: true,
          createdAt: true,
          updatedAt: true,
          visibility: true,
          createdBy: {
            select: {
              name: true,
            },
          },
        },
      }),
    "public/playbooks listing"
  );

  return playbooks.map((p) => ({
    id: p.id,
    title: p.title,
    description: p.description,
    coverImage: p.coverImage,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
    visibility: p.visibility,
    createdBy: p.createdBy,
  }));
}

export default async function PublicPlaybooksPage() {
  const playbooks = await getPlaybooks();

  return (
    <main className="min-h-screen text-black dark:text-white selection:bg-zinc-200 dark:selection:bg-zinc-800 selection:text-zinc-800 dark:selection:text-zinc-200">

      <div className="pt-20 sm:pt-24 px-4 sm:px-6 max-w-7xl mx-auto pb-20">

        {/* Back Link */}
        <Link href="/public" className="flex items-center gap-2 text-zinc-500 hover:text-black dark:hover:text-white mb-8 transition-colors w-fit text-sm font-medium">
            <ArrowLeft className="w-4 h-4"/> Back to Dashboard
        </Link>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
            <div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 flex items-center gap-3">
                     <span className="w-8 h-8 rounded-lg bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center border border-black/10 dark:border-white/10">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-zinc-500 dark:text-zinc-400"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" /></svg>
                     </span>
                     Playbooks
                </h1>
                <p className="text-zinc-500 text-sm md:text-base max-w-2xl leading-relaxed">
                    Centralized repository for your organization&apos;s strategic documentation, SOPs, and knowledge.
                </p>
            </div>
        </div>

        <PlaybooksClient playbooks={playbooks} />

      </div>
      <Footer />
    </main>
  );
}
