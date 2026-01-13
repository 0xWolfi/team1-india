
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
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
