import { prisma } from "@/lib/prisma";

/**
 * Maximum members allowed in a Speedrun team (including the captain).
 * Product rule: solo or duo only.
 */
export const MAX_TEAM_SIZE = 2;

/**
 * Run statuses, in lifecycle order. The product rule is that registration and
 * submissions both close at the same moment — `submissions_closed` is the gate
 * after which team changes and submissions become read-only-ish.
 */
export const RUN_STATUSES = [
  "upcoming",
  "registration_open",
  "submissions_open",
  "submissions_closed",
  "irl_event",
  "judging",
  "completed",
  "cancelled",
] as const;
export type RunStatus = (typeof RUN_STATUSES)[number];

/** A run accepts new registrations only while explicitly open. */
export function canRegisterForRun(status: string): boolean {
  return status === "registration_open";
}

/**
 * Team-mode changes (solo↔create↔join, leave/swap) and project edits are
 * allowed up until submissions close. After that, the run is locked from the
 * registrant's side.
 */
export function canEditTeamForRun(status: string): boolean {
  return status === "registration_open" || status === "submissions_open";
}

/** Submissions can be created/edited only while the submission window is open. */
export function canSubmitForRun(status: string): boolean {
  return status === "submissions_open";
}

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

/**
 * Generate a unique Team1 ID. New teams use the "T1-" prefix; older teams may
 * still carry the legacy "TM-" prefix from before the rebrand. Both formats
 * coexist — generators only produce T1-, but lookup tolerates either.
 */
export async function generateUniqueTeamCode(): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = randomCode("T1");
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

/**
 * Pull the registrant's first name for public team-page display.
 * Splits on the first whitespace; falls back to the whole string if there's
 * none. Always returns a non-empty string when given non-empty input.
 */
export function firstNameFrom(fullName: string | null | undefined): string {
  if (!fullName) return "";
  const trimmed = fullName.trim();
  const idx = trimmed.indexOf(" ");
  return idx === -1 ? trimmed : trimmed.slice(0, idx);
}

/**
 * Whitelist of allowed lucide-react icon names for track icons. Kept in sync
 * with the dropdown options in the admin run editor — accepting an arbitrary
 * string would let an admin set unknown icons that the renderer falls back
 * to a default for, hiding misconfiguration.
 */
export const ALLOWED_TRACK_ICONS = [
  "Coins",
  "Bot",
  "Smartphone",
  "Layers",
  "Zap",
  "Code2",
  "Rocket",
  "Trophy",
  "Sparkles",
  "Globe",
  "Cpu",
  "Wallet",
] as const;
export type TrackIconKey = (typeof ALLOWED_TRACK_ICONS)[number];

/** Returns null if valid (and normalized to null/undefined empty), throws otherwise. */
export function validateTrackIconOrThrow(value: unknown): string | null {
  if (value === null || value === undefined || value === "") return null;
  if (
    typeof value === "string" &&
    (ALLOWED_TRACK_ICONS as readonly string[]).includes(value)
  ) {
    return value;
  }
  throw new Error(
    `Invalid icon key "${String(value)}". Allowed: ${ALLOWED_TRACK_ICONS.join(", ")}`
  );
}
