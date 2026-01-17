import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

// POLLS API (Using ContentResource)
// customFields structure:
// {
//   audience: 'CORE' | 'PUBLIC',
//   options: [
//      { id: '1', text: 'Yes', voters: [{ id: 'u1', name: 'John', image: '...' }] }
//   ]
// }

export async function GET(req: NextRequest) {
    try {
        const polls = await prisma.contentResource.findMany({
            where: { 
                type: 'POLL',
                deletedAt: null
            },
            orderBy: [
                { status: 'asc' }, // active drafts first? actually we use 'active'/'closed'
                { createdAt: 'desc' }
            ]
        });
        return NextResponse.json(polls);
    } catch (error) {
        console.error("GET /api/polls error:", error);
        return NextResponse.json({ error: "Failed to fetch polls", details: String(error) }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await req.json();
        const { question, options, audience } = body;

        if (!question || !options || !Array.isArray(options)) {
            return NextResponse.json({ error: "Invalid data" }, { status: 400 });
        }

        // Initialize options with empty voters array
        const formattedOptions = options.map((opt: string, idx: number) => ({
            id: `opt-${Date.now()}-${idx}`,
            text: opt,
            voters: []
        }));

        const creator = await prisma.member.findUnique({ where: { email: session.user.email } });

        const poll = await prisma.contentResource.create({
            data: {
                title: question,
                type: 'POLL',
                status: 'ACTIVE',
                customFields: {
                    audience: audience || 'CORE',
                    options: formattedOptions
                },
                createdById: creator?.id
            }
        });

        return NextResponse.json(poll);
    } catch (error) {
        console.error("POST /api/polls error:", error);
        return NextResponse.json({ error: "Failed to create poll", details: String(error) }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await req.json();
        const { id, type, optionId, status } = body; 
        
        const voter = await prisma.member.findUnique({ where: { email: session.user.email } });
        if (!voter) return NextResponse.json({ error: "User not found" }, { status: 404 });

        const poll = await prisma.contentResource.findUnique({ where: { id } });
        if (!poll) return NextResponse.json({ error: "Poll not found" }, { status: 404 });

        // STATUS TOGGLE
        if (type === 'STATUS') {
            const updated = await prisma.contentResource.update({
                where: { id },
                data: { status }
            });
            return NextResponse.json(updated);
        }

        // VOTE
        if (type === 'VOTE' && optionId) {
            const customFields = poll.customFields as any;
            const options = customFields.options || [];

            // Check if already voted in any option
            const hasVoted = options.some((opt: any) => 
                opt.voters?.some((v: any) => v.id === voter.id)
            );

            if (hasVoted) {
                 return NextResponse.json({ error: "Already voted" }, { status: 400 });
            }

            // Add voter to selected option
            const newOptions = options.map((opt: any) => {
                if (opt.id === optionId) {
                    const currentVoters = opt.voters || [];
                    return {
                        ...opt,
                        voters: [...currentVoters, {
                            id: voter.id,
                            name: voter.name || "Unknown",
                            image: voter.image
                        }]
                    };
                }
                return opt;
            });

            const updated = await prisma.contentResource.update({
                where: { id },
                data: {
                    customFields: {
                        ...customFields,
                        options: newOptions
                    }
                }
            });
            return NextResponse.json(updated);
        }

        return NextResponse.json({ error: "Invalid action" }, { status: 400 });

    } catch (error) {
         console.error("PATCH /api/polls error:", error);
         return NextResponse.json({ error: "Update failed", details: String(error) }, { status: 500 });
    }
}
