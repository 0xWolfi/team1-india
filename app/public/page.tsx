import { Suspense } from "react";
import Link from "next/link";
import { AccessDeniedHandler } from "@/components/auth/AccessDeniedHandler";
import { Navbar } from "@/components/website/Navbar";
import { Footer } from "@/components/website/Footer";
import { prisma } from "@/lib/prisma";
import { ArrowRight, FileText, Calendar, Users, Briefcase } from "lucide-react";

// Server Data Fetching
async function getPublicData() {
  const [guides, partners, projects, members, settings] = await Promise.all([
    // @ts-ignore
    prisma.guide.findMany({
      where: { visibility: "PUBLIC" },
      orderBy: { createdAt: "desc" }
    }),
    // @ts-ignore
    prisma.partner.findMany({
      where: { visibility: "PUBLIC", status: "active" },
      orderBy: { name: "asc" }
    }),
     // @ts-ignore
    prisma.project.findMany({
      where: { visibility: "PUBLIC", status: { in: ["active", "completed"] } },
      orderBy: { name: "asc" }
    }),
    // @ts-ignore
    prisma.communityMember.findMany({
      where: { status: "active" },
      orderBy: { name: "asc" },
      select: { name: true, tags: true, email: true } // Limit fields
    }),
    prisma.systemSettings.findMany({
        where: { deletedAt: null }
    })
  ]);

   // Convert settings array to map
   const settingsMap = settings.reduce((acc: Record<string, string>, curr: any) => {
        acc[curr.key] = curr.value;
        return acc;
    }, {} as Record<string, string>);

  return { guides, partners, projects, members, settings: settingsMap };
}

export const dynamic = 'force-dynamic';

