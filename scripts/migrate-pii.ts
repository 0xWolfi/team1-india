import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

/**
 * PII Migration Script (Phase 0.5)
 *
 * Copies email/name fields from Member, CommunityMember, PublicUser
 * into the PersonalVault table (encrypted + HMAC indexed).
 *
 * Original fields are NOT removed — this is additive only.
 * Safe to run multiple times (upserts, not inserts).
 *
 * Usage: npx tsx scripts/migrate-pii.ts
 */

const prisma = new PrismaClient();

// --- Encryption helpers (duplicated here to avoid path alias issues in scripts) ---

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;

function getKey(envVar: string): Buffer {
  const key = process.env[envVar];
  if (!key) throw new Error(`${envVar} environment variable is not set`);
  return Buffer.from(key, "base64");
}

function encrypt(plaintext: string): string {
  const key = getKey("PII_ENCRYPTION_KEY");
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString("base64");
}

function hmacHash(value: string): string {
  const key = getKey("PII_HMAC_KEY");
  return crypto.createHmac("sha256", key).update(value.toLowerCase().trim()).digest("hex");
}

// --- Migration logic ---

async function upsertVault(
  entityType: string,
  entityId: string,
  fieldName: string,
  plainValue: string,
  searchable: boolean
) {
  await prisma.personalVault.upsert({
    where: {
      entityType_entityId_fieldName: { entityType, entityId, fieldName },
    },
    update: {
      encryptedValue: encrypt(plainValue),
      hmacIndex: searchable ? hmacHash(plainValue) : null,
    },
    create: {
      entityType,
      entityId,
      fieldName,
      encryptedValue: encrypt(plainValue),
      hmacIndex: searchable ? hmacHash(plainValue) : null,
    },
  });
}

async function migrateMembers() {
  const members = await prisma.member.findMany({
    select: { id: true, email: true, name: true },
  });
  console.log(`Found ${members.length} Members`);

  let migrated = 0;
  for (const m of members) {
    if (m.email) await upsertVault("Member", m.id, "email", m.email, true);
    if (m.name) await upsertVault("Member", m.id, "name", m.name, false);
    migrated++;
    if (migrated % 50 === 0) console.log(`  Members: ${migrated}/${members.length}`);
  }
  console.log(`  Members: ${migrated}/${members.length} done`);
}

async function migrateCommunityMembers() {
  const members = await prisma.communityMember.findMany({
    select: { id: true, email: true, name: true, telegram: true },
  });
  console.log(`Found ${members.length} CommunityMembers`);

  let migrated = 0;
  for (const m of members) {
    if (m.email) await upsertVault("CommunityMember", m.id, "email", m.email, true);
    if (m.name) await upsertVault("CommunityMember", m.id, "name", m.name, false);
    if (m.telegram) await upsertVault("CommunityMember", m.id, "telegram", m.telegram, false);
    migrated++;
    if (migrated % 50 === 0) console.log(`  CommunityMembers: ${migrated}/${members.length}`);
  }
  console.log(`  CommunityMembers: ${migrated}/${members.length} done`);
}

async function migratePublicUsers() {
  const users = await prisma.publicUser.findMany({
    select: { id: true, email: true, fullName: true },
  });
  console.log(`Found ${users.length} PublicUsers`);

  let migrated = 0;
  for (const u of users) {
    if (u.email) await upsertVault("PublicUser", u.id, "email", u.email, true);
    if (u.fullName) await upsertVault("PublicUser", u.id, "name", u.fullName, false);
    migrated++;
    if (migrated % 50 === 0) console.log(`  PublicUsers: ${migrated}/${users.length}`);
  }
  console.log(`  PublicUsers: ${migrated}/${users.length} done`);
}

async function verifySample() {
  const sample = await prisma.personalVault.findFirst({
    where: { fieldName: "email" },
  });
  if (!sample) {
    console.log("\nNo vault records found — database may be empty.");
    return;
  }

  // Verify decryption works
  const key = getKey("PII_ENCRYPTION_KEY");
  const packed = Buffer.from(sample.encryptedValue, "base64");
  const iv = packed.subarray(0, 12);
  const tag = packed.subarray(12, 28);
  const ciphertext = packed.subarray(28);
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");

  console.log(`\nVerification: decrypted a ${sample.entityType} email successfully`);
  console.log(`  Entity ID: ${sample.entityId}`);
  console.log(`  Decrypted value starts with: ${decrypted.substring(0, 3)}***`);
}

async function main() {
  console.log("=== PII Migration (Phase 0.5) ===\n");
  console.log("This copies PII into the vault. Original fields are NOT removed.\n");

  const startTime = Date.now();

  await migrateMembers();
  await migrateCommunityMembers();
  await migratePublicUsers();

  const total = await prisma.personalVault.count();
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log(`\nTotal vault records: ${total}`);
  console.log(`Elapsed: ${elapsed}s`);

  await verifySample();

  console.log("\nMigration complete. Original fields untouched.");
}

main()
  .catch((e) => {
    console.error("Migration failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
