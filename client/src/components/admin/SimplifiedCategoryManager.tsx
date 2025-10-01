import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Pencil, Save, X, Trash2, Plus, AlertCircle, Settings, Eye, EyeOff } from "lucide-react";
import type { TemplateCategory, InsertTemplateCategory } from "@shared/schema";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

// Extended template category that might have projectId for project-specific categories
type CategoryWithProjectId = TemplateCategory & { projectId?: number | null };

interface SimplifiedCategoryManagerProps {
  projectId?: number;
}

export default function SimplifiedCategoryManager({ projectId }: SimplifiedCategoryManagerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [editingCategory, setEditingCategory] = useState<number | null>(null);
  const [editingName, setEditingName] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showHiddenCategoriesDialog, setShowHiddenCategoriesDialog] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<TemplateCategory | null>(null);
  
  // New category form state
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryType, setNewCategoryType] = useState<'tier1' | 'tier2'>('tier1');
  const [newCategoryParentId, setNewCategoryParentId] = useState<number | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');

  // Standard construction category templates
  const standardTemplates = {
    tier1: [
      { value: 'structural', label: 'Structural', description: 'Foundation, framing, and core structural work', color: '#3b82f6' },
      { value: 'systems', label: 'Systems', description: 'Electrical, plumbing, HVAC systems', color: '#8b5cf6' },
      { value: 'sheathing', label: 'Sheathing', description: 'Insulation, drywall, weatherproofing', color: '#ec4899' },
      { value: 'finishings', label: 'Finishings', description: 'Paint, flooring, fixtures, final touches', color: '#10b981' },
    ],
    tier2: {
      structural: [
        { value: 'foundation', label: 'Foundation', description: 'Foundation and excavation work', color: '#1e40af' },
        { value: 'framing', label: 'Framing', description: 'Structural framing and support', color: '#2563eb' },
        { value: 'roofing', label: 'Roofing', description: 'Roof structure and materials', color: '#3b82f6' },
      ],
      systems: [
        { value: 'electrical', label: 'Electrical', description: 'Electrical wiring and fixtures', color: '#7c3aed' },
        { value: 'plumbing', label: 'Plumbing', description: 'Plumbing systems and fixtures', color: '#8b5cf6' },
        { value: 'hvac', label: 'HVAC', description: 'Heating, ventilation, and air conditioning', color: '#a855f7' },
      ],
      sheathing: [
        { value: 'insulation', label: 'Insulation', description: 'Insulation materials and installation', color: '#db2777' },
        { value: 'drywall', label: 'Drywall', description: 'Drywall installation and finishing', color: '#ec4899' },
        { value: 'windows', label: 'Windows', description: 'Window installation and sealing', color: '#f472b6' },
      ],
      finishings: [
        { value: 'flooring', label: 'Flooring', description: 'Floor materials and installation', color: '#059669' },
        { value: 'paint', label: 'Paint', description: 'Interior and exterior painting', color: '#10b981' },
        { value: 'fixtures', label: 'Fixtures', description: 'Lighting and plumbing fixtures', color: '#34d399' },
      ],
    }
  };

  // Fetch categories for the project
  const { data: categories = [], isLoading, error } = useQuery({
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
  });

  // Fetch hidden categories for the project
  const { data: hiddenCategories = [] } = useQuery({
    queryKey: [`/api/projects/${projectId}/hidden-categories`],
    queryFn: async () => {
      if (!projectId) return [];
      const response = await fetch(`/api/projects/${projectId}/hidden-categories`);
      if (!response.ok) {
        throw new Error('Failed to fetch hidden categories');
      }
      return response.json();
    },
    enabled: !!projectId
  });

  // Update category mutation
  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, name }: { id: number; name: string }) => {
      const endpoint = projectId 
        ? `/api/projects/${projectId}/template-categories/${id}`
        : `/api/admin/template-categories/${id}`;
      
      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update category');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: projectId ? [`/api/projects/${projectId}/template-categories`] : ['/api/admin/template-categories']
      });
      setEditingCategory(null);
      setEditingName('');
      toast({
        title: "Category Updated",
        description: "Category name has been updated successfully.",
      });
    },
    onError: (error) => {
      console.error('Update category error:', error);
      toast({
        title: "Error",
        description: "Failed to update category name.",
        variant: "destructive",
      });
    }
  });

  // Create category mutation
  const createCategoryMutation = useMutation({
    mutationFn: async (categoryData: InsertTemplateCategory) => {
      const endpoint = projectId 
        ? `/api/projects/${projectId}/template-categories`
        : '/api/admin/template-categories';
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(categoryData)
      });
      
      if (!response.ok) {
        throw new Error('Failed to create category');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: projectId ? [`/api/projects/${projectId}/template-categories`] : ['/api/admin/template-categories']
      });
      setShowAddDialog(false);
      setNewCategoryName('');
      setNewCategoryType('tier1');
      setNewCategoryParentId(null);
      toast({
        title: "Category Created",
        description: "New category has been created successfully.",
      });
    },
    onError: (error) => {
      console.error('Create category error:', error);
      toast({
        title: "Error",
        description: "Failed to create category.",
        variant: "destructive",
      });
    }
  });

  // Delete category mutation
  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: number) => {
      const endpoint = projectId 
        ? `/api/projects/${projectId}/template-categories/${id}`
        : `/api/admin/template-categories/${id}`;
      
      const response = await fetch(endpoint, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete category');
      }
      
      return response.status;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: projectId ? [`/api/projects/${projectId}/template-categories`] : ['/api/admin/template-categories']
      });
      setShowDeleteDialog(false);
      setCategoryToDelete(null);
      toast({
        title: "Category Deleted",
        description: "Category has been deleted successfully.",
      });
    },
    onError: (error) => {
      console.error('Delete category error:', error);
      toast({
        title: "Error",
        description: "Failed to delete category.",
        variant: "destructive",
      });
    }
  });

  // Mutation for toggling hidden categories
  const toggleHiddenCategoryMutation = useMutation({
    mutationFn: async ({ categoryName, isHidden }: { categoryName: string, isHidden: boolean }) => {
      if (!projectId) throw new Error('Project ID is required');
      
      // Get current hidden categories - the API returns an array of strings
      const currentHiddenNames = Array.isArray(hiddenCategories) ? hiddenCategories : [];
      
      let updatedHiddenCategories;
      if (isHidden) {
        // Add to hidden categories if not already there
        updatedHiddenCategories = currentHiddenNames.includes(categoryName) 
          ? currentHiddenNames 
          : [...currentHiddenNames, categoryName];
      } else {
        // Remove from hidden categories
        updatedHiddenCategories = currentHiddenNames.filter((name: string) => name !== categoryName);
      }
      
      const endpoint = `/api/projects/${projectId}/hidden-categories`;
      const response = await apiRequest(endpoint, 'PUT', { hiddenCategories: updatedHiddenCategories });
      return response;
    },
    onSuccess: () => {
      // Invalidate both hidden categories and main categories queries
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/hidden-categories`] });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/template-categories`] });
      toast({ title: "Category visibility updated", variant: "default" });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Failed to update category visibility", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  // Add standard construction categories mutation
  const addStandardCategoriesMutation = useMutation({
    mutationFn: async () => {
      if (!projectId) throw new Error('Project ID is required');
      
      const response = await fetch(`/api/projects/${projectId}/add-standard-categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (!response.ok) {
        throw new Error('Failed to add standard categories');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: [`/api/projects/${projectId}/template-categories`]
      });
      toast({
        title: "Standard Categories Added",
        description: "All standard construction categories have been added to your project.",
      });
    },
    onError: (error) => {
      console.error('Add standard categories error:', error);
      toast({
        title: "Error",
        description: "Failed to add standard categories.",
        variant: "destructive",
      });
    }
  });

  // Group categories by type
  const tier1Categories = categories.filter((cat: TemplateCategory) => cat.type === 'tier1');
  const tier2Categories = categories.filter((cat: TemplateCategory) => cat.type === 'tier2');

  const startEditing = (category: TemplateCategory) => {
    setEditingCategory(category.id);
    setEditingName(category.name);
  };

  const cancelEditing = () => {
    setEditingCategory(null);
    setEditingName('');
  };

  const saveCategory = () => {
    if (editingCategory && editingName.trim()) {
      updateCategoryMutation.mutate({ id: editingCategory, name: editingName.trim() });
    }
  };

  const handleAddCategory = () => {
    if (selectedTemplate && selectedTemplate !== 'custom') {
      // Handle template selection
      if (newCategoryType === 'tier1') {
        const template = standardTemplates.tier1.find(t => t.value === selectedTemplate);
        if (template) {
          const categoryData: InsertTemplateCategory = {
            name: template.label,
            type: newCategoryType,
            color: template.color,
            description: template.description,
            sortOrder: standardTemplates.tier1.indexOf(template) + 1,
            ...(projectId ? { projectId } : {})
          };
          createCategoryMutation.mutate(categoryData);
        }
      } else if (newCategoryType === 'tier2' && newCategoryParentId) {
        const parentCategory = tier1Categories.find((cat: any) => cat.id === newCategoryParentId);
        const parentKey = parentCategory?.name.toLowerCase();
        const template = standardTemplates.tier2[parentKey as keyof typeof standardTemplates.tier2]?.find(t => t.value === selectedTemplate);
        
        if (template) {
          const categoryData: InsertTemplateCategory = {
            name: template.label,
            type: newCategoryType,
            parentId: newCategoryParentId,
            color: template.color,
            description: template.description,
            sortOrder: 0,
            ...(projectId ? { projectId } : {})
          };
          createCategoryMutation.mutate(categoryData);
        }
      }
    } else if (newCategoryName.trim()) {
      // Handle custom category name
      const categoryData: InsertTemplateCategory = {
        name: newCategoryName.trim(),
        type: newCategoryType,
        ...(newCategoryType === 'tier2' && newCategoryParentId ? { parentId: newCategoryParentId } : {}),
        ...(projectId ? { projectId } : {})
      };
      createCategoryMutation.mutate(categoryData);
    }
  };

  const handleDeleteCategory = (category: TemplateCategory) => {
    setCategoryToDelete(category);
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (categoryToDelete) {
      deleteCategoryMutation.mutate(categoryToDelete.id);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading categories...</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load categories. Please try again.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Color Theme Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-5 h-5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
            Active Color Scheme
          </CardTitle>
          <CardDescription>
            Current theme colors applied to categories
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Tier 1 Colors */}
            <div>
              <h4 className="font-medium mb-3 text-sm">Tier 1 (Main Categories)</h4>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { name: 'Structural', key: 'structural', color: '#3b82f6' },
                  { name: 'Systems', key: 'systems', color: '#8b5cf6' },
                  { name: 'Sheathing', key: 'sheathing', color: '#ec4899' },
                  { name: 'Finishings', key: 'finishings', color: '#10b981' }
                ].map((item) => (
                  <div key={item.key} className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 border">
                    <div 
                      className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                      style={{ backgroundColor: item.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium">{item.name}</div>
                      <div className="text-xs text-muted-foreground font-mono">{item.color}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tier 2 Colors */}
            <div>
              <h4 className="font-medium mb-3 text-sm">Tier 2 (Subcategories)</h4>
              <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                {[
                  { name: 'Foundation', color: '#1d4ed8' },
                  { name: 'Framing', color: '#2563eb' },
                  { name: 'Electrical', color: '#7c3aed' },
                  { name: 'Plumbing', color: '#8b5cf6' },
                  { name: 'Drywall', color: '#db2777' },
                  { name: 'Windows', color: '#047857' },
                  { name: 'Doors', color: '#10b981' },
                  { name: 'Paint', color: '#059669' }
                ].map((item) => (
                  <div key={item.name} className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 border">
                    <div 
                      className="w-3 h-3 rounded-full border border-white shadow-sm"
                      style={{ backgroundColor: item.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium">{item.name}</div>
                      <div className="text-xs text-muted-foreground font-mono">{item.color}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Category Management</span>
            <div className="flex items-center gap-2">
              {/* Hide/Show Categories Button - Only show for project-specific view */}
              {projectId && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowHiddenCategoriesDialog(true)}
                  className="flex items-center gap-2"
                >
                  <Settings className="h-4 w-4" />
                  Hide/Show Categories
                </Button>
              )}
              {/* Quick Add Standard Categories Button - Only show for project-specific view */}
              {projectId && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => addStandardCategoriesMutation.mutate()}
                  disabled={addStandardCategoriesMutation.isPending}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Standard Categories
                </Button>
              )}
              <Button onClick={() => setShowAddDialog(true)} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Category
              </Button>
            </div>
          </CardTitle>
          <CardDescription>
            {projectId 
              ? "Manage categories for this specific project. Changes will only affect this project."
              : "Manage global categories. Changes will affect all projects unless they have project-specific overrides."
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Tier 1 Categories */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Primary Categories (Tier 1)</h3>
            <div className="space-y-3">
              {tier1Categories.map((category: TemplateCategory) => (
                <div key={category.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    {editingCategory === category.id ? (
                      <div className="flex items-center gap-2">
                        <Input
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          className="flex-1"
                          placeholder="Category name"
                        />
                        <Button
                          size="sm"
                          onClick={saveCategory}
                          disabled={updateCategoryMutation.isPending}
                        >
                          <Save className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={cancelEditing}
                          disabled={updateCategoryMutation.isPending}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-4 h-4 rounded-full border-2 border-white shadow-sm" 
                            style={{ backgroundColor: category.color || '#6b7280' }}
                            title={`Color: ${category.color || 'Default'}`}
                          />
                          <span className="font-medium">{category.name}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Badge variant="secondary">Tier 1</Badge>
                          {category.color && (
                            <Badge variant="outline" className="text-xs font-mono">
                              {category.color}
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  {editingCategory !== category.id && (
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => startEditing(category)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteCategory(category)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Tier 2 Categories */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Secondary Categories (Tier 2)</h3>
            <div className="space-y-3">
              {tier2Categories.map((category: TemplateCategory) => {
                const parentCategory = tier1Categories.find((t1: TemplateCategory) => t1.id === category.parentId);
                return (
                  <div key={category.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      {editingCategory === category.id ? (
                        <div className="flex items-center gap-2">
                          <Input
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            className="flex-1"
                            placeholder="Category name"
                          />
                          <Button
                            size="sm"
                            onClick={saveCategory}
                            disabled={updateCategoryMutation.isPending}
                          >
                            <Save className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={cancelEditing}
                            disabled={updateCategoryMutation.isPending}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-4 h-4 rounded-full border-2 border-white shadow-sm" 
                              style={{ backgroundColor: category.color || '#94a3b8' }}
                              title={`Color: ${category.color || 'Default'}`}
                            />
                            <span className="font-medium">{category.name}</span>
                          </div>
                          <div className="flex items-center gap-1 flex-wrap">
                            <Badge variant="secondary">Tier 2</Badge>
                            {parentCategory && (
                              <Badge variant="outline" className="text-xs">
                                Under: {parentCategory.name}
                              </Badge>
                            )}
                            {category.color && (
                              <Badge variant="outline" className="text-xs font-mono">
                                {category.color}
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    {editingCategory !== category.id && (
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => startEditing(category)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteCategory(category)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Category Dialog */}
      <Dialog open={showAddDialog} onOpenChange={(open) => {
        setShowAddDialog(open);
        if (!open) {
          setNewCategoryName('');
          setNewCategoryType('tier1');
          setNewCategoryParentId(null);
          setSelectedTemplate('');
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Category</DialogTitle>
            <DialogDescription>
              Create a new category for organizing tasks and templates.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="category-type">Category Type</Label>
              <Select value={newCategoryType} onValueChange={(value: 'tier1' | 'tier2') => {
                setNewCategoryType(value);
                setSelectedTemplate('');
                setNewCategoryName('');
                setNewCategoryParentId(null);
              }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tier1">Tier 1 (Primary)</SelectItem>
                  <SelectItem value="tier2">Tier 2 (Secondary)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {newCategoryType === 'tier2' && (
              <div>
                <Label htmlFor="parent-category">Parent Category</Label>
                <Select value={newCategoryParentId?.toString() || ''} onValueChange={(value) => {
                  setNewCategoryParentId(value ? parseInt(value) : null);
                  setSelectedTemplate('');
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select parent category" />
                  </SelectTrigger>
                  <SelectContent>
                    {tier1Categories.map((category: TemplateCategory) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label htmlFor="template-select">
                {newCategoryType === 'tier1' ? 'Construction Category Template' : 'Subcategory Template'}
              </Label>
              <Select value={selectedTemplate} onValueChange={(value) => {
                setSelectedTemplate(value);
                if (value === 'custom') {
                  setNewCategoryName('');
                } else {
                  setNewCategoryName('');
                }
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a template or create custom" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="custom">Custom Category</SelectItem>
                  {newCategoryType === 'tier1' && standardTemplates.tier1.map((template) => (
                    <SelectItem key={template.value} value={template.value}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: template.color }}
                        />
                        <div>
                          <div className="font-medium">{template.label}</div>
                          <div className="text-xs text-muted-foreground">{template.description}</div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                  {newCategoryType === 'tier2' && newCategoryParentId && (() => {
                    const parentCategory = tier1Categories.find((cat: any) => cat.id === newCategoryParentId);
                    const parentKey = parentCategory?.name.toLowerCase();
                    const templates = standardTemplates.tier2[parentKey as keyof typeof standardTemplates.tier2] || [];
                    return templates.map((template) => (
                      <SelectItem key={template.value} value={template.value}>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: template.color }}
                          />
                          <div>
                            <div className="font-medium">{template.label}</div>
                            <div className="text-xs text-muted-foreground">{template.description}</div>
                          </div>
                        </div>
                      </SelectItem>
                    ));
                  })()}
                </SelectContent>
              </Select>
            </div>

            {selectedTemplate === 'custom' && (
              <div>
                <Label htmlFor="category-name">Custom Category Name</Label>
                <Input
                  id="category-name"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Enter custom category name"
                />
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => {
                setShowAddDialog(false);
                setNewCategoryName('');
                setNewCategoryType('tier1');
                setNewCategoryParentId(null);
                setSelectedTemplate('');
              }}>
                Cancel
              </Button>
              <Button
                onClick={handleAddCategory}
                disabled={
                  (!selectedTemplate || (selectedTemplate === 'custom' && !newCategoryName.trim())) ||
                  createCategoryMutation.isPending ||
                  (newCategoryType === 'tier2' && !newCategoryParentId)
                }
              >
                {createCategoryMutation.isPending ? 'Creating...' : 'Create Category'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Category</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{categoryToDelete?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleteCategoryMutation.isPending}
            >
              {deleteCategoryMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Hidden Categories Management Dialog */}
      <Dialog open={showHiddenCategoriesDialog} onOpenChange={setShowHiddenCategoriesDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Hide/Show Categories</DialogTitle>
            <DialogDescription>
              Choose which categories to hide from your project view. Hidden categories won't appear in task creation or anywhere else in your project.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {/* Show all global categories to allow hide/show operations */}
            {categories.filter((cat: CategoryWithProjectId) => cat.projectId === null).map((category: CategoryWithProjectId) => {
              // The hiddenCategories array contains strings of category names
              const isHidden = hiddenCategories.includes(category.name.toLowerCase());
              return (
                <div key={category.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: category.color || '#6366f1' }}
                    />
                    <div>
                      <div className="font-medium">{category.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {category.type === 'tier1' ? 'Main Category' : 'Sub Category'}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant={isHidden ? "outline" : "secondary"}
                    size="sm"
                    onClick={() => toggleHiddenCategoryMutation.mutate({
                      categoryName: category.name.toLowerCase(),
                      isHidden: !isHidden
                    })}
                    disabled={toggleHiddenCategoryMutation.isPending}
                    className="flex items-center gap-2"
                  >
                    {isHidden ? (
                      <>
                        <EyeOff className="h-4 w-4" />
                        Hidden
                      </>
                    ) : (
                      <>
                        <Eye className="h-4 w-4" />
                        Visible
                      </>
                    )}
                  </Button>
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}