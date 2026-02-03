import { Request, Response, NextFunction } from 'express';
import session from 'express-session';
import MemoryStore from 'memorystore';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { db } from './db';
import { users, registerUserSchema, loginUserSchema } from '../shared/schema';
import { eq } from 'drizzle-orm';

// Extend express-session types
declare module 'express-session' {
  interface SessionData {
    authenticated: boolean;
    userId: number;
    userEmail: string;
    userName: string;
    token: string;
    loginTime: Date;
  }
}

// Constants
const SALT_ROUNDS = 10;
const TOKEN_EXPIRY_MS = 86400000; // 24 hours

// Create memory store for sessions
const MemoryStoreSession = MemoryStore(session);

// Store for auth tokens (in production, use Redis or database)
const tokenStore = new Map<string, { userId: number; email: string; expiresAt: Date }>();

// Generate a secure token
function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Configure session middleware
export const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET || 'construction-management-app-secret',
  name: 'construction.sid',
  resave: true,
  saveUninitialized: true,
  store: new MemoryStoreSession({
    checkPeriod: 86400000 // prune expired entries every 24h
  }),
  cookie: {
    maxAge: TOKEN_EXPIRY_MS,
    secure: process.env.NODE_ENV === 'production',
    httpOnly: false,
    path: '/',
    sameSite: 'lax'
  }
});

// Authentication middleware
export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Determine if this is a module or asset request that should skip auth
  const isAssetOrModuleRequest =
    req.path.includes('.') ||
    req.path.startsWith('/@') ||
    req.path.startsWith('/@fs/') ||
    req.path.startsWith('/@id/') ||
    req.path.startsWith('/@vite/') ||
    req.path.startsWith('/node_modules/') ||
    req.path.startsWith('/src/') ||
    req.path === '/_debug_apis';

  // Skip auth for public pages and endpoints
  if (req.path === '/login' ||
      req.path === '/signup' ||
      req.path === '/api/auth/login' ||
      req.path === '/api/auth/register' ||
      req.path === '/api/auth/logout' ||
      req.path === '/api/test' ||
      req.path === '/api/task-templates' ||
      isAssetOrModuleRequest ||
      process.env.NODE_ENV !== 'production') {
    return next();
  }

  // Check for authentication token
  let token = req.headers.authorization?.split(' ')[1];

  // Check cookies for token
  if (!token && req.cookies) {
    token = req.cookies.token || req.cookies['auth-token'];
  }

  // Check query string
  if (!token && req.query && req.query.token) {
    token = req.query.token as string;
  }

  // Check custom header
  if (!token && req.headers['x-access-token']) {
    token = req.headers['x-access-token'] as string;
  }

  // Check session
  if (!token && req.session && req.session.token) {
    token = req.session.token;
  }

  // Validate token
  if (token && tokenStore.has(token)) {
    const tokenData = tokenStore.get(token)!;
    if (tokenData.expiresAt > new Date()) {
      return next();
    } else {
      // Token expired, remove it
      tokenStore.delete(token);
    }
  }

  // Check session authentication
  if (req.session && req.session.authenticated) {
    return next();
  }

  // Not authenticated
  if (req.path.startsWith('/api/')) {
    return res.status(401).json({
      message: 'Unauthorized - please log in',
      path: req.path
    });
  }

  return res.redirect('/login');
};

// Register handler
export const handleRegister = async (req: Request, res: Response) => {
  try {
    // Validate input
    const validationResult = registerUserSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationResult.error.errors
      });
    }

    const { email, password, name, company } = validationResult.data;

    // Check if database is available
    if (!db) {
      return res.status(503).json({
        success: false,
        message: 'Database not available'
      });
    }

    // Check if user already exists
    const existingUser = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);
    if (existingUser.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists'
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // Create user
    const [newUser] = await db.insert(users).values({
      email: email.toLowerCase(),
      passwordHash,
      name,
      company: company || null,
      role: 'user',
      isActive: true
    }).returning();

    // Generate token
    const token = generateToken();
    tokenStore.set(token, {
      userId: newUser.id,
      email: newUser.email,
      expiresAt: new Date(Date.now() + TOKEN_EXPIRY_MS)
    });

    // Set session
    req.session.authenticated = true;
    req.session.userId = newUser.id;
    req.session.userEmail = newUser.email;
    req.session.userName = newUser.name;
    req.session.token = token;
    req.session.loginTime = new Date();

    // Set cookies
    res.cookie('token', token, {
      maxAge: TOKEN_EXPIRY_MS,
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'lax'
    });

    console.log('New user registered:', newUser.email);

    return res.json({
      success: true,
      message: 'Registration successful',
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        company: newUser.company
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({
      success: false,
      message: 'Registration failed. Please try again.'
    });
  }
};

// Login handler
export const handleLogin = async (req: Request, res: Response) => {
  try {
    // Validate input
    const validationResult = loginUserSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationResult.error.errors
      });
    }

    const { email, password } = validationResult.data;

    // Check if database is available
    if (!db) {
      return res.status(503).json({
        success: false,
        message: 'Database not available'
      });
    }

    // Find user
    const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Update last login time
    await db.update(users).set({
      lastLoginAt: new Date(),
      updatedAt: new Date()
    }).where(eq(users.id, user.id));

    // Generate token
    const token = generateToken();
    tokenStore.set(token, {
      userId: user.id,
      email: user.email,
      expiresAt: new Date(Date.now() + TOKEN_EXPIRY_MS)
    });

    // Set session
    req.session.authenticated = true;
    req.session.userId = user.id;
    req.session.userEmail = user.email;
    req.session.userName = user.name;
    req.session.token = token;
    req.session.loginTime = new Date();

    // Set cookies
    res.cookie('token', token, {
      maxAge: TOKEN_EXPIRY_MS,
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'lax'
    });

    console.log('User logged in:', user.email);

    return res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        company: user.company
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Login failed. Please try again.'
    });
  }
};

// Logout handler
export const handleLogout = (req: Request, res: Response) => {
  // Remove token from store
  if (req.session && req.session.token) {
    tokenStore.delete(req.session.token);
  }

  // Clear session
  req.session.destroy((err) => {
    if (err) {
      console.error('Session destruction error:', err);
    }
  });

  // Clear cookies
  res.clearCookie('token');
  res.clearCookie('construction.sid');

  return res.json({
    success: true,
    message: 'Logged out successfully'
  });
};

// Get current user handler
export const handleGetCurrentUser = async (req: Request, res: Response) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({
      success: false,
      message: 'Not authenticated'
    });
  }

  try {
    if (!db) {
      return res.status(503).json({
        success: false,
        message: 'Database not available'
      });
    }

    const [user] = await db.select({
      id: users.id,
      email: users.email,
      name: users.name,
      company: users.company,
      role: users.role,
      createdAt: users.createdAt
    }).from(users).where(eq(users.id, req.session.userId)).limit(1);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    return res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Get current user error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get user data'
    });
  }
};
