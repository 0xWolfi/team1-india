"use client";

import React, { useState, useMemo } from 'react';
import { Calendar, ExternalLink, MapPin } from "lucide-react";
import Link from 'next/link';
import {  format } from 'date-fns';

// Placeholder Mock Data for Luma Events
const MOCK_EVENTS = [
    {
        id: '1',
        title: 'Team1 Global Summit',
        date: '2026-03-15T10:00:00Z',
        location: 'New York, NY',
        city: 'New York',
        eventType: 'Summit',
        coverImage: 'https://images.unsplash.com/photo-1540575467063-17e6fc6073b6?auto=format&fit=crop&q=80',
        url: '#'
    },
    {
        id: '2',
        title: 'Community Builder Workshop',
        date: '2026-02-20T14:00:00Z',
        location: 'Bangalore, India',
        city: 'Bangalore',
        eventType: 'Workshop',
        coverImage: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&q=80',
        url: '#'
    },
    {
        id: '3',
        title: 'Founders Mixer',
        date: '2026-02-28T18:00:00Z',
        location: 'San Francisco, CA',
        city: 'San Francisco',
        eventType: 'Meetup',
        coverImage: 'https://images.unsplash.com/photo-1499750310159-5254f412fa2e?auto=format&fit=crop&q=80',
        url: '#'
    },
     {
        id: '4',
        title: 'Product Design Sprint',
        date: '2026-04-10T09:00:00Z',
        location: 'Remote / Online',
        city: 'Online',
        eventType: 'Workshop',
        coverImage: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&q=80',
        url: '#'
    }
];

const CITIES = ['All Cities', 'New York', 'San Francisco', 'Bangalore', 'Online'];
const MONTHS = ['All Dates', 'February 2026', 'March 2026', 'April 2026'];
const EVENT_TYPES = ['All Types', 'Summit', 'Workshop', 'Meetup'];

export default function PublicEventsViewer() {
    const [selectedCity, setSelectedCity] = useState('All Cities');
    const [selectedMonth, setSelectedMonth] = useState('All Dates');
    const [selectedType, setSelectedType] = useState('All Types');

    const filteredEvents = useMemo(() => {
        return MOCK_EVENTS.filter(event => {
            const matchesCity = selectedCity === 'All Cities' || event.city === selectedCity;
            
            const eventDate = new Date(event.date);
            const eventMonthStr = format(eventDate, 'MMMM yyyy');
            const matchesMonth = selectedMonth === 'All Dates' || eventMonthStr === selectedMonth;

            const matchesType = selectedType === 'All Types' || event.eventType === selectedType;

            return matchesCity && matchesMonth && matchesType;
        });
    }, [selectedCity, selectedMonth, selectedType]);

    return (
        <section className="space-y-8">
             <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-white/10 pb-4">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-zinc-400"/> Upcoming Events
                </h2>
                
                {/* Filters */}
                <div className="flex gap-4 flex-wrap">
                    <select 
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="bg-zinc-900 border border-white/10 rounded-lg px-4 py-2 text-sm text-zinc-300 focus:outline-none focus:border-white/30"
                    >
                        {MONTHS.map(month => (
                            <option key={month} value={month}>{month}</option>
                        ))}
                    </select>

                    <select 
                        value={selectedCity}
                        onChange={(e) => setSelectedCity(e.target.value)}
                        className="bg-zinc-900 border border-white/10 rounded-lg px-4 py-2 text-sm text-zinc-300 focus:outline-none focus:border-white/30"
                    >
                        {CITIES.map(city => (
                            <option key={city} value={city}>{city}</option>
                        ))}
                    </select>

                    <select 
                        value={selectedType}
                        onChange={(e) => setSelectedType(e.target.value)}
                        className="bg-zinc-900 border border-white/10 rounded-lg px-4 py-2 text-sm text-zinc-300 focus:outline-none focus:border-white/30"
                    >
                        {EVENT_TYPES.map(type => (
                            <option key={type} value={type}>{type}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Events Grid */}
            {filteredEvents.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {filteredEvents.map(event => (
                        <Link href={event.url} key={event.id} className="group block h-full bg-zinc-900 border border-white/5 rounded-2xl overflow-hidden hover:border-white/20 transition-all flex flex-col">
                            {/* Image */}
                            <div className="h-40 w-full relative">
                                <img src={event.coverImage} alt={event.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded-md border border-white/10">
                                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                                        {format(new Date(event.date), 'MMM d')}
                                    </span>
                                </div>
                            </div>

                            {/* Info */}
                            <div className="p-5 flex-1 flex flex-col gap-2">
                                <h3 className="font-bold text-lg text-white leading-tight group-hover:text-zinc-200 transition-colors">
                                    {event.title}
                                </h3>
                                
                                <div className="flex items-center gap-2 text-xs text-zinc-500 mt-1">
                                    <MapPin className="w-3 h-3"/>
                                    <span>{event.location}</span>
                                </div>

                                <div className="mt-auto pt-4">
                                    <span className="flex items-center gap-1 text-xs font-bold text-white group-hover:underline">
                                        Register via Luma <ExternalLink className="w-3 h-3"/>
                                    </span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            ) : (
                <div className="py-12 text-center border border-dashed border-white/10 rounded-2xl">
                    <p className="text-zinc-500">No events found matching your filters.</p>
                </div>
            )}
        </section>
    );
}
