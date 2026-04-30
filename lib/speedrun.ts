import { prisma } from "@/lib/prisma";

/**
 * Returns the current Speedrun run (the one accepting registrations).
 * Throws if no current run exists — we expect exactly one row with isCurrent=true.
 */
export async function getCurrentRun() {
  const run = await prisma.speedrunRun.findFirst({
    where: { isCurrent: true, deletedAt: null },
  });
  if (!run) throw new Error("No current Speedrun run is configured");
  return run;
}

/**
 * Generate a short unique code with a configurable prefix.
 * Uses an unambiguous alphabet (no I, L, O, 0, 1).
 * Retries up to 5 times on collision before throwing.
 */
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
function randomCode(prefix: string) {
  let s = `${prefix}-`;
  for (let i = 0; i < 6; i++) {
    s += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return s;
}
export async function generateUniqueTeamCode(): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = randomCode("TM");
    const existing = await prisma.speedrunTeam.findUnique({ where: { code } });
    if (!existing) return code;
  }
  throw new Error("Failed to generate unique team code after 5 attempts");
}
export async function generateUniqueReferralCode(): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = randomCode("RF");
    const existing = await prisma.speedrunReferralCode.findUnique({ where: { code } });
    if (!existing) return code;
  }
  throw new Error("Failed to generate unique referral code after 5 attempts");
}
