import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/projects/[id]/versions — version timeline
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const versions = await prisma.projectVersion.findMany({
    where: { projectId: id },
    orderBy: { versionNum: "desc" },
    select: {
      id: true,
      versionNum: true,
      title: true,
      changes: true,
      createdBy: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ versions });
}
