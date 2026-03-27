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
        <div className={`relative ${className} shrink-0`} style={{ aspectRatio: '5896 / 864' }}>
            <Image
                src="/team1-horizontal.svg"
                alt="Team1 India"
                fill
                className="object-contain object-left"
                sizes="200px"
                priority
            />
        </div>
    );
}
