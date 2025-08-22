/**
 * Type definitions for add-selected-templates.js
 */
import postgres from 'postgres';

export function addSelectedTemplatesField(queryClient: postgres.Sql): Promise<{
  success: boolean;
  error?: string;
}>;