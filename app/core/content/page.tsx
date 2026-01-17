import React from 'react';
import { Plus, BookOpen } from 'lucide-react';
import Link from 'next/link';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import { CoreWrapper } from "@/components/core/CoreWrapper";
import { CorePageHeader } from "@/components/core/CorePageHeader";
import { GuideList } from '@/components/guides/GuideList';

export const dynamic = 'force-dynamic';

export default async function ContentPage() {
    const session = await getServerSession(authOptions);
    // @ts-ignore
    const userPermissions = session?.user?.permissions || {};
    const canCreate = hasPermission(userPermissions, "content", "WRITE");

    const rawGuides = await prisma.guide.findMany({
        where: { 
            type: 'CONTENT',
            deletedAt: null
        },
        orderBy: { createdAt: 'desc' },
        include: { createdBy: true }
    });

    const guides = rawGuides.map(g => ({
        ...g,
        createdAt: g.createdAt.toISOString(),
        updatedAt: g.updatedAt.toISOString(),
        // Ensure body is typed correctly or cast it if needed, GuideList expects { description: string } inside body
        body: g.body as any
    }));

    return (
        <CoreWrapper>
             <CorePageHeader
                title="Content"
                description="Manage content guidelines, templates, and publishing workflows."
                icon={<BookOpen className="w-5 h-5 text-red-500" />}
             >
                {canCreate && (
                    <Link href="/core/content/guides/new">
                        <button className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-lg font-bold text-xs hover:bg-zinc-200 transition-colors">
                            <Plus className="w-4 h-4" /> Create Guide
                        </button>
                    </Link>
                )}
             </CorePageHeader>

            <GuideList 
                guides={guides as any} 
                basePath="/core/content/guides" 
                canWrite={canCreate}
            />
        </CoreWrapper>
    );
}
