import { UnifiedCategoryManager } from './UnifiedCategoryManager';

interface ProjectCategorySettingsProps {
  projectId?: number;
}

export default function ProjectCategorySettings({ projectId }: ProjectCategorySettingsProps) {
  return (
    <div className="space-y-6">
      {/* Main category manager */}
      <UnifiedCategoryManager projectId={projectId} />
    </div>
  );
}