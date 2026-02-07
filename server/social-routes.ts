import { Router } from 'express';
import { db } from './db';
import { credentials, socialPosts } from '../shared/schema';
import { eq, and, lte, isNull } from 'drizzle-orm';
import { encryptValue, decryptValue, postToSocial, postToFacebook, postToX, getFacebookPage, Platform, PostResult } from './social-service';

const router = Router();

// Platform mapping
const PLATFORM_MAP: Record<string, Platform> = {
  'facebook': 'facebook',
  'fb': 'facebook',
  'twitter': 'x',
  'x': 'x',
  'instagram': 'instagram',
  'ig': 'instagram',
  'linkedin': 'linkedin',
};

// ============ CREDENTIALS ROUTES ============

// GET /api/social/credentials - List all credentials (masked)
router.get('/credentials', async (req, res) => {
  try {
    const creds = await db.select().from(credentials);
    
    // Mask the values
    const masked = creds.map(c => ({
      ...c,
      encryptedValue: undefined,
      maskedValue: '••••••••••••',
    }));
    
    return res.json({ success: true, credentials: masked });
  } catch (error) {
    console.error('List credentials error:', error);
    return res.status(500).json({ error: 'Failed to list credentials' });
  }
});

// POST /api/social/credentials - Create a new credential
router.post('/credentials', async (req, res) => {
  try {
    const { name, service, category = 'api_key', value, website, username, notes, expiresAt } = req.body;

    if (!name || !service || !value) {
      return res.status(400).json({ error: 'Name, service, and value are required' });
    }

    const encryptedValue = encryptValue(value);

    const [newCred] = await db
      .insert(credentials)
      .values({
        name,
        service,
        category,
        encryptedValue,
        website,
        username,
        notes,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      })
      .returning();

    return res.json({
      success: true,
      credential: {
        ...newCred,
        encryptedValue: undefined,
        maskedValue: '••••••••••••',
      },
    });
  } catch (error) {
    console.error('Create credential error:', error);
    return res.status(500).json({ error: 'Failed to create credential' });
  }
});

// PUT /api/social/credentials/:id - Update a credential
router.put('/credentials/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, service, category, value, website, username, notes, expiresAt } = req.body;

    const updates: any = { updatedAt: new Date() };
    if (name) updates.name = name;
    if (service) updates.service = service;
    if (category) updates.category = category;
    if (value) updates.encryptedValue = encryptValue(value);
    if (website !== undefined) updates.website = website;
    if (username !== undefined) updates.username = username;
    if (notes !== undefined) updates.notes = notes;
    if (expiresAt !== undefined) updates.expiresAt = expiresAt ? new Date(expiresAt) : null;

    const [updated] = await db
      .update(credentials)
      .set(updates)
      .where(eq(credentials.id, Number(id)))
      .returning();

    return res.json({
      success: true,
      credential: {
        ...updated,
        encryptedValue: undefined,
        maskedValue: '••••••••••••',
      },
    });
  } catch (error) {
    console.error('Update credential error:', error);
    return res.status(500).json({ error: 'Failed to update credential' });
  }
});

// DELETE /api/social/credentials/:id - Delete a credential
router.delete('/credentials/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await db.delete(credentials).where(eq(credentials.id, Number(id)));

    return res.json({ success: true, message: 'Credential deleted' });
  } catch (error) {
    console.error('Delete credential error:', error);
    return res.status(500).json({ error: 'Failed to delete credential' });
  }
});

// ============ POSTING ROUTES ============

// POST /api/social/post - Post immediately to a platform
router.post('/post', async (req, res) => {
  try {
    const { platform, content, link } = req.body;

    if (!platform || !content) {
      return res.status(400).json({ error: 'Platform and content are required' });
    }

    const normalizedPlatform = PLATFORM_MAP[platform.toLowerCase()];
    if (!normalizedPlatform) {
      return res.status(400).json({ error: `Unknown platform: ${platform}. Supported: facebook, x, instagram, linkedin` });
    }

    const result = await postToSocial(normalizedPlatform, content, { link });
    
    // Log the post
    await db.insert(socialPosts).values({
      platform: normalizedPlatform,
      content,
      link,
      status: result.success ? 'posted' : 'failed',
      externalId: result.postId,
      errorMessage: result.error,
      postedAt: result.success ? new Date() : null,
    });

    if (result.success) {
      return res.json({ success: true, result });
    } else {
      return res.status(400).json({ success: false, error: result.error });
    }
  } catch (error) {
    console.error('Social post error:', error);
    return res.status(500).json({ error: 'Failed to post' });
  }
});

