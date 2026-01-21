"use client";

import React, { useState, useMemo } from "react";
import { LumaEventData } from "@/lib/luma";
import { ChevronLeft, ChevronRight, X, ExternalLink } from "lucide-react";

interface EventCalendarProps {
  events: LumaEventData[];
}

interface EventsByDate {
  [key: string]: LumaEventData[];
}

export function EventCalendar({ events }: EventCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Lock body scroll when modal is open
  React.useEffect(() => {
    if (selectedDate) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [selectedDate]);

  // Group events by date
  const eventsByDate = useMemo(() => {
    const grouped: EventsByDate = {};
    if (!Array.isArray(events)) {
      return grouped;
    }
    
    events.forEach((event) => {
      const dateKey = new Date(event.event.start_at).toDateString();
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(event);
    });
    
    return grouped;
  }, [events]);

  // Get calendar days for current month
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startingDayOfWeek = firstDay.getDay();
    const totalDays = lastDay.getDate();

    const days = [];
    
    // Add empty slots for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add actual days
    for (let day = 1; day <= totalDays; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  }, [currentDate]);

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const handleDateClick = (date: Date) => {
    const dateKey = date.toDateString();
    const hasEvents = eventsByDate[dateKey] && eventsByDate[dateKey].length > 0;
    if (hasEvents) {
      setSelectedDate(dateKey);
    }
  };

  const closeModal = () => {
    setSelectedDate(null);
  };

  const selectedEvents = selectedDate ? eventsByDate[selectedDate] : [];

  const monthYear = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <>
      <div className="w-full max-w-3xl mx-auto bg-zinc-900/60 backdrop-blur-2xl border border-white/10 rounded-2xl p-4 md:p-5 shadow-2xl">
        {/* Calendar Header */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={goToPreviousMonth}
            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-zinc-400" />
          </button>
          
          <h3 className="text-base md:text-lg font-bold text-white">{monthYear}</h3>
          
          <button
            onClick={goToNextMonth}
            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
          >
            <ChevronRight className="w-4 h-4 text-zinc-400" />
          </button>
        </div>

        {/* Week Day Headers */}
        <div className="grid grid-cols-7 gap-1 md:gap-1.5 mb-1.5">
          {weekDays.map((day) => (
            <div
              key={day}
              className="text-center text-[10px] md:text-xs font-bold text-zinc-500 uppercase tracking-wider py-1"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1 md:gap-1.5">
          {calendarDays.map((day, index) => {
            if (!day) {
              return <div key={`empty-${index}`} className="aspect-square" />;
            }

            const dateKey = day.toDateString();
            const hasEvents = eventsByDate[dateKey] && eventsByDate[dateKey].length > 0;
            const isToday = day.toDateString() === new Date().toDateString();

            return (
              <button
                key={dateKey}
                onClick={() => {
                  if (hasEvents) {
                    handleDateClick(day);
                  }
                }}
                disabled={!hasEvents}
                className={`
                  aspect-square rounded-md flex flex-col items-center justify-center relative
                  transition-all duration-200
                  ${hasEvents 
                    ? 'bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 cursor-pointer' 
                    : 'text-zinc-600 cursor-default'}
                  ${isToday ? 'ring-1 ring-white/30' : ''}
                `}
              >
                <span className={`text-xs md:text-sm font-medium ${hasEvents ? 'text-white' : 'text-zinc-600'}`}>
                  {day.getDate()}
                </span>
                {hasEvents && (
                  <div className="absolute bottom-0.5 w-1 h-1 rounded-full bg-emerald-400" />
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-3 text-center text-[10px] md:text-xs text-zinc-500">
          Click on dates with events to view details
        </div>
      </div>

      {/* Events Modal */}
      {selectedDate && selectedEvents.length > 0 && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={closeModal}
        >
          <div
            className="bg-zinc-900 border border-white/10 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header - Fixed */}
            <div className="flex items-center justify-between p-4 md:p-5 border-b border-white/10 flex-shrink-0">
              <h3 className="text-lg md:text-xl font-bold text-white">
                {new Date(selectedDate).toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  month: 'long', 
                  day: 'numeric',
                  year: 'numeric'
                })}
              </h3>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-zinc-400" />
              </button>
            </div>

            {/* Events List - Scrollable */}
            <div className="overflow-y-auto p-4 md:p-5 space-y-4">
              {selectedEvents.map((eventData) => (
                <div
                  key={eventData.api_id}
                  className="bg-zinc-800/50 border border-white/5 rounded-xl overflow-hidden hover:border-white/20 transition-all group"
                >
                  {/* Event Banner */}
                  {eventData.event.cover_url && (
                    <div className="relative w-full aspect-[16/9] overflow-hidden">
                      <img
                        src={eventData.event.cover_url}
                        alt={eventData.event.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  )}

                  {/* Event Info */}
                  <div className="p-4 md:p-5">
                    <h4 className="text-lg md:text-xl font-bold text-white mb-2 md:mb-3 group-hover:text-zinc-200 transition-colors">
                      {eventData.event.name}
                    </h4>
                    
                    {eventData.event.geo_address_json?.city && (
                      <p className="text-sm text-zinc-400 mb-3 md:mb-4 flex items-center gap-2">
                        <span>📍</span>
                        <span>{eventData.event.geo_address_json.city}</span>
                      </p>
                    )}

                    <a
                      href={eventData.event.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 md:px-5 py-2 md:py-2.5 bg-white text-black rounded-lg text-sm font-bold hover:bg-zinc-200 transition-colors"
                    >
                      See More Details
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
