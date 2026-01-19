import { Zap } from "lucide-react";

export default function Loading() {
    return (
        <div className="h-screen w-full flex flex-col items-center justify-center bg-black text-white gap-4">
            <div className="relative">
                <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-white/10 flex items-center justify-center animate-pulse shadow-[0_0_30px_rgba(255,255,255,0.05)]">
                    <Zap className="w-5 h-5 text-zinc-600" />
                </div>
            </div>
            <div className="flex flex-col items-center gap-2 animate-in fade-in duration-700">
                <h3 className="text-sm font-bold text-zinc-500 tracking-widest uppercase">Loading System</h3>
                <div className="h-1 w-24 bg-zinc-900 rounded-full overflow-hidden">
                    <div className="h-full bg-white/20 w-1/2 animate-shimmer" />
                </div>
            </div>
        </div>
    )
}
