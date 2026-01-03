import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");
    const resource = searchParams.get("resource");
    const actorId = searchParams.get("actorId");
    
    // Date Filtering (Optional)
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const skip = (page - 1) * limit;

    const where: any = {
      deletedAt: null,
    };

    if (action && action !== "ALL") where.action = action;
    if (resource && resource !== "ALL") where.resource = resource;
    if (actorId && actorId !== "ALL") where.actorId = actorId;

    if (from || to) {
        where.createdAt = {};
        if (from) where.createdAt.gte = new Date(from);
        if (to) where.createdAt.lte = new Date(to);
    }

    // Parallel fetch for valid pagination
    const [total, logs] = await Promise.all([
        // @ts-ignore
        prisma.auditLog.count({ where }),
        // @ts-ignore
        prisma.auditLog.findMany({
          where,
          orderBy: { createdAt: "desc" },
          take: limit,
          skip: skip,
          include: {
            actor: {
              select: { name: true, image: true, email: true }
            }
          }
        })
    ]);

    return NextResponse.json({
        items: logs,
        pagination: {
            total,
            page,
            limit,
            pages: Math.ceil(total / limit)
        }
    });
  } catch (error) {
    console.error("[LOGS_GET]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
