
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

        const applicantEmail = body.data?.email || body.email;
        if (!applicantEmail) {
            return NextResponse.json({ error: "Email is required" }, { status: 400 });
        }

        // Check for existing submission within last 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const existingApplication = await prisma.application.findFirst({
            where: {
                guideId: body.guideId,
                applicantEmail: applicantEmail,
                submittedAt: {
                    gte: sevenDaysAgo
                },
                deletedAt: null
            },
            orderBy: { submittedAt: 'desc' }
        });

        if (existingApplication) {
            const daysSinceSubmission = Math.floor(
                (Date.now() - new Date(existingApplication.submittedAt).getTime()) / (1000 * 60 * 60 * 24)
            );
            const daysRemaining = 7 - daysSinceSubmission;

            return NextResponse.json({
                error: "You have already submitted an application for this event",
                message: `You can submit again in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}`,
                canReapplyAt: new Date(new Date(existingApplication.submittedAt).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()
            }, { status: 429 });
        }

        const application = await prisma.application.create({
            data: {
                guideId: body.guideId,
                applicantEmail: applicantEmail,
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
