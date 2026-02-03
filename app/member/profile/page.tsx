import { redirect } from "next/navigation";
import dynamic from "next/dynamic";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { MemberWrapper } from "@/components/member/MemberWrapper";
import { MotionIcon } from "motion-icons-react";
import Link from "next/link";

// Load ProfileDashboard only on client to avoid RSC serialization error (useState not iterable)
const ProfileDashboard = dynamic(
    () => import("@/components/public/profile/ProfileDashboard").then((mod) => ({ default: mod.ProfileDashboard })),
    { ssr: false, loading: () => <div className="min-h-[400px] flex items-center justify-center text-zinc-500">Loading profile...</div> }
);

export default async function MemberProfilePage() {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
        redirect("/member");
    }

    // @ts-ignore
    const userId = session.user.id;
    // @ts-ignore
    const role = session.user.role;

    if (!userId || typeof userId !== "string") {
        redirect("/member");
    }

    // Check Role
    if (role !== 'MEMBER') {
        if (role === 'CORE') redirect("/core");
        if (role === 'PUBLIC') redirect("/public");
        redirect("/member");
    }

    let member;
    try {
        // For MEMBER role, session.user.id is the CommunityMember id (not Member table).
        member = await prisma.communityMember.findUnique({
            where: { id: userId },
            include: { extraProfile: true }
        });
    } catch {
        redirect("/member");
    }

    if (!member) {
        redirect("/member");
    }

    // Parse Custom Fields (ensure plain object for serialization)
    const rawCustom = member.customFields;
    const customFields = typeof rawCustom === 'object' && rawCustom !== null ? JSON.parse(JSON.stringify(rawCustom)) : {};
    const wallet = typeof customFields.wallet === 'string' ? customFields.wallet : '';
    const discord = typeof customFields.discord === 'string' ? customFields.discord : '';
    const bio = typeof customFields.bio === 'string' ? customFields.bio : '';
    const telegramFromFields = typeof customFields.telegram === 'string' ? customFields.telegram : '';
    const address = typeof customFields.address === 'string' ? customFields.address : '';
    // CommunityMember has no image column; use customFields or session
    const profileImage = typeof customFields.profileImage === 'string' ? customFields.profileImage
        : typeof customFields.image === 'string' ? customFields.image
        : (session.user?.image ?? '') || '';

    // Parse Address for City/Country fallback if extraProfile is empty
    let city = member.extraProfile?.city || "";
    let country = member.extraProfile?.country || "";
    if (!city && !country && address) {
        const parts = (address as string).split(',').map((s: string) => s.trim());
        if (parts.length >= 2) {
            city = parts[0];
            country = parts[1];
        } else {
            city = address as string;
        }
    }

    const safeData = {
        fullName: member.name ?? '',
        profileImage: profileImage,
        xHandle: member.xHandle ?? '',
        telegram: member.telegram ?? telegramFromFields,
        wallet,
        discord,
        bio,

        city,
        country,
        currentProject: (member.extraProfile?.currentProject as string) || "",
        availability: (member.extraProfile?.availability as string) || "Just Exploring",
        roles: Array.isArray(member.extraProfile?.roles) ? [...(member.extraProfile.roles as string[])] : [],
        interests: Array.isArray(member.extraProfile?.interests) ? [...(member.extraProfile.interests as string[])] : [],
        skills: Array.isArray(member.extraProfile?.skills) ? [...(member.extraProfile.skills as string[])] : [],
        socialProfiles: Array.isArray(member.extraProfile?.socialProfiles)
            ? (member.extraProfile.socialProfiles as { name?: string; url?: string }[]).map(s => ({ name: String(s?.name ?? ''), url: String(s?.url ?? '') }))
            : [],

        customFields
    };

    return (
        <MemberWrapper>
            <div className="max-w-5xl mx-auto px-4 py-8">
                 <Link href="/member" className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors mb-6 group">
                    <MotionIcon name="ArrowLeft" className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    <span className="text-sm font-medium">Back to Dashboard</span>
                 </Link>
                 
                <ProfileDashboard initialData={safeData} role="MEMBER" />
            </div>
        </MemberWrapper>
    );
}
