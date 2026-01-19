import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { redirect } from "next/navigation";
import { ReactNode } from "react";
import { NotificationPermissionPrompt } from "@/components/NotificationPermissionPrompt";
import PwaUpdatePrompt from "@/components/PWAUpdatePrompt";

export default async function CoreLayout({ children }: { children: ReactNode }) {
    const session = await getServerSession(authOptions);

    // Check if user is authenticated
    if (!session) {
        redirect('/public?error=login_required');
    }

    // Check if user has CORE role
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userRole = (session.user as any)?.role;

    if (userRole !== 'CORE') {
        console.warn(`[Core Layout] Access denied: User with role ${userRole} attempted to access core section`);
        redirect('/public?error=access_denied');
    }

    // User is authenticated and has CORE role, render children
    return (
        <>
            {children}
            <NotificationPermissionPrompt userId={session.user?.id} />
            <PwaUpdatePrompt />
        </>
    );
}
