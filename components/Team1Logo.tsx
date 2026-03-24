import Image from "next/image";

export function Team1Logo({ className = "h-6 w-auto", iconOnly = false }: { className?: string; iconOnly?: boolean }) {
    if (iconOnly) {
        return (
            <div className={`relative ${className} flex items-center justify-center`}>
                <Image
                    src="/team1-symbol.png"
                    alt="Team1 India"
                    fill
                    className="object-contain"
                    sizes="40px"
                    priority
                />
            </div>
        );
    }

    return (
        <div className={`flex items-center gap-1 ${className}`}>
            <div className="relative h-5 w-14 shrink-0">
                <Image
                    src="/team1-full-logo.png"
                    alt="Team1"
                    fill
                    className="object-contain object-left"
                    sizes="80px"
                    priority
                />
            </div>
            <span
                className="text-white font-bold leading-none shrink-0 text-xl"
                style={{ fontFamily: 'var(--font-kanit)' }}
            >
                India
            </span>
        </div>
    );
}
