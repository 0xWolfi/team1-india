import React from "react";
import { getUpcomingEvents } from "@/lib/luma";
import { EventGrid } from "./EventGrid";

export async function Events() {
  const upcomingEvents = await getUpcomingEvents();

  return (
    <section id="events" className="py-20 relative z-10">
      <div className="container mx-auto px-6">
        <h2 className="text-4xl md:text-6xl font-bold text-white mb-12 text-center tracking-tight">
          Upcoming Events
        </h2>
        
        {/* Event Grid - Shows only upcoming events */}
        <EventGrid initialEvents={upcomingEvents} />
      </div>
    </section>
  );
}
