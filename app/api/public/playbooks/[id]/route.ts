
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withRateLimit } from "@/lib/rate-limit";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    // Rate limiting: 20 requests per minute per IP (public endpoint, prevent abuse)
    const rateLimitResponse = await withRateLimit(20, 60 * 1000)(request);
    if (rateLimitResponse) {
        return rateLimitResponse;
    }

    try {
        const { id } = await params;
        const playbook = await prisma.playbook.findFirst({
            where: { 
                id,
                deletedAt: null, // Only show non-deleted playbooks
                visibility: 'PUBLIC' // Only show public playbooks
            },
             include: {
                createdBy: { select: { email: true, id: true } }
            }
        });

        if (!playbook) return new NextResponse("Not found", { status: 404 });

        return NextResponse.json(playbook);
    } catch (error) {
        console.error("Failed to fetch public playbook", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
