import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    // Ensure user is admin/core
    if (!session?.user?.id || session.user.role !== 'CORE') {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { status } = await req.json();

    if (!['PENDING', 'APPROVED', 'REJECTED'].includes(status)) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const application = await prisma.application.update({
      where: { id },
      data: { status }
    });

    return NextResponse.json(application);
  } catch (error) {
    console.error("Failed to update application:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
