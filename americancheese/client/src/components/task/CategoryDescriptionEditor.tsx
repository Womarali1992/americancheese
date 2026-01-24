import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Edit, Save, X, ChevronDown, ChevronRight, FileCode2 } from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation } from '@tanstack/react-query';
import { MarkdownEditor, MarkdownContent } from '@/components/ui/markdown-editor';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ContextEditor } from '@/components/context';
import { ContextData } from '@shared/context-types';

interface CategoryDescriptionEditorProps {
  categoryName: string;
  categoryType: 'tier1' | 'tier2';
  description?: string;
  projectId: number;
  onDescriptionUpdate?: (newDescription: string) => void;
  showType?: 'project' | 'category' | 'both'; // Control what to show
}

export function CategoryDescriptionEditor({
  categoryName,
  categoryType,
  description = '',
  projectId,
  onDescriptionUpdate,
  showType = 'both'
}: CategoryDescriptionEditorProps) {
  const [isEditingCategory, setIsEditingCategory] = useState(false);
  const [isEditingProject, setIsEditingProject] = useState(false);
  const [editedCategoryDescription, setEditedCategoryDescription] = useState(description);
  const [editedProjectDescription, setEditedProjectDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false); // Collapsed by default
  const [contextOpen, setContextOpen] = useState(false);
  const [contextData, setContextData] = useState<ContextData | null>(null);
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
  const currentCategory = (categories as any[]).find((cat: any) => 
    cat.name && typeof cat.name === 'string' &&
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
    if ((project as any)?.description !== undefined) {
      setEditedProjectDescription((project as any).description || '');
    }
  }, [(project as any)?.description]);

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
    setEditedProjectDescription((project as any)?.description || '');
    setIsEditingProject(false);
  };

  // Helper function to get the first 2 lines of text
  const getPreviewText = (text: string, maxLines: number = 2) => {
    if (!text) return '';
    const lines = text.split('\n').filter(line => line.trim() !== '');
    return lines.slice(0, maxLines).join('\n');
  };

  // Get the preview text for both project and category descriptions
  const getPreviewContent = () => {
    const previews = [];
    
    if (showType === 'project' || showType === 'both') {
      const projectDesc = (project as any)?.description || '';
      const projectPreview = getPreviewText(projectDesc);
      if (projectPreview) {
        previews.push(`Project: ${projectPreview}`);
      }
    }
    
    if (showType === 'category' || showType === 'both') {
      const categoryDesc = currentCategory?.description || '';
      const categoryPreview = getPreviewText(categoryDesc);
      if (categoryPreview) {
        previews.push(`${categoryName}: ${categoryPreview}`);
      }
    }
    
    return previews.join(' | ');
  };

  return (
    <div className="mb-4">
      {/* Collapsible Header */}
      <div 
        className="flex items-center gap-2 cursor-pointer hover:bg-blue-50 p-2 rounded-md transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isExpanded ? (
          <ChevronDown className="h-4 w-4 text-slate-600" />
        ) : (
          <ChevronRight className="h-4 w-4 text-slate-600" />
        )}
        <span className="text-sm font-medium text-slate-700">
          {showType === 'project' ? 'Project Description' : 
           showType === 'category' ? `${categoryName} Description` : 
           'Project & Category Description'}
        </span>
      </div>

      {/* Preview Text (when collapsed) */}
      {!isExpanded && (
        <div className="ml-6 mt-1 mb-2">
          <p className="text-xs text-gray-500 italic line-clamp-2 leading-relaxed">
            {getPreviewContent() || 'No description available. Click to expand and add descriptions.'}
          </p>
        </div>
      )}

      {/* Collapsible Content */}
      {isExpanded && (
        <Card className="mt-2">
          <CardContent className="p-4">
            <div className="space-y-3">
              {/* Show Project Description */}
              {(showType === 'project' || showType === 'both') && (
                <div>
                  <h4 className="font-semibold text-lg mb-2">Project Description</h4>
                  {isEditingProject ? (
                    <div className="space-y-3">
                      <MarkdownEditor
                        value={editedProjectDescription}
                        onChange={setEditedProjectDescription}
                        placeholder="Enter a description for this project... Use **bold**, *italic*, - lists, etc."
                        rows={5}
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
                      <div className="text-gray-600 text-sm leading-relaxed min-h-[60px]">
                        {(project as any)?.description ? (
                          <MarkdownContent content={(project as any).description} />
                        ) : (
                          <p className="text-gray-400 italic">No description provided. Click edit to add a description for this project.</p>
                        )}
                      </div>
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
              )}

              {/* Show Category Description */}
              {(showType === 'category' || showType === 'both') && (
                <div className={showType === 'both' ? 'border-t pt-4' : ''}>
                  <h4 className="font-semibold text-lg mb-2 capitalize">
                    {categoryName} Category Description
                  </h4>
                  {isEditingCategory ? (
                    <div className="space-y-3">
                      <MarkdownEditor
                        value={editedCategoryDescription}
                        onChange={setEditedCategoryDescription}
                        placeholder={`Enter description for ${categoryName} category... Use **bold**, *italic*, - lists, etc.`}
                        rows={5}
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
                      <div className="text-gray-600 text-sm">
                        {currentCategory?.description ? (
                          <MarkdownContent content={currentCategory.description} />
                        ) : (
                          <p className="text-gray-400 italic">No description provided</p>
                        )}
                      </div>
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
              )}

              {/* AI Context Section */}
              <div className="border-t pt-4">
                <Collapsible open={contextOpen} onOpenChange={setContextOpen}>
                  <CollapsibleTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      className="w-full flex items-center justify-between px-3 py-2 border border-dashed border-slate-300 rounded-lg hover:bg-slate-50"
                    >
                      <div className="flex items-center gap-2">
                        <FileCode2 className="h-4 w-4 text-slate-500" />
                        <span className="text-sm font-medium text-slate-700">AI Context</span>
                        {contextData && (
                          <Badge variant="secondary" className="text-xs">Configured</Badge>
                        )}
                      </div>
                      <ChevronDown className={`h-4 w-4 text-slate-500 transition-transform ${contextOpen ? 'rotate-180' : ''}`} />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-2">
                    <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/50">
                      <p className="text-xs text-slate-500 mb-3">
                        Configure structured context for AI/LLM assistants.
                      </p>
                      <ContextEditor
                        entityId={`category-${categoryType}-${categoryName}`}
                        entityType="project"
                        initialContext={contextData}
                        onChange={setContextData}
                        compact
                      />
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}