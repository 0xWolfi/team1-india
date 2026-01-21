import React from "react";
import { getUpcomingEvents, getAllEvents } from "@/lib/luma";
import { EventGrid } from "./EventGrid";
import { EventCalendar } from "@/components/calendar/EventCalendar";

export async function Events() {
  const upcomingEvents = await getUpcomingEvents();
  const allEvents = await getAllEvents();

  return (
    <section id="events" className="py-20 relative z-10">
      <div className="container mx-auto px-6">
        <h2 className="text-4xl md:text-6xl font-bold text-white mb-12 text-center tracking-tighter">
          Events
        </h2>
        
        {/* Calendar View - Shows all events (past + future) */}
        <div className="mb-16">
          <EventCalendar events={allEvents} />
        </div>
        
        {/* Event Grid - Shows only upcoming events */}
        <EventGrid initialEvents={upcomingEvents} />
      </div>
    </section>
  );
}
