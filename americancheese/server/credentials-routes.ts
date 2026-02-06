import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { db } from './db';
import {
  credentials,
  users,
  createCredentialSchema,
  updateCredentialSchema,
  revealCredentialSchema
} from '../shared/schema';
import { eq, and, desc } from 'drizzle-orm';
import { encryptCredential, decryptCredential } from './crypto';
import {
  getCredentialByName,
  getCredentialsForService,
  getCredentialsAsEnv
} from './credentials-service';

const router = Router();

// ==================== CREDENTIALS VAULT ENDPOINTS ====================

/**
 * GET /api/credentials
 * List all credentials for the authenticated user (masked values)
 */
router.get('/', async (req: Request, res: Response) => {
  if (!req.session?.userId) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }

  try {
    const userCredentials = await db
      .select({
        id: credentials.id,
        name: credentials.name,
        category: credentials.category,
        website: credentials.website,
        username: credentials.username,
        notes: credentials.notes,
        expiresAt: credentials.expiresAt,
        lastAccessedAt: credentials.lastAccessedAt,
        createdAt: credentials.createdAt,
        updatedAt: credentials.updatedAt,
      })
      .from(credentials)
      .where(eq(credentials.userId, req.session.userId))
      .orderBy(desc(credentials.updatedAt));

    // Add masked preview for each credential
    const credentialsWithMask = userCredentials.map(cred => ({
      ...cred,
      maskedValue: '••••••••••••', // Consistent mask for list view
      isExpired: cred.expiresAt ? new Date(cred.expiresAt) < new Date() : false,
    }));

    return res.json({ success: true, credentials: credentialsWithMask });
  } catch (error) {
    console.error('Error fetching credentials:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch credentials' });
  }
});

/**
 * GET /api/credentials/:id
 * Get a single credential by ID (masked value, no decryption)
 */
router.get('/:id', async (req: Request, res: Response) => {
  if (!req.session?.userId) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }

  try {
    const credentialId = parseInt(req.params.id);

    const [credential] = await db
      .select({
        id: credentials.id,
        name: credentials.name,
        category: credentials.category,
        website: credentials.website,
        username: credentials.username,
        notes: credentials.notes,
        expiresAt: credentials.expiresAt,
        lastAccessedAt: credentials.lastAccessedAt,
        createdAt: credentials.createdAt,
        updatedAt: credentials.updatedAt,
      })
      .from(credentials)
      .where(and(
        eq(credentials.id, credentialId),
        eq(credentials.userId, req.session.userId)
      ))
      .limit(1);

    if (!credential) {
      return res.status(404).json({ success: false, message: 'Credential not found' });
    }

    return res.json({
      success: true,
      credential: {
        ...credential,
        maskedValue: '••••••••••••',
        isExpired: credential.expiresAt ? new Date(credential.expiresAt) < new Date() : false,
      }
    });
  } catch (error) {
    console.error('Error fetching credential:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch credential' });
  }
});

/**
 * POST /api/credentials
 * Create a new credential (encrypts the value)
 */
router.post('/', async (req: Request, res: Response) => {
  if (!req.session?.userId) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }

  try {
    const validationResult = createCredentialSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationResult.error.errors
      });
    }

    const { name, category, website, username, value, notes, expiresAt } = validationResult.data;

    // Encrypt the credential value
    const { encryptedValue, iv, authTag } = encryptCredential(value, req.session.userId);

    // Insert the credential
    const [newCredential] = await db.insert(credentials).values({
      userId: req.session.userId,
      name,
      category,
      website: website || null,
      username: username || null,
      encryptedValue,
      iv,
      authTag,
      notes: notes || null,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    }).returning({
      id: credentials.id,
      name: credentials.name,
      category: credentials.category,
      website: credentials.website,
      username: credentials.username,
      notes: credentials.notes,
      expiresAt: credentials.expiresAt,
      createdAt: credentials.createdAt,
    });

    console.log('Credential created for user:', req.session.userId, 'name:', name);

    return res.status(201).json({
      success: true,
      message: 'Credential created successfully',
      credential: newCredential
    });
  } catch (error) {
    console.error('Error creating credential:', error);
    return res.status(500).json({ success: false, message: 'Failed to create credential' });
  }
});

/**
 * PUT /api/credentials/:id
 * Update an existing credential
 */
