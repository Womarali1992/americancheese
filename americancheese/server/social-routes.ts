import { Router, Request, Response } from 'express';
import { getCredentialByName } from './credentials-service';
import crypto from 'crypto';

const router = Router();

// ==================== FACEBOOK ROUTES ====================

/**
 * POST /api/social/facebook/post
 * Post to Facebook Page
 * Body: { message: string, link?: string, imageUrl?: string }
 */
router.post('/facebook/post', async (req: Request, res: Response) => {
  if (!req.session?.userId) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }

  try {
    const { message, link, imageUrl } = req.body;

    if (!message) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }

    // Get credentials
    const pageToken = await getCredentialByName(req.session.userId, 'Facebook Page Token');
    const pageId = await getCredentialByName(req.session.userId, 'Facebook Page ID');

    if (!pageToken || !pageId) {
      return res.status(404).json({
        success: false,
        message: 'Facebook credentials not found. Need: Facebook Page Token, Facebook Page ID'
      });
    }

    // Build post data
    const postData: Record<string, string> = {
      message,
      access_token: pageToken.value
    };

    if (link) postData.link = link;

    let endpoint = `https://graph.facebook.com/v18.0/${pageId.value}/feed`;

    // If posting with image, use photos endpoint
    if (imageUrl) {
      endpoint = `https://graph.facebook.com/v18.0/${pageId.value}/photos`;
      postData.url = imageUrl;
      postData.caption = message;
      delete postData.message;
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(postData)
    });

    const data = await response.json();

    if (data.error) {
      console.error('Facebook post error:', data.error);
      return res.json({
        success: false,
        message: 'Facebook API error',
        error: data.error.message
      });
    }

    console.log('Facebook post created:', data.id, 'by user:', req.session.userId);

    return res.json({
      success: true,
      message: 'Posted to Facebook successfully',
      postId: data.id,
      postUrl: `https://facebook.com/${data.id}`
    });
  } catch (error) {
    console.error('Error posting to Facebook:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to post to Facebook',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * GET /api/social/facebook/page
 * Get Facebook Page info
 */
router.get('/facebook/page', async (req: Request, res: Response) => {
  if (!req.session?.userId) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }

  try {
    const pageToken = await getCredentialByName(req.session.userId, 'Facebook Page Token');
    const pageId = await getCredentialByName(req.session.userId, 'Facebook Page ID');

    if (!pageToken || !pageId) {
      return res.status(404).json({
        success: false,
        message: 'Facebook credentials not found'
      });
    }

    const response = await fetch(
      `https://graph.facebook.com/v18.0/${pageId.value}?access_token=${pageToken.value}&fields=name,id,fan_count,followers_count,link`
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
      page: data
    });
  } catch (error) {
    console.error('Error getting Facebook page:', error);
    return res.status(500).json({ success: false, message: 'Failed to get page info' });
  }
});

// ==================== X (TWITTER) ROUTES ====================

/**
 * Helper to generate OAuth 1.0a signature for X API
 */
function generateOAuthSignature(
  method: string,
  url: string,
  params: Record<string, string>,
  consumerSecret: string,
  tokenSecret: string = ''
): string {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    .join('&');

  const signatureBase = [
    method.toUpperCase(),
    encodeURIComponent(url),
    encodeURIComponent(sortedParams)
  ].join('&');

  const signingKey = `${encodeURIComponent(consumerSecret)}&${encodeURIComponent(tokenSecret)}`;

  return crypto
    .createHmac('sha1', signingKey)
    .update(signatureBase)
    .digest('base64');
}

/**
 * POST /api/social/x/post
 * Post a tweet to X (Twitter)
 * Body: { text: string }
 *
 * Note: Requires OAuth 1.0a User Context (Consumer Key, Consumer Secret, Access Token, Access Token Secret)
 * The Bearer Token alone only works for read operations
 */
