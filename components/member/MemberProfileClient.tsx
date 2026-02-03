"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";

const ProfileDashboard = dynamic(
    () => import("@/components/public/profile/ProfileDashboard").then((mod) => ({ default: mod.ProfileDashboard })),
    { ssr: false, loading: () => <div className="min-h-[400px] flex items-center justify-center text-zinc-500">Loading profile...</div> }
);

export function MemberProfileClient({ role }: { role: "MEMBER" | "CORE" | "PUBLIC" }) {
    const [initialData, setInitialData] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const [profileRes, extraRes] = await Promise.all([
                    fetch("/api/profile", { cache: "no-store" }),
                    fetch("/api/profile/extra", { cache: "no-store" }),
                ]);
                if (!profileRes.ok) throw new Error("Failed to load profile");
                const profile = await profileRes.json();
                const extra = extraRes.ok ? await extraRes.json() : {};
                if (cancelled) return;
                setInitialData({
                    fullName: profile.name ?? "",
                    profileImage: profile.image ?? "",
                    xHandle: profile.xHandle ?? "",
                    telegram: profile.telegram ?? "",
                    wallet: profile.wallet ?? "",
                    discord: profile.discord ?? "",
                    bio: profile.bio ?? "",
                    city: extra.city ?? "",
                    country: extra.country ?? "",
                    currentProject: extra.currentProject ?? "",
                    availability: extra.availability ?? "Just Exploring",
                    roles: Array.isArray(extra.roles) ? extra.roles : [],
                    interests: Array.isArray(extra.interests) ? extra.interests : [],
                    skills: Array.isArray(extra.skills) ? extra.skills : [],
                    socialProfiles: Array.isArray(extra.socialProfiles) ? extra.socialProfiles : [],
                    customFields: profile.customFields ?? {},
                });
            } catch (e) {
                if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load profile");
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    if (error) {
        return (
            <div className="min-h-[400px] flex items-center justify-center text-red-400">
                {error}
            </div>
        );
    }
    if (!initialData) {
        return (
            <div className="min-h-[400px] flex items-center justify-center text-zinc-500">
                Loading profile...
            </div>
        );
    }
    return <ProfileDashboard initialData={initialData} role={role} />;
}