router.put('/:id', async (req: Request, res: Response) => {
  if (!req.session?.userId) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }

  try {
    const credentialId = parseInt(req.params.id);
    const validationResult = updateCredentialSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationResult.error.errors
      });
    }

    // Verify ownership
    const [existingCredential] = await db
      .select()
      .from(credentials)
      .where(and(
        eq(credentials.id, credentialId),
        eq(credentials.userId, req.session.userId)
      ))
      .limit(1);

    if (!existingCredential) {
      return res.status(404).json({ success: false, message: 'Credential not found' });
    }

    const { name, category, website, username, value, notes, expiresAt } = validationResult.data;

    // Build update object
    const updateData: Record<string, any> = {
      updatedAt: new Date(),
    };

    if (name !== undefined) updateData.name = name;
    if (category !== undefined) updateData.category = category;
    if (website !== undefined) updateData.website = website || null;
    if (username !== undefined) updateData.username = username || null;
    if (notes !== undefined) updateData.notes = notes || null;
    if (expiresAt !== undefined) updateData.expiresAt = expiresAt ? new Date(expiresAt) : null;

    // If value is provided, re-encrypt
    if (value) {
      const { encryptedValue, iv, authTag } = encryptCredential(value, req.session.userId);
      updateData.encryptedValue = encryptedValue;
      updateData.iv = iv;
      updateData.authTag = authTag;
    }

    const [updatedCredential] = await db
      .update(credentials)
      .set(updateData)
      .where(eq(credentials.id, credentialId))
      .returning({
        id: credentials.id,
        name: credentials.name,
        category: credentials.category,
        website: credentials.website,
        username: credentials.username,
        notes: credentials.notes,
        expiresAt: credentials.expiresAt,
        updatedAt: credentials.updatedAt,
      });

    return res.json({
      success: true,
      message: 'Credential updated successfully',
      credential: updatedCredential
    });
  } catch (error) {
    console.error('Error updating credential:', error);
    return res.status(500).json({ success: false, message: 'Failed to update credential' });
  }
});

/**
 * DELETE /api/credentials/:id
 * Delete a credential
 */
router.delete('/:id', async (req: Request, res: Response) => {
  if (!req.session?.userId) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }

  try {
    const credentialId = parseInt(req.params.id);

    // Verify ownership and delete
    const result = await db
      .delete(credentials)
      .where(and(
        eq(credentials.id, credentialId),
        eq(credentials.userId, req.session.userId)
      ))
      .returning();

    if (result.length === 0) {
      return res.status(404).json({ success: false, message: 'Credential not found' });
    }

    console.log('Credential deleted:', credentialId, 'for user:', req.session.userId);

    return res.json({ success: true, message: 'Credential deleted successfully' });
  } catch (error) {
    console.error('Error deleting credential:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete credential' });
  }
});

/**
 * POST /api/credentials/:id/reveal
 * Reveal (decrypt) a credential value after password verification
 */
router.post('/:id/reveal', async (req: Request, res: Response) => {
  if (!req.session?.userId) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }

  try {
    const credentialId = parseInt(req.params.id);
    const validationResult = revealCredentialSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Password is required to reveal credentials',
        errors: validationResult.error.errors
      });
    }

    const { password } = validationResult.data;

    // Verify user password
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, req.session.userId))
      .limit(1);

    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) {
      return res.status(401).json({ success: false, message: 'Invalid password' });
    }

    // Get the credential
    const [credential] = await db
      .select()
      .from(credentials)
      .where(and(
        eq(credentials.id, credentialId),
        eq(credentials.userId, req.session.userId)
      ))
      .limit(1);

    if (!credential) {
      return res.status(404).json({ success: false, message: 'Credential not found' });
    }

    // Decrypt the credential
    const decryptedValue = decryptCredential(
      credential.encryptedValue,
      credential.iv,
      credential.authTag,
      req.session.userId
    );

    // Update last accessed timestamp
    await db
      .update(credentials)
      .set({ lastAccessedAt: new Date() })
      .where(eq(credentials.id, credentialId));

    console.log('Credential revealed:', credentialId, 'for user:', req.session.userId);

    return res.json({
      success: true,
      value: decryptedValue
    });
  } catch (error) {
    console.error('Error revealing credential:', error);
    return res.status(500).json({ success: false, message: 'Failed to reveal credential' });
  }
});

// ==================== INTERNAL/AUTOMATION ENDPOINTS ====================

/**
 * GET /api/credentials/by-name/:name
 * Get a decrypted credential by exact name (for internal/automation use)
 * Requires valid session, no password verification needed
 */
