"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { MotionIcon } from "motion-icons-react";
import { LumaEventData } from "@/lib/luma";

interface CustomDatePickerProps {
  events: LumaEventData[];
  selectedDate: string;
  onChange: (date: string) => void;
}

export function CustomDatePicker({ events, selectedDate, onChange }: CustomDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Map dates to event presence
  const eventDates = useMemo(() => {
    const dates = new Set<string>();
    events.forEach(e => {
      const dateStr = new Date(e.event.start_at).toISOString().split('T')[0];
      dates.add(dateStr);
    });
    return dates;
  }, [events]);

  // Calendar Logic
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startingDayOfWeek = firstDay.getDay();
    const totalDays = lastDay.getDate();

    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) days.push(null);
    for (let day = 1; day <= totalDays; day++) {
        days.push(new Date(year, month, day));
    }
    return days;
  }, [currentDate]);

  const handleDateClick = (date: Date) => {
    // Correct timezone handling for selection value (YYYY-MM-DD)
    // We construct the string manually to avoid timezone shifts
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    
    if (selectedDate === dateStr) {
      onChange(""); // Deselect
    } else {
      onChange(dateStr);
    }
    setIsOpen(false);
  };

  const monthYear = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  return (
    <div className="relative w-full md:w-48 group" ref={containerRef}>
      {/* Trigger */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center gap-3 pl-3 pr-4 py-2.5 bg-white/5 border rounded-xl text-sm transition-all cursor-pointer select-none ${isOpen ? 'border-white/30 bg-white/10' : 'border-white/10 hover:border-white/20'}`}
      >
         <MotionIcon name="Calendar" className={`w-4 h-4 transition-colors ${selectedDate ? 'text-white' : 'text-zinc-500'}`} />
         <span className={`flex-1 truncate ${selectedDate ? 'text-white' : 'text-zinc-400'}`}>
            {selectedDate ? new Date(selectedDate).toLocaleDateString('en-GB') : "Select Date"}
         </span>
         {selectedDate && (
            <div 
                onClick={(e) => {
                    e.stopPropagation();
                    onChange("");
                }}
                className="p-0.5 hover:bg-white/20 rounded-full transition-colors"
             >
                <MotionIcon name="X" className="w-3 h-3 text-zinc-400 hover:text-white" />
            </div>
         )}
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-72 bg-black/40 backdrop-blur-3xl backdrop-saturate-150 border border-white/10 rounded-2xl p-4 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-200">
           {/* Header */}
           <div className="flex items-center justify-between mb-4">
              <button 
                onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
                className="p-1 hover:bg-white/10 rounded-lg text-zinc-400 hover:text-white transition-colors"
                type="button"
              >
                <MotionIcon name="ChevronLeft" className="w-4 h-4" />
              </button>
              <span className="text-white font-bold text-sm tracking-wide">{monthYear}</span>
              <button 
                onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
                className="p-1 hover:bg-white/10 rounded-lg text-zinc-400 hover:text-white transition-colors"
                type="button"
              >
                <MotionIcon name="ChevronRight" className="w-4 h-4" />
              </button>
           </div>

           {/* Grid */}
           <div className="grid grid-cols-7 gap-1 mb-2">
              {weekDays.map(d => (
                  <div key={d} className="text-center text-[10px] text-zinc-500 font-bold uppercase">{d}</div>
              ))}
           </div>
           <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, idx) => {
                  if (!day) return <div key={idx} />;
                  
                  // Construct local date string for check
                  const year = day.getFullYear();
                  const month = String(day.getMonth() + 1).padStart(2, '0');
                  const d = String(day.getDate()).padStart(2, '0');
                  const dateStr = `${year}-${month}-${d}`;
                  
                  const hasEvent = eventDates.has(dateStr);
                  const isSelected = selectedDate === dateStr;
                  const isToday = new Date().toISOString().split('T')[0] === dateStr;

                  return (
                      <button
                        key={idx}
                        onClick={() => hasEvent && handleDateClick(day)}
                        disabled={!hasEvent}
                        type="button"
                        className={`
                            h-8 w-8 rounded-lg flex items-center justify-center text-xs relative transition-all
                            ${!hasEvent ? 'text-zinc-700 cursor-default' : 'hover:bg-white/10 cursor-pointer text-white'}
                            ${isSelected ? 'bg-white text-black font-bold hover:bg-white hover:text-black shadow-[0_0_10px_rgba(255,255,255,0.3)]' : ''}
                            ${isToday && !isSelected ? 'ring-1 ring-white/20' : ''}
                        `}
                      >
                         {day.getDate()}
                         {hasEvent && !isSelected && (
                             <div className="absolute bottom-1 w-1 h-1 rounded-full bg-emerald-400" />
                         )}
                      </button>
                  );
              })}
           </div>
        </div>
      )}
    </div>
  );
}
