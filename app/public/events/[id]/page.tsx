
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ArrowLeft, MapPin, Calendar, Clock, Share2, ExternalLink } from "lucide-react";
import { Footer } from "@/components/website/Footer";

async function getEvent(id: string) {
  // @ts-ignore
  return prisma.event.findUnique({
    where: { id },
    include: {
        createdBy: { select: { name: true, email: true } }
    }
  });
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

  const coverImage = (event.customFields as any)?.coverImage;

  return (
    <main className="min-h-screen bg-black text-white selection:bg-zinc-800 selection:text-zinc-200">
       {/* Hero Image / Header */}
       <div className="relative h-[50vh] w-full bg-zinc-900">
           {coverImage ? (
               <img src={coverImage} alt={event.title} className="w-full h-full object-cover opacity-60" />
           ) : (
                <div className="w-full h-full flex items-center justify-center bg-zinc-900 pattern-grid-lg">
                    <Calendar className="w-20 h-20 text-zinc-800" />
                </div>
           )}
           <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
           
           <div className="absolute bottom-0 left-0 w-full p-6 md:p-12 max-w-7xl mx-auto">
               <Link href="/public/events" className="inline-flex items-center gap-2 text-zinc-400 hover:text-white mb-6 transition-colors text-sm font-medium backdrop-blur-md bg-black/30 px-3 py-1.5 rounded-lg border border-white/5">
                   <ArrowLeft className="w-4 h-4" /> Back to Events
               </Link>
               <h1 className="text-4xl md:text-6xl font-bold mb-4 max-w-4xl leading-tight">{event.title}</h1>
               <div className="flex flex-wrap items-center gap-6 text-zinc-300 font-medium">
                   {event.date && (
                       <div className="flex items-center gap-2">
                           <Calendar className="w-5 h-5 text-indigo-400" />
                           {new Date(event.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                       </div>
                   )}
                   {event.date && (
                       <div className="flex items-center gap-2">
                            <Clock className="w-5 h-5 text-indigo-400" />
                           {new Date(event.date).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                       </div>
                   )}
                   {event.location && (
                       <div className="flex items-center gap-2">
                           <MapPin className="w-5 h-5 text-emerald-400" />
                           {event.location}
                       </div>
                   )}
               </div>
           </div>
       </div>

       <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-12">
                <section>
                    <h2 className="text-xl font-bold text-white mb-4">About Event</h2>
                    <div className="prose prose-invert max-w-none text-zinc-400 leading-relaxed whitespace-pre-wrap">
                        {event.description || "No description provided."}
                    </div>
                </section>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
                <div className="p-6 rounded-2xl bg-zinc-900/50 border border-white/10 backdrop-blur-sm sticky top-24">
                    <h3 className="text-lg font-bold text-white mb-6">Event Details</h3>
                    
                    <div className="space-y-4 mb-8">
                        <div className="flex items-start gap-3">
                            <div className="p-2 rounded-lg bg-zinc-800 text-zinc-400">
                                <Calendar className="w-5 h-5" />
                            </div>
                            <div>
                                <div className="text-sm font-bold text-zinc-300">Date</div>
                                <div className="text-sm text-zinc-500">{event.date ? new Date(event.date).toLocaleDateString() : 'TBA'}</div>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="p-2 rounded-lg bg-zinc-800 text-zinc-400">
                                <MapPin className="w-5 h-5" />
                            </div>
                            <div>
                                <div className="text-sm font-bold text-zinc-300">Location</div>
                                <div className="text-sm text-zinc-500">{event.location || 'Online / TBA'}</div>
                            </div>
                        </div>
                    </div>

                    <button className="w-full py-3.5 bg-white text-black font-bold rounded-xl hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2">
                        Register Now <ExternalLink className="w-4 h-4" />
                    </button>
                    <p className="text-xs text-center text-zinc-600 mt-3">
                        External registration may be required.
                    </p>
                </div>

                <div className="p-6 rounded-2xl border border-white/5">
                    <h3 className="text-sm font-bold text-zinc-400 mb-4 uppercase tracking-wider">Hosted By</h3>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold border border-indigo-500/20">
                            {event.createdBy?.name?.[0] || 'T'}
                        </div>
                        <div>
                            <div className="font-bold text-white">{event.createdBy?.name || 'Team 1'}</div>
                            <div className="text-xs text-zinc-500">Organizer</div>
                        </div>
                    </div>
                </div>
            </div>
       </div>

      <Footer />
    </main>
  );
}
