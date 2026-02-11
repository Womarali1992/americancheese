import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import { registerRoutes } from "./routes";
import unifiedCategoryRoutes from "./unified-category-routes";
import contextRoutes from "./context-routes";
import socialRoutes from "./social-routes";
import { registerAutomationRoutes } from "./automation-routes";
import { setupVite, serveStatic, log } from "./vite";
import { initDatabase } from "./db";
import { authMiddleware, sessionMiddleware } from "./auth";
import cookieParser from 'cookie-parser';

const app = express();

// Enable CORS with environment-aware origin policy
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? (process.env.CORS_ORIGIN || 'https://app.sitesetups.com')
    : true,
  credentials: true,
}));

// Increase body size limits for file uploads (images can be large when base64 encoded)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));
app.use(cookieParser()); // Parse cookies
app.use(sessionMiddleware); // Keep for session storage
app.use(authMiddleware); // Apply authentication

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Initialize database
  try {
    await initDatabase();
    log("Database initialization completed successfully");
  } catch (error) {
    log(`Database initialization failed: ${error}`);
    // Continue running the app anyway, as we don't want to crash if DB setup has issues
  }

  const server = await registerRoutes(app);

  // Add unified category management routes
  app.use(unifiedCategoryRoutes);

  // Add context control center routes
  app.use('/api', contextRoutes);

  // Add social media routes
  app.use('/api/social', socialRoutes);

  // Add automation and webhook routes
  registerAutomationRoutes(app);

  // We're removing this middleware as it's redundant with the authMiddleware
  // and may be interfering with Vite module loading

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    // Do not rethrow; allow Express to continue running in dev
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Serve the app on configured port (default 5000)
  const port = parseInt(process.env.PORT || '5000');
  server.listen(port, "0.0.0.0", async () => {
    log(`serving on port ${port}`);

    // Log available network interfaces to help with mobile debugging
    const { networkInterfaces } = await import('os');
    const nets = networkInterfaces();
    const results: Record<string, string[]> = {};

    for (const name of Object.keys(nets)) {
      for (const net of nets[name] || []) {
        // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
        if (net.family === 'IPv4' && !net.internal) {
          if (!results[name]) {
            results[name] = [];
          }
          results[name].push(net.address);
        }
      }
    }

    // Print the local IP addresses
    log("=================================================");
    log(`Server running on port ${port}`);
    log(`Local:   http://localhost:${port}`);

    Object.keys(results).forEach((name) => {
      results[name].forEach((ip) => {
        log(`Network: http://${ip}:${port}  <-- USE THIS FOR MOBILE`);
      });
    });
    log("=================================================");
  });
})();
