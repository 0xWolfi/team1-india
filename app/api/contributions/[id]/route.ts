import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options"; 
import { prisma } from "@/lib/prisma";
import { checkCoreAccess } from "@/lib/permissions";

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    const access = checkCoreAccess(session);
    if (!access.authorized) return access.response!;

    // @ts-ignore
    const userPermissions = session.user.permissions || {};
    const isSuperAdmin = userPermissions['*'] === 'FULL_ACCESS';

    if (!isSuperAdmin) {
        return new NextResponse("Only Superadmins can approve/reject contributions", { status: 403 });
    }

    try {
        const { id } = await params;
        const body = await request.json();
        const { status } = body;

        if (!status || (status !== 'approved' && status !== 'rejected' && status !== 'pending')) {
            return new NextResponse("Invalid status. Must be 'approved', 'rejected', or 'pending'", { status: 400 });
        }

        const updatedContribution = await prisma.contribution.update({
            where: { id },
            data: { status },
            select: {
                id: true,
                type: true,
                name: true,
                email: true,
                status: true,
                submittedAt: true,
                eventDate: true,
                eventLocation: true,
                contentUrl: true,
                programId: true,
                internalWorksDescription: true
            }
        });

        return NextResponse.json(updatedContribution);
    } catch (error) {
        console.error("Contribution Update Error", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
