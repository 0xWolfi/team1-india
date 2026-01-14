import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ valid: false, reason: "no_session" }, { status: 401 });
    }

    const email = session.user.email.trim();
    
    // Check if user exists in Member table
    const member = await prisma.member.findFirst({
      where: { 
        email: { equals: email, mode: 'insensitive' },
        deletedAt: null // Ensure not soft-deleted
      },
      select: { id: true, status: true }
    });

    if (member) {
      // Also check if status is active (if status field exists and matters)
      if (member.status && member.status !== 'active') {
        return NextResponse.json({ valid: false, reason: "inactive" }, { status: 403 });
      }
      return NextResponse.json({ valid: true, role: 'CORE' });
    }

    // Check if user exists in CommunityMember table
    const communityMember = await prisma.communityMember.findFirst({
      where: { 
        email: { equals: email, mode: 'insensitive' },
        deletedAt: null // Ensure not soft-deleted
      },
      select: { id: true, status: true }
    });

    if (communityMember) {
      // Check status if it exists
      if (communityMember.status && communityMember.status !== 'active') {
        return NextResponse.json({ valid: false, reason: "inactive" }, { status: 403 });
      }
      return NextResponse.json({ valid: true, role: 'MEMBER' });
    }

    // User doesn't exist in either table - they've been deleted
    return NextResponse.json({ valid: false, reason: "not_found" }, { status: 404 });
  } catch (error) {
    console.error("[API] /api/auth/check-validity error:", error);
    return NextResponse.json({ valid: false, reason: "server_error" }, { status: 500 });
  }
}
