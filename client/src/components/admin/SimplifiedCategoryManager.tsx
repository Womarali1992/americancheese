import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Pencil, Save, X, Trash2, Plus, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { apiRequest } from '@/lib/queryClient';
import type { TemplateCategory, InsertTemplateCategory } from '@shared/schema';

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
  const [categoryToDelete, setCategoryToDelete] = useState<TemplateCategory | null>(null);
  
  // New category form state
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryType, setNewCategoryType] = useState<'tier1' | 'tier2'>('tier1');
  const [newCategoryParentId, setNewCategoryParentId] = useState<number | null>(null);

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
    if (newCategoryName.trim()) {
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Category Management</span>
            <Button onClick={() => setShowAddDialog(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Category
            </Button>
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
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{category.name}</span>
                        <Badge variant="secondary">Tier 1</Badge>
                        {category.projectId && (
                          <Badge variant="outline">Project Specific</Badge>
                        )}
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
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{category.name}</span>
                          <Badge variant="secondary">Tier 2</Badge>
                          {parentCategory && (
                            <Badge variant="outline">Under: {parentCategory.name}</Badge>
                          )}
                          {category.projectId && (
                            <Badge variant="outline">Project Specific</Badge>
                          )}
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
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Category</DialogTitle>
            <DialogDescription>
              Create a new category for organizing tasks and templates.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="category-name">Category Name</Label>
              <Input
                id="category-name"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Enter category name"
              />
            </div>
            <div>
              <Label htmlFor="category-type">Category Type</Label>
              <Select value={newCategoryType} onValueChange={(value: 'tier1' | 'tier2') => setNewCategoryType(value)}>
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
                <Select value={newCategoryParentId?.toString() || ''} onValueChange={(value) => setNewCategoryParentId(value ? parseInt(value) : null)}>
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
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleAddCategory}
                disabled={!newCategoryName.trim() || createCategoryMutation.isPending}
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
    </div>
  );
}