// POST /api/social/post-multi - Post to multiple platforms at once
router.post('/post-multi', async (req, res) => {
  try {
    const { platforms, content, link } = req.body;

    if (!platforms || !Array.isArray(platforms) || !content) {
      return res.status(400).json({ error: 'Platforms array and content are required' });
    }

    const results: PostResult[] = [];

    for (const platform of platforms) {
      const normalizedPlatform = PLATFORM_MAP[platform.toLowerCase()];
      if (normalizedPlatform) {
        const result = await postToSocial(normalizedPlatform, content, { link });
        results.push(result);
        
        // Log the post
        await db.insert(socialPosts).values({
          platform: normalizedPlatform,
          content,
          link,
          status: result.success ? 'posted' : 'failed',
          externalId: result.postId,
          errorMessage: result.error,
          postedAt: result.success ? new Date() : null,
        });
      } else {
        results.push({ platform, success: false, error: `Unknown platform: ${platform}` });
      }
    }

    const allSuccess = results.every(r => r.success);
    return res.json({ 
      success: allSuccess, 
      results,
      summary: {
        total: results.length,
        succeeded: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length
      }
    });
  } catch (error) {
    console.error('Social multi-post error:', error);
    return res.status(500).json({ error: 'Failed to post' });
  }
});

// ============ SCHEDULE ROUTES ============

// POST /api/social/schedule - Schedule a post for later
router.post('/schedule', async (req, res) => {
  try {
    const { projectId, platform, content, scheduledAt, link } = req.body;

    if (!platform || !content || !scheduledAt) {
      return res.status(400).json({ error: 'Platform, content, and scheduledAt are required' });
    }

    const normalizedPlatform = PLATFORM_MAP[platform.toLowerCase()];
    if (!normalizedPlatform) {
      return res.status(400).json({ error: `Unknown platform: ${platform}` });
    }

    const [newPost] = await db
      .insert(socialPosts)
      .values({
        projectId: projectId ? Number(projectId) : null,
        platform: normalizedPlatform,
        content,
        link,
        scheduledAt: new Date(scheduledAt),
        status: 'scheduled',
      })
      .returning();

    return res.json({ success: true, post: newPost });
  } catch (error) {
    console.error('Schedule post error:', error);
    return res.status(500).json({ error: 'Failed to schedule post' });
  }
});

// GET /api/social/pending - Get pending scheduled posts
router.get('/pending', async (req, res) => {
  try {
    const pendingPosts = await db
      .select()
      .from(socialPosts)
      .where(eq(socialPosts.status, 'scheduled'))
      .orderBy(socialPosts.scheduledAt);

    return res.json({ success: true, posts: pendingPosts });
  } catch (error) {
    console.error('Get pending error:', error);
    return res.status(500).json({ error: 'Failed to get pending posts' });
  }
});

// POST /api/social/process-scheduled - Process due scheduled posts (cron calls this)
router.post('/process-scheduled', async (req, res) => {
  try {
    const now = new Date();

    const duePosts = await db
      .select()
      .from(socialPosts)
      .where(
        and(
          eq(socialPosts.status, 'scheduled'),
          lte(socialPosts.scheduledAt, now)
        )
      );

    const results: Array<{ id: number; result: PostResult }> = [];

    for (const post of duePosts) {
      const result = await postToSocial(post.platform as Platform, post.content, { link: post.link || undefined });

      await db
        .update(socialPosts)
        .set({
          status: result.success ? 'posted' : 'failed',
          externalId: result.postId,
          errorMessage: result.error,
          postedAt: result.success ? new Date() : null,
          updatedAt: new Date(),
        })
        .where(eq(socialPosts.id, post.id));

      results.push({ id: post.id, result });
    }

    return res.json({
      success: true,
      processed: results.length,
      results,
    });
  } catch (error) {
    console.error('Process scheduled error:', error);
    return res.status(500).json({ error: 'Failed to process scheduled posts' });
  }
});

// DELETE /api/social/schedule/:id - Cancel a scheduled post
router.delete('/schedule/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await db
      .update(socialPosts)
      .set({ status: 'cancelled', updatedAt: new Date() })
      .where(eq(socialPosts.id, Number(id)));

    return res.json({ success: true, message: 'Scheduled post cancelled' });
  } catch (error) {
    console.error('Cancel scheduled error:', error);
    return res.status(500).json({ error: 'Failed to cancel scheduled post' });
  }
});

// ============ HISTORY ROUTES ============

// GET /api/social/history - Get post history
router.get('/history', async (req, res) => {
  try {
    const { platform, status, limit = 50 } = req.query;

    let query = db.select().from(socialPosts);
    
    const posts = await query.orderBy(socialPosts.createdAt).limit(Number(limit));

    return res.json({ success: true, posts });
  } catch (error) {
    console.error('Get history error:', error);
    return res.status(500).json({ error: 'Failed to get history' });
  }
});

// ============ TEST ROUTES ============

// GET /api/social/test/facebook - Test Facebook connection
router.get('/test/facebook', async (req, res) => {
  try {
    const result = await getFacebookPage();
    return res.json(result);
  } catch (error) {
    console.error('Test Facebook error:', error);
    return res.status(500).json({ success: false, error: 'Failed to test Facebook' });
  }
});

export default router;
