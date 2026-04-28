import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { ProfileDashboard } from "@/components/public/profile/ProfileDashboard";
import { Footer } from "@/components/website/Footer";

export default async function PublicProfilePage() {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
        redirect("/public");
    }

    // @ts-ignore
    const userId = session.user.id;
    // @ts-ignore
    const role = session.user.role;

    // Strict role check
    if (role !== 'PUBLIC') {
        // If it's a member, redirect to member dashboard
        if (role === 'CORE') redirect("/core");
        if (role === 'MEMBER') redirect("/member");
        redirect("/public");
    }

    const publicUser = await prisma.publicUser.findUnique({
        where: { id: userId }
    });

    if (!publicUser) {
        // Session exists but DB record missing? Logout or recreate?
        // Cleanest is redirect to logout or public home
        redirect("/public");
    }

    // Ensure array fields are arrays (Prisma JSON types can be anything)
    const safeData = {
        ...publicUser,
        roles: Array.isArray(publicUser.roles) ? publicUser.roles : [],
        interests: Array.isArray(publicUser.interests) ? publicUser.interests : [],
        preferredChains: Array.isArray(publicUser.preferredChains) ? publicUser.preferredChains : [],
        socialProfiles: typeof publicUser.socialProfiles === 'object' ? publicUser.socialProfiles : {},
    };

    return (
        <main className="min-h-screen bg-white dark:bg-black text-black dark:text-white selection:bg-zinc-200 dark:selection:bg-zinc-800 selection:text-zinc-700 dark:selection:text-zinc-200 relative">
            <div className="pt-16 px-4 sm:px-6 md:px-8 max-w-7xl mx-auto relative z-10">
                 <div className="mb-8">
                     <Link href="/public" className="inline-flex items-center gap-2 text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white transition-colors mb-6 group">
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform"/>
                        <span className="text-sm font-medium">Back to Home</span>
                     </Link>
                     <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-2">My Profile</h2>
                     <p className="text-zinc-500 dark:text-zinc-400">Manage your identity and preferences across the Team1 Network.</p>
                 </div>

                 <ProfileDashboard initialData={safeData} role="PUBLIC" />
            </div>

            <Footer />
        </main>
    );
}
