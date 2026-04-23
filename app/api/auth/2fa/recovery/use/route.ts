import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/encryption";

// POST /api/auth/2fa/recovery/use — use a recovery code to bypass 2FA
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { code } = await request.json();
  if (!code) return NextResponse.json({ error: "code required" }, { status: 400 });

  const twoFactor = await prisma.twoFactorAuth.findUnique({ where: { userEmail: session.user.email } });
  if (!twoFactor?.recoveryCodes) return NextResponse.json({ error: "No recovery codes" }, { status: 400 });

  const codes = decrypt(twoFactor.recoveryCodes).split(",");
  const upperCode = code.toUpperCase();

  if (!codes.includes(upperCode)) return NextResponse.json({ error: "Invalid recovery code" }, { status: 400 });
  if (twoFactor.recoveryUsed.includes(upperCode)) return NextResponse.json({ error: "Code already used" }, { status: 400 });

  await prisma.twoFactorAuth.update({
    where: { userEmail: session.user.email },
    data: { recoveryUsed: { push: upperCode } },
  });

  return NextResponse.json({ success: true, message: "Recovery code accepted", remaining: codes.length - twoFactor.recoveryUsed.length - 1 });
}