router.get('/by-name/:name', async (req: Request, res: Response) => {
  if (!req.session?.userId) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }

  try {
    const credentialName = decodeURIComponent(req.params.name);
    const credential = await getCredentialByName(req.session.userId, credentialName);

    if (!credential) {
      return res.status(404).json({ success: false, message: 'Credential not found' });
    }

    console.log('Credential fetched by name:', credentialName, 'for user:', req.session.userId);

    return res.json({
      success: true,
      credential
    });
  } catch (error) {
    console.error('Error fetching credential by name:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch credential' });
  }
});

/**
 * GET /api/credentials/service/:service
 * Get all credentials for a specific service (e.g., 'facebook', 'x.com')
 */
router.get('/service/:service', async (req: Request, res: Response) => {
  if (!req.session?.userId) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }

  try {
    const service = decodeURIComponent(req.params.service);
    const serviceCredentials = await getCredentialsForService(req.session.userId, service);

    console.log('Credentials fetched for service:', service, 'count:', serviceCredentials.length);

    return res.json({
      success: true,
      service,
      credentials: serviceCredentials
    });
  } catch (error) {
    console.error('Error fetching credentials for service:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch credentials' });
  }
});

/**
 * POST /api/credentials/batch
 * Get multiple credentials by names, returns as env-style object
 * Body: { names: ["Facebook Page Token", "X API Bearer Token"] }
 */
router.post('/batch', async (req: Request, res: Response) => {
  if (!req.session?.userId) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }

  try {
    const { names } = req.body;

    if (!names || !Array.isArray(names)) {
      return res.status(400).json({ success: false, message: 'names array is required' });
    }

    const envCredentials = await getCredentialsAsEnv(req.session.userId, names);
    const foundCount = Object.keys(envCredentials).length;

    console.log('Batch credentials fetched:', foundCount, 'of', names.length, 'for user:', req.session.userId);

    return res.json({
      success: true,
      found: foundCount,
      requested: names.length,
      credentials: envCredentials
    });
  } catch (error) {
    console.error('Error fetching batch credentials:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch credentials' });
  }
});

/**
 * GET /api/credentials/test-connection/:service
 * Test API connection using stored credentials
 * Supports: facebook, x (twitter)
 */
router.get('/test-connection/:service', async (req: Request, res: Response) => {
  if (!req.session?.userId) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }

  try {
    const service = req.params.service.toLowerCase();

    if (service === 'facebook') {
      // Get Facebook credentials
      const pageToken = await getCredentialByName(req.session.userId, 'Facebook Page Token');
      const pageId = await getCredentialByName(req.session.userId, 'Facebook Page ID');

      if (!pageToken || !pageId) {
        return res.status(404).json({
          success: false,
          message: 'Facebook credentials not found. Need: Facebook Page Token, Facebook Page ID'
        });
      }

      // Test the connection
      const response = await fetch(
        `https://graph.facebook.com/v18.0/${pageId.value}?access_token=${pageToken.value}&fields=name,id`
      );
      const data = await response.json();

      if (data.error) {
        return res.json({
          success: false,
          message: 'Facebook API error',
          error: data.error.message
        });
      }

      return res.json({
        success: true,
        message: 'Facebook connection successful',
        page: {
          id: data.id,
          name: data.name
        }
      });
    }

    if (service === 'x' || service === 'twitter') {
      // Get X credentials
      const bearerToken = await getCredentialByName(req.session.userId, 'X API Bearer Token');

      if (!bearerToken) {
        return res.status(404).json({
          success: false,
          message: 'X credentials not found. Need: X API Bearer Token'
        });
      }

      // Test the connection - get authenticated user info
      const response = await fetch(
        'https://api.twitter.com/2/users/me',
        {
          headers: {
            'Authorization': `Bearer ${bearerToken.value}`
          }
        }
      );
      const data = await response.json();

      if (data.errors) {
        return res.json({
          success: false,
          message: 'X API error',
          error: data.errors[0]?.message || 'Unknown error'
        });
      }

      return res.json({
        success: true,
        message: 'X (Twitter) connection successful',
        user: data.data
      });
    }

    return res.status(400).json({
      success: false,
      message: `Unsupported service: ${service}. Supported: facebook, x`
    });
  } catch (error) {
    console.error('Error testing connection:', error);
    return res.status(500).json({
      success: false,
      message: 'Connection test failed',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

export default router;
