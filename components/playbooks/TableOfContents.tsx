"use client";

import React, { useEffect, useState } from "react";
import { List, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Heading {
    id: string;
    text: string;
    level: number;
}

interface TableOfContentsProps {
    contentDependency?: any; // To trigger re-scan in edit mode
}

export function TableOfContents({ contentDependency }: TableOfContentsProps) {
    const [headings, setHeadings] = useState<Heading[]>([]);
    const [activeId, setActiveId] = useState<string>("");
    const [isOpen, setIsOpen] = useState(false); // For mobile

    useEffect(() => {
        // Debounce slightly to allow DOM to render
        const timer = setTimeout(() => {
            const elements = Array.from(document.querySelectorAll("h1, h2, h3"))
                .filter((element) => element.id && element.textContent && !element.closest('.toc-ignore')); 

            const headingData = elements.map((element) => ({
                id: element.id,
                text: element.textContent ?? "",
                level: Number(element.tagName.substring(1)),
            }));

            setHeadings(headingData);

            // Re-observe new elements
            const observer = new IntersectionObserver(
                (entries) => {
                    entries.forEach((entry) => {
                        if (entry.isIntersecting) {
                            setActiveId(entry.target.id);
                        }
                    });
                },
                { rootMargin: "0px 0px -40% 0px" }
            );

            elements.forEach((element) => observer.observe(element));
            
            // Clean up internal observer
            return () => observer.disconnect();

        }, 500); // 500ms delay for typing pauses

        return () => clearTimeout(timer);
    }, [contentDependency]);

    if (headings.length === 0) return null;

    const Content = () => (
        <nav className="space-y-1">
            <h3 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">On this page</h3>
            <ul className="space-y-2 border-l border-white/10 pl-4">
                {headings.map((heading) => (
                    <li key={heading.id} style={{ marginLeft: `${(heading.level - 1) * 8}px` }}>
                        <a
                            href={`#${heading.id}`}
                            className={cn(
                                "block text-sm transition-colors duration-200 py-1",
                                activeId === heading.id
                                    ? "text-white font-medium -ml-[17px] border-l-2 border-white pl-[15px]" 
                                    : "text-zinc-500 hover:text-zinc-300"
                            )}
                            onClick={(e) => {
                                e.preventDefault();
                                document.getElementById(heading.id)?.scrollIntoView({ behavior: "smooth" });
                                setActiveId(heading.id);
                                setIsOpen(false);
                            }}
                        >
                            {heading.text}
                        </a>
                    </li>
                ))}
            </ul>
        </nav>
    );

    return (
        <>
            {/* Desktop View */}
            <div className="hidden lg:block sticky top-32 max-h-[calc(100vh-120px)] overflow-y-auto pr-4 toc-ignore">
                <Content />
            </div>

            {/* Mobile View Toggle */}
            <div className="lg:hidden fixed bottom-6 right-6 z-50">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="h-12 w-12 rounded-full bg-white text-black shadow-lg flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
                    aria-label="Table of Contents"
                >
                    {isOpen ? <X className="w-5 h-5"/> : <List className="w-5 h-5"/>}
                </button>
            </div>

            {/* Mobile Drawer */}
            {isOpen && (
                <div className="lg:hidden fixed inset-0 z-40 bg-black/80 backdrop-blur-sm" onClick={() => setIsOpen(false)}>
                    <div 
                        className="absolute bottom-20 right-6 w-64 bg-zinc-900 border border-white/10 rounded-2xl p-6 shadow-2xl animate-in slide-in-from-right-10 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <Content />
                    </div>
                </div>
            )}
        </>
    );
}
