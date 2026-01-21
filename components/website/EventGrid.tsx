"use client";

import React, { useState } from "react";
import { LumaEventData } from "@/lib/luma";
import Image from "next/image";

interface EventGridProps {
  initialEvents: LumaEventData[];
}

export function EventGrid({ initialEvents }: EventGridProps) {
  // Pagination State
  const [visibleCount, setVisibleCount] = useState(6);

  const displayedEvents = initialEvents.slice(0, visibleCount);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-12">
      {/* Centered Flex Layout */}
      {displayedEvents.length > 0 ? (
        <div className="flex flex-col items-center gap-10">
            <div className="flex flex-wrap justify-center gap-8 px-4">
              {displayedEvents.map(({ event, api_id }) => {
                 // Fallback gradient if no image
                 const fallbackGradient = "bg-gradient-to-br from-zinc-800 to-zinc-900";
                 
                 return (
                    <a
                      key={api_id}
                      href={event.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group block w-full sm:w-[280px] md:w-[300px]"
                    >
                      {/* Image Container */}
                      <div className={`relative aspect-square overflow-hidden rounded-3xl border border-white/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] bg-zinc-900/60 backdrop-blur-2xl transition-all duration-500 group-hover:border-white/30 group-hover:shadow-2xl group-hover:shadow-white/5 group-hover:-translate-y-2 mb-5 ${!event.cover_url ? fallbackGradient : ''}`}>
                        {event.cover_url && (
                          <Image
                            src={event.cover_url}
                            alt={event.name}
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            className="object-cover transition-transform duration-700 group-hover:scale-110"
                          />
                        )}
                      </div>

                      {/* Content Below */}
                      <div className="space-y-2 text-center">
                        <h3 className="text-xl font-bold text-white leading-tight line-clamp-2 group-hover:text-zinc-200 transition-colors">
                          {event.name}
                        </h3>
                        <p className="text-sm text-zinc-500 font-medium tracking-wide uppercase">
                             {new Date(event.start_at).toLocaleDateString('en-GB', { month: 'long', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                    </a>
                );
              })}
            </div>
            
            {visibleCount < initialEvents.length && (
                <button
                    onClick={() => setVisibleCount((prev) => prev + 6)}
                    className="px-6 py-2 rounded-full border border-zinc-700 text-zinc-400 text-sm font-medium hover:bg-white/10 hover:border-white/50 hover:text-white transition-all"
                >
                    Show More Events
                </button>
            )}
        </div>
      ) : null}

      {/* See All Button - Only show if there are events */}
      {initialEvents.length > 0 && (
        <div className="flex justify-center pt-8">
          <a 
            href="https://lu.ma/Team1India" 
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-black font-bold hover:bg-zinc-200 hover:text-black transition-all shadow-lg shadow-white/10 hover:shadow-white/20"
          >
   <span className="block transition-transform duration-200 group-hover:scale-110">See All Events</span>
            <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </a>
        </div>
      )}
    </div>
  );
}
