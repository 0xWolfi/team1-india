import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options"; 
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    // @ts-ignore
    const role = session.user.role;
    if (role !== 'MEMBER' && role !== 'CORE') {
        return new NextResponse("Forbidden", { status: 403 });
    }

    try {
        const body = await request.json();
        const { type, name, email, eventDate, eventLocation, contentUrl, programId, internalWorksDescription } = body;

        if (!type || !name || !email) {
            return new NextResponse("Missing required fields", { status: 400 });
        }

        // Validate type-specific fields
        if (type === "event-host" && (!eventDate || !eventLocation)) {
            return new NextResponse("Event date and location are required", { status: 400 });
        }
        if (type === "content" && !contentUrl) {
            return new NextResponse("Content URL is required", { status: 400 });
        }
        if (type === "programs" && !programId) {
            return new NextResponse("Program selection is required", { status: 400 });
        }
        if (type === "internal-works" && !internalWorksDescription) {
            return new NextResponse("Internal works description is required", { status: 400 });
        }

        // Verify email matches session
        if (email !== session.user.email) {
            return new NextResponse("Email mismatch", { status: 403 });
        }

        // Store contribution data
        const contributionData: any = {
            type,
            name,
            email,
            status: "pending",
            submittedAt: new Date(),
        };

        // Add type-specific data
        if (type === "event-host") {
            contributionData.eventDate = eventDate;
            contributionData.eventLocation = eventLocation;
        } else if (type === "content") {
            contributionData.contentUrl = contentUrl;
        } else if (type === "programs") {
            contributionData.programId = programId;
        } else if (type === "internal-works") {
            contributionData.internalWorksDescription = internalWorksDescription;
        }

        // Create contribution record
        const contribution = await prisma.contribution.create({
            data: contributionData
        });

        return NextResponse.json({ success: true, id: contribution.id });
    } catch (error) {
        console.error("Contribution Submission Error", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function GET(request: NextRequest) {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    // @ts-ignore
    const role = session.user.role;
    
    // Only CORE users (superadmins) can view all contributions
    if (role !== 'CORE') {
        // Members can only view their own contributions
        const contributions = await prisma.contribution.findMany({
            where: {
                email: session.user.email,
                deletedAt: null
            },
            orderBy: { submittedAt: 'desc' }
        });
        return NextResponse.json(contributions);
    }

    // @ts-ignore
    const userPermissions = session.user.permissions || {};
    const isSuperAdmin = userPermissions['*'] === 'FULL_ACCESS';

    if (!isSuperAdmin) {
        return new NextResponse("Only Superadmins can view all contributions", { status: 403 });
    }

    try {
        const contributions = await prisma.contribution.findMany({
            where: { deletedAt: null },
            orderBy: { submittedAt: 'desc' }
        });

        // Fetch program titles for contributions with programId
        const contributionsWithPrograms = await Promise.all(
            contributions.map(async (contrib) => {
                if (contrib.programId) {
                    const program = await prisma.guide.findUnique({
                        where: { id: contrib.programId },
                        select: { title: true }
                    });
                    return {
                        ...contrib,
                        programTitle: program?.title || null
                    };
                }
                return contrib;
            })
        );

        return NextResponse.json(contributionsWithPrograms);
    } catch (error) {
        console.error("Contributions Fetch Error", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
