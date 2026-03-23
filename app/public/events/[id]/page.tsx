
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Calendar } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { ApplicationForm } from "@/components/public/ApplicationForm";
import { Footer } from "@/components/website/Footer";
import ReactMarkdown from 'react-markdown';

import { Event, GuideBody } from "@/types/public";

export const revalidate = 300; // ISR: revalidate every 5 minutes

export async function generateStaticParams() {
  const items = await prisma.guide.findMany({
    where: { visibility: "PUBLIC", type: "EVENT", deletedAt: null },
    select: { id: true },
  });
  return items.map((item) => ({ id: item.id }));
}

async function getEvent(id: string): Promise<Event | null> {
  const guide = await prisma.guide.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      body: true,
      coverImage: true,
      createdAt: true,
      updatedAt: true,
      type: true,
      visibility: true,
      createdBy: { select: { name: true, email: true } },
      formSchema: true
    }
  });

  if (!guide || guide.type !== 'EVENT') return null;
  
  const body = guide.body as unknown as GuideBody;

  return {
    ...guide,
    title: guide.title || "Untitled Event",
    type: "EVENT", // override string | null from prisma
    visibility: guide.visibility as "PUBLIC" | "MEMBER" | "CORE",
    description: body.description || "",
    date: body.date || guide.createdAt,
    location: body.location || "",
    status: 'planned', // Default for event
    formSchema: guide.formSchema,
    body: body
    // coverImage is already at top level
  };
}

type Props = {
  params: Promise<{ id: string }>
}

export default async function PublicEventDetailPage({ params }: Props) {
  const { id } = await params;
  const event = await getEvent(id);

  if (!event || (event.visibility !== 'PUBLIC')) {
      return notFound();
  }

  const coverImage = event.coverImage;

  return (
    <main className="min-h-screen bg-black text-white selection:bg-zinc-800 selection:text-zinc-200">
       {/* Hero Image / Header */}
       <div className="relative h-[50vh] w-full bg-zinc-900">
           {coverImage ? (
               <Image 
                   src={coverImage as string} 
                   alt={event.title || "Event"} 
                   fill
                   className="object-cover" 
                   priority
                   unoptimized
               />
           ) : (
                <div className="w-full h-full flex items-center justify-center bg-zinc-900 pattern-grid-lg">
                    <Calendar className="w-20 h-20 text-zinc-800"/>
                </div>
           )}
           <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
           
           <div className="absolute bottom-0 left-0 w-full p-6 md:p-12 max-w-7xl mx-auto">
               <Link href="/public/events" className="inline-flex items-center gap-2 text-zinc-400 hover:text-white mb-6 transition-colors text-sm font-medium backdrop-blur-md bg-black/30 px-3 py-1.5 rounded-lg border border-white/5">
                   <ArrowLeft className="w-4 h-4"/> Back to Events
               </Link>
               <h1 className="text-4xl md:text-6xl font-bold mb-4 max-w-4xl leading-tight">{event.title}</h1>
               <div className="flex flex-wrap items-center gap-6 text-zinc-300 font-medium">


               </div>
           </div>
       </div>

       <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-12">
                <section>
                    <h2 className="text-xl font-bold text-white mb-4">About Event</h2>
                    
                    {/* Render actual event body content */}
                    {event.body?.markdown ? (
                        <div className="prose prose-invert prose-zinc max-w-none">
                            <ReactMarkdown>{event.body.markdown}</ReactMarkdown>
                        </div>
                    ) : (
                        <div className="prose prose-invert max-w-none text-zinc-400 leading-relaxed whitespace-pre-wrap">
                            {event.description || "No description provided."}
                        </div>
                    )}
                </section>
            </div>

            {/* Sidebar */}
    <div className="space-y-6">


                 <div className="sticky top-24">
                    <ApplicationForm programId={event.id} formSchema={event.formSchema as any[]} />
                 </div>


             </div>
       </div>

      <Footer />
    </main>
  );
}
