'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Calendar, BookOpen } from 'lucide-react';
import Link from 'next/link';
import { CoreWrapper } from "@/components/core/CoreWrapper";
import { CorePageHeader } from "@/components/core/CorePageHeader";
import { GuideList } from '@/components/guides/GuideList';
import { EventList } from '@/components/core/EventList';

export default function EventsPage() {
    const [view, setView] = useState<'CALENDAR' | 'GUIDES'>('CALENDAR');
    
    // Data States
    const [events, setEvents] = useState([]);
    const [isEventsLoading, setIsEventsLoading] = useState(true);
    
    const [guides, setGuides] = useState([]);
    const [isGuidesLoading, setIsGuidesLoading] = useState(true);

    const fetchEvents = async () => {
        setIsEventsLoading(true);
        try {
            const res = await fetch('/api/events');
            if (res.ok) {
                const data = await res.json();
                setEvents(data);
            }
        } catch (error) {
            console.error("Failed to fetch events", error);
        } finally {
            setIsEventsLoading(false);
        }
    };

    const fetchGuides = async () => {
        setIsGuidesLoading(true);
        try {
            const res = await fetch('/api/guides?type=EVENT');
            if (res.ok) {
                const data = await res.json();
                setGuides(data);
            }
        } catch (error) {
            console.error("Failed to fetch guides", error);
        } finally {
            setIsGuidesLoading(false);
        }
    };

    useEffect(() => {
        fetchEvents();
        fetchGuides();
    }, []);

    return (
        <CoreWrapper>
            <CorePageHeader
                title="Events & Logistics"
                description="Manage your calendar, event details, and standard operating procedures."
                icon={<Calendar className="w-5 h-5 text-zinc-200" />}
            >
                <div className="flex items-center gap-2">
                    {view === 'CALENDAR' ? (
                        <Link href="/core/events/new">
                            <button className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-lg font-bold text-xs hover:bg-zinc-200 transition-colors">
                                <Plus className="w-4 h-4" /> Schedule Event
                            </button>
                        </Link>
                    ) : (
                        <Link href="/core/events/guides/new">
                            <button className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-lg font-bold text-xs hover:bg-zinc-200 transition-colors">
                                <Plus className="w-4 h-4" /> Create Guide
                            </button>
                        </Link>
                    )}
                </div>
            </CorePageHeader>

            {/* Tabs */}
            <div className="flex gap-6 border-b border-white/5 mb-8">
                <button 
                    onClick={() => setView('CALENDAR')}
                    className={`pb-4 text-sm font-bold uppercase tracking-wider transition-colors flex items-center gap-2 ${
                        view === 'CALENDAR' ? 'text-white border-b-2 border-white' : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                >
                    <Calendar className="w-4 h-4" /> Calendar
                </button>
                <button 
                    onClick={() => setView('GUIDES')}
                    className={`pb-4 text-sm font-bold uppercase tracking-wider transition-colors flex items-center gap-2 ${
                        view === 'GUIDES' ? 'text-white border-b-2 border-white' : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                >
                    <BookOpen className="w-4 h-4" /> SOP Guides
                </button>
            </div>

            {view === 'CALENDAR' ? (
                <EventList 
                    events={events}
                    basePath="/core/events"
                    isLoading={isEventsLoading}
                />
            ) : (
                <GuideList 
                    guides={guides} 
                    basePath="/core/events/guides" 
                    isLoading={isGuidesLoading} 
                />
            )}
        </CoreWrapper>
    );
}
