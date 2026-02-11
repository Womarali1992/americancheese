/**
 * Security-hardened error messages for SEC-01: Email Enumeration Vulnerability
 *
 * CRITICAL SECURITY REQUIREMENT:
 * These messages must NEVER reveal information about:
 * - Whether a user exists in the system
 * - Whether an email is registered
 * - Whether a user is already a member
 * - Whether a user is the project owner
 *
 * WHY THIS MATTERS:
 * Email enumeration attacks allow attackers to discover valid user accounts by observing
 * different error messages. If "user already exists" vs "invitation sent" are different,
 * an attacker can build a list of all registered emails in the system.
 *
 * THE SOLUTION:
 * ALL user-related failures MUST use the SAME generic message. The attacker should get
 * identical responses whether the user exists, doesn't exist, is already a member, etc.
 *
 * ❌ NEVER DO THIS:
 * ```typescript
 * if (userExists) return "User already exists";        // Leaks info
 * if (!userExists) return "Email not found";           // Leaks info
 * if (isOwner) return "Cannot remove project owner";   // Leaks info
 * if (isMember) return "User is already a member";     // Leaks info
 * ```
 *
 * ✅ ALWAYS DO THIS:
 * ```typescript
 * // Same message for ALL scenarios
 * return SAFE_ERROR_MESSAGES.INVITATION_FAILED;
 * ```
 *
 * @see {@link https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/03-Identity_Management_Testing/04-Testing_for_Account_Enumeration_and_Guessable_User_Account}
 */
export const SAFE_ERROR_MESSAGES = Object.freeze({
  /**
   * Generic message for ALL user-related invitation failures.
   *
   * Use this for:
   * - User already exists
   * - User doesn't exist
   * - User is the project owner
   * - User is already a member
   * - Database errors during invitation
   * - Any other invitation failure
   *
   * @example
   * ```typescript
   * try {
   *   await inviteUser(email);
   * } catch (error) {
   *   // ALWAYS return the same message, never expose the real error
   *   return res.status(400).json({ error: SAFE_ERROR_MESSAGES.INVITATION_FAILED });
   * }
   * ```
   */
  INVITATION_FAILED: "Unable to send invitation to this email address",

  /**
   * Invalid email format validation error.
   * This can be specific because it doesn't reveal user existence.
   */
  INVALID_EMAIL: "Invalid email address format",

  /**
   * Permission denied errors.
   * Generic enough to not reveal why permission was denied.
   */
  UNAUTHORIZED: "You don't have permission to perform this action",

  /**
   * Rate limiting errors.
   * Prevents abuse while not leaking user information.
   */
  RATE_LIMITED: "Too many requests. Please try again later.",

  /**
   * Generic member update failure.
   * Same message whether user exists, doesn't exist, or update fails.
   */
  MEMBER_UPDATE_FAILED: "Unable to update member",

  /**
   * Generic member removal failure.
   * Same message whether user exists, is owner, or removal fails.
   */
  MEMBER_REMOVE_FAILED: "Unable to remove member",
} as const);

/**
 * Type-safe union of all safe error messages
 */
export type SafeErrorMessage = typeof SAFE_ERROR_MESSAGES[keyof typeof SAFE_ERROR_MESSAGES];
