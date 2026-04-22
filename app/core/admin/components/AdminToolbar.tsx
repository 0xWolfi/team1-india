"use client";

import React from "react";
import { RefreshCw, Search } from "lucide-react";
interface AdminToolbarProps {
    searchTerm: string;
    onSearchChange: (value: string) => void;
    onRefresh: () => void;
    isLoading: boolean;
}

export const AdminToolbar: React.FC<AdminToolbarProps & { children?: React.ReactNode }> = ({ searchTerm, onSearchChange, onRefresh, isLoading, children }) => {
    return (
        <div className="flex flex-col md:flex-row gap-4 mb-6 relative z-10">
            <div className="relative flex-1 group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 dark:text-zinc-600 group-focus-within:text-zinc-500 dark:group-focus-within:text-zinc-400 transition-colors"/>
                <input 
                    type="text" 
                    placeholder="Filter operatives..." 
                    value={searchTerm}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="w-full bg-white/40 dark:bg-black/40 backdrop-blur-md border border-black/5 dark:border-white/5 rounded-xl pl-10 pr-4 py-2.5 text-sm text-black dark:text-white placeholder-zinc-400 dark:placeholder-zinc-700 focus:outline-none focus:border-black/20 dark:focus:border-white/20 focus:ring-1 focus:ring-black/20 dark:focus:ring-white/20 transition-all"
                />
            </div>
            {children}
            <div className="flex items-center gap-2">
                <button onClick={onRefresh} className="p-2.5 rounded-xl bg-white/40 dark:bg-black/40 border border-black/5 dark:border-white/5 hover:bg-black/5 dark:hover:bg-white/5 text-zinc-500 hover:text-black dark:hover:text-white transition-colors">
                    <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`}/>
                </button>
            </div>
        </div>
    );
};
