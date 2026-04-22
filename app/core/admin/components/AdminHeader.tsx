"use client";

import React from "react";
import { Plus, Users } from "lucide-react";
interface AdminHeaderProps {
    canAddMembers: boolean;
    onAddClick: () => void;
    title?: string;
    description?: string;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({ 
    canAddMembers, 
    onAddClick,
    title = "Headquarters",
    description = "Central command for access protocol and operative management."
}) => {
    return (
        <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
            <div>
                <h1 className="text-3xl font-bold flex items-center gap-3 tracking-tighter text-black dark:text-white">
                    <span className="w-8 h-8 rounded-lg bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 flex items-center justify-center">
                        <Users className="w-5 h-5 text-zinc-700 dark:text-zinc-200"/>
                    </span>
                    {title}
                </h1>
                <p className="text-zinc-500 mt-2 text-sm max-w-lg leading-relaxed font-medium">
                    {description}
                </p>
            </div>
            <div className="flex items-center gap-3">
                {canAddMembers && (
                    <button 
                        onClick={onAddClick}
                        className="bg-white text-black px-4 py-2 rounded-lg text-sm font-semibold hover:bg-zinc-200 transition-all shadow-lg shadow-black/5 dark:shadow-white/5 flex items-center gap-2 active:scale-95"
                    >
                        <Plus className="w-4 h-4"/> Add
                    </button>
                )}
            </div>
        </header>
    );
};
