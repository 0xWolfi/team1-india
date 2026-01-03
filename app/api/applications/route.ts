import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import * as z from "zod";

const SubmitApplicationSchema = z.object({
  guideId: z.string().uuid(),
  data: z.record(z.string(), z.any())
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    // Allowing public submission? Or require login?
    // Let's require login for now to track applicant email easily, or allow manual email input.
    // Schema has 'applicantEmail', so we can use session email or body email.
    
    // For now, let's assume if logged in use that, else check body (not in schema yet but easy to add).
    // Actually, Application model has applicantEmail.

    const body = await req.json();
    const result = SubmitApplicationSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: "Invalid Request", details: result.error.format() }, { status: 400 });
    }

    const { guideId, data } = result.data;
    const email = session?.user?.email || body.email || "anonymous";

    const application = await prisma.application.create({
      data: {
        guideId,
        data: data as any,
        applicantEmail: email,
        status: "PENDING"
      }
    });

    return NextResponse.json(application, { status: 201 });
  } catch (error) {
    console.error("Failed to submit application:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
