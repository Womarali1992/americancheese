import { SAFE_ERROR_MESSAGES } from '../../shared/constants/errors';

/**
 * Sanitize errors from member operations to prevent information leakage (SEC-01)
 *
 * SECURITY GUARANTEE:
 * This function ensures that internal error details (like "user exists", "user not found",
 * "user is owner", etc.) are NEVER exposed to the client. All errors are mapped to generic
 * messages that reveal NO information about user existence or state.
 *
 * WHY THIS EXISTS:
 * Without this sanitizer, different error messages would allow attackers to enumerate
 * valid email addresses in the system. By always returning the same message, we prevent
 * this attack vector entirely.
 *
 * USAGE RULES:
 * 1. ALWAYS use this function when handling member operation errors
 * 2. NEVER return the raw error message to the client
 * 3. NEVER create custom error messages in the endpoint handlers
 * 4. The real error is logged server-side for debugging
 *
 * @param error - The internal error (logged server-side but NOT exposed to client)
 * @param context - The operation context determining which generic message to return
 * @returns A safe, generic error message with no information leakage
 *
 * @example
 * ```typescript
 * // In your route handler
 * try {
 *   await inviteUserToProject(email, projectId);
 *   res.json({ success: true });
 * } catch (error) {
 *   // Use sanitizer to get safe message
 *   const safeMessage = sanitizeMemberError(error as Error, 'invite');
 *   res.status(400).json({ error: safeMessage });
 * }
 * ```
 *
 * @example
 * ```typescript
 * // What NOT to do
 * catch (error) {
 *   // ❌ WRONG: Exposes internal error message
 *   res.status(400).json({ error: error.message });
 * }
 *
 * // ✅ CORRECT: Use sanitizer
 * catch (error) {
 *   const safeMessage = sanitizeMemberError(error as Error, 'invite');
 *   res.status(400).json({ error: safeMessage });
 * }
 * ```
 */
export function sanitizeMemberError(
  error: Error,
  context: 'invite' | 'update' | 'remove' | 'accept'
): string {
  // Log the actual error for debugging (server-side only, never sent to client)
  console.error('Member operation error:', error);

  // Return generic message based on context
  // CRITICAL: Same message regardless of error type (user exists, not found, is owner, etc.)
  switch (context) {
    case 'invite':
      return SAFE_ERROR_MESSAGES.INVITATION_FAILED;
    case 'update':
      return SAFE_ERROR_MESSAGES.MEMBER_UPDATE_FAILED;
    case 'remove':
      return SAFE_ERROR_MESSAGES.MEMBER_REMOVE_FAILED;
    case 'accept':
      return SAFE_ERROR_MESSAGES.INVITATION_FAILED;
  }
}
