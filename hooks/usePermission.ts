import { useSession } from "next-auth/react";
import { PERMISSIONS, hasPermission, PermissionLevel } from "@/lib/permissions";

export function usePermission(resource: string, level: PermissionLevel = 'READ') {
    const { data: session } = useSession();
    
    if (!session?.user) return false;

    // @ts-ignore
    const userPermissions = session.user.permissions || {};
    
    return hasPermission(userPermissions, resource, level);
}
