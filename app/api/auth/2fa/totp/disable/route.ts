import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { verifyTotp } from "@/lib/2fa/totp";
import { decrypt } from "@/lib/encryption";

// POST /api/auth/2fa/totp/disable — disable TOTP (requires current code)
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { code } = await request.json();
  if (!code) return NextResponse.json({ error: "code required" }, { status: 400 });

  const twoFactor = await prisma.twoFactorAuth.findUnique({ where: { userEmail: session.user.email } });
  if (!twoFactor?.totpSecret || !twoFactor.totpEnabled) return NextResponse.json({ error: "TOTP not enabled" }, { status: 400 });

  const secret = decrypt(twoFactor.totpSecret);
  if (!verifyTotp(secret, code)) return NextResponse.json({ error: "Invalid code" }, { status: 400 });

  await prisma.twoFactorAuth.update({
    where: { userEmail: session.user.email },
    data: { totpEnabled: false, totpSecret: null, totpVerifiedAt: null },
  });

  return NextResponse.json({ success: true, message: "TOTP disabled" });
}
