"use client";

import React, { useState, useMemo } from "react";
import { LumaEventData } from "@/lib/luma";

interface EventGridProps {
  initialEvents: LumaEventData[];
}

export function EventGrid({ initialEvents }: EventGridProps) {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // Extract unique cities for the filter dropdown
  const cities = useMemo(() => {
    const allCities = initialEvents
      .map((e) => e.event.geo_address_json?.city)
      .filter((city): city is string => !!city); // Filter out undefined/null
    return Array.from(new Set(allCities)).sort();
  }, [initialEvents]);

  // Filter logic
  const filteredEvents = useMemo(() => {
    return initialEvents.filter((e) => {
      const eventDate = new Date(e.event.start_at);
      const eventCity = e.event.geo_address_json?.city || "";
      const eventName = e.event.name || "";

      // Search Filter
      if (searchQuery && !eventName.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }

      // City Filter
      if (selectedCity && eventCity !== selectedCity) return false;

      // Date Range Filter
      if (startDate) {
        const start = new Date(startDate);
        if (eventDate < start) return false;
      }
      if (endDate) {
        const end = new Date(endDate);
        // Set end date to end of day to include events on that day
        end.setHours(23, 59, 59, 999);
        if (eventDate > end) return false;
      }

      return true;
    });
  }, [initialEvents, searchQuery, selectedCity, startDate, endDate]);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-12">
      {/* Sleek Filters */}
      <div className="relative z-20 flex flex-col md:flex-row gap-2 items-center justify-center bg-zinc-900/80 backdrop-blur-xl border border-white/10 p-1.5 rounded-xl w-fit mx-auto shadow-2xl shadow-black/50 transition-all hover:border-white/20">
        <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search events..."
            autoComplete="off"
            className="bg-white/5 border border-transparent rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:bg-white/10 focus:ring-1 focus:ring-white/20 w-full md:w-64 placeholder:text-zinc-500 transition-all"
        />

        <div className="h-6 w-px bg-white/10 hidden md:block" />

        <select
          value={selectedCity}
          onChange={(e) => setSelectedCity(e.target.value)}
          className="bg-white/5 border border-transparent rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:bg-white/10 focus:ring-1 focus:ring-white/20 cursor-pointer transition-all"
        >
          <option value="">All Cities</option>
          {cities.map((city) => (
            <option key={city} value={city} className="bg-zinc-900">
              {city}
            </option>
          ))}
        </select>

        <div className="h-6 w-px bg-white/10 hidden md:block" />

        <div className="flex items-center gap-2 text-sm text-zinc-400 bg-white/5 rounded-lg px-3 py-1.5 border border-transparent focus-within:bg-white/10 focus-within:ring-1 focus-within:ring-white/20 transition-all">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="bg-transparent border-none text-white text-sm focus:outline-none p-0 w-24 placeholder:text-zinc-600"
            placeholder="Start Date"
          />
          <span className="text-zinc-600">-</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="bg-transparent border-none text-white text-sm focus:outline-none p-0 w-24 placeholder:text-zinc-600"
            placeholder="End Date"
          />
        </div>
        
        {(searchQuery || selectedCity || startDate || endDate) && (
            <button 
                onClick={() => { setSearchQuery(""); setSelectedCity(""); setStartDate(""); setEndDate(""); }}
                className="px-3 text-xs text-red-400 hover:text-red-300 transition-colors font-medium hover:underline"
            >
                Reset
            </button>
        )}
      </div>

      {/* Centered Flex Layout */}
      {filteredEvents.length > 0 ? (
        <div className="flex flex-wrap justify-center gap-8 px-4">
          {filteredEvents.map(({ event, api_id }) => {
             // Fallback gradient if no image
             const fallbackGradient = "bg-gradient-to-br from-purple-500/20 to-blue-500/20";
             
             return (
                <a
                  key={api_id}
                  href={event.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block w-full sm:w-[280px] md:w-[300px]"
                >
                  {/* Image Container */}
                  <div className={`relative aspect-square overflow-hidden rounded-3xl border border-white/10 bg-zinc-900 transition-all duration-500 group-hover:border-white/20 group-hover:shadow-2xl group-hover:shadow-indigo-500/10 group-hover:-translate-y-2 mb-5 ${!event.cover_url ? fallbackGradient : ''}`}>
                    {event.cover_url && (
                      <img
                        src={event.cover_url}
                        alt={event.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                    )}
                  </div>

                  {/* Content Below */}
                  <div className="space-y-2 text-center">
                    <h3 className="text-xl font-bold text-white leading-tight line-clamp-2 group-hover:text-indigo-400 transition-colors">
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
      ) : (
        <div className="text-center py-20 bg-white/5 rounded-2xl border border-white/10 border-dashed max-w-3xl mx-auto">
          <p className="text-zinc-500">No events found matching your filters.</p>
        </div>
      )}

      {/* See All Button */}
      <div className="flex justify-center pt-8">
        <a 
          href="https://lu.ma/Team1India" 
          target="_blank"
          rel="noopener noreferrer"
          className="group inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-black font-bold hover:bg-zinc-200 transition-all hover:scale-105 active:scale-95"
        >
          See All Events
          <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </a>
      </div>
    </div>
  );
}
