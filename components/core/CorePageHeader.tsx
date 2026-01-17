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
    icon = <User className="w-5 h-5 text-white" />, 
    backLink = "/core", 
    backText = "Back to Core",
    children
}) => {
    return (
        <div className="mb-10">
             <div className="mb-6">
                <Link 
                    href={backLink} 
                    className="inline-flex items-center gap-2 text-xs text-zinc-500 hover:text-white transition-colors"
                >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    {backText}
                </Link>
            </div>

            <div className="flex flex-col md:flex-row justify-between items-end gap-6 pb-2">
                 <div className="relative">
                    <div className="flex items-center gap-3 mb-2">
                         <div className="p-2 bg-red-500/10 rounded-lg border border-red-500/20 flex items-center justify-center text-red-500 shadow-[0_0_15px_-3px_rgba(239,68,68,0.2)]">
                             {React.isValidElement(icon) 
                                ? React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: "w-5 h-5 text-red-500" })
                                : icon}
                         </div>
                         <h1 className="text-2xl font-bold tracking-tight text-red-500">
                             {title}
                         </h1>
                    </div>
                    {description && (
                         <p className="text-red-400 text-sm max-w-lg font-medium">
                            {description}
                         </p>
                    )}
                 </div>
                 
                 {children && (
                     <div className="flex items-center gap-3">
                        {children}
                     </div>
                 )}
            </div>
        </div>
    );
};
