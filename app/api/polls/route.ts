import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

export async function GET(req: NextRequest) {
    try {
        const polls = await prisma.poll.findMany({
            orderBy: { createdAt: 'desc' }
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
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await req.json();
        const { question, options } = body;

        if (!question || !options || !Array.isArray(options)) {
            return NextResponse.json({ error: "Invalid data" }, { status: 400 });
        }

        const poll = await prisma.poll.create({
            data: {
                question,
                options
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
        // Voting doesn't require auth for now? Or maybe check session. Strict for now?
        // Let's assume open voting or basic auth check.
        const body = await req.json();
        const { id, type, optionId, status } = body; 
        // type: 'VOTE' | 'STATUS'

        if (type === 'STATUS') {
            const updated = await prisma.poll.update({
                where: { id },
                data: { status }
            });
            return NextResponse.json(updated);
        }

        if (type === 'VOTE' && optionId) {
            // Needed to fetch current options, update count, save back.
            // Concurrency issue? Yes, but low traffic.
            const poll = await prisma.poll.findUnique({ where: { id } });
            if (!poll) return NextResponse.json({ error: "Poll not found" }, { status: 404 });

            const options = poll.options as any[];
            const newOptions = options.map((opt: any) => 
                opt.id === optionId ? { ...opt, votes: opt.votes + 1 } : opt
            );

            const updated = await prisma.poll.update({
                where: { id },
                data: { options: newOptions }
            });
            return NextResponse.json(updated);
        }

        return NextResponse.json({ error: "Invalid action" }, { status: 400 });

    } catch (error) {
         console.error("PATCH /api/polls error:", error);
         return NextResponse.json({ error: "Update failed", details: String(error) }, { status: 500 });
    }
}
