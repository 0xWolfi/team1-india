import Link from "next/link";
import { ArrowLeft, Trophy, Users, Calendar, FileText } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Footer } from "@/components/website/Footer";

export const revalidate = 60;

export default async function ChallengeDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  let challenge;
  try {
    challenge = await prisma.challenge.findFirst({
      where: { slug, deletedAt: null },
      include: {
        tracks: { orderBy: { sortOrder: "asc" } },
        winners: { where: { isPublished: true }, orderBy: { position: "asc" } },
        _count: { select: { registrations: true, submissions: true } },
      },
    });
  } catch { notFound(); }

  if (!challenge) notFound();

  return (
    <main className="min-h-screen text-black dark:text-white selection:bg-zinc-200 dark:selection:bg-zinc-800">
      <div className="pt-24 px-6 max-w-4xl mx-auto pb-20">
        <Link href="/public/challenges" className="flex items-center gap-2 text-zinc-500 hover:text-black dark:hover:text-white mb-8 transition-colors w-fit text-sm font-medium">
          <ArrowLeft className="w-4 h-4" /> Back to Challenges
        </Link>

        {challenge.coverImage && (
          <div className="rounded-2xl overflow-hidden mb-8 border border-black/5 dark:border-white/5">
            <img src={challenge.coverImage} alt={challenge.title} className="w-full h-64 md:h-80 object-cover" />
          </div>
        )}

        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-500/10 text-blue-500">{challenge.status.replace(/_/g, " ")}</span>
            {challenge.prizePool && <span className="text-sm font-medium text-yellow-500">{challenge.prizePool}</span>}
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-3">{challenge.title}</h1>
          {challenge.description && <p className="text-zinc-500 text-base leading-relaxed max-w-2xl">{challenge.description}</p>}
        </div>

        <div className="flex items-center gap-6 mb-8 text-sm text-zinc-500">
          <span className="flex items-center gap-1.5"><Users className="w-4 h-4" />{challenge._count.registrations} teams</span>
          <span className="flex items-center gap-1.5"><FileText className="w-4 h-4" />{challenge._count.submissions} submissions</span>
          {challenge.startDate && <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" />{new Date(challenge.startDate).toLocaleDateString()}</span>}
        </div>

        {challenge.tracks.length > 0 && (
          <div className="mb-8">
            <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400 mb-3">Tracks</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {challenge.tracks.map((t) => (
                <div key={t.id} className="p-4 rounded-xl border border-black/5 dark:border-white/5 bg-zinc-50 dark:bg-zinc-900">
                  <h3 className="font-bold text-sm">{t.name}</h3>
                  {t.description && <p className="text-xs text-zinc-500 mt-1">{t.description}</p>}
                  {t.prizeAmount && <span className="text-xs text-yellow-500 font-medium mt-1 block">{t.prizeAmount}</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {challenge.rules && (
          <div className="mb-8">
            <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400 mb-3">Rules</h2>
            <div className="p-4 rounded-xl border border-black/5 dark:border-white/5 text-sm text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap">{challenge.rules}</div>
          </div>
        )}

        {challenge.judgingCriteria && (
          <div className="mb-8">
            <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400 mb-3">Judging Criteria</h2>
            <div className="p-4 rounded-xl border border-black/5 dark:border-white/5 text-sm text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap">{challenge.judgingCriteria}</div>
          </div>
        )}

        {challenge.winners.length > 0 && (
          <div className="mb-8">
            <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400 mb-3">Winners</h2>
            <div className="space-y-3">
              {challenge.winners.map((w) => (
                <div key={w.id} className="flex items-center gap-4 p-4 rounded-xl border border-yellow-500/20 bg-yellow-500/5">
                  <Trophy className="w-6 h-6 text-yellow-500 shrink-0" />
                  <div>
                    <div className="font-bold text-sm">{w.position} Place</div>
                    <div className="text-xs text-zinc-500">{w.teamEmail}{w.prizeAmount ? ` — ${w.prizeAmount}` : ""}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <Footer />
    </main>
  );
}
