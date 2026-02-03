"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MotionIcon } from "motion-icons-react";
import { signOut } from "next-auth/react";
import Image from "next/image";

interface UnifiedDashboardHeaderProps {
    title: string;
    subtitle?: React.ReactNode;
    user?: any;
    backLink?: string;
    backLabel?: string;
    children?: React.ReactNode;
}

export function UnifiedDashboardHeader({ 
    title, 
    subtitle, 
    user, 
    backLink = "/public", 
    backLabel = "Back to Home", 
    children 
}: UnifiedDashboardHeaderProps) {
    const router = useRouter();
    const [profileImageError, setProfileImageError] = useState(false);
    const [profileImage, setProfileImage] = useState<string | null>(null);
    const [imageCacheBust, setImageCacheBust] = useState<number>(0);

    // Fetch latest profile image from API
    const fetchProfileImage = async () => {
        try {
            const res = await fetch("/api/profile");
            if (res.ok) {
                const data = await res.json();
                if (data.image) {
                    setProfileImage(data.image);
                    setImageCacheBust(Date.now());
                    setProfileImageError(false);
                }
            }
        } catch (error) {
            console.error("Failed to fetch profile image:", error);
        }
    };

    useEffect(() => {
        fetchProfileImage();
        const handleProfileUpdate = () => {
            fetchProfileImage();
        };
        window.addEventListener("profileUpdated", handleProfileUpdate);
        return () => window.removeEventListener("profileUpdated", handleProfileUpdate);
    }, []);

    const buildImageSrc = (url: string | null | undefined): string | undefined => {
        if (!url) return undefined;
        if (url.includes(".public.blob.vercel-storage.com") && imageCacheBust) {
            const separator = url.includes("?") ? "&" : "?";
            return `${url}${separator}t=${imageCacheBust}`;
        }
        return url;
    };

    const displayImage = profileImage || user?.image;

    return (
        <header className="mb-8 border-b border-white/5 pb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="flex-1">
                 {/* Desktop Back Button */}
                 <div className="hidden md:block mb-4">
                    <Link 
                        href={backLink} 
                        className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-500 hover:text-white transition-colors group"
                    >
                        <MotionIcon name="ArrowLeft" className="w-3 h-3 group-hover:-translate-x-1 transition-transform" />
                        {backLabel}
                    </Link>
                 </div>

                 {/* Mobile Top Row: Title + Mobile Back */}
                 <div className="flex items-center justify-between md:hidden mb-4">
                    <div className="flex items-center gap-2">
                         <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                         <span className="text-[10px] font-mono text-zinc-500 tracking-widest uppercase">System Online</span>
                    </div>
                    <Link href={backLink} className="p-2 bg-white/5 rounded-lg text-zinc-400">
                        <MotionIcon name="ArrowLeft" className="w-4 h-4" />
                    </Link>
                 </div>

                {/* Title Section */}
                <div>
                    <h1 className="text-3xl md:text-5xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-200 to-zinc-500">
                        {title}
                    </h1>
                    {subtitle && (
                        <div className="text-zinc-500 font-medium text-sm mt-2 max-w-lg leading-relaxed">
                            {subtitle}
                        </div>
                    )}
                </div>
            </div>
            
            {/* Desktop Actions */}
            <div className="hidden md:flex items-center gap-6">
                
                {children}

                <div className="flex items-center gap-3 pl-6 border-l border-white/5">
                    {/* Profile Image (Static Display) */}
                    <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-white/10 bg-zinc-800 flex items-center justify-center relative">
                        {displayImage && !profileImageError ? (
                            <Image 
                                src={buildImageSrc(displayImage) || displayImage} 
                                alt="Profile" 
                                fill
                                className="object-cover"
                                onError={() => setProfileImageError(true)}
                                unoptimized={displayImage.startsWith('data:') || displayImage.startsWith('blob:')}
                            />
                        ) : (
                            <MotionIcon name="User" className="w-5 h-5 text-zinc-400" />
                        )}
                    </div>

                    {/* Settings Button */}
                    <button
                        type="button"
                        onClick={() => router.push(user?.role === 'CORE' ? "/core/profile" : "/member/profile")}
                        className="w-10 h-10 rounded-full bg-zinc-800 hover:bg-zinc-700 border border-white/5 hover:border-white/20 transition-all flex items-center justify-center text-zinc-400 hover:text-white cursor-pointer"
                        title="My Profile"
                    >
                        <MotionIcon name="Settings" className="w-4 h-4" />
                    </button>
                    <button 
                        onClick={() => signOut({ callbackUrl: '/public' })}
                        className="w-10 h-10 rounded-full bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/30 transition-all flex items-center justify-center text-red-500 hover:text-red-400"
                        title="Logout"
                    >
                        <MotionIcon name="LogOut" className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </header>
    );
}
