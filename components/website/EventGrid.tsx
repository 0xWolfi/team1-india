"use client";

import React, { useState } from "react";
import { LumaEventData } from "@/lib/luma";
import Image from "next/image";
import { Search, MapPin, Calendar, ChevronDown } from "lucide-react";
import { CustomDatePicker } from "./CustomDatePicker";

interface EventGridProps {
  initialEvents: LumaEventData[];
}

export function EventGrid({ initialEvents }: EventGridProps) {
  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState("All Cities");
  const [selectedDate, setSelectedDate] = useState("");
  const [visibleCount, setVisibleCount] = useState(6);

  // Extract unique cities
  const cities = ["All Cities", ...Array.from(new Set(initialEvents.map(e => e.event.geo_address_json?.city).filter(Boolean)))];

  // Filtering Logic
  const filteredEvents = initialEvents.filter(item => {
    const matchesSearch = item.event.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCity = selectedCity === "All Cities" || item.event.geo_address_json?.city === selectedCity;
    
    let matchesDate = true;
    if (selectedDate) {
        const eventDate = new Date(item.event.start_at).toISOString().split('T')[0];
        matchesDate = eventDate === selectedDate;
    }

    return matchesSearch && matchesCity && matchesDate;
  });

  const displayedEvents = filteredEvents.slice(0, visibleCount);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-12">
      
      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row items-center justify-center gap-4 w-full max-w-3xl mx-auto">
        {/* Search */}
        <div className="relative w-full md:w-64 group">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <Search className="w-4 h-4 text-zinc-500 group-focus-within:text-white transition-colors" />
          </div>
          <input 
            type="text"
            placeholder="Search events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all"
          />
        </div>

        {/* City Filter */}
        <div className="relative w-full md:w-48 group">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <MapPin className="w-4 h-4 text-zinc-500 group-focus-within:text-white transition-colors" />
          </div>
          <select 
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            className="w-full pl-10 pr-10 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white appearance-none focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all cursor-pointer"
          >
            {cities.map(city => (
              <option key={city} value={city} className="bg-zinc-900 text-white">{city}</option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
            <ChevronDown className="w-4 h-4 text-zinc-600" />
          </div>
        </div>

         {/* Date Filter */}
         <CustomDatePicker 
            events={initialEvents}
            selectedDate={selectedDate}
            onChange={setSelectedDate}
         />
      </div>

      {/* Grid or Empty State */}
      {filteredEvents.length > 0 ? (
        <div className="flex flex-col items-center gap-10">
            <div className="flex flex-wrap justify-center gap-8 px-4">
              {displayedEvents.map(({ event, api_id }) => {
                 const fallbackGradient = "bg-gradient-to-br from-zinc-800 to-zinc-900";
                 return (
                    <a
                      key={api_id}
                      href={event.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group block w-full sm:w-[280px] md:w-[300px]"
                    >
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
            
            {visibleCount < filteredEvents.length && (
                <button
                    onClick={() => setVisibleCount((prev) => prev + 6)}
                    className="px-6 py-2 rounded-full border border-zinc-700 text-zinc-400 text-sm font-medium hover:bg-white/10 hover:border-white/50 hover:text-white transition-all"
                >
                    Show More Events
                </button>
            )}
        </div>
      ) : (
        /* Empty State */
        <div className="w-full max-w-3xl mx-auto h-64 border border-dashed border-white/10 bg-white/5 rounded-[32px] flex flex-col items-center justify-center text-center p-8 backdrop-blur-sm">
            <p className="text-zinc-500 text-lg">No events found matching your filters.</p>
        </div>
      )}


    </div>
  );
}
