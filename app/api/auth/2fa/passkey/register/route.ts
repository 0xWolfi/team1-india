import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { getRegistrationOptions } from "@/lib/2fa/passkey";

// POST /api/auth/2fa/passkey/register — start passkey registration
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const twoFactor = await prisma.twoFactorAuth.upsert({
    where: { userEmail: session.user.email },
    update: {},
    create: { userEmail: session.user.email },
    include: { passkeys: { select: { credentialId: true } } },
  });

  const existingIds = twoFactor.passkeys.map((p) => p.credentialId);
  const options = await getRegistrationOptions(session.user.email, existingIds);

  // Store challenge in a temporary way (using twoFactor record)
  await prisma.twoFactorAuth.update({
    where: { userEmail: session.user.email },
    data: { backupEmail: options.challenge }, // reuse backupEmail field temporarily for challenge
  });

  return NextResponse.json(options);
}
