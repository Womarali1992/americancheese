import { Request, Response, NextFunction } from 'express';
import session from 'express-session';
import MemoryStore from 'memorystore';

// Simplify the approach - use an API key token approach instead of sessions
// This works more reliably for simple auth scenarios

// Password for authentication
const ADMIN_PASSWORD = 'richman';

// Authentication token that will be returned after login
// In a real app, this would be dynamically generated and stored securely
const AUTH_TOKEN = 'cm-app-auth-token-123456';

// Create memory store for sessions (needed for express-session middleware)
const MemoryStoreSession = MemoryStore(session);

// Configure session middleware (still needed for express)
export const sessionMiddleware = session({
  secret: 'construction-management-app-secret',
  name: 'construction.sid',
  resave: false,
  saveUninitialized: false,
  store: new MemoryStoreSession({
    checkPeriod: 86400000 // prune expired entries every 24h
  }),
  cookie: { 
    maxAge: 86400000, // 24 hours
    secure: false,
    httpOnly: false,
    path: '/'
  }
});

// Very simple authentication middleware that checks for the token in the header
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
  
  // Skip auth for login page, login endpoint, test endpoint, or static assets
  if (req.path === '/login' || 
      req.path === '/api/auth/login' || 
      req.path === '/api/test' || 
      isAssetOrModuleRequest) {
    return next();
  }

  console.log('Auth check for path:', req.path);
  
  // Get token from header, query string, or cookie to support all client methods
  const token = 
    req.headers.authorization?.split(' ')[1] || // From Authorization header
    req.query.token as string || // From query string
    req.cookies?.token || // From cookies
    req.headers['x-access-token']; // From custom header

  // Debug token info
  console.log('Auth token from request:', token);
  console.log('Expected auth token:', AUTH_TOKEN);
  console.log('Auth headers:', req.headers.authorization);
  console.log('Cookies received:', req.cookies);
  
  // Check for auth token
  const isAuthenticated = token === AUTH_TOKEN;
  
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

// Login handler - simple token-based auth
export const handleLogin = (req: Request, res: Response) => {
  const { password } = req.body;

  console.log('Login attempt, checking password');

  if (password === ADMIN_PASSWORD) {
    console.log('Password correct, returning auth token');
    
    // Set a cookie with the token
    res.cookie('token', AUTH_TOKEN, {
      maxAge: 86400000, // 24 hours
      httpOnly: false, // Allow JS access so we can check it
      secure: false,
      path: '/'
    });
    
    return res.json({ 
      success: true, 
      message: 'Authentication successful',
      token: AUTH_TOKEN // Send token in response
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