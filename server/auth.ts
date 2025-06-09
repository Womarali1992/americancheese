import { Request, Response, NextFunction } from 'express';
import session from 'express-session';
import MemoryStore from 'memorystore';

// Very simple auth for a prototype app - DON'T use this in production
// Instead, use a proper authentication system with secure password hashing

// Password for authentication
export const ADMIN_PASSWORD = 'richman';

// Authentication token that will be returned after login
// In a real app, this would be dynamically generated per user and stored securely
export const AUTH_TOKEN = 'cm-app-auth-token-123456';

// Create a map to store authenticated users
const authenticatedUsers = new Map<string, boolean>();

// Create memory store for sessions (needed for express-session middleware)
const MemoryStoreSession = MemoryStore(session);

// Configure session middleware with simplest possible settings
export const sessionMiddleware = session({
  secret: 'construction-management-app-secret',
  name: 'construction.sid',
  resave: true,
  saveUninitialized: true,
  store: new MemoryStoreSession({
    checkPeriod: 86400000 // prune expired entries every 24h
  }),
  cookie: { 
    maxAge: 86400000, // 24 hours
    secure: false,
    httpOnly: false,
    path: '/',
    sameSite: 'lax'
  }
});

// Map to store active sessions - this should be a database in production
const activeSessionIpMap = new Map<string, boolean>();

// Very simple authentication middleware using IP as session identifier
// THIS IS NOT SECURE AND ONLY FOR DEMO PURPOSES
export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Determine if this is a module or asset request that should skip auth
  const isAssetOrModuleRequest = 
    req.path.includes('.') ||            // Files with extensions
    req.path.startsWith('/@') ||         // Vite module imports
    req.path.startsWith('/@fs/') ||      // Vite filesystem access
    req.path.startsWith('/@id/') ||      // Vite module ID imports
    req.path.startsWith('/@vite/') ||    // Vite internal modules
    req.path.startsWith('/node_modules/')|| // Node modules  
    req.path.startsWith('/src/') ||      // Source files
    req.path === '/_debug_apis';         // Debug API endpoints
  
  // Skip auth for login page, login endpoint, test endpoint, task templates endpoint, or static assets
  if (req.path === '/login' || 
      req.path === '/api/auth/login' || 
      req.path === '/api/test' ||
      req.path === '/api/task-templates' ||
      isAssetOrModuleRequest) {
    return next();
  }

  console.log('Auth check for path:', req.path);
  
  // Get client IP as session identifier
  const ip = req.ip || req.socket.remoteAddress || '0.0.0.0';
  console.log('Client IP:', ip);
  
  // First check if we have an active session for this IP
  if (activeSessionIpMap.has(ip)) {
    console.log('Found active session for IP:', ip);
    return next();
  }
  
  // Otherwise try the token approach
  // Look in authorization header (Bearer token)
  let token = req.headers.authorization?.split(' ')[1];
  
  // If not found in auth header, check for token in cookies
  if (!token && req.cookies) {
    token = req.cookies.token || req.cookies['cm-app-auth-token'];
    console.log('Found token in cookies:', token);
    console.log('Available cookies:', Object.keys(req.cookies));
  }
  
  // If not found in cookie, check query string
  if (!token && req.query && req.query.token) {
    token = req.query.token as string;
    console.log('Found token in query:', token);
  }
  
  // If not found, check custom header
  if (!token && req.headers['x-access-token']) {
    token = req.headers['x-access-token'] as string;
    console.log('Found token in custom header:', token);
  }
  
  // If not found, check session too
  if (!token && req.session && (req.session as any).token) {
    token = (req.session as any).token;
    console.log('Found token in session:', token);
  }

  // Debug token info
  console.log('Final auth token from request:', token);
  console.log('Expected auth token:', AUTH_TOKEN);
  console.log('Auth headers:', req.headers.authorization);
  console.log('Cookies received:', req.cookies);
  console.log('Session data:', req.session);
  
  // Check for auth token
  const isAuthenticated = token === AUTH_TOKEN || activeSessionIpMap.has(ip);
  
  if (isAuthenticated) {
    console.log('Token auth successful, proceeding to route:', req.path);
    return next();
  }

  // For API requests, return 401 Unauthorized
  if (req.path.startsWith('/api/')) {
    console.log('Token auth failed for API path:', req.path);
    return res.status(401).json({ 
      message: 'Unauthorized - invalid or missing token',
      path: req.path
    });
  }

  // For non-API requests, redirect to login
  console.log('Token auth failed, redirecting to login');
  return res.redirect('/login');
};

// Login handler - simple token-based auth combined with IP-based session
export const handleLogin = (req: Request, res: Response) => {
  const { password } = req.body;

  console.log('Login attempt, checking password');

  if (password === ADMIN_PASSWORD) {
    console.log('Password correct, returning auth token');
    
    // Get client IP for session tracking
    const ip = req.ip || req.socket.remoteAddress || '0.0.0.0';
    console.log('Storing session for IP:', ip);
    
    // Store IP in active sessions map - this would be a DB in production
    activeSessionIpMap.set(ip, true);
    
    // ALSO store auth token in session
    if (req.session) {
      (req.session as any).authenticated = true;
      (req.session as any).token = AUTH_TOKEN;
      (req.session as any).loginTime = new Date();
      console.log('Session data stored:', { 
        auth: (req.session as any).authenticated,
        token: (req.session as any).token
      });
    }
    
    // Set a cookie with the token - multiple approaches for redundancy
    res.cookie('token', AUTH_TOKEN, {
      maxAge: 86400000, // 24 hours
      httpOnly: false, // Allow JS access
      secure: false,
      path: '/',
      sameSite: 'lax'
    });
    
    // Also set a second cookie with different options as fallback
    res.cookie('auth', AUTH_TOKEN, {
      maxAge: 86400000, // 24 hours
      httpOnly: false,
      secure: false,
      path: '/'
    });
    
    return res.json({ 
      success: true, 
      message: 'Authentication successful',
      token: AUTH_TOKEN, // Send token in response
      ip: ip // Include IP in response for debugging
    });
  } else {
    console.log('Login failed: invalid password');
    res.status(401).json({ 
      success: false, 
      message: 'Invalid password' 
    });
  }
};

// Logout handler - just clear the token
export const handleLogout = (req: Request, res: Response) => {
  res.clearCookie('token');
  res.json({ 
    success: true, 
    message: 'Logged out successfully' 
  });
};