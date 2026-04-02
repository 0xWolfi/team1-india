import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options"; 
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { log } from "@/lib/logger";

// Zod validation schema for contribution submission
const ContributionSchema = z.object({
    type: z.enum(["event-host", "content", "programs", "internal-works", "quest-fullstack", "quest-creator", "quest-builder"]),
    name: z.string().min(1).max(200),
    email: z.string().email(),
    eventDate: z.string().optional(),
    eventLocation: z.string().max(500).optional(),
    contentUrl: z.string().url().optional(),
    programId: z.string().uuid().optional().nullable(),
    internalWorksDescription: z.string().max(5000).optional(),
    links: z.array(z.object({ label: z.string(), url: z.string().url() })).optional(),
}).refine((data) => {
    if (data.type === "event-host") {
        return data.eventDate && data.eventLocation;
    }
    if (data.type === "content") {
        return data.contentUrl;
    }
    if (data.type === "programs") {
        return data.programId;
    }
    if (data.type === "internal-works") {
        return data.internalWorksDescription && data.internalWorksDescription.length > 0;
    }
    if (data.type.startsWith("quest-")) {
        return data.links && data.links.length > 0;
    }
    return true;
}, {
    message: "Type-specific fields are required"
});

export async function POST(request: NextRequest) {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // @ts-ignore
    const role = session.user.role;
    if (role !== 'MEMBER' && role !== 'CORE') {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        const body = await request.json();
        
        // Validate input with Zod
        const validationResult = ContributionSchema.safeParse(body);
        if (!validationResult.success) {
            log("WARN", "Invalid contribution submission", "CONTRIBUTIONS", { 
                email: session.user.email,
                errors: validationResult.error.flatten()
            });
            return NextResponse.json({ 
                error: "Invalid input", 
                details: validationResult.error.flatten() 
            }, { status: 400 });
        }

        const data = validationResult.data;

        // Verify email matches session (security check)
        if (data.email !== session.user.email) {
            log("WARN", "Email mismatch in contribution submission", "CONTRIBUTIONS", { 
                sessionEmail: session.user.email,
                providedEmail: data.email
            });
            return NextResponse.json({ error: "Email mismatch" }, { status: 403 });
        }

        // Store contribution data
        const contributionData: any = {
            type: data.type,
            name: data.name,
            email: data.email,
            status: "pending",
            submittedAt: new Date(),
        };

        // Add type-specific data
        if (data.type === "event-host") {
            contributionData.eventDate = data.eventDate;
            contributionData.eventLocation = data.eventLocation;
        } else if (data.type === "content") {
            contributionData.contentUrl = data.contentUrl;
        } else if (data.type === "programs") {
            contributionData.programId = data.programId;
        } else if (data.type === "internal-works") {
            contributionData.internalWorksDescription = data.internalWorksDescription;
        } else if (data.type.startsWith("quest-")) {
            contributionData.links = data.links || [];
        }

        // Create contribution record
        const contribution = await prisma.contribution.create({
            data: contributionData
        });

        log("INFO", "Contribution submitted", "CONTRIBUTIONS", { 
            contributionId: contribution.id,
            type: data.type,
            email: data.email
        });

        return NextResponse.json({ success: true, id: contribution.id });
    } catch (error) {
        log("ERROR", "Contribution submission failed", "CONTRIBUTIONS", { 
            email: session.user.email 
        }, error instanceof Error ? error : new Error(String(error)));
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}

export async function GET(request: NextRequest) {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // @ts-ignore
    const role = session.user.role;
    
    // CORE users (superadmin + admin) can view all contributions
    const canViewAll = role === 'CORE';

    if (!canViewAll) {
        try {
            // Members can only view their own contributions
            const contributions = await prisma.contribution.findMany({
                where: {
                    email: session.user.email,
                    deletedAt: null
                },
                orderBy: { submittedAt: 'desc' }
            });
            return NextResponse.json(contributions);
        } catch (error) {
            log("ERROR", "Failed to fetch member contributions", "CONTRIBUTIONS", {
                email: session.user.email
            }, error instanceof Error ? error : new Error(String(error)));
            return NextResponse.json({ error: "Internal Error" }, { status: 500 });
        }
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
        log("ERROR", "Failed to fetch all contributions", "CONTRIBUTIONS", { 
            email: session.user.email 
        }, error instanceof Error ? error : new Error(String(error)));
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
