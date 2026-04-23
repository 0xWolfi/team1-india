import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/encryption";

// POST /api/auth/2fa/recovery/verify-backup — user types back 2 codes to prove they saved them
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { code1, code2 } = await request.json();
  if (!code1 || !code2) return NextResponse.json({ error: "Two codes required" }, { status: 400 });

  const twoFactor = await prisma.twoFactorAuth.findUnique({ where: { userEmail: session.user.email } });
  if (!twoFactor?.recoveryCodes) return NextResponse.json({ error: "Generate codes first" }, { status: 400 });

  const codes = decrypt(twoFactor.recoveryCodes).split(",");
  const valid = codes.includes(code1.toUpperCase()) && codes.includes(code2.toUpperCase()) && code1 !== code2;

  if (!valid) return NextResponse.json({ error: "Codes do not match" }, { status: 400 });

  return NextResponse.json({ success: true, message: "Recovery codes verified" });
}
