import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { MemberWrapper } from "@/components/member/MemberWrapper";
import { CorePageHeader } from "@/components/core/CorePageHeader";
import { Layers, Heart, Eye, Plus } from "lucide-react";
import Link from "next/link";

export default async function MemberProjectsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/public?error=login_required");
  const role = (session.user as any)?.role;
  if (role !== "MEMBER" && role !== "CORE") redirect("/public?error=access_denied");

  const projects = await prisma.userProject.findMany({
    where: { teamEmails: { has: session.user.email }, deletedAt: null },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <MemberWrapper>
      <CorePageHeader title="My Projects" description="Manage your projects and track engagement." icon={<Layers />} backLink="/member" backText="Back to Dashboard" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {projects.map((p) => (
          <Link key={p.id} href={`/public/projects/${p.slug}`} className="p-5 rounded-xl border border-black/5 dark:border-white/5 hover:border-black/10 dark:hover:border-white/10 transition-colors group">
            {p.coverImage && <div className="h-32 rounded-lg overflow-hidden mb-3 bg-zinc-100 dark:bg-zinc-800"><img src={p.coverImage} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" /></div>}
            <h3 className="font-bold mb-1">{p.title}</h3>
            {p.description && <p className="text-zinc-500 text-sm line-clamp-2 mb-3">{p.description}</p>}
            <div className="flex items-center gap-4 text-xs text-zinc-400">
              <span className="flex items-center gap-1"><Heart className="w-3 h-3" />{p.likeCount}</span>
              <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{p.viewCount}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${p.status === "published" ? "bg-green-500/10 text-green-500" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"}`}>{p.status}</span>
            </div>
          </Link>
        ))}
      </div>
      {projects.length === 0 && <p className="text-zinc-400 text-sm text-center py-16">No projects yet.</p>}
    </MemberWrapper>
  );
}
