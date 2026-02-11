/**
 * Tests for safe JSON parsing utilities
 *
 * These tests verify that JSON parsing handles malformed data gracefully
 * and never crashes the application.
 */

import { describe, it, expect } from 'vitest';
import { safeJsonParse, safeJsonParseArray, safeJsonParseObject } from './safe-json';

describe('safeJsonParse', () => {
  it('should parse valid JSON string', () => {
    const result = safeJsonParse('{"name": "test"}', {});
    expect(result).toEqual({ name: 'test' });
  });

  it('should return fallback for invalid JSON', () => {
    const fallback = { error: 'fallback' };
    const result = safeJsonParse('invalid json', fallback);
    expect(result).toEqual(fallback);
  });

  it('should return fallback for null', () => {
    const fallback = { error: 'fallback' };
    const result = safeJsonParse(null, fallback);
    expect(result).toEqual(fallback);
  });

  it('should return fallback for undefined', () => {
    const fallback = { error: 'fallback' };
    const result = safeJsonParse(undefined, fallback);
    expect(result).toEqual(fallback);
  });

  it('should return fallback for empty string', () => {
    const fallback = { error: 'fallback' };
    const result = safeJsonParse('', fallback);
    expect(result).toEqual(fallback);
  });

  it('should handle JSON with trailing commas', () => {
    const fallback = { error: 'fallback' };
    const result = safeJsonParse('{"name": "test",}', fallback);
    expect(result).toEqual(fallback);
  });

  it('should handle JSON with single quotes', () => {
    const fallback = { error: 'fallback' };
    const result = safeJsonParse("{'name': 'test'}", fallback);
    expect(result).toEqual(fallback);
  });

  it('should handle already parsed objects', () => {
    const obj = { name: 'test' };
    const result = safeJsonParse(obj, {});
    expect(result).toEqual(obj);
  });

  it('should handle arrays', () => {
    const result = safeJsonParse('[1, 2, 3]', []);
    expect(result).toEqual([1, 2, 3]);
  });

  it('should handle primitive values', () => {
    expect(safeJsonParse('123', 0)).toBe(123);
    expect(safeJsonParse('true', false)).toBe(true);
    expect(safeJsonParse('"string"', '')).toBe('string');
  });
});

describe('safeJsonParseArray', () => {
  it('should parse valid JSON array', () => {
    const result = safeJsonParseArray('[1, 2, 3]', []);
    expect(result).toEqual([1, 2, 3]);
  });

  it('should return fallback for non-array JSON', () => {
    const fallback = [1, 2];
    const result = safeJsonParseArray('{"name": "test"}', fallback);
    expect(result).toEqual(fallback);
  });

  it('should return fallback for invalid JSON', () => {
    const fallback = [1, 2];
    const result = safeJsonParseArray('invalid', fallback);
    expect(result).toEqual(fallback);
  });

  it('should handle empty arrays', () => {
    const result = safeJsonParseArray('[]', [1]);
    expect(result).toEqual([]);
  });

  it('should handle null values in arrays', () => {
    const result = safeJsonParseArray('[1, null, 3]', []);
    expect(result).toEqual([1, null, 3]);
  });

  it('should handle already parsed arrays', () => {
    const arr = [1, 2, 3];
    const result = safeJsonParseArray(arr, []);
    expect(result).toEqual(arr);
  });
});

describe('safeJsonParseObject', () => {
  it('should parse valid JSON object', () => {
    const result = safeJsonParseObject('{"name": "test"}', {});
    expect(result).toEqual({ name: 'test' });
  });

  it('should return fallback for non-object JSON', () => {
    const fallback = { error: 'fallback' };
    const result = safeJsonParseObject('[1, 2, 3]', fallback);
    expect(result).toEqual(fallback);
  });

  it('should return fallback for invalid JSON', () => {
    const fallback = { error: 'fallback' };
    const result = safeJsonParseObject('invalid', fallback);
    expect(result).toEqual(fallback);
  });

  it('should handle empty objects', () => {
    const result = safeJsonParseObject('{}', { error: 'fallback' });
    expect(result).toEqual({});
  });

  it('should handle nested objects', () => {
    const result = safeJsonParseObject('{"nested": {"key": "value"}}', {});
    expect(result).toEqual({ nested: { key: 'value' } });
  });

  it('should handle already parsed objects', () => {
    const obj = { name: 'test' };
    const result = safeJsonParseObject(obj, {});
    expect(result).toEqual(obj);
  });

  it('should return fallback for null (not an object)', () => {
    const fallback = { error: 'fallback' };
    const result = safeJsonParseObject('null', fallback);
    expect(result).toEqual(fallback);
  });
});

describe('error logging', () => {
  it('should log parsing errors when logErrors is true', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    safeJsonParse('invalid json', {}, true);

    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });

  it('should not log parsing errors when logErrors is false', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    safeJsonParse('invalid json', {}, false);

    expect(consoleErrorSpy).not.toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });
});
