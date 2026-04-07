"use client";

import React, { useState } from "react";
import NextImage from "next/image";
import { LumaEventData } from "@/lib/luma";
import { Calendar, ChevronDown, MapPin, Search } from "lucide-react";
import { CustomDatePicker } from "./CustomDatePicker";

interface EventGridProps {
  initialEvents: LumaEventData[];
}

export function EventGrid({ initialEvents }: EventGridProps) {
  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState("All Cities");
  const [selectedDate, setSelectedDate] = useState("");
  // Extract unique cities
  const cities = ["All Cities", ...Array.from(new Set(initialEvents.map(e => e.event.geo_address_json?.city).filter(Boolean)))];

  // Filtering Logic
  const filteredEvents = initialEvents
    .filter(item => {
      const matchesSearch = item.event.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCity = selectedCity === "All Cities" || item.event.geo_address_json?.city === selectedCity;
      let matchesDate = true;
      if (selectedDate) {
        const eventDate = new Date(item.event.start_at).toISOString().split('T')[0];
        matchesDate = eventDate === selectedDate;
      }
      return matchesSearch && matchesCity && matchesDate;
    })
    .sort((a, b) => new Date(a.event.start_at).getTime() - new Date(b.event.start_at).getTime());

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      
      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row items-center justify-center gap-4 w-full max-w-3xl mx-auto">
        {/* Search */}
        <div className="relative w-full md:w-64 group">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <Search className="w-4 h-4 text-zinc-500 group-focus-within:text-white transition-colors"/>
          </div>
          <input
            type="text"
            placeholder="Search events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl text-sm text-black dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:border-black/30 dark:focus:border-white/30 focus:bg-black/10 dark:focus:bg-white/10 transition-all"
          />
        </div>

        {/* City Filter */}
        <div className="relative w-full md:w-48 group">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <MapPin className="w-4 h-4 text-zinc-500 group-focus-within:text-white transition-colors"/>
          </div>
          <select
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            className="w-full pl-10 pr-10 py-2.5 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl text-sm text-black dark:text-white appearance-none focus:outline-none focus:border-black/30 dark:focus:border-white/30 focus:bg-black/10 dark:focus:bg-white/10 transition-all cursor-pointer"
          >
            {cities.map(city => (
              <option key={city} value={city} className="bg-white dark:bg-zinc-900 text-black dark:text-white">{city}</option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
            <ChevronDown className="w-4 h-4 text-zinc-600"/>
          </div>
        </div>

         {/* Date Filter */}
         <CustomDatePicker 
            events={initialEvents}
            selectedDate={selectedDate}
            onChange={setSelectedDate}
         />
      </div>

      {filteredEvents.length > 0 ? (
        <div className="flex flex-col items-center gap-10">
            {/* Horizontal scroll: all event cards */}
            <div className="w-full px-4">
                <div className="overflow-x-auto overflow-y-hidden pb-4 -mx-4 px-4 md:mx-0 md:px-0" style={{ scrollSnapType: "x mandatory" }}>
                  <div className="flex gap-4 sm:gap-8 justify-center min-w-0">
                    {filteredEvents.map(({ event, api_id }) => {
                      const fallbackGradient = "bg-gradient-to-br from-zinc-200 to-zinc-300 dark:from-zinc-800 dark:to-zinc-900";
                      return (
                        <a
                          key={api_id}
                          href={event.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group block shrink-0 w-[220px] sm:w-[260px] snap-center"
                        >
                            <div className={`relative aspect-square overflow-hidden rounded-3xl border border-black/10 dark:border-white/10 shadow-[inset_0_1px_0_0_rgba(0,0,0,0.03)] dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] bg-zinc-100/60 dark:bg-zinc-900/60 backdrop-blur-2xl transition-all duration-500 group-hover:border-black/30 dark:group-hover:border-white/30 group-hover:shadow-2xl group-hover:shadow-black/5 dark:group-hover:shadow-white/5 group-hover:-translate-y-2 mb-5 ${!event.cover_url ? fallbackGradient : ''}`}>
                              {event.cover_url ? (
                                <NextImage
                                  src={event.cover_url}
                                  alt={event.name}
                                  fill
                                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                                />
                              ) : (
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <Calendar className="w-12 h-12 text-zinc-400 dark:text-zinc-600"/>
                                </div>
                              )}
                            </div>
                          <div className="space-y-2 text-center">
                            <h3 className="text-xl font-bold text-black dark:text-white leading-tight line-clamp-2 group-hover:text-zinc-700 dark:group-hover:text-zinc-200 transition-colors">
                              {event.name}
                            </h3>
                            <p className="text-sm text-zinc-500 font-medium tracking-wide uppercase">
                              {new Date(event.start_at).toLocaleDateString("en-GB", { month: "long", day: "numeric", year: "numeric" })}
                            </p>
                          </div>
                        </a>
                      );
                    })}
                  </div>
                </div>
            </div>
            {/* More Events button */}
            <a
              href="/events"
              className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-black/8 dark:bg-white/8 border border-black/12 dark:border-white/12 text-black dark:text-white font-semibold text-sm tracking-wide uppercase transition-all duration-300 hover:bg-red-500 hover:border-red-500 hover:text-white hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(239,68,68,0.3)]"
            >
              More Events
            </a>
        </div>
      ) : (
        /* Empty State */
        <div className="w-full max-w-3xl mx-auto h-64 border border-dashed border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 rounded-[32px] flex flex-col items-center justify-center text-center p-8 backdrop-blur-sm">
            <p className="text-zinc-500 text-lg">No events found matching your filters.</p>
        </div>
      )}


    </div>
  );
}
