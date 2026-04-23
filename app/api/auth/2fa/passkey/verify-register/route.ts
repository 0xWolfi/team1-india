import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { verifyRegistration } from "@/lib/2fa/passkey";

// POST /api/auth/2fa/passkey/verify-register — complete passkey registration
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { response, deviceName } = body;

  const twoFactor = await prisma.twoFactorAuth.findUnique({ where: { userEmail: session.user.email } });
  if (!twoFactor?.backupEmail) return NextResponse.json({ error: "No pending registration" }, { status: 400 });

  try {
    const verification = await verifyRegistration(response, twoFactor.backupEmail);
    if (!verification.verified || !verification.registrationInfo) {
      return NextResponse.json({ error: "Verification failed" }, { status: 400 });
    }

    const { credential } = verification.registrationInfo;

    await prisma.passkey.create({
      data: {
        twoFactorId: twoFactor.id,
        credentialId: Buffer.from(credential.id).toString("base64url"),
        publicKey: Buffer.from(credential.publicKey),
        counter: BigInt(credential.counter),
        deviceName: deviceName || "Unknown device",
      },
    });

    await prisma.twoFactorAuth.update({
      where: { userEmail: session.user.email },
      data: { passkeyEnabled: true, backupEmail: null },
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Registration failed" }, { status: 400 });
  }
}
