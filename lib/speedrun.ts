import { prisma } from "@/lib/prisma";
import crypto from "crypto";

// Re-export browser-safe constants and pure helpers so existing server-side
// callers can keep importing from "@/lib/speedrun". Client components should
// import directly from "@/lib/speedrunConstants" to avoid pulling Prisma
// and Node's `crypto` into the browser bundle.
export {
  MAX_TEAM_SIZE,
  RUN_STATUSES,
  canRegisterForRun,
  canEditTeamForRun,
  canSubmitForRun,
  firstNameFrom,
  ALLOWED_TRACK_ICONS,
  validateTrackIconOrThrow,
} from "@/lib/speedrunConstants";
export type { RunStatus, TrackIconKey } from "@/lib/speedrunConstants";

/**
 * Resolves a run by its URL slug (e.g. `may-26`). Returns null if not found
 * or if the run has been soft-deleted.
 */
export async function getRunBySlug(slug: string) {
  if (!slug) return null;
  return prisma.speedrunRun.findFirst({
    where: { slug, deletedAt: null },
  });
}

/**
 * Atomically flip the `isCurrent` flag — clears it on every other run and
 * sets it on the target. Used by the admin "Set as current" action.
 */
export async function setCurrentRun(slug: string): Promise<void> {
  const target = await getRunBySlug(slug);
  if (!target) throw new Error(`Run not found: ${slug}`);
  await prisma.$transaction([
    prisma.speedrunRun.updateMany({
      where: { isCurrent: true, NOT: { id: target.id } },
      data: { isCurrent: false },
    }),
    prisma.speedrunRun.update({
      where: { id: target.id },
      data: { isCurrent: true },
    }),
  ]);
}

/**
 * Generate a short unique code with a configurable prefix.
 * Uses an unambiguous alphabet (no I, L, O, 0, 1).
 *
 * SECURITY: Uses Node's CSPRNG (`crypto.randomInt`) instead of `Math.random()`
 * because team codes act as bearer auth tokens for the team-join endpoint.
 * Falls back to `crypto.randomBytes` with rejection sampling if `randomInt`
 * is unavailable for any reason.
 */
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

function secureRandomIndex(max: number): number {
  try {
    return crypto.randomInt(0, max);
  } catch {
    // Rejection-sampling fallback. Reads bytes until one falls within an even
    // multiple of `max` to avoid modulo bias.
    const limit = 256 - (256 % max);
    while (true) {
      const byte = crypto.randomBytes(1)[0];
      if (byte < limit) return byte % max;
    }
  }
}

function randomCode(prefix: string, length = 6) {
  let s = `${prefix}-`;
  for (let i = 0; i < length; i++) {
    s += ALPHABET[secureRandomIndex(ALPHABET.length)];
  }
  return s;
}

/**
 * Generate a unique Team1 ID. New teams use the "T1-" prefix; older teams may
 * still carry the legacy "TM-" prefix from before the rebrand. Both formats
 * coexist — generators only produce T1-, but lookup tolerates either.
 *
 * Team codes are 8 chars (31^8 ≈ 8.5e11 keyspace) because possessing one
 * authorizes joining that team via the public team-join endpoint.
 */
export async function generateUniqueTeamCode(): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = randomCode("T1", 8);
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
