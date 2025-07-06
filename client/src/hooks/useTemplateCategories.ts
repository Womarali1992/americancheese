import { useQuery } from "@tanstack/react-query";

export interface TemplateCategory {
  id: number;
  name: string;
  type: 'tier1' | 'tier2';
  parentId: number | null;
  projectId: number | null;
  color: string | null;
  createdAt: string;
  updatedAt: string;
}

export function useTemplateCategories(projectId?: number | null) {
  return useQuery({
    queryKey: projectId ? [`/api/projects/${projectId}/template-categories`] : ['/api/admin/template-categories'],
    queryFn: async () => {
      const endpoint = projectId 
        ? `/api/projects/${projectId}/template-categories`
        : '/api/admin/template-categories';
      const response = await fetch(endpoint);
      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }
      return response.json();
    },
    enabled: true
  });
}

export function useTier1Categories(projectId?: number | null) {
  const { data: categories = [], ...rest } = useTemplateCategories(projectId);
  const tier1Categories = categories.filter(cat => cat.type === 'tier1');
  
  return {
    data: tier1Categories,
    ...rest
  };
}

export function useTier2Categories(projectId?: number | null, tier1CategoryId?: number) {
  const { data: categories = [], ...rest } = useTemplateCategories(projectId);
  const tier2Categories = categories.filter(cat => 
    cat.type === 'tier2' && 
    (tier1CategoryId ? cat.parentId === tier1CategoryId : true)
  );
  
  return {
    data: tier2Categories,
    ...rest
  };
}

// Helper function to get all projects for aggregating categories
export function useAllProjectCategories() {
  return useQuery({
    queryKey: ['/api/projects/all-categories'],
    queryFn: async () => {
      // First get all projects
      const projectsResponse = await fetch('/api/projects');
      if (!projectsResponse.ok) {
        throw new Error('Failed to fetch projects');
      }
      const projects = await projectsResponse.json();
      
      // Then get categories for each project
      const allCategories: TemplateCategory[] = [];
      
      for (const project of projects) {
        try {
          const categoriesResponse = await fetch(`/api/projects/${project.id}/template-categories`);
          if (categoriesResponse.ok) {
            const categories = await categoriesResponse.json();
            allCategories.push(...categories);
          }
        } catch (error) {
          console.error(`Failed to fetch categories for project ${project.id}:`, error);
        }
      }
      
      // Remove duplicates based on name and type
      const uniqueCategories = allCategories.filter((category, index, self) => 
        index === self.findIndex(c => 
          c.name.toLowerCase() === category.name.toLowerCase() && 
          c.type === category.type
        )
      );
      
      return uniqueCategories;
    },
    enabled: true
  });
}

// Helper function to get tier2 categories by tier1 name
export function useTier2CategoriesByTier1Name(projectId?: number | null) {
  // Use project-specific categories if projectId is provided, otherwise aggregate from all projects
  const projectSpecificQuery = useTemplateCategories(projectId);
  const allProjectsQuery = useAllProjectCategories();
  
  const shouldUseAllProjects = projectId === null;
  const activeQuery = shouldUseAllProjects ? allProjectsQuery : projectSpecificQuery;
  
  const categories = activeQuery.data || [];
  
  const tier1Categories = categories.filter(cat => cat.type === 'tier1');
  const tier2Categories = categories.filter(cat => cat.type === 'tier2');
  
  const tier2ByTier1Name = tier1Categories.reduce((acc, tier1) => {
    const relatedTier2 = tier2Categories.filter(tier2 => tier2.parentId === tier1.id);
    acc[tier1.name.toLowerCase()] = relatedTier2.map(tier2 => tier2.name.toLowerCase());
    return acc;
  }, {} as Record<string, string[]>);
  
  return {
    data: tier2ByTier1Name,
    tier1Categories,
    tier2Categories,
    isLoading: activeQuery.isLoading,
    error: activeQuery.error,
    refetch: activeQuery.refetch
  };
}