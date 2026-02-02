"use client";

import React, { useEffect, useState } from "react";
import { MotionIcon } from "motion-icons-react";
import Link from "next/link";

interface Announcement {
  id: string;
  title: string;
  link: string | null;
  audience: string;
  createdAt: string;
  expiresAt?: string | null;
}

interface AnnouncementsProps {
  audience?: "PUBLIC" | "MEMBER";
}

export function Announcements({ audience = "PUBLIC" }: AnnouncementsProps) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const res = await fetch(`/api/announcements?audience=${audience}`, { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          // Filter to max 6 and ensure they're not expired
          const now = new Date();
          const filtered = data
            .filter((a: Announcement) => !a.expiresAt || new Date(a.expiresAt) > now)
            .slice(0, 6);
          setAnnouncements(filtered);
        }
      } catch (error) {
        console.error("Failed to fetch announcements:", error);
      }
    };
    fetchAnnouncements();
  }, [audience]);

  if (!announcements.length) return null;

  return (
    <section id="announcements" className="py-8 my-2 relative z-30">
      <div className="max-w-4xl mx-auto px-4 md:px-8">
        <h2 className="text-sm font-bold mb-6 text-center text-zinc-500 uppercase tracking-widest">
            Latest Updates
        </h2>
        
        <div className="flex flex-wrap justify-center gap-4">
            {announcements.map((announcement) => (
                <Link 
                    key={announcement.id}
                    href={announcement.link || "/core/announcements"}
                    target={announcement.link?.startsWith('http') ? "_blank" : "_self"}
                    className="group flex items-center gap-3 px-4 py-2 bg-zinc-900/60 hover:bg-zinc-800/80 border border-white/10 backdrop-blur-2xl rounded-full transition-all duration-300 shadow-xl hover:shadow-white/5 w-full md:w-auto"
                >
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        <span className="text-zinc-200 text-[10px] font-bold uppercase tracking-wider min-w-fit">
                            New
                        </span>
                    </div>
                    <span className="text-sm text-zinc-300 group-hover:text-white transition-colors truncate">
                        {announcement.title}
                    </span>
                    <MotionIcon name="ArrowRight" className="w-3.5 h-3.5 text-zinc-500 group-hover:text-white group-hover:translate-x-1 transition-all ml-auto min-w-fit" />
                </Link>
            ))}
        </div>
      </div>
    </section>
  );
}
