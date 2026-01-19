"use client";

import dynamic from 'next/dynamic';

const EtheralBackground = dynamic(() => import("@/components/ui/etheral-shadow").then(mod => mod.Component), { 
  ssr: false 
});

export const DynamicBackground = () => {
    return (
        <EtheralBackground
            color="rgba(128, 128, 128, 0.5)" // Slightly transparent gray
            animation={{ scale: 100, speed: 90 }}
            noise={{ opacity: 0.2, scale: 1.2 }} // Reduced noise opacity for background
            sizing="fill"
        />
    );
};
