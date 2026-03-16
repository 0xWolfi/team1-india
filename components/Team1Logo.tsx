import React from "react";
import Image from "next/image";

export function Team1Logo({ className = "w-8 h-8" }: { className?: string }) {
    return (
        <div className={`relative ${className} flex items-center justify-center`}>
            {/* Using the uploaded logo as requested */}
            <Image 
                src="/team1-symbol.png"
                alt="Team1" 
                fill
                className="object-contain"
                sizes="(max-width: 768px) 100px, 50px"
                priority
            />
        </div>
    );
}
