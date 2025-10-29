import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getProjectTheme, applyProjectTheme, type ProjectTheme } from '@/lib/project-themes';

export function useProjectTheme(projectId?: number) {
  const [currentTheme, setCurrentTheme] = useState<ProjectTheme>();

  // Get project data to extract theme
  const { data: project } = useQuery({
    queryKey: ["/api/projects", projectId],
    queryFn: async () => {
      if (!projectId) return null;
      const response = await fetch(`/api/projects/${projectId}`);
      if (!response.ok) throw new Error("Failed to fetch project");
      return await response.json();
    },
    enabled: !!projectId
  });

  useEffect(() => {
    if (projectId && project?.colorTheme) {
      const theme = getProjectTheme(project.colorTheme, projectId);
      setCurrentTheme(theme);
      applyProjectTheme(theme, projectId);
    } else if (projectId) {
      // Use default theme for the project
      const defaultTheme = getProjectTheme(undefined, projectId);
      setCurrentTheme(defaultTheme);
      applyProjectTheme(defaultTheme, projectId);
    } else {
      // No project ID, use global theme (Earth Tone)
      const globalTheme = getProjectTheme('Earth Tone');
      setCurrentTheme(globalTheme);
    }
  }, [project?.colorTheme, projectId]);

  return {
    theme: currentTheme,
    themeName: project?.colorTheme || 'Earth Tone'
  };
}