"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, User } from "lucide-react";
interface CorePageHeaderProps {
    title: string;
    description?: string;
    icon?: React.ReactNode;
    backLink?: string;
    backText?: string;
    children?: React.ReactNode; // For "Add" buttons etc.
}

export const CorePageHeader: React.FC<CorePageHeaderProps> = ({ 
    title, 
    description, 
    icon = <User className="w-5 h-5 text-black dark:text-white"/>,
    backLink = "/core", 
    backText = "Back to Core",
    children
}) => {
    return (
        <div className="mb-6 sm:mb-10">
             <div className="mb-4 sm:mb-6">
                <Link
                    href={backLink}
                    className="inline-flex items-center gap-2 text-xs text-zinc-500 hover:text-black dark:hover:text-white transition-colors group"
                >
                    <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform"/>
                    {backText}
                </Link>
            </div>

            <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 md:gap-6 pb-2">
                 <div className="relative min-w-0 flex-1">
                    <div className="flex items-center gap-3 mb-2">
                         <div className="p-2 bg-black/5 dark:bg-white/5 rounded-lg border border-black/5 dark:border-white/5 flex items-center justify-center text-zinc-600 dark:text-zinc-300 shadow-none flex-shrink-0">
                             {React.isValidElement(icon)
                                ? React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: "w-5 h-5 text-zinc-700 dark:text-zinc-200" })
                                : icon}
                         </div>
                         <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-black dark:text-white truncate">
                             {title}
                         </h1>
                    </div>
                    {description && (
                         <p className="text-zinc-500 dark:text-zinc-400 text-xs sm:text-sm max-w-lg font-medium">
                            {description}
                         </p>
                    )}
                 </div>

                 {children && (
                     <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full md:w-auto">
                        {children}
                     </div>
                 )}
            </div>
        </div>
    );
};
