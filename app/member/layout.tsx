import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { redirect } from "next/navigation";
import { ReactNode } from "react";

export default async function MemberLayout({ children }: { children: ReactNode }) {
    const session = await getServerSession(authOptions);

    // Check if user is authenticated
    if (!session) {
        redirect('/public?error=login_required');
    }

    // Check if user has MEMBER or CORE role (CORE can access member section)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userRole = (session.user as any)?.role;

    if (userRole !== 'MEMBER' && userRole !== 'CORE') {
        console.warn(`[Member Layout] Access denied: User with role ${userRole} attempted to access member section`);
        redirect('/public?error=access_denied');
    }

    // User is authenticated and has MEMBER or CORE role, render children
    return <>{children}</>;
}
