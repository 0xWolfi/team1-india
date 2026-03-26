import Link from "next/link";
import { ArrowLeft, Trophy } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Footer } from "@/components/website/Footer";
import ContentClient from "@/components/public/ContentClient";

async function getGuides() {
  // @ts-ignore
  return prisma.guide.findMany({
    where: { visibility: "PUBLIC", type: "CONTENT", deletedAt: null },
    orderBy: { createdAt: "desc" },
    select: { 
      id: true, 
      title: true, 
      type: true,
      body: true,
      // @ts-ignore
      coverImage: true,
      createdAt: true,
      createdBy: {
        select: {
          name: true
        }
      }
    },
  });
}

export default async function PublicContentPage() {
  const guidesData = await getGuides();
  const guides = guidesData.map((g: any) => ({
    id: g.id,
    title: g.title,
    description: g.body?.description || "",
    coverImage: g.coverImage,
    type: g.type,
    createdAt: g.createdAt,
    createdBy: g.createdBy
  }));

  return (
    <main className="min-h-screen text-white selection:bg-zinc-800 selection:text-zinc-200">
      
      <div className="pt-24 px-6 max-w-7xl mx-auto pb-20">
        
        {/* Back Link */}
        <Link href="/public" className="flex items-center gap-2 text-zinc-500 hover:text-white mb-8 transition-colors w-fit text-sm font-medium">
            <ArrowLeft className="w-4 h-4"/> Back to Dashboard
        </Link>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
            <div>
                <h1 className="text-3xl md:text-4xl font-bold mb-3 flex items-center gap-3">
                     <span className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center border border-white/10">
                        <Trophy className="w-4 h-4 text-zinc-400"/>
                     </span>
                     Content
                </h1>
                <p className="text-zinc-500 text-sm md:text-base max-w-2xl leading-relaxed">
                    Earn bounties by contributing guides, articles, and resources.
                </p>
            </div>
        </div>
            
        <ContentClient guides={guides} />

      </div>
      <Footer />
    </main>
  );
}
