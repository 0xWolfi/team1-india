import React from "react";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Announcement } from "@prisma/client";

interface AnnouncementsProps {
  audience?: "PUBLIC" | "MEMBER";
}

export async function Announcements({ audience = "PUBLIC" }: AnnouncementsProps) {
  let whereClause: any = {};
  if (audience === 'PUBLIC') {
      whereClause = {
          OR: [
              { audience: 'PUBLIC' },
              { audience: 'ALL' }
          ]
      };
  } else if (audience === 'MEMBER') {
       whereClause = {
          OR: [
              { audience: 'MEMBER' },
              { audience: 'ALL' }
          ]
      };
  }

  let announcements: Announcement[] = [];
  try {
      // Add expiration filter
      whereClause.OR = [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }
      ];

      announcements = await prisma.announcement.findMany({
          where: whereClause,
          orderBy: { createdAt: 'desc' },
          take: 6
      });
  } catch (error) {
      console.error("Failed to fetch announcements:", error);
      return null;
  }

  if (!announcements.length) return null;

  return (
    <section id="announcements" className="py-8 my-2">
      <div className="max-w-5xl mx-auto px-4 md:px-8">
        <h2 className="text-xl font-bold mb-6 text-center bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-500">
            Latest Updates
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {announcements.map((announcement) => (
                <Link 
                    key={announcement.id}
                    href={announcement.link || "/core/announcements"}
                    target={announcement.link?.startsWith('http') ? "_blank" : "_self"}
                    className="group flex items-center gap-3 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/10 backdrop-blur-md rounded-full transition-all duration-300 shadow-[0_0_20px_rgba(255,255,255,0.05)]"
                >
                    <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 text-[10px] font-bold uppercase tracking-wider min-w-fit">
                        {announcement.audience === 'ALL' ? 'Update' : 'New'}
                    </span>
                    <span className="text-sm text-zinc-300 group-hover:text-white transition-colors truncate">
                        {announcement.title}
                    </span>
                    <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-white group-hover:translate-x-1 transition-all ml-auto min-w-fit" />
                </Link>
            ))}
        </div>
      </div>
    </section>
  );
}
