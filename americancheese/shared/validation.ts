import { z } from "zod";

/**
 * Validation utilities for security and data integrity
 */

// Text sanitization - removes potentially dangerous characters while preserving useful content
export function sanitizeText(text: string, maxLength: number = 1000): string {
  if (!text) return "";

  // Remove control characters and zero-width spaces
  let sanitized = text.replace(/[\u0000-\u001F\u007F-\u009F\u200B-\u200D\uFEFF]/g, "");

  // Normalize whitespace
  sanitized = sanitized.replace(/\s+/g, " ").trim();

  // Enforce length limit
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  return sanitized;
}

// HTML sanitization - strips all HTML tags
export function sanitizeHtml(html: string): string {
  if (!html) return "";

  // Remove all HTML tags
  const withoutTags = html.replace(/<[^>]*>/g, "");

  // Decode HTML entities
  const textarea = typeof document !== "undefined" ? document.createElement("textarea") : null;
  if (textarea) {
    textarea.innerHTML = withoutTags;
    return sanitizeText(textarea.value);
  }

  // Fallback for server-side
  return sanitizeText(withoutTags);
}

// Validate positive number
export function validatePositiveNumber(value: unknown): number | null {
  const num = Number(value);
  if (isNaN(num) || num < 0) {
    return null;
  }
  return num;
}

// Validate non-negative number (allows zero)
export function validateNonNegativeNumber(value: unknown): number | null {
  const num = Number(value);
  if (isNaN(num) || num < 0) {
    return null;
  }
  return num;
}

// Validate date string (YYYY-MM-DD format)
export function validateDateString(dateStr: string): boolean {
  if (!dateStr) return false;

  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateStr)) {
    return false;
  }

  const date = new Date(dateStr);
  return !isNaN(date.getTime());
}

// Material validation schema
export const materialValidationSchema = z.object({
  name: z.string()
    .min(1, "Material name is required")
    .max(200, "Material name must be less than 200 characters")
    .transform(val => sanitizeText(val, 200)),

  type: z.string()
    .max(100, "Type must be less than 100 characters")
    .transform(val => sanitizeText(val, 100))
    .optional()
    .default(""),

  quantity: z.number()
    .min(0, "Quantity must be a positive number")
    .finite("Quantity must be a valid number"),

  unit: z.string()
    .max(50, "Unit must be less than 50 characters")
    .transform(val => sanitizeText(val, 50))
    .optional()
    .default(""),

  cost: z.number()
    .min(0, "Cost must be a positive number")
    .finite("Cost must be a valid number"),

  estimatedCost: z.number()
    .min(0, "Estimated cost must be a positive number")
    .finite("Estimated cost must be a valid number")
    .nullable()
    .optional(),

  details: z.string()
    .max(2000, "Details must be less than 2000 characters")
    .transform(val => sanitizeText(val, 2000))
    .nullable()
    .optional(),

  quoteNumber: z.string()
    .max(100, "Quote number must be less than 100 characters")
    .transform(val => sanitizeText(val, 100))
    .optional()
    .default(""),

  quoteDate: z.string()
    .refine(val => !val || validateDateString(val), "Invalid quote date format")
    .nullable()
    .optional(),

  orderDate: z.string()
    .refine(val => !val || validateDateString(val), "Invalid order date format")
    .nullable()
    .optional(),

  materialSize: z.string()
    .max(100, "Material size must be less than 100 characters")
    .transform(val => sanitizeText(val, 100))
    .nullable()
    .optional(),

  tier2Category: z.string()
    .max(100, "Category must be less than 100 characters")
    .transform(val => sanitizeText(val, 100))
    .optional()
    .default(""),

  section: z.string()
    .max(100, "Section must be less than 100 characters")
    .transform(val => sanitizeText(val, 100))
    .nullable()
    .optional(),

  subsection: z.string()
    .max(100, "Subsection must be less than 100 characters")
    .transform(val => sanitizeText(val, 100))
    .nullable()
    .optional(),
});

// Category validation schema
export const categoryValidationSchema = z.object({
  name: z.string()
    .min(1, "Category name is required")
    .max(100, "Category name must be less than 100 characters")
    .transform(val => sanitizeText(val, 100)),

  description: z.string()
    .max(500, "Description must be less than 500 characters")
    .transform(val => sanitizeText(val, 500))
    .optional()
    .default(""),
});

// Task template validation schema
export const taskTemplateValidationSchema = z.object({
  title: z.string()
    .min(1, "Task title is required")
    .max(200, "Task title must be less than 200 characters")
    .transform(val => sanitizeText(val, 200)),

  description: z.string()
    .max(2000, "Description must be less than 2000 characters")
    .transform(val => sanitizeText(val, 2000))
    .optional()
    .default(""),

  estimatedDuration: z.number()
    .min(0.5, "Duration must be at least 0.5 days")
    .max(365, "Duration must be less than 365 days")
    .finite("Duration must be a valid number"),
});

// Preset validation schema
export const presetValidationSchema = z.object({
  name: z.string()
    .min(1, "Preset name is required")
    .max(100, "Preset name must be less than 100 characters")
    .transform(val => sanitizeText(val, 100)),

  description: z.string()
    .max(500, "Description must be less than 500 characters")
    .transform(val => sanitizeText(val, 500))
    .optional()
    .default(""),

  recommendedTheme: z.string()
    .max(50, "Theme name must be less than 50 characters")
    .transform(val => sanitizeText(val, 50))
    .optional()
    .default(""),
});

// Type exports for TypeScript
export type MaterialValidation = z.infer<typeof materialValidationSchema>;
export type CategoryValidation = z.infer<typeof categoryValidationSchema>;
export type TaskTemplateValidation = z.infer<typeof taskTemplateValidationSchema>;
export type PresetValidation = z.infer<typeof presetValidationSchema>;
