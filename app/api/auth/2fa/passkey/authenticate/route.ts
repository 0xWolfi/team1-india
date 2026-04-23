import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { getAuthenticationOptions, verifyAuthentication } from "@/lib/2fa/passkey";

// POST /api/auth/2fa/passkey/authenticate — verify passkey during login
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { action, response } = body;

  const twoFactor = await prisma.twoFactorAuth.findUnique({
    where: { userEmail: session.user.email },
    include: { passkeys: true },
  });

  if (!twoFactor?.passkeyEnabled || !twoFactor.passkeys.length) {
    return NextResponse.json({ error: "No passkeys registered" }, { status: 400 });
  }

  // Step 1: Generate options
  if (action === "options") {
    const credentialIds = twoFactor.passkeys.map((p) => p.credentialId);
    const options = await getAuthenticationOptions(credentialIds);
    await prisma.twoFactorAuth.update({
      where: { userEmail: session.user.email },
      data: { backupEmail: options.challenge },
    });
    return NextResponse.json(options);
  }

  // Step 2: Verify response
  if (!response || !twoFactor.backupEmail) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const passkey = twoFactor.passkeys.find(
    (p) => p.credentialId === response.id
  );
  if (!passkey) return NextResponse.json({ error: "Unknown credential" }, { status: 400 });

  try {
    const verification = await verifyAuthentication(
      response,
      twoFactor.backupEmail,
      Buffer.from(passkey.publicKey),
      Number(passkey.counter)
    );

    if (!verification.verified) {
      return NextResponse.json({ error: "Verification failed" }, { status: 400 });
    }

    // Update counter
    await prisma.passkey.update({
      where: { id: passkey.id },
      data: {
        counter: BigInt(verification.authenticationInfo.newCounter),
        lastUsedAt: new Date(),
      },
    });

    await prisma.twoFactorAuth.update({
      where: { userEmail: session.user.email },
      data: { backupEmail: null },
    });

    return NextResponse.json({ success: true, verified: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Authentication failed" }, { status: 400 });
  }
}
