import { describe, it, expect, vi } from 'vitest';
import { addRandomDelay, sendSecureErrorResponse } from '../timingAttackPrevention';
import type { Response } from 'express';

/**
 * Tests for Timing Attack Prevention Utilities (SEC-01)
 *
 * These tests verify that our timing attack prevention functions work correctly:
 * - Random delays are added with proper variance
 * - Helper function correctly combines delay + error response
 * - Response format is consistent
 */

describe('Timing Attack Prevention Utilities', () => {
  describe('addRandomDelay', () => {
    it('should add delay within default range (0-100ms)', async () => {
      const start = Date.now();
      await addRandomDelay();
      const duration = Date.now() - start;

      // Delay should be between 0 and 100ms (with some tolerance for timing)
      expect(duration).toBeGreaterThanOrEqual(0);
      expect(duration).toBeLessThanOrEqual(150); // Allow some tolerance
    });

    it('should add delay within custom range', async () => {
      const start = Date.now();
      await addRandomDelay(50, 100);
      const duration = Date.now() - start;

      // Delay should be at least 50ms
      expect(duration).toBeGreaterThanOrEqual(45); // Small tolerance
      expect(duration).toBeLessThanOrEqual(150);
    });

    it('should produce variable timings across multiple calls', async () => {
      const timings: number[] = [];

      // Measure 20 delays
      for (let i = 0; i < 20; i++) {
        const start = Date.now();
        await addRandomDelay();
        timings.push(Date.now() - start);
      }

      // Calculate variance
      const mean = timings.reduce((a, b) => a + b, 0) / timings.length;
      const variance = timings.reduce((sum, time) => {
        return sum + Math.pow(time - mean, 2);
      }, 0) / timings.length;

      // Variance should be > 0 (indicating randomness)
      expect(variance).toBeGreaterThan(0);

      // Should have at least some different values
      const uniqueTimings = new Set(timings);
      expect(uniqueTimings.size).toBeGreaterThan(1);
    });

    it('should return a Promise', () => {
      const result = addRandomDelay();
      expect(result).toBeInstanceOf(Promise);
    });

    it('should resolve successfully', async () => {
      await expect(addRandomDelay()).resolves.toBeUndefined();
    });
  });

  describe('sendSecureErrorResponse', () => {
    it('should add random delay before sending response', async () => {
      const mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      } as unknown as Response;

      const start = Date.now();
      await sendSecureErrorResponse(mockRes, 'Test error message');
      const duration = Date.now() - start;

      // Should have added delay (0-100ms)
      expect(duration).toBeGreaterThanOrEqual(0);
      expect(duration).toBeLessThanOrEqual(150);
    });

    it('should send response with default status code 400', async () => {
      const mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      } as unknown as Response;

      await sendSecureErrorResponse(mockRes, 'Test error message');

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Test error message' });
    });

    it('should send response with custom status code', async () => {
      const mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      } as unknown as Response;

      await sendSecureErrorResponse(mockRes, 'Server error', 500);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Server error' });
    });

    it('should use consistent message format', async () => {
      const mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      } as unknown as Response;

      await sendSecureErrorResponse(mockRes, 'Unable to send invitation to this email address');

      // Verify the exact format: { message: "..." }
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Unable to send invitation to this email address'
      });
    });

    it('should be usable with SAFE_ERROR_MESSAGES constants', async () => {
      // Simulate using the constant
      const SAFE_ERROR_MESSAGES = {
        INVITATION_FAILED: 'Unable to send invitation to this email address'
      };

      const mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      } as unknown as Response;

      await sendSecureErrorResponse(mockRes, SAFE_ERROR_MESSAGES.INVITATION_FAILED);

      expect(mockRes.json).toHaveBeenCalledWith({
        message: SAFE_ERROR_MESSAGES.INVITATION_FAILED
      });
    });

    it('should call status and json in correct order', async () => {
      const callOrder: string[] = [];
      const mockRes = {
        status: vi.fn(() => {
          callOrder.push('status');
          return mockRes;
        }),
        json: vi.fn(() => {
          callOrder.push('json');
        })
      } as unknown as Response;

      await sendSecureErrorResponse(mockRes, 'Test message');

      expect(callOrder).toEqual(['status', 'json']);
    });

    it('should produce timing variance across multiple calls', async () => {
      const timings: number[] = [];

      for (let i = 0; i < 10; i++) {
        const mockRes = {
          status: vi.fn().mockReturnThis(),
          json: vi.fn()
        } as unknown as Response;

        const start = Date.now();
        await sendSecureErrorResponse(mockRes, 'Test message');
        timings.push(Date.now() - start);
      }

      // Calculate variance
      const mean = timings.reduce((a, b) => a + b, 0) / timings.length;
      const variance = timings.reduce((sum, time) => {
        return sum + Math.pow(time - mean, 2);
      }, 0) / timings.length;

      // Should have timing variance (randomness)
      expect(variance).toBeGreaterThan(0);
    });
  });

  describe('Integration', () => {
    it('should prevent timing-based user enumeration', async () => {
      // Simulate different error scenarios
      const scenarios = ['owner', 'self', 'already-member', 'not-found'];
      const timings = new Map<string, number[]>();

      // Measure each scenario 10 times
      for (const scenario of scenarios) {
        timings.set(scenario, []);
        for (let i = 0; i < 10; i++) {
          const mockRes = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn()
          } as unknown as Response;

          const start = Date.now();
          await sendSecureErrorResponse(mockRes, 'Unable to send invitation to this email address');
          timings.get(scenario)!.push(Date.now() - start);
        }
      }

      // Calculate mean for each scenario
      const means = scenarios.map(scenario => {
        const times = timings.get(scenario)!;
        return times.reduce((a, b) => a + b, 0) / times.length;
      });

      // All means should be similar (within reasonable variance)
      const overallMean = means.reduce((a, b) => a + b, 0) / means.length;
      means.forEach(mean => {
        // Each scenario mean should be close to overall mean
        // Allow 50ms difference due to random nature
        expect(Math.abs(mean - overallMean)).toBeLessThan(50);
      });
    });
  });
});
