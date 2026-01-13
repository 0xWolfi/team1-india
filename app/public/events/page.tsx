
import { Suspense } from "react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ArrowLeft, Search, LayoutGrid, List as ListIcon, Calendar, ChevronDown, MapPin } from "lucide-react";
import { Footer } from "@/components/website/Footer";

async function getEvents() {
  const guides = await prisma.guide.findMany({
    where: { 
        visibility: "PUBLIC",
        type: "EVENT",
        deletedAt: null
    },
    orderBy: { createdAt: "asc" }, // Guides don't have top-level date, sorting by createdAt or body date if possible? Prisma can't sort by json field easily.
    // For now sort by createdAt or fetch all and sort in JS.
    select: { 
      id: true, 
      title: true, 
      body: true,
      coverImage: true,
      createdAt: true,
      createdBy: {
        select: {
          name: true
        }
      }
    },
  });

  return guides.map((g: any) => ({
      id: g.id,
      title: g.title,
      description: g.body?.description || "",
      date: g.body?.date || g.createdAt,
      location: g.body?.location || "",
      coverImage: g.coverImage,
      createdAt: g.createdAt,
      createdBy: g.createdBy
  })); // We can add .sort() here if needed based on date
}

function TimeAgo({ date }: { date: Date }) {
    const d = new Date(date);
    const now = new Date();
    const diff = Math.floor((now.getTime() - d.getTime()) / 1000); 
    
    let text = "";
    if (diff < 60) text = "just now";
    else if (diff < 3600) text = `${Math.floor(diff / 60)}m ago`;
    else if (diff < 86400) text = `${Math.floor(diff / 3600)}h ago`;
    else text = `${Math.floor(diff / 86400)}d ago`;
    
    return <span>{text}</span>;
}

export default async function PublicEventsPage() {
  const events = await getEvents();

  return (
    <main className="min-h-screen bg-black text-white selection:bg-zinc-800 selection:text-zinc-200">
      
      <div className="pt-24 px-6 max-w-7xl mx-auto pb-20">
        
        {/* Back Link */}
        <Link href="/public" className="flex items-center gap-2 text-zinc-500 hover:text-white mb-8 transition-colors w-fit text-sm font-medium">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
            <div>
                <h1 className="text-3xl md:text-4xl font-bold mb-3 flex items-center gap-3">
                     <span className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center border border-white/10">
                        <Calendar className="w-4 h-4 text-zinc-400" />
                     </span>
                     Events
                </h1>
                <p className="text-zinc-500 text-sm md:text-base max-w-2xl leading-relaxed">
                    Join us for meetups, workshops, and hackathons around the globe.
                </p>
            </div>
        </div>
            
        {/* Search & Filter Bar */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-white transition-colors" />
                <input 
                    type="text" 
                    placeholder="Search events..." 
                    className="w-full pl-11 pr-4 py-2.5 bg-zinc-900/50 border border-white/10 rounded-xl text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/20 focus:bg-zinc-900 transition-all"
                />
            </div>
            <div className="flex items-center gap-2">
                <button className="flex items-center gap-2 px-3 py-2.5 bg-zinc-900/50 border border-white/10 rounded-xl text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all">
                    <LayoutGrid className="w-4 h-4" /> 
                    <span>All Views</span>
                    <ChevronDown className="w-3 h-3 opacity-50" />
                </button>
                <div className="flex items-center bg-zinc-900/50 border border-white/10 rounded-xl p-1">
                    <button className="p-1.5 rounded-lg bg-zinc-800 text-white shadow-sm">
                        <LayoutGrid className="w-4 h-4" />
                    </button>
                    <button className="p-1.5 rounded-lg text-zinc-500 hover:text-white transition-colors">
                        <ListIcon className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>

        {/* Vertical List */}
        <div className="flex flex-col gap-6">
          {events.map((item: any) => (
            <Link key={item.id} href={`/public/events/${item.id}`} className="block bg-zinc-950 border border-white/10 rounded-3xl overflow-hidden hover:border-white/20 transition-all flex flex-row h-auto group relative">
                    
                    {/* Image Section */}
                    <div className="w-64 h-48 bg-zinc-900 relative shrink-0">
                        {item.coverImage ? (
                            <img src={item.coverImage} alt={item.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-zinc-900">
                                <div className="p-4 rounded-full bg-white/5 mx-auto">
                                    <Calendar className="w-8 h-8 text-zinc-700" />
                                </div>
                            </div>
                        )}
                        <div className="absolute top-4 right-4">
                            <span className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-black/60 border border-white/10 backdrop-blur-md text-[10px] font-bold text-white uppercase tracking-wider">
                                {item.date ? new Date(item.date).toLocaleDateString() : 'TBA'}
                            </span>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-5 flex flex-col flex-1 bg-zinc-950">
                        <div className="flex items-start justify-between gap-4 mb-2">
                            <h3 className="font-bold text-white text-base line-clamp-1">{item.title}</h3>
                            <span className="shrink-0 px-2 py-1 rounded-lg border border-white/10 text-[10px] font-bold text-zinc-500 uppercase tracking-wider group-hover:bg-white text-white group-hover:text-black transition-all">
                                Open &rarr;
                            </span>
                        </div>
                        
                        {item.location && (
                            <div className="flex items-center gap-1.5 text-zinc-400 text-xs font-medium mb-3">
                                <MapPin className="w-3.5 h-3.5" />
                                {item.location}
                            </div>
                        )}

                        <p className="text-sm text-zinc-500 line-clamp-2 leading-relaxed mb-4 flex-1">
                            {item.description || "No description provided."}
                        </p>
                        
                        <div className="mt-auto flex items-center justify-between text-xs text-zinc-600 border-t border-white/5 pt-4">
                            <span>by <span className="text-zinc-400">{item.createdBy?.name || 'Team 1'}</span></span>
                            <TimeAgo date={item.createdAt} />
                        </div>
                    </div>
              </Link>
            ))}
          </div>
        
        {events.length === 0 && (
            <div className="py-32 text-center border-2 border-dashed border-white/5 rounded-3xl">
                <p className="text-zinc-500">No upcoming events found.</p>
            </div>
        )}

      </div>
      <Footer />
    </main>
  );
}
