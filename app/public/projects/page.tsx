import Link from "next/link";
import { ArrowLeft, Layers, Heart, Eye, Flame, X } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Footer } from "@/components/website/Footer";

export const revalidate = 60;

type ProjectFilter = "all" | "speedrun";

async function getProjects(filter: ProjectFilter, runSlug: string | null) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = { status: "published", deletedAt: null };
    if (filter === "speedrun") {
      if (runSlug) {
        const run = await prisma.speedrunRun.findFirst({
          where: { slug: runSlug, deletedAt: null },
          select: { id: true },
        });
        where.speedrunRunId = run?.id ?? "__none__";
      } else {
        where.speedrunRunId = { not: null };
      }
    }
    return await prisma.userProject.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true, title: true, slug: true, description: true, coverImage: true,
        techStack: true, tags: true, likeCount: true, viewCount: true,
        ownerEmail: true, createdAt: true,
        speedrunRun: { select: { slug: true, monthLabel: true } },
      },
    });
  } catch {
    return [];
  }
}

async function getShowcase() {
  try {
    return await prisma.showcaseSection.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    });
  } catch {
    return [];
  }
}

export default async function PublicProjectsPage({
  searchParams,
}: {
  searchParams?: Promise<{ speedrun?: string; speedrunRun?: string }>;
}) {
  const sp = (await searchParams) || {};
  const filter: ProjectFilter = sp.speedrun || sp.speedrunRun ? "speedrun" : "all";
  const runSlug = sp.speedrunRun || null;
  const [projects, showcase] = await Promise.all([
    getProjects(filter, runSlug),
    getShowcase(),
  ]);

  return (
    <main className="min-h-screen text-black dark:text-white selection:bg-zinc-200 dark:selection:bg-zinc-800">
      <div className="pt-20 sm:pt-24 px-4 sm:px-6 max-w-7xl mx-auto pb-20">
        <Link href="/public" className="flex items-center gap-2 text-zinc-500 hover:text-black dark:hover:text-white mb-8 transition-colors w-fit text-sm font-medium">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>

        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-lg bg-zinc-200 dark:bg-zinc-800 border border-black/10 dark:border-white/10 flex items-center justify-center">
              <Layers className="w-4 h-4 text-zinc-500" />
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">Discover Projects</h1>
          </div>
          <p className="text-zinc-500 text-sm md:text-base max-w-2xl leading-relaxed">
            Explore projects built by the Team1 India community. From hackathon winners to side projects.
          </p>
        </div>

        {/* Filter pills */}
        <div className="flex flex-wrap items-center gap-2 mb-8">
          <Link
            href="/public/projects"
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-colors ${
              filter === "all"
                ? "bg-black text-white dark:bg-white dark:text-black"
                : "border border-black/10 dark:border-white/10 text-zinc-500 hover:text-black dark:hover:text-white"
            }`}
          >
            All
          </Link>
          <Link
            href="/public/projects?speedrun=1"
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-colors ${
              filter === "speedrun"
                ? "bg-red-500 text-white"
                : "border border-red-500/30 text-red-500 hover:bg-red-500/10"
            }`}
          >
            <Flame className="w-3 h-3" /> Speedrun
          </Link>
          {runSlug && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-red-500/10 text-red-500">
              {runSlug}
              <Link href="/public/projects?speedrun=1" className="hover:opacity-70" aria-label="Clear run filter">
                <X className="w-3 h-3" />
              </Link>
            </span>
          )}
        </div>

        {/* Project Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/public/projects/${project.slug}`}
              className="group rounded-2xl border border-black/5 dark:border-white/5 bg-white/50 dark:bg-zinc-900/50 hover:border-black/10 dark:hover:border-white/10 transition-all overflow-hidden"
            >
              {project.coverImage && (
                <div className="h-40 bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                  <img src={project.coverImage} alt={project.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                </div>
              )}
              <div className="p-5">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-bold text-lg group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors line-clamp-1">{project.title}</h3>
                </div>
                {project.speedrunRun && (
                  <div className="inline-flex items-center gap-1 mb-2 px-2 py-0.5 rounded-md bg-red-500/10 text-red-500 text-[10px] font-bold uppercase tracking-widest">
                    <Flame className="w-2.5 h-2.5" />
                    Speedrun · {project.speedrunRun.monthLabel}
                  </div>
                )}
                {project.description && (
                  <p className="text-zinc-500 text-sm line-clamp-2 mb-3">{project.description}</p>
                )}
                {project.techStack.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {project.techStack.slice(0, 4).map((t) => (
                      <span key={t} className="px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-[10px] font-medium text-zinc-600 dark:text-zinc-400">{t}</span>
                    ))}
                    {project.techStack.length > 4 && (
                      <span className="px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-[10px] text-zinc-400">+{project.techStack.length - 4}</span>
                    )}
                  </div>
                )}
                <div className="flex items-center gap-4 text-xs text-zinc-400">
                  <span className="flex items-center gap-1"><Heart className="w-3 h-3" />{project.likeCount}</span>
                  <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{project.viewCount}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {projects.length === 0 && (
          <div className="text-center py-20 text-zinc-400 text-sm">No projects yet. Be the first to share yours!</div>
        )}
      </div>
      <Footer />
    </main>
  );
}
