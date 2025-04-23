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

interface CategoryManagerProps {
  projectId?: number;
}

export default function CategoryManager({ projectId }: CategoryManagerProps) {
  const { toast } = useToast();
  const [openAdd, setOpenAdd] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState<TemplateCategory | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<TemplateCategory | null>(null);
  
  // Add category form state
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryType, setNewCategoryType] = useState<"tier1" | "tier2">("tier1");
  const [newCategoryParent, setNewCategoryParent] = useState<string>("");
  
  // Edit category form state
  const [editCategoryName, setEditCategoryName] = useState("");
  const [editCategoryType, setEditCategoryType] = useState<"tier1" | "tier2">("tier1");
  const [editCategoryParent, setEditCategoryParent] = useState<string>("");
  
  // Fetch all categories
  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['/api/template-categories', projectId],
    queryFn: async () => {
      const urlParams = projectId ? `?projectId=${projectId}` : '';
      const response = await fetch(`/api/template-categories${urlParams}`);
      if (!response.ok) {
        throw new Error('Failed to fetch template categories');
      }
      return response.json();
    }
  });
  
  // Filter categories by type
  const tier1Categories = categories.filter((cat: TemplateCategory) => cat.type === 'tier1');
  const tier2Categories = categories.filter((cat: TemplateCategory) => cat.type === 'tier2');
  
  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (newCategory: { name: string; type: string; parentId?: number }) => {
      return await apiRequest('/api/template-categories', 'POST', {
        ...newCategory,
        projectId: projectId
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/template-categories'] });
      setOpenAdd(false);
      setNewCategoryName("");
      setNewCategoryType("tier1");
      setNewCategoryParent("");
      toast({
        title: "Category created",
        description: "The category has been created successfully."
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to create category",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
    }
  });
  
  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (updatedCategory: { id: number; name: string; type: string; parentId?: number }) => {
      return await apiRequest(`/api/template-categories/${updatedCategory.id}`, 'PUT', {
        name: updatedCategory.name,
        type: updatedCategory.type,
        parentId: updatedCategory.parentId || null,
        projectId: projectId
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/template-categories'] });
      setOpenEdit(false);
      setCategoryToEdit(null);
      toast({
        title: "Category updated",
        description: "The category has been updated successfully."
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to update category",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
    }
  });
  
  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/template-categories/${id}`, 'DELETE');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/template-categories'] });
      setOpenDelete(false);
      setCategoryToDelete(null);
      toast({
        title: "Category deleted",
        description: "The category has been deleted successfully."
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to delete category",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
    }
  });
  
  // Handle form submissions
  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newCategory = {
      name: newCategoryName,
      type: newCategoryType,
      ...(newCategoryType === 'tier2' && newCategoryParent 
        ? { parentId: parseInt(newCategoryParent) } 
        : {})
    };
    
    createMutation.mutate(newCategory);
  };
  
  const handleEditCategory = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!categoryToEdit) return;
    
    const updatedCategory = {
      id: categoryToEdit.id,
      name: editCategoryName,
      type: editCategoryType,
      ...(editCategoryType === 'tier2' && editCategoryParent 
        ? { parentId: parseInt(editCategoryParent) } 
        : {})
    };
    
    updateMutation.mutate(updatedCategory);
  };
  
  const handleDeleteCategory = () => {
    if (!categoryToDelete) return;
    deleteMutation.mutate(categoryToDelete.id);
  };
  
  const openEditDialog = (category: TemplateCategory) => {
    setCategoryToEdit(category);
    setEditCategoryName(category.name);
    setEditCategoryType(category.type);
    setEditCategoryParent(category.parentId ? category.parentId.toString() : "");
    setOpenEdit(true);
  };
  
  const openDeleteDialog = (category: TemplateCategory) => {
    setCategoryToDelete(category);
    setOpenDelete(true);
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">Template Categories</h2>
        <Dialog open={openAdd} onOpenChange={setOpenAdd}>
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
                Create a new category for task templates.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddCategory}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Category Name</Label>
                  <Input
                    id="name"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="e.g., Structural, Plumbing"
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
      
      <div className="grid gap-6 md:grid-cols-2">
        {/* Tier 1 Categories */}
        <Card>
          <CardHeader>
            <CardTitle>Tier 1 Categories</CardTitle>
            <CardDescription>
              Main categories like Structural, Systems, etc.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-4">
                <p>Loading categories...</p>
              </div>
            ) : tier1Categories.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                <p>No Tier 1 categories found</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead className="w-[120px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tier1Categories.map((category: TemplateCategory) => (
                    <TableRow key={category.id}>
                      <TableCell>{category.name}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(category)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openDeleteDialog(category)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
        
        {/* Tier 2 Categories */}
        <Card>
          <CardHeader>
            <CardTitle>Tier 2 Categories</CardTitle>
            <CardDescription>
              Sub-categories like Foundation, Framing, etc.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-4">
                <p>Loading categories...</p>
              </div>
            ) : tier2Categories.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                <p>No Tier 2 categories found</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Parent</TableHead>
                    <TableHead className="w-[120px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tier2Categories.map((category: TemplateCategory) => (
                    <TableRow key={category.id}>
                      <TableCell>{category.name}</TableCell>
                      <TableCell>
                        {category.parentId
                          ? tier1Categories.find(c => c.id === category.parentId)?.name || "Unknown"
                          : "None"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(category)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openDeleteDialog(category)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Edit Category Dialog */}
      <Dialog open={openEdit} onOpenChange={setOpenEdit}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>
              Update the category details.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditCategory}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">Category Name</Label>
                <Input
                  id="edit-name"
                  value={editCategoryName}
                  onChange={(e) => setEditCategoryName(e.target.value)}
                  placeholder="e.g., Structural, Plumbing"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-type">Category Type</Label>
                <Select
                  value={editCategoryType}
                  onValueChange={(value) => setEditCategoryType(value as 'tier1' | 'tier2')}
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
              {editCategoryType === 'tier2' && (
                <div className="grid gap-2">
                  <Label htmlFor="edit-parentId">Parent Category</Label>
                  <Select
                    value={editCategoryParent}
                    onValueChange={setEditCategoryParent}
                  >
                    <SelectTrigger>
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
      <AlertDialog open={openDelete} onOpenChange={setOpenDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              category and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCategory}
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