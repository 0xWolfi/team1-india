"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  Users,
  ExternalLink,
  Github,
  Twitter,
} from "lucide-react";
import { FloatingNav } from "@/components/public/FloatingNav";
import { Footer } from "@/components/website/Footer";

interface TeamMember {
  team1Id: string;
  firstName: string;
  city: string | null;
  primaryRole: string | null;
  isCaptain: boolean;
  twitterHandle: string | null;
  githubHandle: string | null;
}

interface PublicTeam {
  id: string;
  team1Id: string;
  memberCount: number;
  members: TeamMember[];
}

interface ProjectCard {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  coverImage: string | null;
  speedrunTrack: { id: string; name: string } | null;
  team: { id: string; team1Id: string } | null;
}

export default function TeamPageClient({
  runSlug,
  team1Id,
}: {
  runSlug: string;
  team1Id: string;
}) {
  const [team, setTeam] = useState<PublicTeam | null>(null);
  const [projects, setProjects] = useState<ProjectCard[]>([]);
  const [runLabel, setRunLabel] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/speedrun/runs/${encodeURIComponent(runSlug)}/public`, { cache: "no-store" })
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => {
        setRunLabel(data.run?.monthLabel ?? "");
        const match = data.teams?.find(
          (t: PublicTeam) => t.team1Id.toUpperCase() === team1Id.toUpperCase()
        );
        if (!match) {
          setError("Team not found");
          return;
        }
        setTeam(match);
        // Filter the run's projects down to the ones submitted by THIS team.
        const projectsForTeam = (data.projects || []).filter(
          (p: ProjectCard) => p.team?.team1Id?.toUpperCase() === team1Id.toUpperCase()
        );
        setProjects(projectsForTeam);
      })
      .catch((e: Error) => setError(e.message || "Failed to load team"))
      .finally(() => setLoading(false));
  }, [runSlug, team1Id]);

  return (
    <main className="relative min-h-[100svh] bg-[var(--background)] text-black dark:text-white overflow-x-hidden">
      <FloatingNav />

      <section className="relative pt-28 sm:pt-32 pb-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 md:px-8">
          <Link
            href={`/speedrun/${encodeURIComponent(runSlug)}`}
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-500 hover:text-red-500 transition-colors mb-6"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to {runLabel || "run"}
          </Link>

          {loading ? (
            <div className="text-center text-sm text-zinc-500 py-12">
              <Loader2 className="w-5 h-5 animate-spin mx-auto mb-3" />
              Loading team...
            </div>
          ) : error || !team ? (
            <div className="text-center text-sm">
              <p className="text-red-500 font-semibold mb-1">Team not found</p>
              <p className="text-zinc-500">{error}</p>
            </div>
          ) : (
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-red-500 mb-2">
                Team1 ID
              </p>
              <h1
                className="font-black italic tracking-tighter leading-[0.85] text-red-500 mb-3"
                style={{ fontSize: "clamp(2.5rem, 8vw, 5rem)" }}
              >
                {team.team1Id}
              </h1>
              <p className="text-sm text-zinc-500">
                {team.memberCount} member{team.memberCount === 1 ? "" : "s"}
                {runLabel ? ` · ${runLabel}` : ""}
              </p>

              <section className="mt-10 rounded-2xl border border-red-500/15 bg-white/40 dark:bg-zinc-950/40 p-5 sm:p-6">
                <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-red-500 mb-4">
                  Members
                </h2>
                <ul className="space-y-3">
                  {team.members.map((m, i) => (
                    <li
                      key={i}
                      className="flex items-center gap-3 px-3 py-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.02]"
                    >
                      <div className="w-8 h-8 rounded-full bg-red-500/15 text-red-500 inline-flex items-center justify-center text-sm font-bold">
                        {m.firstName?.[0]?.toUpperCase() || "?"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold text-black dark:text-white">
                            {m.firstName || "Anon"}
                          </span>
                          {m.isCaptain && (
                            <span className="text-[10px] font-bold uppercase tracking-widest text-red-500">
                              Captain
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-zinc-500">
                          {m.primaryRole && <span>{m.primaryRole}</span>}
                          {m.city && (
                            <>
                              <span>·</span>
                              <span>{m.city}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {m.twitterHandle && (
                          <a
                            href={`https://x.com/${m.twitterHandle}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-8 h-8 rounded-lg bg-black/5 dark:bg-white/5 text-zinc-500 hover:text-red-500 inline-flex items-center justify-center transition-colors"
                          >
                            <Twitter className="w-3.5 h-3.5" />
                          </a>
                        )}
                        {m.githubHandle && (
                          <a
                            href={`https://github.com/${m.githubHandle}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-8 h-8 rounded-lg bg-black/5 dark:bg-white/5 text-zinc-500 hover:text-red-500 inline-flex items-center justify-center transition-colors"
                          >
                            <Github className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </section>

              {projects.length > 0 && (
                <section className="mt-8">
                  <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-red-500 mb-4">
                    Submitted projects
                  </h2>
                  <div className="space-y-3">
                    {projects.map((p) => (
                      <Link
                        key={p.id}
                        href={`/public/projects/${encodeURIComponent(p.slug)}`}
                        className="flex items-center gap-3 p-4 rounded-xl border border-red-500/15 bg-white/40 dark:bg-zinc-950/40 hover:border-red-500/40 transition-colors"
                      >
                        <div className="w-10 h-10 rounded-lg bg-red-500/10 text-red-500 inline-flex items-center justify-center">
                          <ExternalLink className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-sm text-black dark:text-white truncate">
                            {p.title}
                          </div>
                          {p.description && (
                            <div className="text-xs text-zinc-500 line-clamp-1">{p.description}</div>
                          )}
                        </div>
                        {p.speedrunTrack && (
                          <span className="text-[10px] font-bold uppercase tracking-widest text-red-500">
                            {p.speedrunTrack.name}
                          </span>
                        )}
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              <section className="mt-10 flex items-center gap-3 text-zinc-500">
                <Users className="w-4 h-4" />
                <p className="text-xs">
                  Member emails are private. Socials shown only when teammates opt in.
                </p>
              </section>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}
