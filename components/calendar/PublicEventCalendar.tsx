"use client";

import React, { useState, useEffect } from "react";
import { EventCalendar } from "./EventCalendar";
import { LumaEventData } from "@/lib/luma";

export function PublicEventCalendar() {
  const [events, setEvents] = useState<LumaEventData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchEvents = async () => {
      try {
        const res = await fetch("/api/luma-events", {
          cache: 'no-store',
          headers: {
            'Content-Type': 'application/json',
          }
        });
        
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        
        const data = await res.json();
        
        if (isMounted) {
          const eventsArray = Array.isArray(data) ? data : [];
          console.log("Public calendar loaded:", eventsArray.length, "events");
          setEvents(eventsArray);
          setError(null);
          setIsLoading(false);
        }
      } catch (err) {
        console.error("Failed to fetch events:", err);
        if (isMounted) {
          setError("Failed to load events");
          setEvents([]);
          setIsLoading(false);
        }
      }
    };

    fetchEvents();

    return () => {
      isMounted = false;
    };
  }, []);

  if (isLoading) {
    return (
      <div className="w-full max-w-3xl mx-auto bg-zinc-900/60 backdrop-blur-2xl border border-white/10 rounded-2xl p-4 md:p-5 shadow-2xl animate-pulse">
        <div className="h-[300px] flex items-center justify-center">
          <div className="text-zinc-500">Loading calendar...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-3xl mx-auto bg-zinc-900/60 backdrop-blur-2xl border border-white/10 rounded-2xl p-4 md:p-5 shadow-2xl">
        <div className="h-[300px] flex items-center justify-center">
          <div className="text-red-400">{error}</div>
        </div>
      </div>
    );
  }

  return <EventCalendar events={events} />;
}
