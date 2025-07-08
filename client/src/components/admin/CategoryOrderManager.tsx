import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, DialogContent, DialogDescription, 
  DialogFooter, DialogHeader, DialogTitle, DialogTrigger 
} from "@/components/ui/dialog";
import { 
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { GripVertical, Plus, Pencil, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface CategoryItem {
  id: number;
  name: string;
  type: 'tier1' | 'tier2';
  parentId: number | null;
  color: string | null;
  sortOrder: number;
  templateId?: number | null;
}

interface CategoryOrderManagerProps {
  projectId?: number;
}

export default function CategoryOrderManager({ projectId }: CategoryOrderManagerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<CategoryItem | null>(null);
  
  // Form state
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryType, setNewCategoryType] = useState<"tier1" | "tier2">("tier1");
  const [newCategoryParent, setNewCategoryParent] = useState<string>("");
  const [newCategoryColor, setNewCategoryColor] = useState("#3b82f6");

  // Fetch categories (admin templates or project-specific categories)
  const { data: categories = [], isLoading } = useQuery({
    queryKey: projectId ? [`/api/projects/${projectId}/template-categories`] : ['/api/admin/template-categories'],
    queryFn: async () => {
      const endpoint = projectId 
        ? `/api/projects/${projectId}/template-categories`  // Returns only project-specific categories
        : '/api/admin/template-categories';  // Returns global templates
      const response = await fetch(endpoint);
      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }
      return response.json();
    }
  });

  // Separate and sort categories
  const tier1Categories = categories
    .filter((cat: CategoryItem) => cat.type === 'tier1')
    .sort((a: CategoryItem, b: CategoryItem) => (a.sortOrder || 0) - (b.sortOrder || 0));
    
  const tier2Categories = categories
    .filter((cat: CategoryItem) => cat.type === 'tier2')
    .sort((a: CategoryItem, b: CategoryItem) => (a.sortOrder || 0) - (b.sortOrder || 0));

  // Get tier2 categories for a specific tier1
  const getTier2ForTier1 = (tier1Id: number) => {
    return tier2Categories.filter((cat: CategoryItem) => cat.parentId === tier1Id);
  };

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (newCategory: {
      name: string;
      type: string;
      parentId?: number;
      color?: string;
      sortOrder?: number;
    }) => {
      const endpoint = projectId 
        ? `/api/projects/${projectId}/template-categories`  // Use template-categories endpoint for project
        : '/api/admin/template-categories';
      
      return await apiRequest(endpoint, 'POST', {
        ...newCategory,
        sortOrder: newCategory.type === 'tier1' ? tier1Categories.length : tier2Categories.length
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: projectId ? [`/api/projects/${projectId}/template-categories`] : ['/api/admin/template-categories']
      });
      setOpenAddDialog(false);
      resetForm();
      toast({
        title: "Category created",
        description: "The category has been created successfully."
      });
    }
  });

  // Update order mutation
  const updateOrderMutation = useMutation({
    mutationFn: async (updates: { id: number; sortOrder: number }[]) => {
      const promises = updates.map(({ id, sortOrder }) => {
        // Find the category to determine if it's global or project-specific
        const category = categories.find(cat => cat.id === id);
        const isGlobalCategory = !category?.projectId;
        
        const endpoint = isGlobalCategory
          ? `/api/admin/template-categories/${id}`
          : `/api/projects/${category?.projectId}/template-categories/${id}`;
        
        return apiRequest(endpoint, 'PUT', { sortOrder });
      });
      
      return Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: projectId ? [`/api/projects/${projectId}/template-categories`] : ['/api/admin/template-categories']
      });
      toast({
        title: "Order updated",
        description: "Category order has been updated successfully."
      });
    }
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (updatedCategory: { id: number; name: string; type: 'tier1' | 'tier2'; parentId?: number; color: string }) => {
      console.log('Updating category:', updatedCategory);
      
      // Find the category to determine if it's global or project-specific
      const category = categories.find(cat => cat.id === updatedCategory.id);
      const isGlobalCategory = !category?.projectId;
      
      const endpoint = isGlobalCategory
        ? `/api/admin/template-categories/${updatedCategory.id}`
        : `/api/projects/${category?.projectId}/template-categories/${updatedCategory.id}`;
      
      console.log('Using endpoint:', endpoint);
      console.log('Category data:', { category, isGlobalCategory });
      
      return await apiRequest(endpoint, 'PUT', {
        name: updatedCategory.name,
        type: updatedCategory.type,
        parentId: updatedCategory.parentId || null,
        color: updatedCategory.color
      });
    },
    onSuccess: () => {
      console.log('Category update successful');
      queryClient.invalidateQueries({ 
        queryKey: projectId ? [`/api/projects/${projectId}/template-categories`] : ['/api/admin/template-categories']
      });
      setOpenEditDialog(false);
      setSelectedCategory(null);
      resetForm();
      toast({
        title: "Category updated",
        description: "The category has been updated successfully."
      });
    },
    onError: (error) => {
      console.error('Category update failed:', error);
      toast({
        title: "Update failed",
        description: "Failed to update category. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      // Find the category to determine if it's global or project-specific
      const category = categories.find(cat => cat.id === id);
      const isGlobalCategory = !category?.projectId;
      
      const endpoint = isGlobalCategory
        ? `/api/admin/template-categories/${id}`
        : `/api/projects/${category?.projectId}/template-categories/${id}`;
      
      return await apiRequest(endpoint, 'DELETE');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: projectId ? [`/api/projects/${projectId}/template-categories`] : ['/api/admin/template-categories']
      });
      setOpenDeleteDialog(false);
      setSelectedCategory(null);
      toast({
        title: "Category deleted",
        description: "The category has been deleted successfully."
      });
    }
  });

  const resetForm = () => {
    setNewCategoryName("");
    setNewCategoryType("tier1");
    setNewCategoryParent("");
    setNewCategoryColor("#3b82f6");
  };

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newCategory = {
      name: newCategoryName,
      type: newCategoryType,
      color: newCategoryColor,
      ...(newCategoryType === 'tier2' && newCategoryParent 
        ? { parentId: parseInt(newCategoryParent) } 
        : {})
    };
    
    createMutation.mutate(newCategory);
  };

  const moveCategoryUp = (category: CategoryItem) => {
    const categoriesOfSameType = category.type === 'tier1' ? tier1Categories : 
      getTier2ForTier1(category.parentId!);
    
    const currentIndex = categoriesOfSameType.findIndex(cat => cat.id === category.id);
    if (currentIndex > 0) {
      const updates = [
        { id: category.id, sortOrder: currentIndex - 1 },
        { id: categoriesOfSameType[currentIndex - 1].id, sortOrder: currentIndex }
      ];
      updateOrderMutation.mutate(updates);
    }
  };

  const moveCategoryDown = (category: CategoryItem) => {
    const categoriesOfSameType = category.type === 'tier1' ? tier1Categories : 
      getTier2ForTier1(category.parentId!);
    
    const currentIndex = categoriesOfSameType.findIndex(cat => cat.id === category.id);
    if (currentIndex < categoriesOfSameType.length - 1) {
      const updates = [
        { id: category.id, sortOrder: currentIndex + 1 },
        { id: categoriesOfSameType[currentIndex + 1].id, sortOrder: currentIndex }
      ];
      updateOrderMutation.mutate(updates);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center py-8">Loading categories...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Category Order Management</h2>
          <p className="text-muted-foreground">Organize tier1 categories and their tier2 subcategories in your preferred order</p>
        </div>
        <Dialog open={openAddDialog} onOpenChange={setOpenAddDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Category
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Category</DialogTitle>
              <DialogDescription>
                Create a new category. Tier1 categories are main groups, tier2 are subcategories.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateCategory}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Category Name</Label>
                  <Input
                    id="name"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="e.g., Structural, Foundation"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="type">Category Type</Label>
                  <Select
                    value={newCategoryType}
                    onValueChange={(value) => setNewCategoryType(value as 'tier1' | 'tier2')}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tier1">Tier 1 (Main Category)</SelectItem>
                      <SelectItem value="tier2">Tier 2 (Sub-Category)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {newCategoryType === 'tier2' && (
                  <div className="grid gap-2">
                    <Label htmlFor="parentId">Parent Category</Label>
                    <Select
                      value={newCategoryParent}
                      onValueChange={setNewCategoryParent}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select parent category" />
                      </SelectTrigger>
                      <SelectContent>
                        {tier1Categories.map((cat: CategoryItem) => (
                          <SelectItem key={cat.id} value={cat.id.toString()}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="grid gap-2">
                  <Label htmlFor="color">Color</Label>
                  <Input
                    id="color"
                    type="color"
                    value={newCategoryColor}
                    onChange={(e) => setNewCategoryColor(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Creating..." : "Create Category"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tier 1 Categories with their Tier 2 subcategories */}
      <div className="space-y-6">
        {tier1Categories.map((tier1, tier1Index) => (
          <Card key={tier1.id} className="border-l-4" style={{ borderLeftColor: tier1.color || '#3b82f6' }}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-4 h-4 rounded-full" 
                    style={{ backgroundColor: tier1.color || '#3b82f6' }}
                  />
                  <div>
                    <CardTitle className="text-lg">{tier1.name}</CardTitle>
                    <CardDescription>Tier 1 Category • Order: {tier1Index + 1}</CardDescription>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => moveCategoryUp(tier1)}
                    disabled={tier1Index === 0}
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => moveCategoryDown(tier1)}
                    disabled={tier1Index === tier1Categories.length - 1}
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedCategory(tier1);
                      setNewCategoryName(tier1.name);
                      setNewCategoryType(tier1.type);
                      setNewCategoryParent(tier1.parentId?.toString() || "");
                      setNewCategoryColor(tier1.color || "#3b82f6");
                      setOpenEditDialog(true);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedCategory(tier1);
                      setOpenDeleteDialog(true);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-sm text-muted-foreground">Tier 2 Subcategories</h4>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Plus className="mr-2 h-3 w-3" />
                        Add Subcategory
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Subcategory to {tier1.name}</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={(e) => {
                        e.preventDefault();
                        createMutation.mutate({
                          name: newCategoryName,
                          type: 'tier2',
                          parentId: tier1.id,
                          color: newCategoryColor
                        });
                      }}>
                        <div className="grid gap-4 py-4">
                          <div className="grid gap-2">
                            <Label>Subcategory Name</Label>
                            <Input
                              value={newCategoryName}
                              onChange={(e) => setNewCategoryName(e.target.value)}
                              placeholder="e.g., Foundation, Framing"
                              required
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label>Color</Label>
                            <Input
                              type="color"
                              value={newCategoryColor}
                              onChange={(e) => setNewCategoryColor(e.target.value)}
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button type="submit" disabled={createMutation.isPending}>
                            Add Subcategory
                          </Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {getTier2ForTier1(tier1.id).map((tier2, tier2Index) => (
                    <div 
                      key={tier2.id} 
                      className="flex items-center justify-between p-2 border rounded-lg bg-muted/30"
                    >
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: tier2.color || tier1.color || '#3b82f6' }}
                        />
                        <span className="text-sm">{tier2.name}</span>
                        <Badge variant="secondary" className="text-xs">
                          #{tier2Index + 1}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => moveCategoryUp(tier2)}
                          disabled={tier2Index === 0}
                          className="h-6 w-6 p-0"
                        >
                          <ArrowUp className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => moveCategoryDown(tier2)}
                          disabled={tier2Index === getTier2ForTier1(tier1.id).length - 1}
                          className="h-6 w-6 p-0"
                        >
                          <ArrowDown className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedCategory(tier2);
                            setNewCategoryName(tier2.name);
                            setNewCategoryType(tier2.type);
                            setNewCategoryParent(tier2.parentId?.toString() || "");
                            setNewCategoryColor(tier2.color || "#3b82f6");
                            setOpenEditDialog(true);
                          }}
                          className="h-6 w-6 p-0"
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedCategory(tier2);
                            setOpenDeleteDialog(true);
                          }}
                          className="h-6 w-6 p-0 text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {getTier2ForTier1(tier1.id).length === 0 && (
                    <p className="text-sm text-muted-foreground col-span-full py-4 text-center">
                      No subcategories added yet
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {tier1Categories.length === 0 && (
          <Card>
            <CardContent className="py-8">
              <div className="text-center text-muted-foreground">
                <p>No categories found. Start by adding your first tier1 category.</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Edit Category Dialog */}
      <Dialog open={openEditDialog} onOpenChange={setOpenEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>
              Update the category details.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            if (selectedCategory) {
              updateMutation.mutate({
                id: selectedCategory.id,
                name: newCategoryName,
                type: newCategoryType,
                parentId: newCategoryType === 'tier2' ? parseInt(newCategoryParent) : undefined,
                color: newCategoryColor
              });
            }
          }}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">Category Name</Label>
                <Input
                  id="edit-name"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="e.g., Structural, Plumbing"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-type">Category Type</Label>
                <Select
                  value={newCategoryType}
                  onValueChange={(value) => setNewCategoryType(value as 'tier1' | 'tier2')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tier1">Tier 1 (Main Category)</SelectItem>
                    <SelectItem value="tier2">Tier 2 (Sub-Category)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {newCategoryType === 'tier2' && (
                <div className="grid gap-2">
                  <Label htmlFor="edit-parentId">Parent Category</Label>
                  <Select
                    value={newCategoryParent}
                    onValueChange={setNewCategoryParent}
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
              <div className="grid gap-2">
                <Label htmlFor="edit-color">Color</Label>
                <Input
                  id="edit-color"
                  type="color"
                  value={newCategoryColor}
                  onChange={(e) => setNewCategoryColor(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "Updating..." : "Update Category"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <AlertDialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedCategory?.name}"? 
              {selectedCategory?.type === 'tier1' && (
                <span className="block mt-2 text-destructive font-medium">
                  This will also delete all subcategories under this category.
                </span>
              )}
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => selectedCategory && deleteMutation.mutate(selectedCategory.id)}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}