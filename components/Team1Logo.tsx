import React from "react";
import Image from "next/image";

export function Team1Logo({ className = "h-6 w-auto", iconOnly = false }: { className?: string; iconOnly?: boolean }) {
    return (
        <div className={`relative ${className} flex items-center justify-center`}>
            <Image
                src={iconOnly ? "/team1-symbol.png" : "/team1-full-logo.png"}
                alt="Team1"
                fill
                className="object-contain"
                sizes="(max-width: 768px) 150px, 200px"
                priority
            />
        </div>
    );
}
