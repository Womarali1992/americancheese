import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Table, TableBody, TableCaption, TableCell, 
  TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { 
  Dialog, DialogContent, DialogDescription, 
  DialogFooter, DialogHeader, DialogTitle, DialogTrigger 
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// Types
interface TemplateCategory {
  id: number;
  name: string;
  type: 'tier1' | 'tier2';
  parentId: number | null;
  createdAt: string;
  updatedAt: string;
}

interface CategoryFormValues {
  name: string;
  type: 'tier1' | 'tier2';
  parentId: number | null;
}

// Component
export default function CategoryManager() {
  const { toast } = useToast();
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<TemplateCategory | null>(null);
  const [formValues, setFormValues] = useState<CategoryFormValues>({
    name: "",
    type: "tier1",
    parentId: null
  });

  // Fetch categories
  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['/api/admin/template-categories'],
    queryFn: async () => {
      const response = await fetch('/api/admin/template-categories');
      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }
      return response.json();
    }
  });

  const tier1Categories = categories.filter((cat: TemplateCategory) => cat.type === 'tier1');
  const tier2Categories = categories.filter((cat: TemplateCategory) => cat.type === 'tier2');

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (data: CategoryFormValues) => {
      const response = await apiRequest(
        '/api/admin/template-categories', 
        'POST',
        data
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/template-categories'] });
      toast({ title: "Category created successfully", variant: "default" });
      setOpenCreateDialog(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast({ 
        title: "Failed to create category", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: CategoryFormValues }) => {
      const response = await apiRequest(
        `/api/admin/template-categories/${id}`,
        'PUT',
        data
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/template-categories'] });
      toast({ title: "Category updated successfully", variant: "default" });
      setOpenEditDialog(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast({ 
        title: "Failed to update category", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest(
        `/api/admin/template-categories/${id}`,
        'DELETE'
      );
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/template-categories'] });
      toast({ title: "Category deleted successfully", variant: "default" });
      setOpenDeleteDialog(false);
    },
    onError: (error: Error) => {
      toast({ 
        title: "Failed to delete category", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  // Form handlers
  const resetForm = () => {
    setFormValues({
      name: "",
      type: "tier1",
      parentId: null
    });
    setCurrentCategory(null);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formValues);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentCategory) {
      updateMutation.mutate({ id: currentCategory.id, data: formValues });
    }
  };

  const handleDelete = () => {
    if (currentCategory) {
      deleteMutation.mutate(currentCategory.id);
    }
  };

  const handleEditClick = (category: TemplateCategory) => {
    setCurrentCategory(category);
    setFormValues({
      name: category.name,
      type: category.type,
      parentId: category.parentId
    });
    setOpenEditDialog(true);
  };

  const handleDeleteClick = (category: TemplateCategory) => {
    setCurrentCategory(category);
    setOpenDeleteDialog(true);
  };

  const getParentName = (parentId: number | null) => {
    if (!parentId) return "None";
    const parent = categories.find((c: TemplateCategory) => c.id === parentId);
    return parent ? parent.name : "Unknown";
  };

  if (isLoading) {
    return <div className="flex justify-center p-4">Loading categories...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Task Categories</h3>
        <Dialog open={openCreateDialog} onOpenChange={setOpenCreateDialog}>
          <DialogTrigger asChild>
            <Button 
              onClick={() => { resetForm(); setOpenCreateDialog(true); }}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Category
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Category</DialogTitle>
              <DialogDescription>
                Add a new category for organizing task templates
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Category Name</Label>
                  <Input
                    id="name"
                    placeholder="Enter category name"
                    value={formValues.name}
                    onChange={(e) => setFormValues({ ...formValues, name: e.target.value })}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="type">Category Type</Label>
                  <Select
                    value={formValues.type}
                    onValueChange={(value: 'tier1' | 'tier2') => {
                      setFormValues({ 
                        ...formValues, 
                        type: value,
                        // Reset parentId if switching to tier1
                        parentId: value === 'tier1' ? null : formValues.parentId
                      });
                    }}
                  >
                    <SelectTrigger id="type">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tier1">Tier 1 (Main Category)</SelectItem>
                      <SelectItem value="tier2">Tier 2 (Sub-Category)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {formValues.type === 'tier2' && (
                  <div className="grid gap-2">
                    <Label htmlFor="parentId">Parent Category</Label>
                    <Select
                      value={formValues.parentId?.toString() || ""}
                      onValueChange={(value) => {
                        setFormValues({ 
                          ...formValues, 
                          parentId: value ? parseInt(value) : null 
                        });
                      }}
                    >
                      <SelectTrigger id="parentId">
                        <SelectValue placeholder="Select parent category" />
                      </SelectTrigger>
                      <SelectContent>
                        {tier1Categories.map((cat: TemplateCategory) => (
                          <SelectItem key={cat.id} value={cat.id.toString()}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
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

      {/* Hierarchical Category View */}
      <Card>
        <CardHeader>
          <CardTitle>Category Hierarchy</CardTitle>
          <CardDescription>Task categories and their sub-categories</CardDescription>
        </CardHeader>
        <CardContent>
          {tier1Categories.length === 0 ? (
            <div className="text-center p-4 border rounded-md bg-muted/50">
              No categories found. Add your first category with the button above.
            </div>
          ) : (
            <div className="space-y-4">
              {tier1Categories.map((tier1Category: TemplateCategory) => {
                const relatedTier2Categories = tier2Categories.filter(
                  (c: TemplateCategory) => c.parentId === tier1Category.id
                );
                
                return (
                  <div key={tier1Category.id} className="border rounded-md overflow-hidden">
                    <div className="bg-muted/50 p-4 flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold">{tier1Category.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {relatedTier2Categories.length} sub-categories
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditClick(tier1Category)}
                          className="flex items-center gap-1"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteClick(tier1Category)}
                          className="flex items-center gap-1"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </Button>
                      </div>
                    </div>
                    
                    {relatedTier2Categories.length > 0 && (
                      <div className="p-2">
                        <h4 className="text-sm font-medium mb-2 px-2">Sub-categories</h4>
                        <div className="space-y-1">
                          {relatedTier2Categories.map((tier2Category: TemplateCategory) => (
                            <div 
                              key={tier2Category.id} 
                              className="flex items-center justify-between p-2 rounded-md hover:bg-accent/50"
                            >
                              <div className="pl-6 font-medium">{tier2Category.name}</div>
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEditClick(tier2Category)}
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDeleteClick(tier2Category)}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={openEditDialog} onOpenChange={setOpenEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>
              Update category details
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">Category Name</Label>
                <Input
                  id="edit-name"
                  placeholder="Enter category name"
                  value={formValues.name}
                  onChange={(e) => setFormValues({ ...formValues, name: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-type">Category Type</Label>
                <Select
                  value={formValues.type}
                  onValueChange={(value: 'tier1' | 'tier2') => {
                    setFormValues({ 
                      ...formValues, 
                      type: value,
                      parentId: value === 'tier1' ? null : formValues.parentId 
                    });
                  }}
                  disabled={true} // Type cannot be changed after creation
                >
                  <SelectTrigger id="edit-type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tier1">Tier 1 (Main Category)</SelectItem>
                    <SelectItem value="tier2">Tier 2 (Sub-Category)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {formValues.type === 'tier2' && (
                <div className="grid gap-2">
                  <Label htmlFor="edit-parentId">Parent Category</Label>
                  <Select
                    value={formValues.parentId?.toString() || ""}
                    onValueChange={(value) => {
                      setFormValues({ 
                        ...formValues, 
                        parentId: value ? parseInt(value) : null 
                      });
                    }}
                  >
                    <SelectTrigger id="edit-parentId">
                      <SelectValue placeholder="Select parent category" />
                    </SelectTrigger>
                    <SelectContent>
                      {tier1Categories.map((cat: TemplateCategory) => (
                        <SelectItem key={cat.id} value={cat.id.toString()}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "Updating..." : "Update Category"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete the category <strong>{currentCategory?.name}</strong>{" "}
              {currentCategory?.type === 'tier1' && 
                'and all its sub-categories. All associated task templates will also be deleted.'}
              {currentCategory?.type === 'tier2' && 
                'and all associated task templates.'}
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}