import { describe, it, expect } from 'vitest';
import { SAFE_ERROR_MESSAGES, type SafeErrorMessage } from '../../shared/constants/errors';
import { sanitizeMemberError } from '../utils/errorSanitizer';

/**
 * Security Tests for SEC-01: Email Enumeration Vulnerability
 *
 * These tests verify that error messages don't leak information about:
 * - Whether a user exists in the system
 * - Whether an email is registered
 * - Whether a user is already a member
 * - Whether a user is the project owner
 */
describe('Error Constants Security', () => {
  describe('SAFE_ERROR_MESSAGES existence', () => {
    it('should have INVITATION_FAILED constant', () => {
      expect(SAFE_ERROR_MESSAGES.INVITATION_FAILED).toBeDefined();
      expect(typeof SAFE_ERROR_MESSAGES.INVITATION_FAILED).toBe('string');
    });

    it('should have INVALID_EMAIL constant', () => {
      expect(SAFE_ERROR_MESSAGES.INVALID_EMAIL).toBeDefined();
      expect(typeof SAFE_ERROR_MESSAGES.INVALID_EMAIL).toBe('string');
    });

    it('should have UNAUTHORIZED constant', () => {
      expect(SAFE_ERROR_MESSAGES.UNAUTHORIZED).toBeDefined();
      expect(typeof SAFE_ERROR_MESSAGES.UNAUTHORIZED).toBe('string');
    });

    it('should have RATE_LIMITED constant', () => {
      expect(SAFE_ERROR_MESSAGES.RATE_LIMITED).toBeDefined();
      expect(typeof SAFE_ERROR_MESSAGES.RATE_LIMITED).toBe('string');
    });

    it('should have MEMBER_UPDATE_FAILED constant', () => {
      expect(SAFE_ERROR_MESSAGES.MEMBER_UPDATE_FAILED).toBeDefined();
      expect(typeof SAFE_ERROR_MESSAGES.MEMBER_UPDATE_FAILED).toBe('string');
    });

    it('should have MEMBER_REMOVE_FAILED constant', () => {
      expect(SAFE_ERROR_MESSAGES.MEMBER_REMOVE_FAILED).toBeDefined();
      expect(typeof SAFE_ERROR_MESSAGES.MEMBER_REMOVE_FAILED).toBe('string');
    });
  });

  describe('Information Leakage Prevention', () => {
    it('should not contain words that reveal user existence', () => {
      // These phrases reveal information about user state
      const leakPhrases = [
        'exists',
        'exist',
        'registered',
        'not found',
        'owner',
        'already a member',
        'already exists',
        'user not found',
      ];

      Object.values(SAFE_ERROR_MESSAGES).forEach((message) => {
        const lowerMessage = message.toLowerCase();
        leakPhrases.forEach(phrase => {
          expect(lowerMessage).not.toContain(phrase);
        });
      });
    });

    it('should use generic wording for invitation failures', () => {
      const message = SAFE_ERROR_MESSAGES.INVITATION_FAILED;

      // Should be generic and not reveal WHY it failed
      expect(message).toMatch(/unable to send invitation/i);
      expect(message).not.toMatch(/user/i);
      expect(message).not.toMatch(/account/i);
    });
  });

  describe('Error Sanitizer Utility', () => {
    it('should export sanitizeMemberError function', () => {
      expect(sanitizeMemberError).toBeDefined();
      expect(typeof sanitizeMemberError).toBe('function');
    });

    it('should return generic message for invite context', () => {
      const error = new Error('User already exists');
      const result = sanitizeMemberError(error, 'invite');

      expect(result).toBe(SAFE_ERROR_MESSAGES.INVITATION_FAILED);
    });

    it('should return generic message for update context', () => {
      const error = new Error('User not found');
      const result = sanitizeMemberError(error, 'update');

      expect(result).toBe(SAFE_ERROR_MESSAGES.MEMBER_UPDATE_FAILED);
    });

    it('should return generic message for remove context', () => {
      const error = new Error('User is owner');
      const result = sanitizeMemberError(error, 'remove');

      expect(result).toBe(SAFE_ERROR_MESSAGES.MEMBER_REMOVE_FAILED);
    });

    it('should return same message regardless of error type', () => {
      const errors = [
        new Error('User already exists'),
        new Error('User not found'),
        new Error('User is owner'),
        new Error('Database error'),
        new Error('Network timeout'),
      ];

      const results = errors.map(err => sanitizeMemberError(err, 'invite'));

      // All should return the same message
      const uniqueMessages = new Set(results);
      expect(uniqueMessages.size).toBe(1);
    });
  });

  describe('Type Safety', () => {
    it('should export SafeErrorMessage type', () => {
      // Type-only test - if this compiles, the type exists
      const message: SafeErrorMessage = SAFE_ERROR_MESSAGES.INVITATION_FAILED;
      expect(message).toBeDefined();
    });

    it('should make SAFE_ERROR_MESSAGES readonly', () => {
      // Attempt to modify should fail at compile time
      // At runtime, we can verify the object is frozen
      expect(() => {
        (SAFE_ERROR_MESSAGES as any).INVITATION_FAILED = 'Modified';
      }).toThrow();
    });
  });
});
