"use client";

import dynamic from "next/dynamic";

const ProfileDashboard = dynamic(
    () => import("@/components/public/profile/ProfileDashboard").then((mod) => ({ default: mod.ProfileDashboard })),
    { ssr: false, loading: () => <div className="min-h-[400px] flex items-center justify-center text-zinc-500">Loading profile...</div> }
);

export function MemberProfileClient({
    initialData,
    role,
}: {
    initialData: any;
    role: "MEMBER" | "CORE" | "PUBLIC";
}) {
    return <ProfileDashboard initialData={initialData} role={role} />;
}
