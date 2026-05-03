
import Link from "next/link";
import { ArrowLeft, Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { safeBuildFetch } from "@/lib/safeStaticParams";
import { Footer } from "@/components/website/Footer";
import ProgramsClient from "@/components/public/ProgramsClient";

export const revalidate = 300; // ISR: revalidate every 5 minutes

async function getPrograms() {
  const guides = await safeBuildFetch(
    () =>
      prisma.guide.findMany({
        where: {
          visibility: "PUBLIC",
          type: "PROGRAM",
          deletedAt: null,
        },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          body: true,
          coverImage: true,
          createdAt: true,
          createdBy: {
            select: {
              name: true,
            },
          },
        },
      }),
    "public/programs listing"
  );

  return guides.map((g: any) => ({
      id: g.id,
      title: g.title,
      description: g.body?.description || "",
      coverImage: g.coverImage,
      createdAt: g.createdAt,
      createdBy: g.createdBy
  }));
}

export default async function PublicProgramsPage() {
  const programs = await getPrograms();

  return (
    <main className="min-h-screen text-black dark:text-white selection:bg-zinc-200 dark:selection:bg-zinc-800 selection:text-zinc-700 dark:selection:text-zinc-200">
      
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
                        <Users className="w-4 h-4 text-zinc-500 dark:text-zinc-400"/>
                     </span>
                     Programs
                </h1>
                <p className="text-zinc-500 text-sm md:text-base max-w-2xl leading-relaxed">
                    Initiatives, mentorships, and long-term series to accelerate your growth.
                </p>
            </div>
        </div>
            
        <ProgramsClient programs={programs} />

      </div>
      <Footer />
    </main>
  );
}
