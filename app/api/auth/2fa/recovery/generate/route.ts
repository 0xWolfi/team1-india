import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { generateRecoveryCodes } from "@/lib/2fa/totp";
import { encrypt } from "@/lib/encryption";

// POST /api/auth/2fa/recovery/generate — generate 10 recovery codes
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const codes = generateRecoveryCodes(10);

  await prisma.twoFactorAuth.upsert({
    where: { userEmail: session.user.email },
    update: { recoveryCodes: encrypt(codes.join(",")), recoveryUsed: [] },
    create: { userEmail: session.user.email, recoveryCodes: encrypt(codes.join(",")), recoveryUsed: [] },
  });

  return NextResponse.json({ codes }); // Show once — user must save these
}
