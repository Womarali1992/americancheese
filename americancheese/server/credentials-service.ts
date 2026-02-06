import { db } from './db';
import { credentials } from '../shared/schema';
import { eq, and, ilike } from 'drizzle-orm';
import { decryptCredential } from './crypto';

/**
 * Credentials Service
 *
 * Provides internal access to encrypted credentials without requiring
 * user password verification. Used for server-side automation and API integrations.
 *
 * SECURITY NOTE: This service bypasses password verification.
 * Only use it for internal server-side operations, never expose directly to clients.
 */

export interface CredentialValue {
  id: number;
  name: string;
  value: string;
  category: string | null;
  website: string | null;
  username: string | null;
  notes: string | null;
}

/**
 * Get a credential by exact name for a specific user
 */
export async function getCredentialByName(
  userId: number,
  name: string
): Promise<CredentialValue | null> {
  try {
    const [credential] = await db
      .select()
      .from(credentials)
      .where(and(
        eq(credentials.userId, userId),
        eq(credentials.name, name)
      ))
      .limit(1);

    if (!credential) {
      return null;
    }

    // Decrypt the value
    const decryptedValue = decryptCredential(
      credential.encryptedValue,
      credential.iv,
      credential.authTag,
      userId
    );

    // Update last accessed timestamp
    await db
      .update(credentials)
      .set({ lastAccessedAt: new Date() })
      .where(eq(credentials.id, credential.id));

    return {
      id: credential.id,
      name: credential.name,
      value: decryptedValue,
      category: credential.category,
      website: credential.website,
      username: credential.username,
      notes: credential.notes,
    };
  } catch (error) {
    console.error('Error getting credential by name:', error);
    return null;
  }
}

/**
 * Get a credential by ID for a specific user
 */
export async function getCredentialById(
  userId: number,
  credentialId: number
): Promise<CredentialValue | null> {
  try {
    const [credential] = await db
      .select()
      .from(credentials)
      .where(and(
        eq(credentials.userId, userId),
        eq(credentials.id, credentialId)
      ))
      .limit(1);

    if (!credential) {
      return null;
    }

    // Decrypt the value
    const decryptedValue = decryptCredential(
      credential.encryptedValue,
      credential.iv,
      credential.authTag,
      userId
    );

    // Update last accessed timestamp
    await db
      .update(credentials)
      .set({ lastAccessedAt: new Date() })
      .where(eq(credentials.id, credential.id));

    return {
      id: credential.id,
      name: credential.name,
      value: decryptedValue,
      category: credential.category,
      website: credential.website,
      username: credential.username,
      notes: credential.notes,
    };
  } catch (error) {
    console.error('Error getting credential by ID:', error);
    return null;
  }
}

/**
 * Search credentials by name pattern (case-insensitive)
 */
export async function searchCredentials(
  userId: number,
  searchPattern: string
): Promise<CredentialValue[]> {
  try {
    const matchingCredentials = await db
      .select()
      .from(credentials)
      .where(and(
        eq(credentials.userId, userId),
        ilike(credentials.name, `%${searchPattern}%`)
      ));

    return matchingCredentials.map(credential => {
      const decryptedValue = decryptCredential(
        credential.encryptedValue,
        credential.iv,
        credential.authTag,
        userId
      );

      return {
        id: credential.id,
        name: credential.name,
        value: decryptedValue,
        category: credential.category,
        website: credential.website,
        username: credential.username,
        notes: credential.notes,
      };
    });
  } catch (error) {
    console.error('Error searching credentials:', error);
    return [];
  }
}

/**
 * Get multiple credentials by their names
 * Useful for getting all credentials needed for a specific integration
 */
export async function getCredentialsByNames(
  userId: number,
  names: string[]
): Promise<Record<string, string>> {
  const result: Record<string, string> = {};

  for (const name of names) {
    const credential = await getCredentialByName(userId, name);
    if (credential) {
      result[name] = credential.value;
    }
  }

  return result;
}

/**
 * Get all credentials for a specific service (by website/category)
 * e.g., getAllForService(userId, 'x.com') or getAllForService(userId, 'facebook')
 */
export async function getCredentialsForService(
  userId: number,
  service: string
): Promise<CredentialValue[]> {
  try {
    const matchingCredentials = await db
      .select()
      .from(credentials)
      .where(and(
        eq(credentials.userId, userId),
        // Match by website containing the service name or name containing service
        ilike(credentials.website, `%${service}%`)
      ));

    // Also search by name if website didn't match
    const byName = await db
      .select()
      .from(credentials)
      .where(and(
        eq(credentials.userId, userId),
        ilike(credentials.name, `%${service}%`)
      ));

    // Combine and deduplicate
    const allMatches = [...matchingCredentials, ...byName];
    const uniqueIds = new Set<number>();
    const unique = allMatches.filter(c => {
      if (uniqueIds.has(c.id)) return false;
      uniqueIds.add(c.id);
      return true;
    });

    return unique.map(credential => {
      const decryptedValue = decryptCredential(
        credential.encryptedValue,
        credential.iv,
        credential.authTag,
        userId
      );

      return {
        id: credential.id,
        name: credential.name,
        value: decryptedValue,
        category: credential.category,
        website: credential.website,
        username: credential.username,
        notes: credential.notes,
      };
    });
  } catch (error) {
    console.error('Error getting credentials for service:', error);
    return [];
  }
}

/**
 * Helper to get credentials as environment-variable-style object
 * Converts credential names to ENV_VAR_STYLE keys
 */
export async function getCredentialsAsEnv(
  userId: number,
  names: string[]
): Promise<Record<string, string>> {
  const result: Record<string, string> = {};

  for (const name of names) {
    const credential = await getCredentialByName(userId, name);
    if (credential) {
      // Convert "Facebook Page Token" to "FACEBOOK_PAGE_TOKEN"
      const envKey = name
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, '_')
        .replace(/^_|_$/g, '');
      result[envKey] = credential.value;
    }
  }

  return result;
}
