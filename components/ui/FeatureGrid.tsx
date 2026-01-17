import React, { ReactNode } from "react";

export interface FeatureItem {
  title: string;
  desc: string;
  icon: ReactNode;
  colSpan?: string;
}

interface FeatureGridProps {
  items: FeatureItem[];
}

export function FeatureGrid({ items }: FeatureGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-0 max-w-7xl mx-auto border-t border-l border-white/10 relative">
      {items.map((item, idx) => (
        <div 
          key={idx} 
          className={`p-8 border-b border-r border-white/10 relative group ${item.colSpan || ''} bg-white/5 backdrop-blur-md hover:bg-brand-500/[0.02] transition-all duration-300 cursor-default`}
        >
          <div className="flex items-center gap-4 mb-3 relative z-10">
            <div className="text-zinc-400 group-hover:text-brand-500 transition-colors duration-300">
                {/* Ensure icon inherits or sets classes */}
                {React.isValidElement(item.icon) && React.cloneElement(item.icon as React.ReactElement<{ className?: string }>, { className: "w-6 h-6" })}
            </div>
            <h3 className="text-xl font-bold text-white group-hover:text-brand-400 transition-colors duration-300">
              {item.title}
            </h3>
          </div>
          <p className="text-zinc-500 text-base leading-relaxed relative z-10 group-hover:text-brand-400/80 transition-colors duration-300">
            {item.desc}
          </p>
        </div>
      ))}
    </div>
  );
}
