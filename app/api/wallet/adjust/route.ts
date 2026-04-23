import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { adminAdjust } from "@/lib/wallet";

// POST /api/wallet/adjust — admin manual adjustment
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // CORE only
  if ((session.user as any)?.role !== "CORE") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { userEmail, xp, points, description } = body as {
    userEmail: string;
    xp?: number;
    points?: number;
    description?: string;
  };

  if (!userEmail) {
    return NextResponse.json({ error: "userEmail is required" }, { status: 400 });
  }

  if ((xp ?? 0) === 0 && (points ?? 0) === 0) {
    return NextResponse.json({ error: "xp or points must be non-zero" }, { status: 400 });
  }

  try {
    await adminAdjust(
      userEmail,
      xp ?? 0,
      points ?? 0,
      description || "Manual adjustment",
      session.user.email
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
