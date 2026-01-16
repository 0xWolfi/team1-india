import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options"; 
import { prisma } from "@/lib/prisma";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    
    // Only CORE users can view member activity
    if (!session?.user?.email) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    // @ts-ignore
    const role = session.user.role;
    if (role !== 'CORE') {
        return new NextResponse("Forbidden", { status: 403 });
    }

    // Check if user is superadmin
    // @ts-ignore
    const userPermissions = session.user.permissions || {};
    const isSuperAdmin = userPermissions['*'] === 'FULL_ACCESS';

    if (!isSuperAdmin) {
        return new NextResponse("Only Superadmins can view member activity", { status: 403 });
    }

    try {
        const { id } = await params;
        
        // Get member
        const member = await prisma.communityMember.findUnique({
            where: { id },
            select: { email: true }
        });

        if (!member) {
            return new NextResponse("Member not found", { status: 404 });
        }

        const memberEmail = member.email;

        // Fetch all activities
        const [applications, experiments, experimentComments] = await Promise.all([
            // Applications
            prisma.application.findMany({
                where: {
                    applicantEmail: memberEmail,
                    deletedAt: null
                },
                include: {
                    guide: {
                        select: {
                            id: true,
                            title: true,
                            type: true,
                            coverImage: true
                        }
                    }
                },
                orderBy: { submittedAt: 'desc' }
            }),
            // Experiments (proposals)
            prisma.experiment.findMany({
                where: {
                    createdByEmail: memberEmail,
                    deletedAt: null
                },
                select: {
                    id: true,
                    title: true,
                    description: true,
                    stage: true,
                    upvotes: true,
                    createdAt: true
                },
                orderBy: { createdAt: 'desc' }
            }),
            // Experiment Comments
            prisma.experimentComment.findMany({
                where: {
                    authorEmail: memberEmail,
                    deletedAt: null
                },
                include: {
                    experiment: {
                        select: {
                            id: true,
                            title: true
                        }
                    }
                },
                orderBy: { createdAt: 'desc' }
            })
        ]);

        return NextResponse.json({
            applications,
            experiments,
            experimentComments,
            stats: {
                totalApplications: applications.length,
                pendingApplications: applications.filter(a => a.status === 'pending').length,
                approvedApplications: applications.filter(a => a.status === 'approved').length,
                rejectedApplications: applications.filter(a => a.status === 'rejected').length,
                totalExperiments: experiments.length,
                totalComments: experimentComments.length
            }
        });
    } catch (error) {
        console.error("Member Activity Fetch Error", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
