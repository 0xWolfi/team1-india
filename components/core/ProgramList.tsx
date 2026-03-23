import React from 'react';
import Link from 'next/link';
import { Layers } from "lucide-react";
import { formatDistanceToNow } from 'date-fns';
import { ResourceCard } from '../public/ResourceCard';

interface Program {
    id: string;
    title: string;
    description: string;
    status: string;
    visibility: string; // CORE, MEMBER, PUBLIC
    customFields: any;
    createdAt?: string;
    updatedAt?: string;
    createdBy?: { email: string };
}

interface ProgramListProps {
    programs: Program[];
    basePath: string; // e.g. '/core/programs'
    isLoading?: boolean;
}

export const ProgramList: React.FC<ProgramListProps> = ({ programs, basePath, isLoading }) => {
    if (isLoading) {
        return <div className="text-zinc-500 text-sm animate-pulse">Loading programs...</div>;
    }

    if (programs.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 border border-dashed border-white/10 rounded-2xl bg-white/[0.02]">
                <Layers className="w-8 h-8 text-zinc-600 mb-4"/>
                <h3 className="text-zinc-400 font-medium text-sm">No programs found</h3>
                <p className="text-zinc-600 text-xs mt-1">Create a new program to get started.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {programs.map(program => (
                <ResourceCard 
                    key={program.id} 
                    title={program.title}
                    coverImage={program.customFields?.coverImage}
                    href={`${basePath}/${program.id}`}
                    description={program.description}
                    author={program.createdBy?.email ? program.createdBy.email.split('@')[0] : undefined}
                    date={program.createdAt ? `${formatDistanceToNow(new Date(program.createdAt))} ago` : undefined}
                    buttonText="Manage"
                    // Pass visibility as a badge or extra info if ResourceCard supports it, 
                    // or we might need to enhance ResourceCard or use a different card.
                    // For now, `Manage` implies Core access.
                />
            ))}
        </div>
    );
};
