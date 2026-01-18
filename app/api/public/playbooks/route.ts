import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withRateLimit } from "@/lib/rate-limit";
import { NextRequest } from "next/server";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
    // Rate limiting: 20 requests per minute per IP (public endpoint, prevent abuse)
    const rateLimitResponse = await withRateLimit(20, 60 * 1000)(request);
    if (rateLimitResponse) {
        return rateLimitResponse;
    }

    try {
        const playbooks = await prisma.playbook.findMany({
            where: { 
                visibility: "PUBLIC",
                deletedAt: null // Only show non-deleted playbooks
            },
            orderBy: { updatedAt: "desc" }, // Use updatedAt to show recently updated playbooks first
            select: { 
                id: true, 
                title: true, 
                description: true, 
                coverImage: true, 
                createdAt: true,
                updatedAt: true,
                visibility: true,
                createdBy: {
                    select: {
                        name: true
                    }
                }
            },
        });
        
        // Log for debugging
        console.log(`[API] GET /api/public/playbooks - Found ${playbooks.length} public playbooks`);
        playbooks.forEach((p: any) => {
            console.log(`[API] - ${p.title} (${p.id}) - visibility: ${p.visibility}, updatedAt: ${p.updatedAt}`);
        });
        
        // Add cache headers to prevent caching
        return NextResponse.json(playbooks, {
            headers: {
                'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0',
            }
        });
    } catch (error) {
        console.error("[API] GET /api/public/playbooks Failed", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
