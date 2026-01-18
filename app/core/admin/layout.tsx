import React from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { notFound } from "next/navigation";
import { CoreWrapper } from "@/components/core/CoreWrapper";

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await getServerSession(authOptions);

    // Check if user is authenticated
    if (!session?.user?.email) {
        notFound();
    }

    // Check if user has CORE role
    // @ts-ignore
    const userRole = session.user?.role;
    if (userRole !== 'CORE') {
        notFound();
    }

    // Check if user is superadmin
    // @ts-ignore
    const userPermissions = session.user?.permissions || {};
    const isSuperAdmin = userPermissions['*'] === 'FULL_ACCESS';

    if (!isSuperAdmin) {
        // Return 404 for non-superadmins
        notFound();
    }

    // Only superadmins can access this page
    return (
        <CoreWrapper>
            {children}
        </CoreWrapper>
    );
}
