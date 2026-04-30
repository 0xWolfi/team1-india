import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

/**
 * Short referral link handler.
 *   /r/RF-XXXXXX  →  increments click counter, redirects to /speedrun?ref=RF-XXXXXX
 *
 * Wrapped in a server component so the click is counted before the user
 * lands on the page. Invalid / unknown codes simply forward to /speedrun
 * without setting any ref param.
 */
export default async function ReferralRedirectPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code: raw } = await params;
  const code = (raw || "").trim().toUpperCase();

  if (!code) redirect("/speedrun");

  // Look up + atomic increment of click counter (safe even on race conditions)
  try {
    const ref = await prisma.speedrunReferralCode.findUnique({
      where: { code },
      select: { id: true },
    });
    if (!ref) redirect("/speedrun");
    await prisma.speedrunReferralCode.update({
      where: { id: ref.id },
      data: { clicks: { increment: 1 } },
    });
  } catch {
    // Don't block the redirect on tracking failure
  }

  redirect(`/speedrun?ref=${encodeURIComponent(code)}`);
}
