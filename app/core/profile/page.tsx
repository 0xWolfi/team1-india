import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { CoreWrapper } from "@/components/core/CoreWrapper";
import { ProfileDashboard } from "@/components/public/profile/ProfileDashboard";
import { MotionIcon } from "motion-icons-react";
import Link from "next/link";

export default async function CoreProfilePage() {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
        redirect("/core");
    }

    // @ts-ignore
    const userId = session.user.id;
    // @ts-ignore
    const role = session.user.role;

    // Check Role
    if (role !== 'CORE') {
        // Core users might be able to view member dashboard, but this is the core profile route
        if (role === 'MEMBER') redirect("/member");
        if (role === 'PUBLIC') redirect("/public");
        redirect("/core");
    }

    const member = await prisma.member.findUnique({
        where: { id: userId },
        include: { extraProfile: true }
    });

    if (!member) {
        redirect("/core");
    }

    // Parse Custom Fields
    const customFields = typeof member.customFields === 'object' && member.customFields ? member.customFields : {};
    // @ts-ignore
    const { wallet, discord, bio, telegram, address } = customFields;
    
    // Parse Address for City/Country fallback if extraProfile is empty
    let city = member.extraProfile?.city || "";
    let country = member.extraProfile?.country || "";
    
    if (!city && !country && address) {
         const parts = (address as string).split(',').map((s: string) => s.trim());
         if (parts.length >= 2) {
             city = parts[0];
             country = parts[1]; // simplified
         } else {
             city = address as string;
         }
    }

    const safeData = {
        fullName: member.name,
        profileImage: member.image,
        xHandle: member.xHandle,
        telegram: telegram, 
        wallet: wallet,
        discord: discord,
        bio: bio,
        
        // Extra Profile
        city: city,
        country: country,
        currentProject: member.extraProfile?.currentProject || "",
        availability: member.extraProfile?.availability || "Just Exploring",
        roles: Array.isArray(member.extraProfile?.roles) ? member.extraProfile.roles : [],
        interests: Array.isArray(member.extraProfile?.interests) ? member.extraProfile.interests : [],
        skills: Array.isArray(member.extraProfile?.skills) ? member.extraProfile.skills : [],
        socialProfiles: typeof member.extraProfile?.socialProfiles === 'object' ? member.extraProfile.socialProfiles : [],
        
        // Pass complete customFields for save parity if needed
        customFields: customFields
    };

    return (
        <CoreWrapper>
            <div className="max-w-5xl mx-auto px-4 py-8">
                 <Link href="/core" className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors mb-6 group">
                    <MotionIcon name="ArrowLeft" className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    <span className="text-sm font-medium">Back to Core</span>
                 </Link>
                 
                <ProfileDashboard initialData={safeData} role="CORE" />
            </div>
        </CoreWrapper>
    );
}
