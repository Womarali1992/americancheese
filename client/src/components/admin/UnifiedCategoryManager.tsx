/**
 * Unified Category Manager
 * 
 * This component provides a complete interface for managing the new generic
 * category system. It replaces the old construction-specific category management
 * with a flexible, user-configurable system.
 */

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Save, 
  X, 
  ChevronRight,
  ChevronDown,
  Palette,
  Tag,
  FolderTree,
  LayoutTemplate,
  Download,
  Upload,
  RotateCcw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CategoryManager, DEFAULT_TEMPLATE_SETS, type CategoryTree } from '@/lib/category-manager';
import { useToast } from '@/hooks/use-toast';
import type { Category, CategoryTemplateSet, InsertCategory } from '@shared/schema';

interface UnifiedCategoryManagerProps {
  projectId?: number; // If provided, manage project-specific categories
  showTemplates?: boolean; // Whether to show template management
  compact?: boolean; // Compact view for smaller spaces
}

export function UnifiedCategoryManager({ 
  projectId, 
  showTemplates = true, 
  compact = false 
}: UnifiedCategoryManagerProps) {
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [editingCategory, setEditingCategory] = useState<number | null>(null);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState<Set<number>>(new Set());
  const [newCategory, setNewCategory] = useState<Partial<InsertCategory>>({
    level: 1,
    sortOrder: 0,
    isActive: true,
    projectId: projectId || null
  });

  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Query for categories
  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories', projectId],
    queryFn: () => CategoryManager.getCategories(projectId)
  });

  // Query for category tree
  const { data: categoryTree = [], isLoading: treeLoading } = useQuery({
    queryKey: ['category-tree', projectId],
    queryFn: () => CategoryManager.getCategoryTree(projectId)
  });

  // Query for template sets
  const { data: templateSets = [] } = useQuery({
    queryKey: ['category-template-sets'],
    queryFn: () => CategoryManager.getTemplateSets(),
    enabled: showTemplates
  });

  // Create category mutation
  const createCategoryMutation = useMutation({
    mutationFn: (data: InsertCategory) => CategoryManager.createCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['category-tree'] });
      setIsAddingCategory(false);
      setNewCategory({ level: 1, sortOrder: 0, isActive: true, projectId: projectId || null });
      toast({ title: 'Success', description: 'Category created successfully' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  // Update category mutation
  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: Partial<InsertCategory> }) => 
      CategoryManager.updateCategory(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['category-tree'] });
      setEditingCategory(null);
      toast({ title: 'Success', description: 'Category updated successfully' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  // Delete category mutation
  const deleteCategoryMutation = useMutation({
    mutationFn: (id: number) => CategoryManager.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['category-tree'] });
      setSelectedCategory(null);
      toast({ title: 'Success', description: 'Category deleted successfully' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  // Apply template mutation
  const applyTemplateMutation = useMutation({
    mutationFn: ({ templateSetId }: { templateSetId: number }) => 
      CategoryManager.applyTemplateSet(projectId!, templateSetId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['category-tree'] });
      toast({ title: 'Success', description: 'Template applied successfully' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  // Migration mutation
  const migrateLegacyMutation = useMutation({
    mutationFn: () => CategoryManager.migrateLegacyCategories(projectId),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['category-tree'] });
      toast({ 
        title: 'Migration Complete', 
        description: `Created ${result.length} categories from legacy data` 
      });
    },
    onError: (error: any) => {
      toast({ title: 'Migration Error', description: error.message, variant: 'destructive' });
    }
  });

  const handleCreateCategory = () => {
    if (!newCategory.name) {
      toast({ title: 'Error', description: 'Category name is required', variant: 'destructive' });
      return;
    }

    // Auto-generate color if not provided
    if (!newCategory.color) {
      newCategory.color = CategoryManager.generateCategoryColor(
        newCategory.level || 1, 
        newCategory.sortOrder || 0
      );
    }

    createCategoryMutation.mutate(newCategory as InsertCategory);
  };

  const handleUpdateCategory = (id: number, updates: Partial<InsertCategory>) => {
    updateCategoryMutation.mutate({ id, updates });
  };

  const handleDeleteCategory = (id: number) => {
    if (confirm('Are you sure you want to delete this category?')) {
      deleteCategoryMutation.mutate(id);
    }
  };

  const toggleNodeExpansion = (nodeId: number) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const renderCategoryTree = (nodes: CategoryTree[], level = 0) => {
    return (
      <div className={level > 0 ? 'ml-6' : ''}>
        {nodes.map((node) => (
          <div key={node.id} className="mb-2">
            <div 
              className={`flex items-center gap-2 p-3 rounded-lg border hover:shadow-sm transition-all cursor-pointer ${
                selectedCategory?.id === node.id ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
              }`}
              onClick={() => setSelectedCategory(node)}
            >
              {/* Expand/Collapse Icon */}
              {node.children.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-0 h-auto"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleNodeExpansion(node.id);
                  }}
                >
                  {expandedNodes.has(node.id) ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
              )}

              {/* Color Indicator */}
              <div 
                className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                style={{ backgroundColor: node.color || '#6b7280' }}
              />

              {/* Category Info */}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{node.name}</span>
                  <Badge variant="outline" className="text-xs">
                    Level {node.level}
                  </Badge>
                  {!node.isActive && (
                    <Badge variant="secondary" className="text-xs">
                      Inactive
                    </Badge>
                  )}
                </div>
                {node.description && (
                  <p className="text-sm text-muted-foreground mt-1">{node.description}</p>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingCategory(node.id);
                  }}
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteCategory(node.id);
                  }}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Render children if expanded */}
            {expandedNodes.has(node.id) && node.children.length > 0 && (
              <div className="mt-2">
                {renderCategoryTree(node.children, level + 1)}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  if (categoriesLoading || treeLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-200 rounded-lg mb-4" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Category Management</h2>
          <p className="text-muted-foreground">
            {projectId ? 'Project-specific categories' : 'Global categories'}
          </p>
        </div>
        
        <div className="flex gap-2">
          {categories.length === 0 && (
            <Button
              onClick={() => migrateLegacyMutation.mutate()}
              variant="outline"
              className="gap-2"
              disabled={migrateLegacyMutation.isPending}
            >
              <RotateCcw className="h-4 w-4" />
              Migrate Legacy
            </Button>
          )}
          
          <Button
            onClick={() => setIsAddingCategory(true)}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Category
          </Button>
        </div>
      </div>

      {/* Migration Alert */}
      {categories.length === 0 && (
        <Alert>
          <LayoutTemplate className="h-4 w-4" />
          <AlertDescription>
            No categories found. You can migrate from legacy categories, apply a template, or create categories manually.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="categories" className="w-full">
        <TabsList>
          <TabsTrigger value="categories" className="gap-2">
            <FolderTree className="h-4 w-4" />
            Categories
          </TabsTrigger>
          {showTemplates && (
            <TabsTrigger value="templates" className="gap-2">
              <LayoutTemplate className="h-4 w-4" />
              Templates
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="categories">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Category Tree */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="gap-2 flex items-center">
                    <Tag className="h-5 w-5" />
                    Category Hierarchy
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {categoryTree.length > 0 ? (
                    renderCategoryTree(categoryTree)
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <FolderTree className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No categories created yet</p>
                      <p className="text-sm">Create your first category to get started</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Category Details/Editor */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>
                    {isAddingCategory ? 'Add Category' : 'Category Details'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isAddingCategory ? (
                    // Add Category Form
                    <>
                      <div>
                        <label className="text-sm font-medium">Name</label>
                        <Input
                          value={newCategory.name || ''}
                          onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                          placeholder="Category name"
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium">Description</label>
                        <Textarea
                          value={newCategory.description || ''}
                          onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                          placeholder="Optional description"
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium">Level</label>
                        <Select
                          value={newCategory.level?.toString()}
                          onValueChange={(value) => setNewCategory({ ...newCategory, level: parseInt(value) })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">Level 1 (Root)</SelectItem>
                            <SelectItem value="2">Level 2 (Subcategory)</SelectItem>
                            <SelectItem value="3">Level 3</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {newCategory.level && newCategory.level > 1 && (
                        <div>
                          <label className="text-sm font-medium">Parent Category</label>
                          <Select
                            value={newCategory.parentId?.toString()}
                            onValueChange={(value) => setNewCategory({ ...newCategory, parentId: parseInt(value) })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select parent" />
                            </SelectTrigger>
                            <SelectContent>
                              {categories
                                .filter(cat => cat.level < (newCategory.level || 1))
                                .map((cat) => (
                                  <SelectItem key={cat.id} value={cat.id.toString()}>
                                    {cat.name}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      <div>
                        <label className="text-sm font-medium">Color</label>
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            value={newCategory.color || '#6366f1'}
                            onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
                            className="w-16"
                          />
                          <Input
                            value={newCategory.color || ''}
                            onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
                            placeholder="#6366f1"
                          />
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          onClick={handleCreateCategory}
                          disabled={createCategoryMutation.isPending}
                          className="gap-2"
                        >
                          <Save className="h-4 w-4" />
                          Create
                        </Button>
                        <Button
                          onClick={() => setIsAddingCategory(false)}
                          variant="outline"
                          className="gap-2"
                        >
                          <X className="h-4 w-4" />
                          Cancel
                        </Button>
                      </div>
                    </>
                  ) : selectedCategory ? (
                    // Category Details
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                          style={{ backgroundColor: selectedCategory.color || undefined }}
                        />
                        <div>
                          <h3 className="font-semibold">{selectedCategory.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            Level {selectedCategory.level}
                          </p>
                        </div>
                      </div>

                      {selectedCategory.description && (
                        <p className="text-sm">{selectedCategory.description}</p>
                      )}

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Slug:</span>
                          <code className="bg-muted px-2 py-1 rounded">{selectedCategory.slug}</code>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Sort Order:</span>
                          <span>{selectedCategory.sortOrder}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Status:</span>
                          <Badge variant={selectedCategory.isActive ? 'default' : 'secondary'}>
                            {selectedCategory.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Tag className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Select a category to view details</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {showTemplates && (
          <TabsContent value="templates">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(DEFAULT_TEMPLATE_SETS).map(([key, template]) => (
                <Card key={key} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <CardDescription>{template.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 mb-4">
                      {template.categories.slice(0, 3).map((cat, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: cat.color }}
                          />
                          <span className="text-sm">{cat.name}</span>
                        </div>
                      ))}
                      {template.categories.length > 3 && (
                        <p className="text-xs text-muted-foreground">
                          +{template.categories.length - 3} more categories
                        </p>
                      )}
                    </div>

                    {projectId && (
                      <Button
                        onClick={() => {
                          // This would need to be implemented to create template set first
                          toast({ title: 'Info', description: 'Template application coming soon' });
                        }}
                        className="w-full gap-2"
                        disabled={applyTemplateMutation.isPending}
                      >
                        <Download className="h-4 w-4" />
                        Apply Template
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

export default UnifiedCategoryManager;