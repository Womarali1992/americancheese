import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Edit, Save, X } from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation } from '@tanstack/react-query';

interface CategoryDescriptionEditorProps {
  categoryName: string;
  categoryType: 'tier1' | 'tier2';
  description?: string;
  projectId: number;
  onDescriptionUpdate?: (newDescription: string) => void;
}

export function CategoryDescriptionEditor({
  categoryName,
  categoryType,
  description = '',
  projectId,
  onDescriptionUpdate
}: CategoryDescriptionEditorProps) {
  const [isEditingCategory, setIsEditingCategory] = useState(false);
  const [isEditingProject, setIsEditingProject] = useState(false);
  const [editedCategoryDescription, setEditedCategoryDescription] = useState(description);
  const [editedProjectDescription, setEditedProjectDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Fetch current category data to get the latest description
  const { data: categories = [] } = useQuery({
    queryKey: [`/api/projects/${projectId}/template-categories`],
    enabled: !!projectId && projectId !== 0,
  });

  // Fetch project data to get project description
  const { data: project } = useQuery({
    queryKey: [`/api/projects`, projectId],
    enabled: !!projectId && projectId !== 0,
  });

  // Find the current category
  const currentCategory = categories.find((cat: any) => 
    cat.name.toLowerCase() === categoryName.toLowerCase() && 
    cat.type === categoryType
  );

  // Project description update mutation
  const updateProjectDescriptionMutation = useMutation({
    mutationFn: async (newDescription: string) => {
      return apiRequest(`/api/projects/${projectId}`, 'PATCH', {
        description: newDescription
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects`, projectId] });
      queryClient.invalidateQueries({ queryKey: [`/api/projects`] });
      setIsEditingProject(false);
      toast({
        title: "Success",
        description: "Project description updated successfully",
        variant: "default"
      });
    },
    onError: (error) => {
      console.error('Error updating project description:', error);
      toast({
        title: "Error",
        description: "Failed to update project description",
        variant: "destructive"
      });
    }
  });

  // Update local state when category or project data changes
  useEffect(() => {
    if (currentCategory?.description !== undefined) {
      setEditedCategoryDescription(currentCategory.description || '');
    }
  }, [currentCategory?.description]);

  useEffect(() => {
    if (project?.description !== undefined) {
      setEditedProjectDescription(project.description || '');
    }
  }, [project?.description]);

  const handleSave = async () => {
    console.log('handleSave called with projectId:', projectId);
    if (!projectId || projectId === 0) {
      toast({
        title: 'Error',
        description: 'Please select a project first',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      console.log('Fetching categories for project:', projectId);
      // Find the category in the project
      const categoriesResponse = await fetch(`/api/projects/${projectId}/template-categories`);
      
      if (!categoriesResponse.ok) {
        throw new Error(`Failed to fetch categories: ${categoriesResponse.statusText}`);
      }
      
      const categories = await categoriesResponse.json();
      console.log('Categories found:', categories);
      
      const category = categories.find((cat: any) => 
        cat.name.toLowerCase() === categoryName.toLowerCase() && 
        cat.type === categoryType
      );

      console.log('Looking for category:', { name: categoryName, type: categoryType });
      console.log('Found category:', category);

      if (!category) {
        throw new Error(`Category '${categoryName}' not found in project`);
      }

      console.log('Updating category description:', { id: category.id, description: editedCategoryDescription });
      
      // Update the category description
      const response = await apiRequest(`/api/projects/${projectId}/template-categories/${category.id}`, 'PATCH', {
        description: editedCategoryDescription
      });

      console.log('Update response:', response);
      console.log('Description that was sent:', editedCategoryDescription);

      // Invalidate the React Query cache to refresh the data
      await queryClient.invalidateQueries({
        queryKey: [`/api/projects/${projectId}/template-categories`]
      });

      // Also refetch the data to ensure immediate update
      await queryClient.refetchQueries({
        queryKey: [`/api/projects/${projectId}/template-categories`]
      });

      onDescriptionUpdate?.(editedCategoryDescription);
      setIsEditingCategory(false);
      
      toast({
        title: 'Description updated',
        description: `Updated description for ${categoryName}`,
      });
    } catch (error) {
      console.error('Error updating category description:', error);
      toast({
        title: 'Error',
        description: `Failed to update category description: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProject = () => {
    updateProjectDescriptionMutation.mutate(editedProjectDescription);
  };

  const handleCancelCategory = () => {
    setEditedCategoryDescription(currentCategory?.description || '');
    setIsEditingCategory(false);
  };

  const handleCancelProject = () => {
    setEditedProjectDescription(project?.description || '');
    setIsEditingProject(false);
  };

  return (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="space-y-6">
          {/* Project Description Section */}
          <div>
            <h4 className="font-semibold text-lg mb-2">Project Description</h4>
            {isEditingProject ? (
              <div className="space-y-3">
                <Textarea
                  value={editedProjectDescription}
                  onChange={(e) => setEditedProjectDescription(e.target.value)}
                  placeholder="Enter a description for this project..."
                  rows={3}
                  className="w-full"
                  autoFocus
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleSaveProject}
                    disabled={updateProjectDescriptionMutation.isPending}
                  >
                    <Save className="h-4 w-4 mr-1" />
                    {updateProjectDescriptionMutation.isPending ? 'Saving...' : 'Save'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCancelProject}
                    disabled={updateProjectDescriptionMutation.isPending}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-gray-600 text-sm leading-relaxed min-h-[60px]">
                  {project?.description || 'No description provided. Click edit to add a description for this project.'}
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsEditingProject(true)}
                  className="flex items-center gap-1 hover:bg-blue-50 hover:border-blue-300"
                >
                  <Edit className="h-4 w-4" />
                  Edit Project Description
                </Button>
              </div>
            )}
          </div>

          {/* Category Description Section */}
          <div className="border-t pt-4">
            <h4 className="font-semibold text-lg mb-2 capitalize">
              {categoryName} Category Description
            </h4>
            {isEditingCategory ? (
              <div className="space-y-3">
                <Textarea
                  value={editedCategoryDescription}
                  onChange={(e) => setEditedCategoryDescription(e.target.value)}
                  placeholder={`Enter description for ${categoryName} category...`}
                  rows={3}
                  className="w-full"
                  autoFocus
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={isLoading}
                  >
                    <Save className="h-4 w-4 mr-1" />
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCancelCategory}
                    disabled={isLoading}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-gray-600 text-sm">
                  {currentCategory?.description || 'No description provided'}
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsEditingCategory(true)}
                  className="flex items-center gap-1"
                >
                  <Edit className="h-4 w-4" />
                  Edit Category Description
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}