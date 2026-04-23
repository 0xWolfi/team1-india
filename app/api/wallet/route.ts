import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { getOrCreateWallet } from "@/lib/wallet";

// GET /api/wallet — get own wallet
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const wallet = await getOrCreateWallet(session.user.email);

  return NextResponse.json({ wallet });
}
