import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Calendar, Globe, Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { safeBuildFetch } from "@/lib/safeStaticParams";
import { DataLoadError } from "@/components/public/DataLoadError";
import { notFound } from "next/navigation";
import { Footer } from "@/components/website/Footer";
import { ApplicationForm } from "@/components/public/ApplicationForm";
import ReactMarkdown from 'react-markdown';

import { Program, GuideBody } from "@/types/public";

export const revalidate = 300; // ISR: revalidate every 5 minutes

export async function generateStaticParams() {
  const items = await safeBuildFetch(
    () =>
      prisma.guide.findMany({
        where: { visibility: "PUBLIC", type: "PROGRAM", deletedAt: null },
        select: { id: true },
      }),
    "programs generateStaticParams"
  );
  return items.map((item) => ({ id: item.id }));
}

type ProgramLoadResult =
  | { kind: "ok"; program: Program }
  | { kind: "missing" }
  | { kind: "error"; message: string };

async function getProgram(id: string): Promise<ProgramLoadResult> {
  let guide;
  try {
    guide = await prisma.guide.findUnique({
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
        formSchema: true
      }
    });
  } catch (err) {
    return {
      kind: "error",
      message: err instanceof Error ? err.message : String(err),
    };
  }

  if (!guide || guide.type !== 'PROGRAM') return { kind: "missing" };

  const body = guide.body as unknown as GuideBody;

  return {
    kind: "ok",
    program: {
        id: guide.id,
        title: guide.title || "Untitled Program",
        type: "PROGRAM",
        description: body.description || "",
        coverImage: guide.coverImage,
        createdAt: guide.createdAt,
        updatedAt: guide.updatedAt,
        visibility: guide.visibility as "PUBLIC" | "MEMBER" | "CORE",
        status: "active",
        formSchema: guide.formSchema,
        body: body
    },
  };
}

type Props = {
  params: Promise<{ id: string }>
}

export default async function ProgramDetailPage({ params }: Props) {
  const { id } = await params;
  const result = await getProgram(id);

  if (result.kind === "error") {
    return (
      <DataLoadError
        title="Couldn't load this program"
        description="We hit a snag fetching this program. Please try again in a moment."
        detail={result.message}
        backHref="/public/programs"
        backLabel="All programs"
      />
    );
  }
  if (result.kind === "missing") notFound();
  const program = result.program;

  // extract image safely
  const coverImage = program.coverImage;

  return (
    <main className="min-h-screen bg-white dark:bg-black text-black dark:text-white selection:bg-zinc-200 dark:selection:bg-zinc-800 selection:text-zinc-800 dark:selection:text-zinc-200">
      
      {/* Cover Image Section */}
      {coverImage && (
        <div className="relative w-full h-[30vh] sm:h-[40vh] md:h-[50vh] overflow-hidden">
          <Image
            src={coverImage}
            alt={program.title}
            fill
            className="object-cover"
            priority
            unoptimized
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
        </div>
      )}

      {/* Hero Section with Content */}
      <div className="relative pb-20 px-4 sm:px-6 overflow-hidden" style={{ marginTop: coverImage ? '-10vh' : '8rem' }}>

         <div className="max-w-5xl mx-auto relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-12">
            
            {/* Left Content */}
            <div className="lg:col-span-2">
                <Link href="/public/programs" className="flex items-center gap-2 text-zinc-500 hover:text-black dark:hover:text-white mb-8 transition-colors w-fit text-sm font-medium">
                    <ArrowLeft className="w-4 h-4"/> Back to Programs
                </Link>

                <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6 leading-tight">{program.title}</h1>
                <p className="text-base sm:text-lg md:text-xl text-zinc-500 dark:text-zinc-400 leading-relaxed mb-8">{program.description}</p>
                
                <div className="flex flex-wrap gap-4 text-sm text-zinc-500 mb-12 border-y border-black/5 dark:border-white/5 py-6">
                    <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-zinc-500 dark:text-zinc-400"/>
                        <span>Open Enrollment</span>
                    </div>
                    <div className="w-px h-4 bg-black/10 dark:bg-white/10" />
                    <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-zinc-500 dark:text-zinc-400"/>
                        <span>Rolling Admissions</span>
                    </div>
                    <div className="w-px h-4 bg-black/10 dark:bg-white/10" />
                    <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-zinc-500 dark:text-zinc-400"/>
                        <span>Remote / Global</span>
                    </div>
                </div>

                {/* Render actual program body content */}
                {program.body?.markdown && (
                    <div className="prose dark:prose-invert prose-zinc max-w-none">
                        <ReactMarkdown>{program.body.markdown}</ReactMarkdown>
                    </div>
                )}
                
                {/* Fallback content if no markdown */}
                {!program.body?.markdown && (
                    <div className="prose dark:prose-invert prose-zinc max-w-none">
                        <h3>About the Program</h3>
                        <p>
                            This program is designed to provide you with the resources, mentorship, and network needed to accelerate your growth. 
                            Whether you are just starting out or looking to scale, our curriculum and community support are tailored to meet your needs.
                        </p>
                        <ul>
                            <li>Weekly mentorship sessions with industry experts</li>
                            <li>Access to exclusive resources and tools</li>
                            <li>Community of like-minded builders</li>
                            <li>Opportunity for grants and funding</li>
                        </ul>
                    </div>
                )}
            </div>

            {/* Right: Application Form */}
            <div className="lg:col-span-1">
                <div className="sticky top-24">
                   <ApplicationForm programId={program.id} formSchema={program.formSchema as any[]} />
                </div>
            </div>

         </div>
      </div>

      <Footer />
    </main>
  );
}
