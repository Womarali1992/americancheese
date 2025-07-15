import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';

interface AllProjectsCategoryDescriptionsProps {
  categoryName: string;
  categoryType: 'tier1' | 'tier2';
  projects: Array<{ id: number; name: string }>;
}

export function AllProjectsCategoryDescriptions({
  categoryName,
  categoryType,
  projects
}: AllProjectsCategoryDescriptionsProps) {
  // Fetch categories for all projects
  const categoriesQueries = projects.map(project => {
    return useQuery({
      queryKey: [`/api/projects/${project.id}/template-categories`],
      enabled: !!project.id,
    });
  });

  // Find descriptions for the current category across all projects
  const descriptions = categoriesQueries.map((query, index) => {
    const project = projects[index];
    const categories = query.data || [];
    
    // For tier2 categories, we need to find the correct category by checking both name and parent
    let category;
    if (categoryType === 'tier2') {
      // Find tier2 category by name
      category = categories.find((cat: any) => 
        cat.name.toLowerCase() === categoryName.toLowerCase() && 
        cat.type === categoryType
      );
    } else {
      // For tier1 categories, find by name and type
      category = categories.find((cat: any) => 
        cat.name.toLowerCase() === categoryName.toLowerCase() && 
        cat.type === categoryType
      );
    }
    
    return {
      projectId: project.id,
      projectName: project.name,
      description: category?.description || null,
      isLoading: query.isLoading,
      error: query.error
    };
  }).filter(desc => desc.description); // Only show projects with descriptions

  if (descriptions.length === 0) {
    return (
      <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> No descriptions found for "{categoryName}" category across projects. Select a specific project to add descriptions.
        </p>
      </div>
    );
  }

  return (
    <Card className="mb-4">
      <CardContent className="p-4">
        <h3 className="font-semibold text-lg mb-3 capitalize">
          {categoryName} Descriptions Across Projects
        </h3>
        
        <div className="space-y-4">
          {descriptions.map(({ projectId, projectName, description }) => (
            <div key={projectId} className="border-l-4 border-blue-500 pl-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium text-blue-600">{projectName}</span>
              </div>
              <p className="text-gray-600 text-sm">{description}</p>
            </div>
          ))}
        </div>
        
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
          <p className="text-xs text-blue-700">
            <strong>Tip:</strong> Select a specific project from the filter above to edit these descriptions.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}