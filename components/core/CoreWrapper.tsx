"use client";

import React from "react";

interface CoreWrapperProps {
    children: React.ReactNode;
}

export const CoreWrapper: React.FC<CoreWrapperProps> = ({ children }) => {
    return (
        <div className="min-h-screen pt-24 px-6 md:px-12 container mx-auto text-white pb-20 relative font-sans selection:bg-white/20">
            {/* Background Effects */}
            <div className="fixed top-0 left-0 w-full h-[500px] bg-gradient-to-b from-black/80 via-black/50 to-transparent pointer-events-none z-0" />
            <div className="fixed -top-[200px] right-0 w-[600px] h-[600px] bg-purple-900/10 blur-[120px] rounded-full pointer-events-none -z-10" />

            {/* Content */}
            <main className="relative z-10">
                {children}
            </main>
        </div>
    );
};
