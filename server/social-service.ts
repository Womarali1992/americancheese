import crypto from 'crypto';
import { db } from './db';
import { credentials, socialPosts } from '../shared/schema';
import { eq } from 'drizzle-orm';

// Encryption config
const ALGORITHM = 'aes-256-gcm';

function getEncryptionKey(): Buffer {
  const masterKey = process.env.MASTER_ENCRYPTION_KEY;
  if (!masterKey) {
    // Fallback to deterministic dev key
    return crypto.scryptSync('dev-key-not-for-production', 'salt', 32);
  }
  return Buffer.from(masterKey, 'hex');
}

// Encrypt a value
export function encryptValue(plaintext: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, getEncryptionKey(), iv);
  
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

// Decrypt a value
export function decryptValue(encryptedData: string): string {
  try {
    const [ivHex, authTagHex, encryptedHex] = encryptedData.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const encrypted = Buffer.from(encryptedHex, 'hex');
    
    const decipher = crypto.createDecipheriv(ALGORITHM, getEncryptionKey(), iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, undefined, 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption failed:', error);
    throw new Error('Failed to decrypt credential');
  }
}

// Get a credential by name
export async function getCredential(name: string): Promise<string | null> {
  try {
    const [cred] = await db
      .select()
      .from(credentials)
      .where(eq(credentials.name, name))
      .limit(1);
    
    if (!cred || !cred.encryptedValue) return null;
    return decryptValue(cred.encryptedValue);
  } catch (error) {
    console.error(`Failed to get credential ${name}:`, error);
    return null;
  }
}

// Get credentials by service
export async function getCredentialsByService(service: string): Promise<Record<string, string>> {
  try {
    const creds = await db
      .select()
      .from(credentials)
      .where(eq(credentials.service, service));
    
    const result: Record<string, string> = {};
    for (const cred of creds) {
      if (cred.encryptedValue) {
        result[cred.name] = decryptValue(cred.encryptedValue);
      }
    }
    return result;
  } catch (error) {
    console.error(`Failed to get credentials for ${service}:`, error);
    return {};
  }
}

// ============ FACEBOOK API ============

export async function postToFacebook(message: string, link?: string): Promise<{ success: boolean; postId?: string; error?: string }> {
  try {
    const creds = await getCredentialsByService('facebook');
    
    const pageToken = creds['Facebook Page Token'];
    const pageId = creds['Facebook Page ID'];

    if (!pageToken || !pageId) {
      return { success: false, error: 'Facebook credentials not configured' };
    }

    const params: Record<string, string> = {
      message,
      access_token: pageToken,
    };
    if (link) params.link = link;

    const response = await fetch(`https://graph.facebook.com/v24.0/${pageId}/feed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(params).toString(),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error?.message || 'Facebook API error' };
    }

    return { success: true, postId: data.id };
  } catch (error) {
    console.error('Facebook post error:', error);
    return { success: false, error: String(error) };
  }
}

export async function getFacebookPage(): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const creds = await getCredentialsByService('facebook');
    
    const pageToken = creds['Facebook Page Token'];
    const pageId = creds['Facebook Page ID'];

    if (!pageToken || !pageId) {
      return { success: false, error: 'Facebook credentials not configured' };
    }

    const response = await fetch(
      `https://graph.facebook.com/v24.0/${pageId}?fields=name,id,fan_count,followers_count&access_token=${pageToken}`
    );

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error?.message || 'Facebook API error' };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Facebook page error:', error);
    return { success: false, error: String(error) };
  }
}

// ============ X/TWITTER API ============

function generateOAuthSignature(
  method: string,
  url: string,
  params: Record<string, string>,
  consumerSecret: string,
  tokenSecret: string
): string {
  const signatureBaseString = [
    method.toUpperCase(),
    encodeURIComponent(url),
    encodeURIComponent(
      Object.keys(params)
        .sort()
        .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
        .join('&')
    )
  ].join('&');

  const signingKey = `${encodeURIComponent(consumerSecret)}&${encodeURIComponent(tokenSecret)}`;
  
  return crypto
    .createHmac('sha1', signingKey)
    .update(signatureBaseString)
    .digest('base64');
}

function generateOAuthHeader(
  method: string,
  url: string,
  consumerKey: string,
  consumerSecret: string,
  accessToken: string,
  accessTokenSecret: string
): string {
  const oauthParams: Record<string, string> = {
    oauth_consumer_key: consumerKey,
    oauth_nonce: crypto.randomBytes(16).toString('hex'),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: accessToken,
    oauth_version: '1.0'
  };

  const signature = generateOAuthSignature(
    method,
    url,
    oauthParams,
    consumerSecret,
    accessTokenSecret
  );

  oauthParams.oauth_signature = signature;

  const headerString = Object.keys(oauthParams)
    .sort()
    .map(key => `${encodeURIComponent(key)}="${encodeURIComponent(oauthParams[key])}"`)
    .join(', ');

  return `OAuth ${headerString}`;
}

export async function postToX(text: string): Promise<{ success: boolean; tweetId?: string; error?: string }> {
  try {
    const creds = await getCredentialsByService('x');

    const consumerKey = creds['X API Consumer Key'];
    const consumerSecret = creds['X API Secret Key'];
    const accessToken = creds['X API Access Token'];
    const accessTokenSecret = creds['X API Access Token Secret'];

    if (!consumerKey || !consumerSecret || !accessToken || !accessTokenSecret) {
      return { success: false, error: 'X/Twitter credentials not configured. Need: Consumer Key, Secret, Access Token, Access Token Secret' };
    }

    if (text.length > 280) {
      return { success: false, error: 'Tweet exceeds 280 characters' };
    }

    const url = 'https://api.twitter.com/2/tweets';
    const authHeader = generateOAuthHeader(
      'POST',
      url,
      consumerKey,
      consumerSecret,
      accessToken,
      accessTokenSecret
    );

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.detail || data.title || JSON.stringify(data) };
    }

    return { success: true, tweetId: data.data?.id };
  } catch (error) {
    console.error('X post error:', error);
    return { success: false, error: String(error) };
  }
}

// ============ UNIFIED POST FUNCTION ============

export type Platform = 'facebook' | 'x' | 'instagram' | 'linkedin';

export interface PostResult {
  platform: Platform;
  success: boolean;
  postId?: string;
  error?: string;
}

export async function postToSocial(
  platform: Platform,
  content: string,
  options?: { link?: string }
): Promise<PostResult> {
  switch (platform) {
    case 'facebook':
      const fbResult = await postToFacebook(content, options?.link);
      return { platform, ...fbResult };
    
    case 'x':
      const xResult = await postToX(content);
      return { platform, ...xResult };
    
    case 'instagram':
      return { platform, success: false, error: 'Instagram posting not yet implemented' };
    
    case 'linkedin':
      return { platform, success: false, error: 'LinkedIn posting not yet implemented' };
    
    default:
      return { platform, success: false, error: `Unknown platform: ${platform}` };
  }
}
