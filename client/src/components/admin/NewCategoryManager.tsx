import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Plus, Download, RotateCcw } from "lucide-react";
import { queryClient } from "@/lib/queryClient";

interface CategoryTemplate {
  id: number;
  name: string;
  type: string;
  parentId: number | null;
  color: string | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ProjectCategory {
  id: number;
  projectId: number;
  name: string;
  type: string;
  parentId: number | null;
  color: string | null;
  templateId: number | null;
  createdAt: string;
  updatedAt: string;
}

interface NewCategoryManagerProps {
  projectId?: number;
}

export function NewCategoryManager({ projectId }: NewCategoryManagerProps) {
  const { toast } = useToast();
  const [selectedTemplates, setSelectedTemplates] = useState<number[]>([]);

  // Fetch category templates (global templates)
  const { data: templates = [], isLoading: templatesLoading } = useQuery({
    queryKey: ['/api/category-templates'],
    queryFn: async () => {
      const response = await fetch('/api/category-templates');
      if (!response.ok) throw new Error('Failed to fetch templates');
      return response.json() as CategoryTemplate[];
    }
  });

  // Fetch project categories (if projectId is provided)
  const { data: projectCategories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: [`/api/projects/${projectId}/categories`],
    queryFn: async () => {
      if (!projectId) return [];
      const response = await fetch(`/api/projects/${projectId}/categories`);
      if (!response.ok) throw new Error('Failed to fetch project categories');
      return response.json() as ProjectCategory[];
    },
    enabled: !!projectId
  });

  // Load templates into project
  const loadTemplatesMutation = useMutation({
    mutationFn: async (templateIds: number[]) => {
      if (!projectId) throw new Error('No project selected');
      const response = await fetch(`/api/projects/${projectId}/categories/load-templates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateIds })
      });
      if (!response.ok) throw new Error('Failed to load templates');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/categories`] });
      setSelectedTemplates([]);
      toast({
        title: "Templates Loaded",
        description: "Selected category templates have been loaded into your project."
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load templates",
        variant: "destructive"
      });
    }
  });

  // Delete project category
  const deleteCategoryMutation = useMutation({
    mutationFn: async (categoryId: number) => {
      if (!projectId) throw new Error('No project selected');
      const response = await fetch(`/api/projects/${projectId}/categories/${categoryId}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete category');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/categories`] });
      toast({
        title: "Category Deleted",
        description: "The category has been removed from your project."
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete category",
        variant: "destructive"
      });
    }
  });

  const handleTemplateSelection = (templateId: number) => {
    setSelectedTemplates(prev => 
      prev.includes(templateId) 
        ? prev.filter(id => id !== templateId)
        : [...prev, templateId]
    );
  };

  const handleLoadTemplates = () => {
    if (selectedTemplates.length > 0) {
      loadTemplatesMutation.mutate(selectedTemplates);
    }
  };

  const tier1Templates = templates.filter(t => t.type === 'tier1');
  const tier2Templates = templates.filter(t => t.type === 'tier2');
  const tier1Categories = projectCategories.filter(c => c.type === 'tier1');
  const tier2Categories = projectCategories.filter(c => c.type === 'tier2');

  if (templatesLoading || categoriesLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>New Category Management System</CardTitle>
          <CardDescription>
            Global categories are now templates that you can manually load into projects. 
            Projects start empty and you choose which categories you need.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Global Category Templates */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5" />
            Category Templates
          </CardTitle>
          <CardDescription>
            Global category templates available to load into projects
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Tier 1 Templates */}
          <div>
            <Label className="text-sm font-medium">Tier 1 Templates</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {tier1Templates.map(template => (
                <Badge
                  key={template.id}
                  variant={selectedTemplates.includes(template.id) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => handleTemplateSelection(template.id)}
                >
                  {template.name}
                </Badge>
              ))}
            </div>
          </div>

          {/* Tier 2 Templates */}
          <div>
            <Label className="text-sm font-medium">Tier 2 Templates</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {tier2Templates.map(template => (
                <Badge
                  key={template.id}
                  variant={selectedTemplates.includes(template.id) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => handleTemplateSelection(template.id)}
                >
                  {template.name}
                </Badge>
              ))}
            </div>
          </div>

          {projectId && (
            <div className="flex gap-2 pt-4">
              <Button
                onClick={handleLoadTemplates}
                disabled={selectedTemplates.length === 0 || loadTemplatesMutation.isPending}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Load Selected Templates ({selectedTemplates.length})
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Project Categories */}
      {projectId && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Project Categories
            </CardTitle>
            <CardDescription>
              Categories currently loaded in this project
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Tier 1 Categories */}
            <div>
              <Label className="text-sm font-medium">Tier 1 Categories</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {tier1Categories.map(category => (
                  <div key={category.id} className="flex items-center gap-1">
                    <Badge variant="secondary">
                      {category.name}
                      {category.templateId && " (template)"}
                    </Badge>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteCategoryMutation.mutate(category.id)}
                      className="h-6 w-6 p-0 text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
                {tier1Categories.length === 0 && (
                  <p className="text-sm text-muted-foreground">No tier 1 categories loaded</p>
                )}
              </div>
            </div>

            {/* Tier 2 Categories */}
            <div>
              <Label className="text-sm font-medium">Tier 2 Categories</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {tier2Categories.map(category => (
                  <div key={category.id} className="flex items-center gap-1">
                    <Badge variant="secondary">
                      {category.name}
                      {category.templateId && " (template)"}
                    </Badge>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteCategoryMutation.mutate(category.id)}
                      className="h-6 w-6 p-0 text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
                {tier2Categories.length === 0 && (
                  <p className="text-sm text-muted-foreground">No tier 2 categories loaded</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}