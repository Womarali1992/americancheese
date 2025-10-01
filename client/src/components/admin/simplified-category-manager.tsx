import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, FolderTree, Palette } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

// Simplified types using projectCategories
interface ProjectCategory {
  id: number;
  projectId: number;
  name: string;
  type: 'tier1' | 'tier2';
  parentId: number | null;
  color?: string | null;
  description?: string | null;
  sortOrder: number;
  isFromTemplate: boolean;
  templateSource?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface CategoryHierarchy extends ProjectCategory {
  children: ProjectCategory[];
}

interface CategoryPreset {
  id: string;
  name: string;
  description: string;
}

interface SimplifiedCategoryManagerProps {
  projectId: number;
}

export default function SimplifiedCategoryManager({ projectId }: SimplifiedCategoryManagerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openPresetDialog, setOpenPresetDialog] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<ProjectCategory | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    type: "tier1" as "tier1" | "tier2",
    parentId: null as number | null,
    description: "",
    color: ""
  });

  // Fetch project categories in hierarchical structure
  const { data: categoryHierarchy = [], isLoading: isLoadingCategories } = useQuery({
    queryKey: [`/api/projects/${projectId}/categories`],
    queryFn: async () => {
      const response = await apiRequest(`/api/projects/${projectId}/categories`);
      return response.json() as Promise<CategoryHierarchy[]>;
    },
    enabled: !!projectId
  });

  // Fetch flat list for dropdowns
  const { data: flatCategories = [] } = useQuery({
    queryKey: [`/api/projects/${projectId}/categories/flat`],
    queryFn: async () => {
      const response = await apiRequest(`/api/projects/${projectId}/categories/flat`);
      return response.json() as Promise<ProjectCategory[]>;
    },
    enabled: !!projectId
  });

  // Fetch available presets
  const { data: presets = [] } = useQuery({
    queryKey: ['/api/categories/presets'],
    queryFn: async () => {
      const response = await apiRequest('/api/categories/presets');
      return response.json() as Promise<CategoryPreset[]>;
    }
  });

  // Get tier1 categories for parent selection
  const tier1Categories = flatCategories.filter(cat => cat.type === 'tier1');

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await apiRequest(`/api/projects/${projectId}/categories`, 'POST', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/categories`] });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/categories/flat`] });
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
    mutationFn: async ({ id, data }: { id: number, data: typeof formData }) => {
      const response = await apiRequest(`/api/projects/${projectId}/categories/${id}`, 'PUT', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/categories`] });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/categories/flat`] });
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
      await apiRequest(`/api/projects/${projectId}/categories/${id}`, 'DELETE');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/categories`] });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/categories/flat`] });
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

  const applyPresetMutation = useMutation({
    mutationFn: async (presetId: string) => {
      const response = await apiRequest(`/api/projects/${projectId}/categories/apply-preset`, 'POST', { presetId });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/categories`] });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/categories/flat`] });
      toast({
        title: "Preset applied successfully",
        description: `Created ${data.categoriesCreated} categories`,
        variant: "default"
      });
      setOpenPresetDialog(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to apply preset",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Form handlers
  const resetForm = () => {
    setFormData({
      name: "",
      type: "tier1",
      parentId: null,
      description: "",
      color: ""
    });
    setCurrentCategory(null);
  };

  const handleEdit = (category: ProjectCategory) => {
    setCurrentCategory(category);
    setFormData({
      name: category.name,
      type: category.type,
      parentId: category.parentId,
      description: category.description || "",
      color: category.color || ""
    });
    setOpenEditDialog(true);
  };

  const handleDelete = (category: ProjectCategory) => {
    setCurrentCategory(category);
    setOpenDeleteDialog(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (currentCategory) {
      updateMutation.mutate({ id: currentCategory.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  if (isLoadingCategories) {
    return <div className="flex justify-center p-4">Loading categories...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center">
        <div>
          <h2 className="text-2xl font-bold">Project Categories</h2>
          <p className="text-muted-foreground">Manage categories for organizing tasks, materials, and labor</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={openPresetDialog} onOpenChange={setOpenPresetDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <FolderTree className="h-4 w-4" />
                Apply Preset
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Apply Category Preset</DialogTitle>
                <DialogDescription>
                  Choose a preset to create a standard set of categories for your project
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                {presets.map((preset) => (
                  <Card key={preset.id} className="cursor-pointer hover:bg-accent"
                        onClick={() => applyPresetMutation.mutate(preset.id)}>
                    <CardContent className="p-4">
                      <h3 className="font-semibold">{preset.name}</h3>
                      <p className="text-sm text-muted-foreground">{preset.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={openCreateDialog} onOpenChange={setOpenCreateDialog}>
            <DialogTrigger asChild>
              <Button onClick={() => { resetForm(); setOpenCreateDialog(true); }}>
                <Plus className="h-4 w-4 mr-2" />
                Add Category
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Category</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="type">Type</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value: "tier1" | "tier2") => setFormData({ ...formData, type: value, parentId: value === "tier1" ? null : formData.parentId })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tier1">Tier 1 (Main Category)</SelectItem>
                        <SelectItem value="tier2">Tier 2 (Sub Category)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {formData.type === "tier2" && (
                    <div>
                      <Label htmlFor="parentId">Parent Category</Label>
                      <Select
                        value={formData.parentId?.toString() || ""}
                        onValueChange={(value) => setFormData({ ...formData, parentId: parseInt(value) })}
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
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="color">Color (optional)</Label>
                    <Input
                      id="color"
                      type="color"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    />
                  </div>
                </div>
                <DialogFooter className="mt-6">
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? "Creating..." : "Create Category"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Category hierarchy display */}
      <Card>
        <CardHeader>
          <CardTitle>Category Structure</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px]">
            {categoryHierarchy.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No categories found. Apply a preset or create custom categories to get started.
              </div>
            ) : (
              <div className="space-y-4">
                {categoryHierarchy.map((tier1) => (
                  <div key={tier1.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        {tier1.color && (
                          <div
                            className="w-4 h-4 rounded-full border"
                            style={{ backgroundColor: tier1.color }}
                          />
                        )}
                        <h3 className="font-semibold text-lg">{tier1.name}</h3>
                        <Badge variant="outline">Tier 1</Badge>
                        {tier1.isFromTemplate && (
                          <Badge variant="secondary">From {tier1.templateSource}</Badge>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(tier1)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(tier1)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    {tier1.description && (
                      <p className="text-sm text-muted-foreground mb-3">{tier1.description}</p>
                    )}

                    {tier1.children.length > 0 && (
                      <div className="ml-6 space-y-2">
                        {tier1.children.map((tier2) => (
                          <div key={tier2.id} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                            <div className="flex items-center gap-2">
                              {tier2.color && (
                                <div
                                  className="w-3 h-3 rounded-full border"
                                  style={{ backgroundColor: tier2.color }}
                                />
                              )}
                              <span className="font-medium">{tier2.name}</span>
                              <Badge variant="outline" className="text-xs">Tier 2</Badge>
                            </div>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="icon" onClick={() => handleEdit(tier2)}>
                                <Pencil className="h-3 w-3" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleDelete(tier2)}>
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={openEditDialog} onOpenChange={setOpenEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Name</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="edit-color">Color</Label>
                <Input
                  id="edit-color"
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "Updating..." : "Update Category"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{currentCategory?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => currentCategory && deleteMutation.mutate(currentCategory.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}