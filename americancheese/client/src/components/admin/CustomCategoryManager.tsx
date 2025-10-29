import React, { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Save, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface CategoryTemplate {
  id: number;
  name: string;
  type: 'tier1' | 'tier2';
  parentId?: number;
  color?: string;
  description?: string;
  sortOrder: number;
}

interface CustomCategoryManagerProps {
  onCategoriesChange?: (categories: CategoryTemplate[]) => void;
}

export function CustomCategoryManager({ onCategoriesChange }: CustomCategoryManagerProps) {
  const [categories, setCategories] = useState<CategoryTemplate[]>([]);
  const [editingCategory, setEditingCategory] = useState<number | null>(null);
  const [newCategory, setNewCategory] = useState<Partial<CategoryTemplate>>({
    type: 'tier1',
    sortOrder: 0
  });
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/category-templates');
      const data = await response.json();
      setCategories(data);
      onCategoriesChange?.(data);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const saveCategory = async (category: Partial<CategoryTemplate>) => {
    try {
      const method = category.id ? 'PUT' : 'POST';
      const url = category.id ? `/api/category-templates/${category.id}` : '/api/category-templates';
      
      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(category)
      });
      
      fetchCategories();
      setEditingCategory(null);
      setShowAddForm(false);
      setNewCategory({ type: 'tier1', sortOrder: 0 });
    } catch (error) {
      console.error('Failed to save category:', error);
    }
  };

  const deleteCategory = async (id: number) => {
    try {
      await fetch(`/api/category-templates/${id}`, { method: 'DELETE' });
      fetchCategories();
    } catch (error) {
      console.error('Failed to delete category:', error);
    }
  };

  const tier1Categories = categories.filter(cat => cat.type === 'tier1');
  const tier2Categories = categories.filter(cat => cat.type === 'tier2');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Custom Categories</h2>
          <p className="text-muted-foreground">
            Define your own category structure instead of using construction-specific categories
          </p>
        </div>
        <Button onClick={() => setShowAddForm(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Category
        </Button>
      </div>

      {/* Add New Category Form */}
      {showAddForm && (
        <Card className="border-blue-200">
          <CardHeader>
            <CardTitle>Add New Category</CardTitle>
            <CardDescription>Create a new custom category template</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Name</label>
                <Input
                  value={newCategory.name || ''}
                  onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                  placeholder="Enter category name"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Type</label>
                <Select
                  value={newCategory.type}
                  onValueChange={(value) => setNewCategory({ ...newCategory, type: value as 'tier1' | 'tier2' })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tier1">Main Category (Tier 1)</SelectItem>
                    <SelectItem value="tier2">Sub Category (Tier 2)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {newCategory.type === 'tier2' && (
              <div>
                <label className="text-sm font-medium">Parent Category</label>
                <Select
                  value={newCategory.parentId?.toString()}
                  onValueChange={(value) => setNewCategory({ ...newCategory, parentId: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select parent category" />
                  </SelectTrigger>
                  <SelectContent>
                    {tier1Categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id.toString()}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <label className="text-sm font-medium">Description (Optional)</label>
              <Input
                value={newCategory.description || ''}
                onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                placeholder="Brief description of this category"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Color (Optional)</label>
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
                onClick={() => saveCategory(newCategory)}
                disabled={!newCategory.name}
                className="gap-2"
              >
                <Save className="h-4 w-4" />
                Save Category
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddForm(false);
                  setNewCategory({ type: 'tier1', sortOrder: 0 });
                }}
                className="gap-2"
              >
                <X className="h-4 w-4" />
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Categories (Tier 1) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Main Categories (Tier 1)
            <Badge variant="secondary">{tier1Categories.length}</Badge>
          </CardTitle>
          <CardDescription>
            These are your main category groups (equivalent to Sub Cat 1, Sub Cat 2, Sub Cat 3, etc.)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2">
            {tier1Categories.map((category) => (
              <div key={category.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  {category.color && (
                    <div
                      className="w-4 h-4 rounded-full border"
                      style={{ backgroundColor: category.color }}
                    />
                  )}
                  <div>
                    <span className="font-medium">{category.name}</span>
                    {category.description && (
                      <p className="text-sm text-muted-foreground">{category.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingCategory(category.id)}
                    className="gap-2"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteCategory(category.id)}
                    className="gap-2 text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            {tier1Categories.length === 0 && (
              <p className="text-muted-foreground text-center py-8">
                No main categories defined. Add your first category to get started.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Sub Categories (Tier 2) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Sub Categories (Tier 2)
            <Badge variant="secondary">{tier2Categories.length}</Badge>
          </CardTitle>
          <CardDescription>
            These are subcategories that belong to your main categories
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {tier1Categories.map((parentCategory) => {
              const subCategories = tier2Categories.filter(cat => cat.parentId === parentCategory.id);
              return (
                <div key={parentCategory.id} className="border rounded-lg p-4">
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    {parentCategory.color && (
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: parentCategory.color }}
                      />
                    )}
                    {parentCategory.name}
                    <Badge variant="outline" className="ml-auto">
                      {subCategories.length} subcategories
                    </Badge>
                  </h4>
                  <div className="grid gap-2">
                    {subCategories.map((subCategory) => (
                      <div key={subCategory.id} className="flex items-center justify-between p-2 bg-muted rounded">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {subCategory.color && (
                            <div
                              className="w-3 h-3 rounded-full border flex-shrink-0"
                              style={{ backgroundColor: subCategory.color }}
                            />
                          )}
                          <div className="flex flex-col gap-0.5 min-w-0">
                            <span className="text-sm font-medium">{subCategory.name}</span>
                            {subCategory.description && (
                              <span className="text-xs text-muted-foreground truncate">{subCategory.description}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1 flex-shrink-0 ml-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingCategory(subCategory.id)}
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteCategory(subCategory.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    {subCategories.length === 0 && (
                      <p className="text-xs text-muted-foreground italic">No subcategories defined</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default CustomCategoryManager;