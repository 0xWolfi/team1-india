
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
    
    // Check for explicit DENY (defense in depth)
    if (userLevel === 'DENY' || userLevel === 'deny') return false;
    
    if (userLevel === 'FULL_ACCESS') return true;
    
    // READ access: user must have at least READ permission
    if (requiredLevel === 'READ') {
        return userLevel === 'READ' || userLevel === 'WRITE' || userLevel === 'FULL_ACCESS';
    }
    
    // WRITE access: user must have WRITE or FULL_ACCESS
    if (requiredLevel === 'WRITE') {
        return userLevel === 'WRITE' || userLevel === 'FULL_ACCESS';
    }
    
    // FULL_ACCESS required: user must have exactly FULL_ACCESS
    if (requiredLevel === 'FULL_ACCESS') {
        return userLevel === 'FULL_ACCESS';
    }

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

/**
 * Speedrun run-management gate. CORE-only baseline matches existing behavior;
 * a SuperAdmin can explicitly DENY a single CORE user via `speedrun: 'DENY'`
 * in their permissions JSON, or grant non-write surfaces via `speedrun: 'READ'`.
 *
 * Default for CORE users with no explicit `speedrun` key is WRITE — this
 * preserves the pre-permission-key behavior. Tighten later by setting an
 * explicit `default: 'READ'` policy.
 */
export function checkSpeedrunAccess(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    session: any,
    requiredLevel: PermissionLevel = 'WRITE'
): { authorized: boolean; response?: Response } {
    if (!session?.user?.email) {
        return { authorized: false, response: new Response("Unauthorized", { status: 401 }) };
    }
    if (session.user.role !== 'CORE') {
        return { authorized: false, response: new Response("Forbidden", { status: 403 }) };
    }
    const perms: Record<string, string> = session.user.permissions || {};
    const explicit = perms['speedrun'];

    if (explicit === 'DENY' || explicit === 'deny') {
        return { authorized: false, response: new Response("Forbidden", { status: 403 }) };
    }
    if (perms['*'] === 'FULL_ACCESS') return { authorized: true };
    if (explicit) {
        return hasPermission(perms, 'speedrun', requiredLevel)
            ? { authorized: true }
            : { authorized: false, response: new Response("Forbidden", { status: 403 }) };
    }
    // No explicit grant — default to allow for CORE users.
    return { authorized: true };
}
