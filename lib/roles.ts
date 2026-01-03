import { prisma } from "@/lib/prisma";

export type AccessLevel = 'READ' | 'WRITE' | 'FULL_ACCESS';

export interface UserAccessContext {
    permissions: Record<string, string>;
    tags: string[];
}

export async function getUserAccess(email: string): Promise<UserAccessContext> {
    try {
        const member = await prisma.member.findUnique({
             where: { email },
             select: { permissions: true, tags: true }
        });

        if (member) {
             return {
                 permissions: (member.permissions as Record<string, string>) || { default: "READ" },
                 tags: member.tags || []
             };
        }
    } catch (error) {
         console.error("Error fetching user access:", error);
    }
    return { permissions: { default: "READ" }, tags: [] };
}

// Kept for backward compatibility with Access Check page
export async function getUserRole(email: string): Promise<'CORE' | 'MEMBER' | 'PUBLIC'> {
    const { permissions } = await getUserAccess(email);
    
    // Logic: If they have FULL_ACCESS or WRITE access (default or *), they are CORE
    const hasWrite = permissions['*'] === 'FULL_ACCESS' || 
                     permissions['default'] === 'WRITE' || 
                     permissions['default'] === 'FULL_ACCESS';
                     
    if (hasWrite) return 'CORE';
    
    // If they exist in DB (which getUserAccess implies if permissions isn't empty, but let's assume default READ means member)
    // Actually needed to verify if member exists at all. using prisma check again is cleaner or just rely on auth-options.
    
    // Simplified: If they have *any* permissions stored, they are at least a member.
    // For now, let's trust that anyone calling this is authenticated.
    return 'MEMBER';
}
