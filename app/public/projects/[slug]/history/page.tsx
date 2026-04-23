import Link from "next/link";
import { ArrowLeft, GitCommit } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Footer } from "@/components/website/Footer";

export default async function ProjectHistoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const project = await prisma.userProject.findFirst({
    where: { slug, deletedAt: null },
    select: { id: true, title: true, slug: true, version: true },
  });
  if (!project) notFound();

  const versions = await prisma.projectVersion.findMany({
    where: { projectId: project.id },
    orderBy: { versionNum: "desc" },
  });

  return (
    <main className="min-h-screen text-black dark:text-white selection:bg-zinc-200 dark:selection:bg-zinc-800">
      <div className="pt-24 px-6 max-w-4xl mx-auto pb-20">
        <Link href={`/public/projects/${slug}`} className="flex items-center gap-2 text-zinc-500 hover:text-black dark:hover:text-white mb-8 transition-colors w-fit text-sm font-medium">
          <ArrowLeft className="w-4 h-4" /> Back to {project.title}
        </Link>

        <div className="mb-12">
          <h1 className="text-3xl font-bold mb-2">Version History</h1>
          <p className="text-zinc-500 text-sm">Current version: v{project.version}</p>
        </div>

        <div className="space-y-0">
          {versions.map((v, i) => (
            <div key={v.id} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-black/10 dark:border-white/10 flex items-center justify-center shrink-0">
                  <GitCommit className="w-4 h-4 text-zinc-500" />
                </div>
                {i < versions.length - 1 && <div className="w-px flex-1 bg-zinc-200 dark:bg-zinc-800" />}
              </div>
              <div className="pb-8 flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-sm font-bold">v{v.versionNum}</span>
                  <span className="text-xs text-zinc-400">{new Date(v.createdAt).toLocaleDateString()}</span>
                </div>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">{v.changes || "Updated project"}</p>
                <p className="text-xs text-zinc-400 mt-1">by {v.createdBy}</p>
              </div>
            </div>
          ))}
          {versions.length === 0 && (
            <p className="text-zinc-400 text-sm text-center py-10">No version history yet.</p>
          )}
        </div>
      </div>
      <Footer />
    </main>
  );
}