export default async function PublicPage() {
  const { guides, partners, projects, members, settings } = await getPublicData();

  const showPartners = settings["SHOW_PARTNERS_SECTION"] !== "false"; // Default true
  const showProjects = settings["SHOW_PROJECTS_SECTION"] !== "false"; // Default true
  const showMembers = settings["SHOW_MEMBER_DIRECTORY"] !== "false"; // Default true

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-zinc-800">
      <Navbar />
      
      <main className="pt-24 pb-20 px-6 max-w-7xl mx-auto space-y-24">
        
        {/* Hero Section */}
        <section className="text-center space-y-6">
            <Suspense fallback={null}>
                <AccessDeniedHandler />
            </Suspense>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tighter bg-gradient-to-b from-white to-zinc-500 bg-clip-text text-transparent pb-2">
                Public Directory
            </h1>
            <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
                Explore our community resources, partners, and members. Join us to unlock full access to experiments, media, and more.
            </p>
            <div className="flex justify-center gap-4 pt-4">
                <Link href="/#involved" className="px-6 py-3 bg-white text-black font-bold rounded-full hover:bg-zinc-200 transition-colors">
                    Apply for Membership
                </Link>
                <Link href="/access-check" className="px-6 py-3 bg-white/5 border border-white/10 text-white font-bold rounded-full hover:bg-white/10 transition-colors">
                    Member Login
                </Link>
            </div>
        </section>

        {/* Resources Grid */}
        <section className="space-y-8">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                    <FileText className="w-5 h-5 text-zinc-400" /> Public Resources
                </h2>
            </div>
            {guides.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {guides.map((guide: any) => (
                        <Link key={guide.id} href={`/public/guides/${guide.id}`} className="group block p-6 rounded-2xl bg-zinc-900/50 border border-white/5 hover:border-white/20 transition-all">
                            <div className="flex justify-between items-start mb-4">
                                <span className="px-2 py-1 rounded-md bg-white/5 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                                    {guide.type}
                                </span>
                                <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-white transition-colors" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">{guide.title}</h3>
                            <div className="flex gap-2 flex-wrap">
                                {guide.audience.map((tag: string) => (
                                    <span key={tag} className="text-xs text-zinc-500">#{tag}</span>
                                ))}
                            </div>
                        </Link>
                    ))}
                </div>
            ) : (
                <p className="text-zinc-500 italic">No public resources available yet.</p>
            )}
        </section>

        {/* Partners Grid */}
        {showPartners && (
        <section className="space-y-8">
             <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-zinc-400" /> Community Partners
                </h2>
            </div>
            {partners.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                    {partners.map((partner: any) => (
                        <div key={partner.id} className="group relative p-6 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all flex flex-col items-center justify-center gap-4 text-center">
                            {partner.logo ? (
                                <img src={partner.logo} alt={partner.name} className="h-12 w-auto object-contain opacity-70 group-hover:opacity-100 transition-opacity" />
                            ) : (
                                <div className="h-12 w-12 rounded-full bg-white/10 flex items-center justify-center">
                                    <span className="text-lg font-bold text-zinc-500">{partner.name[0]}</span>
                                </div>
                            )}
                            <div>
                                <h4 className="font-bold text-sm text-zinc-300 group-hover:text-white">{partner.name}</h4>
                                <div className="flex gap-2 justify-center mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {partner.website && <Link href={partner.website} target="_blank" className="text-xs text-blue-400 hover:underline">Web</Link>}
                                    {partner.twitter && <Link href={partner.twitter} target="_blank" className="text-xs text-blue-400 hover:underline">X</Link>}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-zinc-500 italic">No partners listed publicly.</p>
            )}
        </section>
        )}

        {/* Projects Grid */}
        {showProjects && (
        <section className="space-y-8">
             <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-zinc-400" /> Featured Projects
                </h2>
            </div>
            {projects.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {projects.map((project: any) => (
                        <div key={project.id} className="group p-6 rounded-xl bg-zinc-900 border border-white/5">
                             <div className="flex items-center gap-4 mb-4">
                                {project.logo ? (
                                    <img src={project.logo} alt={project.name} className="w-10 h-10 rounded-lg object-cover" />
                                ) : (
                                    <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center">
                                        <span className="font-bold text-zinc-500">{project.name[0]}</span>
                                    </div>
                                )}
                                <div>
                                    <h4 className="font-bold text-white">{project.name}</h4>
                                    <span className="text-xs text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full uppercase tracking-wider">{project.status}</span>
                                </div>
                             </div>
                             <div className="flex gap-4 mt-4 text-xs font-medium text-zinc-400">
                                {project.website && (
                                    <Link href={project.website} target="_blank" className="hover:text-white flex items-center gap-1">
                                        Website <ArrowRight className="w-3 h-3" />
                                    </Link>
                                )}
                             </div>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-zinc-500 italic">No public projects available.</p>
            )}
        </section>
        )}

        {/* Members List */}
        {showMembers && (
        <section className="space-y-8">
             <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Users className="w-5 h-5 text-zinc-400" /> Community Members
                </h2>
            </div>
            
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-white/10 text-xs font-bold text-zinc-500 uppercase tracking-wider">
                            <th className="py-4 pr-6">Name</th>
                            <th className="py-4 pr-6">Role / Tags</th>
                            <th className="py-4 pr-6">Contact</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {members.map((member: any) => (
                            <tr key={member.email} className="group hover:bg-white/5 transition-colors">
                                <td className="py-4 pr-6 font-medium text-zinc-300 group-hover:text-white">
                                    {member.name || "Anonymous"}
                                </td>
                                <td className="py-4 pr-6">
                                    <div className="flex gap-2 flex-wrap">
                                        {member.tags.map((tag: string) => (
                                            <span key={tag} className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] text-zinc-400">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </td>
                                <td className="py-4 pr-6 text-sm text-zinc-500">
                                    {/* Obfuscated email or minimal contact info */}
                                    <span className="opacity-50 hover:opacity-100 cursor-pointer" title={member.email}>
                                        Email
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {members.length === 0 && (
                    <p className="py-8 text-center text-zinc-500 italic">No active members found.</p>
                )}
            </div>
        </section>
        )}

      </main>
      <Footer />
    </div>
  );
}
