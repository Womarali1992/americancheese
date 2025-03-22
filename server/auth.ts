import { Request, Response, NextFunction } from 'express';
import session, { SessionData } from 'express-session';
import MemoryStore from 'memorystore';

// Add authenticated property to session
declare module 'express-session' {
  interface SessionData {
    authenticated?: boolean;
  }
}

// Create memory store for sessions
const MemoryStoreSession = MemoryStore(session);

// Password for authentication
const ADMIN_PASSWORD = 'richman';

// Configure session middleware
export const sessionMiddleware = session({
  secret: 'construction-management-app-secret',
  name: 'construction.sid',
  resave: true,
  saveUninitialized: false,
  rolling: true, // Reset maxAge on every response
  store: new MemoryStoreSession({
    checkPeriod: 86400000 // prune expired entries every 24h
  }),
  cookie: { 
    maxAge: 86400000, // 24 hours
    secure: false, // In production, this should be true if using HTTPS
    httpOnly: true,
    sameSite: 'lax',
    path: '/'
  }
});

// Authentication middleware
export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Determine if this is a module or asset request
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

  console.log('Auth check for path:', req.path, 'Session authenticated:', !!req.session.authenticated);
  console.log('Session ID:', req.session.id);
  console.log('Cookies:', req.headers.cookie);

  // Check if user is authenticated
  if (req.session && req.session.authenticated === true) {
    console.log('User is authenticated, proceeding to protected route');
    return next();
  }

  // For API requests, return 401 Unauthorized
  if (req.path.startsWith('/api/')) {
    console.log('Denying access to API path:', req.path);
    return res.status(401).json({ message: 'Unauthorized' });
  }

  // For other requests, redirect to login page
  console.log('Redirecting to login page from path:', req.path);
  return res.redirect('/login');
};

// Login handler
export const handleLogin = (req: Request, res: Response) => {
  const { password } = req.body;

  if (password === ADMIN_PASSWORD) {
    req.session.authenticated = true;
    // Explicitly save the session to ensure the store is updated
    req.session.save((err) => {
      if (err) {
        console.error('Error saving session:', err);
        return res.status(500).json({ success: false, message: 'Session save failed' });
      }
      return res.json({ 
        success: true, 
        message: 'Authentication successful',
        session: req.session.id // Return the session ID for debugging
      });
    });
  } else {
    res.status(401).json({ success: false, message: 'Invalid password' });
  }
};

// Logout handler
export const handleLogout = (req: Request, res: Response) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error destroying session:', err);
      res.status(500).json({ success: false, message: 'Logout failed' });
    } else {
      res.clearCookie('construction.sid'); // Make sure this matches the session name above
      res.json({ success: true, message: 'Logged out successfully' });
    }
  });
};