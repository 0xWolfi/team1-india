import Link from "next/link";
import { ArrowLeft, Trophy, Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Footer } from "@/components/website/Footer";

export const revalidate = 60;

async function getChallenges() {
  try {
    return await prisma.challenge.findMany({
      where: { deletedAt: null, status: { not: "cancelled" } },
      orderBy: { createdAt: "desc" },
      include: {
        tracks: { select: { id: true, name: true }, orderBy: { sortOrder: "asc" } },
        _count: { select: { registrations: true, submissions: true } },
      },
    });
  } catch {
    return [];
  }
}

const STATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  draft: { bg: "bg-zinc-100 dark:bg-zinc-800", text: "text-zinc-500", label: "Coming Soon" },
  registration_open: { bg: "bg-green-500/10", text: "text-green-500", label: "Registration Open" },
  in_progress: { bg: "bg-blue-500/10", text: "text-blue-500", label: "In Progress" },
  judging: { bg: "bg-yellow-500/10", text: "text-yellow-500", label: "Judging" },
  completed: { bg: "bg-purple-500/10", text: "text-purple-500", label: "Completed" },
};

export default async function PublicChallengesPage() {
  const challenges = await getChallenges();

  return (
    <main className="min-h-screen text-black dark:text-white selection:bg-zinc-200 dark:selection:bg-zinc-800">
      <div className="pt-20 sm:pt-24 px-4 sm:px-6 max-w-7xl mx-auto pb-20">
        <Link href="/public" className="flex items-center gap-2 text-zinc-500 hover:text-black dark:hover:text-white mb-8 transition-colors w-fit text-sm font-medium">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>

        <div className="mb-12">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-lg bg-zinc-200 dark:bg-zinc-800 border border-black/10 dark:border-white/10 flex items-center justify-center">
              <Trophy className="w-4 h-4 text-zinc-500" />
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">Challenges</h1>
          </div>
          <p className="text-zinc-500 text-sm md:text-base max-w-2xl leading-relaxed">
            Compete in hackathons, build projects, and win prizes with the Team1 India community.
          </p>
        </div>

        <div className="space-y-4">
          {challenges.map((c) => {
            const status = STATUS_COLORS[c.status] || STATUS_COLORS.draft;
            return (
              <Link key={c.id} href={`/public/challenges/${c.slug}`} className="block p-4 sm:p-6 rounded-2xl border border-black/5 dark:border-white/5 hover:border-black/10 dark:hover:border-white/10 transition-all bg-white/50 dark:bg-zinc-900/50">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${status.bg} ${status.text}`}>{status.label}</span>
                      {c.prizePool && <span className="text-xs font-medium text-yellow-500">{c.prizePool}</span>}
                    </div>
                    <h2 className="text-xl font-bold mb-1">{c.title}</h2>
                    {c.description && <p className="text-zinc-500 text-sm line-clamp-2">{c.description}</p>}
                    {c.tracks.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {c.tracks.map((t) => (
                          <span key={t.id} className="px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-[10px] font-medium text-zinc-600 dark:text-zinc-400">{t.name}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-zinc-400 shrink-0">
                    <span className="flex items-center gap-1"><Users className="w-4 h-4" />{c._count.registrations} teams</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {challenges.length === 0 && (
          <div className="text-center py-20 text-zinc-400 text-sm">No challenges yet. Check back soon!</div>
        )}
      </div>
      <Footer />
    </main>
  );
}
