import React from "react";
import { UnifiedCategoryManager } from './UnifiedCategoryManager';

interface CategoryManagerProps {
  projectId: number | null;
}

/**
 * Legacy Category Manager - now uses the new UnifiedCategoryManager
 * This component provides backward compatibility while using the new generic category system
 */
export default function CategoryManager({ projectId }: CategoryManagerProps) {
  return <UnifiedCategoryManager projectId={projectId ?? undefined} />;
}