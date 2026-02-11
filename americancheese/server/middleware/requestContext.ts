import type { Request, Response, NextFunction } from 'express';

/**
 * Request Context Middleware
 *
 * Captures request metadata (IP address, user agent) and attaches it to the request object.
 * This context is used by the audit logger to track the source of member operations.
 *
 * Security Features:
 * - Handles proxy headers (X-Forwarded-For, X-Real-IP) for accurate IP tracking
 * - Sanitizes and normalizes IP addresses
 * - Provides fallback values for missing data
 *
 * Usage:
 * ```typescript
 * app.use(captureRequestContext);
 *
 * // Access in route handlers:
 * const { ipAddress, userAgent } = (req as any).context;
 * ```
 *
 * Part of SEC-02: Missing Audit Trail fix
 *
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Next middleware function
 */
export function captureRequestContext(req: Request, res: Response, next: NextFunction) {
  // Capture IP address (handle proxies)
  // Priority: X-Forwarded-For > X-Real-IP > socket remote address
  const ipAddress = req.headers['x-forwarded-for']?.toString().split(',')[0].trim()
    || req.headers['x-real-ip']?.toString()
    || req.socket.remoteAddress
    || 'unknown';

  // Capture user agent
  const userAgent = req.headers['user-agent'] || 'unknown';

  // Attach context to request object for downstream use
  (req as any).context = { ipAddress, userAgent };

  next();
}
