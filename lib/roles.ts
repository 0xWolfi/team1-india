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
// Fixed logic: Check table membership explicitly
export async function getUserRole(email: string): Promise<'CORE' | 'MEMBER' | 'PUBLIC'> {
    // 1. Check Core Member Table
    const member = await prisma.member.findUnique({
        where: { email },
        select: { id: true }
    });

    if (member) return 'CORE';

    // 2. Check Community Member Table
    const communityMember = await prisma.communityMember.findUnique({
        where: { email },
        select: { id: true }
    });

    if (communityMember) return 'MEMBER';

    return 'PUBLIC';
}
