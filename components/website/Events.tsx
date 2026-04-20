import React from "react";
import { getUpcomingEvents } from "@/lib/luma";
import { EventGrid } from "./EventGrid";
import { AnimatedEventsSection } from "./AnimatedEventsSection";

export async function Events() {
  const upcomingEvents = await getUpcomingEvents();

  return (
    <section id="events" className="py-10 md:py-14 relative z-10">
      <div className="container mx-auto px-6">
        <AnimatedEventsSection>
          {/* Event Grid - Shows only upcoming events */}
          <EventGrid initialEvents={upcomingEvents} />
        </AnimatedEventsSection>
      </div>
    </section>
  );
}
