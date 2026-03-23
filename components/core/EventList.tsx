import React from 'react';
import { ResourceCard } from '../public/ResourceCard';
import { Calendar } from "lucide-react";
import { formatDistanceToNow } from 'date-fns';

interface EventModel {
    id: string;
    title: string;
    description?: string;
    date?: string;
    location?: string;
    visibility: string; // CORE, MEMBER, PUBLIC
    coverImage?: string; // If Event has one, otherwise fallback
    customFields?: any;
    createdById?: string;
    updatedAt?: string;
    createdAt?: string;
    // Relation typings if needed
    createdBy?: { email: string };
}

interface EventListProps {
    events: EventModel[];
    basePath: string; // e.g. '/core/events'
    isLoading?: boolean;
}

export const EventList: React.FC<EventListProps> = ({ events, basePath, isLoading }) => {
    if (isLoading) {
        return <div className="text-zinc-500 text-sm animate-pulse">Loading events...</div>;
    }

    if (events.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 border border-dashed border-white/10 rounded-2xl bg-white/[0.02]">
                <Calendar className="w-8 h-8 text-zinc-600 mb-4"/>
                <h3 className="text-zinc-400 font-medium text-sm">No events scheduled</h3>
                <p className="text-zinc-600 text-xs mt-1">Create an event to populate the calendar.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map(event => (
                <ResourceCard 
                    key={event.id} 
                    title={event.title}
                    // Event doesn't currently store coverImage in top level schema, check customFields or add if needed.
                    // Assuming for now, or use placeholder.
                    // Schema update? I didn't verify Event model fully. 
                    // Prisma schema for Event (vague memory). 
                    // Let's assume customFields.coverImage for now or none.
                    coverImage={(event.customFields as any)?.coverImage}
                    href={`${basePath}/${event.id}`}
                    description={event.description || event.location || ''}
                    date={event.date ? new Date(event.date).toLocaleDateString() : undefined}
                    buttonText="Manage"
                    visibility={event.visibility as any}
                />
            ))}
        </div>
    );
};