router.post('/x/post', async (req: Request, res: Response) => {
  if (!req.session?.userId) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }

  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ success: false, message: 'Text is required' });
    }

    if (text.length > 280) {
      return res.status(400).json({ success: false, message: 'Tweet exceeds 280 characters' });
    }

    // Get credentials - need Consumer Key & Secret for OAuth 1.0a signing
    const consumerKey = await getCredentialByName(req.session.userId, 'X API Consumer Key');
    const consumerSecret = await getCredentialByName(req.session.userId, 'X API Secret Key');
    const accessToken = await getCredentialByName(req.session.userId, 'X API Access Token');
    const accessTokenSecret = await getCredentialByName(req.session.userId, 'X API Access Token Secret');

    // Check if we have OAuth 1.0a credentials
    if (!consumerKey || !consumerSecret) {
      return res.status(404).json({
        success: false,
        message: 'X API Consumer credentials not found. Need: X API Consumer Key, X API Secret Key'
      });
    }

    // For posting, we need user access tokens (OAuth 1.0a)
    if (!accessToken || !accessTokenSecret) {
      // Try using Bearer token with v2 API (requires OAuth 2.0 User Context)
      const bearerToken = await getCredentialByName(req.session.userId, 'X API Bearer Token');

      if (!bearerToken) {
        return res.status(404).json({
          success: false,
          message: 'X API credentials incomplete. For posting, you need either: (1) Access Token + Access Token Secret for OAuth 1.0a, or (2) OAuth 2.0 User Access Token'
        });
      }

      // Try posting with Bearer token (OAuth 2.0)
      const response = await fetch('https://api.twitter.com/2/tweets', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${bearerToken.value}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text })
      });

      const data = await response.json();

      if (data.errors || data.detail) {
        console.error('X API error:', data);
        return res.json({
          success: false,
          message: 'X API error',
          error: data.errors?.[0]?.message || data.detail || 'Unknown error',
          hint: 'Bearer tokens from App-only auth cannot post tweets. You need OAuth 2.0 User Context or OAuth 1.0a tokens.'
        });
      }

      if (data.data?.id) {
        console.log('Tweet posted:', data.data.id, 'by user:', req.session.userId);
        return res.json({
          success: true,
          message: 'Posted to X successfully',
          tweetId: data.data.id,
          tweetUrl: `https://twitter.com/i/status/${data.data.id}`
        });
      }
    }

    // Use OAuth 1.0a if we have all credentials
    const url = 'https://api.twitter.com/2/tweets';
    const oauthParams: Record<string, string> = {
      oauth_consumer_key: consumerKey.value,
      oauth_nonce: crypto.randomBytes(16).toString('hex'),
      oauth_signature_method: 'HMAC-SHA1',
      oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
      oauth_token: accessToken.value,
      oauth_version: '1.0'
    };

    const signature = generateOAuthSignature(
      'POST',
      url,
      oauthParams,
      consumerSecret.value,
      accessTokenSecret.value
    );

    oauthParams.oauth_signature = signature;

    const authHeader = 'OAuth ' + Object.keys(oauthParams)
      .sort()
      .map(key => `${encodeURIComponent(key)}="${encodeURIComponent(oauthParams[key])}"`)
      .join(', ');

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ text })
    });

    const data = await response.json();

    if (data.errors) {
      console.error('X API error:', data.errors);
      return res.json({
        success: false,
        message: 'X API error',
        error: data.errors[0]?.message || 'Unknown error'
      });
    }

    console.log('Tweet posted:', data.data?.id, 'by user:', req.session.userId);

    return res.json({
      success: true,
      message: 'Posted to X successfully',
      tweetId: data.data?.id,
      tweetUrl: `https://twitter.com/i/status/${data.data?.id}`
    });
  } catch (error) {
    console.error('Error posting to X:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to post to X',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * GET /api/social/x/me
 * Get authenticated X user info
 */
router.get('/x/me', async (req: Request, res: Response) => {
  if (!req.session?.userId) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }

  try {
    const bearerToken = await getCredentialByName(req.session.userId, 'X API Bearer Token');

    if (!bearerToken) {
      return res.status(404).json({
        success: false,
        message: 'X API Bearer Token not found'
      });
    }

    const response = await fetch(
      'https://api.twitter.com/2/users/me?user.fields=public_metrics,description,profile_image_url',
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
      user: data.data
    });
  } catch (error) {
    console.error('Error getting X user:', error);
    return res.status(500).json({ success: false, message: 'Failed to get user info' });
  }
});

// ==================== UNIFIED POSTING ====================

/**
 * POST /api/social/post
 * Post to multiple platforms at once
 * Body: { message: string, platforms: ['facebook', 'x'], link?: string }
 */
router.post('/post', async (req: Request, res: Response) => {
  if (!req.session?.userId) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }

  try {
    const { message, platforms, link } = req.body;

    if (!message) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }

    if (!platforms || !Array.isArray(platforms) || platforms.length === 0) {
      return res.status(400).json({ success: false, message: 'Platforms array is required' });
    }

    const results: Record<string, any> = {};

    // Post to Facebook
    if (platforms.includes('facebook')) {
      try {
        const pageToken = await getCredentialByName(req.session.userId, 'Facebook Page Token');
        const pageId = await getCredentialByName(req.session.userId, 'Facebook Page ID');

        if (pageToken && pageId) {
          const postData: Record<string, string> = {
            message,
            access_token: pageToken.value
          };
          if (link) postData.link = link;

          const response = await fetch(
            `https://graph.facebook.com/v18.0/${pageId.value}/feed`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(postData)
            }
          );
          const data = await response.json();

          if (data.error) {
            results.facebook = { success: false, error: data.error.message };
          } else {
            results.facebook = { success: true, postId: data.id };
          }
        } else {
          results.facebook = { success: false, error: 'Credentials not found' };
        }
      } catch (e) {
        results.facebook = { success: false, error: String(e) };
      }
    }

    // Post to X
    if (platforms.includes('x') || platforms.includes('twitter')) {
      try {
        const bearerToken = await getCredentialByName(req.session.userId, 'X API Bearer Token');

        if (bearerToken) {
          // Truncate for Twitter if needed
          const tweetText = message.length > 280
            ? message.substring(0, 277) + '...'
            : message;

          const response = await fetch('https://api.twitter.com/2/tweets', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${bearerToken.value}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ text: tweetText })
          });
          const data = await response.json();

          if (data.errors || data.detail) {
            results.x = {
              success: false,
              error: data.errors?.[0]?.message || data.detail,
              hint: 'App-only Bearer tokens cannot post. Need OAuth 2.0 User Context.'
            };
          } else if (data.data?.id) {
            results.x = { success: true, tweetId: data.data.id };
          }
        } else {
          results.x = { success: false, error: 'Credentials not found' };
        }
      } catch (e) {
        results.x = { success: false, error: String(e) };
      }
    }

    const successCount = Object.values(results).filter((r: any) => r.success).length;

    return res.json({
      success: successCount > 0,
      message: `Posted to ${successCount} of ${platforms.length} platforms`,
      results
    });
  } catch (error) {
    console.error('Error in unified post:', error);
    return res.status(500).json({ success: false, message: 'Failed to post' });
  }
});

export default router;
