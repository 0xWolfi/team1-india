import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { MemberWrapper } from "@/components/member/MemberWrapper";
import { ProfileDashboard } from "@/components/public/profile/ProfileDashboard";
import { MotionIcon } from "motion-icons-react";
import Link from "next/link";

export default async function MemberProfilePage() {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
        redirect("/member");
    }

    // @ts-ignore
    const userId = session.user.id;
    // @ts-ignore
    const role = session.user.role;

    // Check Role
    if (role !== 'MEMBER') {
        if (role === 'CORE') redirect("/core");
        if (role === 'PUBLIC') redirect("/public");
        redirect("/member");
    }

    // For MEMBER role, session.user.id is the CommunityMember id (not Member table).
    const member = await prisma.communityMember.findUnique({
        where: { id: userId },
        include: { extraProfile: true }
    });

    if (!member) {
        redirect("/member");
    }

    // Parse Custom Fields
    const customFields = typeof member.customFields === 'object' && member.customFields ? member.customFields : {};
    // @ts-ignore
    const { wallet, discord, bio, telegram, address } = customFields;
    // CommunityMember has no image column; use customFields or session
    const profileImage = (customFields as { profileImage?: string; image?: string }).profileImage
        ?? (customFields as { image?: string }).image
        ?? session.user?.image
        ?? null;

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
        fullName: member.name,
        profileImage: profileImage,
        xHandle: member.xHandle,
        telegram: member.telegram ?? telegram,
        wallet: wallet,
        discord: discord,
        bio: bio,

        city: city,
        country: country,
        currentProject: member.extraProfile?.currentProject || "",
        availability: member.extraProfile?.availability || "Just Exploring",
        roles: Array.isArray(member.extraProfile?.roles) ? member.extraProfile.roles : [],
        interests: Array.isArray(member.extraProfile?.interests) ? member.extraProfile.interests : [],
        skills: Array.isArray(member.extraProfile?.skills) ? member.extraProfile.skills : [],
        socialProfiles: typeof member.extraProfile?.socialProfiles === 'object' ? member.extraProfile.socialProfiles : [],

        customFields: customFields
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
