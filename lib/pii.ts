import { prisma } from "@/lib/prisma";
import { encrypt, decrypt, hmacHash } from "@/lib/encryption";

type EntityType = "Member" | "CommunityMember" | "PublicUser";

/**
 * Store a PII field in the vault (encrypted).
 * If the field already exists for this entity, it updates it.
 * Optionally creates an HMAC index for searchable fields (e.g., email).
 */
export async function storePii(
  entityType: EntityType,
  entityId: string,
  fieldName: string,
  plainValue: string,
  searchable = false
): Promise<void> {
  const encryptedValue = encrypt(plainValue);
  const hmacIndex = searchable ? hmacHash(plainValue) : null;

  await prisma.personalVault.upsert({
    where: {
      entityType_entityId_fieldName: {
        entityType,
        entityId,
        fieldName,
      },
    },
    update: {
      encryptedValue,
      hmacIndex,
    },
    create: {
      entityType,
      entityId,
      fieldName,
      encryptedValue,
      hmacIndex,
    },
  });
}

/**
 * Retrieve a single PII field from the vault (decrypted).
 * Returns null if not found.
 */
export async function retrievePii(
  entityType: EntityType,
  entityId: string,
  fieldName: string
): Promise<string | null> {
  const record = await prisma.personalVault.findUnique({
    where: {
      entityType_entityId_fieldName: {
        entityType,
        entityId,
        fieldName,
      },
    },
  });

  if (!record) return null;
  return decrypt(record.encryptedValue);
}

/**
 * Retrieve multiple PII fields for an entity at once.
 * Returns a map of fieldName → decrypted value.
 */
export async function retrieveAllPii(
  entityType: EntityType,
  entityId: string
): Promise<Record<string, string>> {
  const records = await prisma.personalVault.findMany({
    where: { entityType, entityId },
  });

  const result: Record<string, string> = {};
  for (const record of records) {
    result[record.fieldName] = decrypt(record.encryptedValue);
  }
  return result;
}

/**
 * Search for an entity by a searchable PII field (uses HMAC index).
 * Example: findByPii("PublicUser", "email", "user@example.com")
 */
export async function findByPii(
  entityType: EntityType,
  fieldName: string,
  plainValue: string
): Promise<string | null> {
  const hash = hmacHash(plainValue);

  const record = await prisma.personalVault.findFirst({
    where: {
      entityType,
      fieldName,
      hmacIndex: hash,
    },
    select: { entityId: true },
  });

  return record?.entityId ?? null;
}

/**
 * Delete all PII for a given entity (e.g., on account deletion / GDPR request).
 */
export async function deletePii(
  entityType: EntityType,
  entityId: string
): Promise<void> {
  await prisma.personalVault.deleteMany({
    where: { entityType, entityId },
  });
}

/**
 * Delete a specific PII field for an entity.
 */
export async function deletePiiField(
  entityType: EntityType,
  entityId: string,
  fieldName: string
): Promise<void> {
  await prisma.personalVault.deleteMany({
    where: { entityType, entityId, fieldName },
  });
}
