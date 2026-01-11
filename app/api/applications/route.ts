
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: Request) {
    try {
        const body = await req.json();

        // Basic validation
        if (!body.guideId) {
            return NextResponse.json({ error: "Guide ID is required" }, { status: 400 });
        }

        const application = await prisma.application.create({
            data: {
                guideId: body.guideId,
                applicantEmail: body.data?.email || body.email,
                status: "pending",
                data: {
                    ...body.data,
                    submittedAt: new Date().toISOString()
                }
            }
        });

        return NextResponse.json({ success: true, id: application.id });
    } catch (error) {
        console.error("Application Submit Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function GET(req: Request) {
    // SECURITY: This should be protected in production (check session). 
    // Assuming this route is for the admin panel which is protected or checking auth here.
    // For now, fetching all pending applications.
    try {
        const applications = await prisma.application.findMany({
            orderBy: { submittedAt: 'desc' },
            include: {
                guide: { select: { title: true, type: true } }
            }
        });
        return NextResponse.json(applications);
    } catch (error) {
        return NextResponse.json({ error: "Error fetching applications" }, { status: 500 });
    }
}
