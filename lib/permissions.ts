
export type PermissionLevel = 'READ' | 'WRITE' | 'FULL_ACCESS';

export const PERMISSIONS = {
    READ: 'READ',
    WRITE: 'WRITE',
    FULL_ACCESS: 'FULL_ACCESS'
};

export function hasPermission(
    userPermissions: Record<string, string>, 
    resource: string, 
    requiredLevel: PermissionLevel
): boolean {
    const userLevel = userPermissions[resource] || userPermissions['*'];
    
    if (!userLevel) return false;
    if (userLevel === 'FULL_ACCESS') return true;
    if (requiredLevel === 'READ') return true; // Any permission implies READ
    if (requiredLevel === 'WRITE' && userLevel === 'WRITE') return true;

    return false;
}

export function checkCoreAccess(session: any): { authorized: boolean; response?: Response } {
    if (!session?.user?.email) {
        return { authorized: false, response: new Response("Unauthorized", { status: 401 }) };
    }
    // @ts-ignore
    if (session.user.role !== 'CORE') {
        return { authorized: false, response: new Response("Forbidden. Core access required.", { status: 403 }) };
    }
    return { authorized: true };
}
