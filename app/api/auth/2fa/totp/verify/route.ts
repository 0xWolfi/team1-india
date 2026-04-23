import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { verifyTotp } from "@/lib/2fa/totp";
import { decrypt } from "@/lib/encryption";

// POST /api/auth/2fa/totp/verify — verify code and enable TOTP
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { code } = await request.json();
  if (!code) return NextResponse.json({ error: "code required" }, { status: 400 });

  const twoFactor = await prisma.twoFactorAuth.findUnique({ where: { userEmail: session.user.email } });
  if (!twoFactor?.totpSecret) return NextResponse.json({ error: "Run setup first" }, { status: 400 });

  const secret = decrypt(twoFactor.totpSecret);
  const valid = verifyTotp(secret, code);

  if (!valid) return NextResponse.json({ error: "Invalid code" }, { status: 400 });

  await prisma.twoFactorAuth.update({
    where: { userEmail: session.user.email },
    data: { totpEnabled: true, totpVerifiedAt: new Date() },
  });

  return NextResponse.json({ success: true, message: "TOTP enabled" });
}
