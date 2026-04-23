import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { verifyTotp } from "@/lib/2fa/totp";
import { decrypt } from "@/lib/encryption";

// POST /api/auth/2fa/challenge — verify 2FA during login
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { code, method } = await request.json();
  // method: "totp" or "recovery"

  const twoFactor = await prisma.twoFactorAuth.findUnique({ where: { userEmail: session.user.email } });
  if (!twoFactor) return NextResponse.json({ error: "2FA not configured" }, { status: 400 });

  if (method === "recovery") {
    if (!twoFactor.recoveryCodes) return NextResponse.json({ error: "No recovery codes" }, { status: 400 });
    const codes = decrypt(twoFactor.recoveryCodes).split(",");
    const upperCode = code.toUpperCase();
    if (!codes.includes(upperCode) || twoFactor.recoveryUsed.includes(upperCode)) {
      return NextResponse.json({ error: "Invalid recovery code" }, { status: 400 });
    }
    await prisma.twoFactorAuth.update({
      where: { userEmail: session.user.email },
      data: { recoveryUsed: { push: upperCode } },
    });
    return NextResponse.json({ success: true, verified: true });
  }

  // Default: TOTP
  if (!twoFactor.totpEnabled || !twoFactor.totpSecret) {
    return NextResponse.json({ error: "TOTP not enabled" }, { status: 400 });
  }

  const secret = decrypt(twoFactor.totpSecret);
  if (!verifyTotp(secret, code)) {
    return NextResponse.json({ error: "Invalid code" }, { status: 400 });
  }

  return NextResponse.json({ success: true, verified: true });
}
