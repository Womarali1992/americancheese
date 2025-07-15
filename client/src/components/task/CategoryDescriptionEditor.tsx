import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Edit, Save, X } from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';

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
  const [isEditing, setIsEditing] = useState(false);
  const [editedDescription, setEditedDescription] = useState(description);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Fetch current category data to get the latest description
  const { data: categories = [] } = useQuery({
    queryKey: [`/api/projects/${projectId}/template-categories`],
    enabled: !!projectId && projectId !== 0,
  });

  // Find the current category
  const currentCategory = categories.find((cat: any) => 
    cat.name.toLowerCase() === categoryName.toLowerCase() && 
    cat.type === categoryType
  );

  // Update local state when category data changes
  useEffect(() => {
    if (currentCategory?.description !== undefined) {
      setEditedDescription(currentCategory.description || '');
    }
  }, [currentCategory?.description]);

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

      console.log('Updating category description:', { id: category.id, description: editedDescription });
      
      // Update the category description
      const response = await apiRequest({
        method: 'PUT',
        url: `/api/projects/${projectId}/template-categories/${category.id}`,
        data: { description: editedDescription }
      });

      console.log('Update response:', response);

      // Invalidate the React Query cache to refresh the data
      await queryClient.invalidateQueries({
        queryKey: [`/api/projects/${projectId}/template-categories`]
      });

      onDescriptionUpdate?.(editedDescription);
      setIsEditing(false);
      
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

  const handleCancel = () => {
    setEditedDescription(currentCategory?.description || '');
    setIsEditing(false);
  };

  return (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h3 className="font-semibold text-lg mb-2 capitalize">
              {categoryName} Description
            </h3>
            
            {isEditing ? (
              <div className="space-y-3">
                <Textarea
                  value={editedDescription}
                  onChange={(e) => setEditedDescription(e.target.value)}
                  placeholder={`Enter description for ${categoryName}...`}
                  rows={3}
                  className="w-full"
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
                    onClick={handleCancel}
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
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-1"
                >
                  <Edit className="h-4 w-4" />
                  Edit Description
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}