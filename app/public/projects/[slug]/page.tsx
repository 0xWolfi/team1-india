import Link from "next/link";
import { ArrowLeft, Heart, Eye, MessageCircle, ExternalLink, Github, Trophy, Clock } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Footer } from "@/components/website/Footer";

export const revalidate = 60;

export default async function ProjectDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const project = await prisma.userProject.findFirst({
    where: { slug, deletedAt: null, status: "published" },
    include: {
      challenge: { select: { id: true, title: true, slug: true } },
      comments: { where: { deletedAt: null, isHidden: false }, orderBy: { createdAt: "desc" }, take: 20 },
      _count: { select: { likes: true, comments: true } },
    },
  });

  if (!project) notFound();

  return (
    <main className="min-h-screen text-black dark:text-white selection:bg-zinc-200 dark:selection:bg-zinc-800">
      <div className="pt-24 px-6 max-w-4xl mx-auto pb-20">
        <Link href="/public/projects" className="flex items-center gap-2 text-zinc-500 hover:text-black dark:hover:text-white mb-8 transition-colors w-fit text-sm font-medium">
          <ArrowLeft className="w-4 h-4" /> Back to Projects
        </Link>

        {/* Cover Image */}
        {project.coverImage && (
          <div className="rounded-2xl overflow-hidden mb-8 border border-black/5 dark:border-white/5">
            <img src={project.coverImage} alt={project.title} className="w-full h-64 md:h-80 object-cover" />
          </div>
        )}

        {/* Title + Badges */}
        <div className="mb-6">
          <div className="flex items-start gap-3 mb-3">
            <h1 className="text-3xl md:text-4xl font-bold flex-1">{project.title}</h1>
            {project.isWinner && (
              <span className="shrink-0 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-sm font-bold text-yellow-600 dark:text-yellow-400 flex items-center gap-1.5">
                <Trophy className="w-4 h-4" />{project.winnerBadge} Place
              </span>
            )}
          </div>

          {project.challenge && (
            <Link href={`/public/challenges/${project.challenge.slug}`} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 transition-colors mb-4">
              Built for: {project.challenge.title}
            </Link>
          )}

          {project.description && (
            <p className="text-zinc-500 text-base leading-relaxed max-w-2xl">{project.description}</p>
          )}
        </div>

        {/* Stats */}
        <div className="flex items-center gap-6 mb-8 text-sm text-zinc-500">
          <span className="flex items-center gap-1.5"><Heart className="w-4 h-4" />{project.likeCount} likes</span>
          <span className="flex items-center gap-1.5"><Eye className="w-4 h-4" />{project.viewCount} views</span>
          <span className="flex items-center gap-1.5"><MessageCircle className="w-4 h-4" />{project._count.comments} comments</span>
        </div>

        {/* Links */}
        <div className="flex flex-wrap gap-3 mb-8">
          {project.demoUrl && (
            <a href={project.demoUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-black dark:bg-white text-white dark:text-black text-sm font-medium hover:opacity-90 transition-opacity">
              <ExternalLink className="w-4 h-4" /> Live Demo
            </a>
          )}
          {project.repoUrl && (
            <a href={project.repoUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-black/10 dark:border-white/10 text-sm font-medium hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
              <Github className="w-4 h-4" /> Source Code
            </a>
          )}
          <Link href={`/public/projects/${slug}/history`} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-black/10 dark:border-white/10 text-sm font-medium text-zinc-500 hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
            <Clock className="w-4 h-4" /> Version History
          </Link>
        </div>

        {/* Tech Stack */}
        {project.techStack.length > 0 && (
          <div className="mb-8">
            <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400 mb-3">Tech Stack</h2>
            <div className="flex flex-wrap gap-2">
              {project.techStack.map((t) => (
                <span key={t} className="px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-sm font-medium text-zinc-600 dark:text-zinc-400 border border-black/5 dark:border-white/5">{t}</span>
              ))}
            </div>
          </div>
        )}

        {/* Team */}
        <div className="mb-8">
          <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400 mb-3">Team</h2>
          <div className="flex flex-wrap gap-2">
            {project.teamEmails.map((email) => (
              <span key={email} className="px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-sm text-zinc-600 dark:text-zinc-400">{email}</span>
            ))}
          </div>
        </div>

        {/* Comments */}
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400 mb-4">Comments ({project._count.comments})</h2>
          {project.comments.length > 0 ? (
            <div className="space-y-4">
              {project.comments.map((c) => (
                <div key={c.id} className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-black/5 dark:border-white/5">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">{c.authorEmail}</span>
                    <span className="text-xs text-zinc-400">{new Date(c.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm text-zinc-700 dark:text-zinc-300">{c.content}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-zinc-400 text-sm">No comments yet.</p>
          )}
        </div>
      </div>
      <Footer />
    </main>
  );
}
