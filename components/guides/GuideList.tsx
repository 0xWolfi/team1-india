import React from 'react';
import Link from 'next/link';
import { ArrowRight, BookOpen } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ResourceCard } from '../public/ResourceCard';

interface Guide {
    id: string;
    title: string;
    body: {
        description: string;
    };
    type: string;
    visibility: string;
    coverImage?: string;
    createdAt?: string;
    updatedAt?: string;
    createdBy?: { email: string };
}

interface GuideListProps {
    guides: Guide[];
    basePath: string; // e.g. '/core/events/guides'
    isLoading?: boolean;
}

export const GuideList: React.FC<GuideListProps> = ({ guides, basePath, isLoading }) => {
    if (isLoading) {
        return <div className="text-zinc-500 text-sm animate-pulse">Loading guides...</div>;
    }

    if (guides.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 border border-dashed border-white/10 rounded-2xl bg-white/[0.02]">
                <BookOpen className="w-8 h-8 text-zinc-600 mb-4" />
                <h3 className="text-zinc-400 font-medium text-sm">No guides available</h3>
                <p className="text-zinc-600 text-xs mt-1">Check back later for standard operating procedures.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {guides.map(guide => (
                <ResourceCard 
                    key={guide.id} 
                    title={guide.title}
                    coverImage={guide.coverImage}
                    href={`${basePath}/${guide.id}`}
                    description={guide.body?.description}
                    author={guide.createdBy?.email ? guide.createdBy.email.split('@')[0] : undefined}
                    date={(guide.updatedAt || guide.createdAt) ? `${formatDistanceToNow(new Date((guide.updatedAt || guide.createdAt)!))} ago` : undefined}
                    buttonText="Read"
                    visibility={guide.visibility as any}
                />
            ))}
        </div>
    );
};
