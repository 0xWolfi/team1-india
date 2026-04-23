import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { generateTotpSecret, generateTotpUri } from "@/lib/2fa/totp";
import { encrypt } from "@/lib/encryption";

// POST /api/auth/2fa/totp/setup — generate secret + QR URI
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const secret = generateTotpSecret();
  const uri = generateTotpUri(session.user.email, secret);

  // Store encrypted secret (not yet enabled — user must verify first)
  await prisma.twoFactorAuth.upsert({
    where: { userEmail: session.user.email },
    update: { totpSecret: encrypt(secret) },
    create: { userEmail: session.user.email, totpSecret: encrypt(secret) },
  });

  return NextResponse.json({ secret, uri });
}
