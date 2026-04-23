import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";

// GET /api/auth/2fa/status — check 2FA status
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const twoFactor = await prisma.twoFactorAuth.findUnique({
    where: { userEmail: session.user.email },
    select: { totpEnabled: true, passkeyEnabled: true, passkeys: { select: { id: true, deviceName: true, lastUsedAt: true } } },
  });

  return NextResponse.json({
    enabled: !!(twoFactor?.totpEnabled || twoFactor?.passkeyEnabled),
    totp: twoFactor?.totpEnabled ?? false,
    passkey: twoFactor?.passkeyEnabled ?? false,
    passkeys: twoFactor?.passkeys ?? [],
  });
}
