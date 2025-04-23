import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { Pencil, Plus, Search, Timer, Trash2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

// Types
interface TemplateCategory {
  id: number;
  name: string;
  type: 'tier1' | 'tier2';
  parentId: number | null;
  createdAt: string;
  updatedAt: string;
}

interface TaskTemplate {
  id: number;
  templateId: string;
  title: string;
  description: string;
  tier1CategoryId: number;
  tier2CategoryId: number;
  estimatedDuration: number;
  createdAt: string;
  updatedAt: string;
}

interface TemplateFormValues {
  templateId: string;
  title: string;
  description: string;
  tier1CategoryId: number | null;
  tier2CategoryId: number | null;
  estimatedDuration: number;
}

// Component
export default function TemplateManager() {
  const { toast } = useToast();
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentTemplate, setCurrentTemplate] = useState<TaskTemplate | null>(null);
  const [selectedTier1, setSelectedTier1] = useState<number | null>(null);
  const [formValues, setFormValues] = useState<TemplateFormValues>({
    templateId: "",
    title: "",
    description: "",
    tier1CategoryId: null,
    tier2CategoryId: null,
    estimatedDuration: 1,
  });

  // Fetch templates and categories
  const { data: templates = [], isLoading: isLoadingTemplates } = useQuery({
    queryKey: ['/api/admin/task-templates'],
    queryFn: async () => {
      const response = await fetch('/api/admin/task-templates');
      if (!response.ok) {
        throw new Error('Failed to fetch templates');
      }
      return response.json();
    }
  });

  const { data: categories = [], isLoading: isLoadingCategories } = useQuery({
    queryKey: ['/api/admin/template-categories'],
    queryFn: async () => {
      const response = await fetch('/api/admin/template-categories');
      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }
      return response.json();
    }
  });

  // Filter templates by search query
  const filteredTemplates = templates.filter((template: TaskTemplate) => {
    return (
      template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.templateId.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  // Filter categories by type
  const tier1Categories = categories.filter((cat: TemplateCategory) => cat.type === 'tier1');
  const tier2Categories = categories.filter((cat: TemplateCategory) => cat.type === 'tier2');

  // Get filtered tier2 categories based on selected tier1
  const filteredTier2Categories = tier2Categories.filter(
    (cat: TemplateCategory) => cat.parentId === formValues.tier1CategoryId
  );

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (data: TemplateFormValues) => {
      const response = await apiRequest(
        '/api/admin/task-templates',
        'POST',
        data
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/task-templates'] });
      toast({ title: "Template created successfully", variant: "default" });
      setOpenCreateDialog(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast({ 
        title: "Failed to create template", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: Partial<TemplateFormValues> }) => {
      const response = await apiRequest(
        `/api/admin/task-templates/${id}`,
        'PUT',
        data
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/task-templates'] });
      toast({ title: "Template updated successfully", variant: "default" });
      setOpenEditDialog(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast({ 
        title: "Failed to update template", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest(
        `/api/admin/task-templates/${id}`,
        'DELETE'
      );
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/task-templates'] });
      toast({ title: "Template deleted successfully", variant: "default" });
      setOpenDeleteDialog(false);
    },
    onError: (error: Error) => {
      toast({ 
        title: "Failed to delete template", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  // Form handlers
  const resetForm = () => {
    setFormValues({
      templateId: "",
      title: "",
      description: "",
      tier1CategoryId: null,
      tier2CategoryId: null,
      estimatedDuration: 1,
    });
    setCurrentTemplate(null);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const { tier1CategoryId, tier2CategoryId } = formValues;
    
    if (!tier1CategoryId) {
      toast({ 
        title: "Missing Tier 1 Category", 
        description: "Please select a Tier 1 category", 
        variant: "destructive" 
      });
      return;
    }
    
    if (!tier2CategoryId) {
      toast({ 
        title: "Missing Tier 2 Category", 
        description: "Please select a Tier 2 category", 
        variant: "destructive" 
      });
      return;
    }
    
    createMutation.mutate(formValues);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentTemplate) {
      const { tier1CategoryId, tier2CategoryId } = formValues;
      
      if (!tier1CategoryId) {
        toast({ 
          title: "Missing Tier 1 Category", 
          description: "Please select a Tier 1 category", 
          variant: "destructive" 
        });
        return;
      }
      
      if (!tier2CategoryId) {
        toast({ 
          title: "Missing Tier 2 Category", 
          description: "Please select a Tier 2 category", 
          variant: "destructive" 
        });
        return;
      }
      
      updateMutation.mutate({ id: currentTemplate.id, data: formValues });
    }
  };

  const handleDelete = () => {
    if (currentTemplate) {
      deleteMutation.mutate(currentTemplate.id);
    }
  };

  const handleEditClick = (template: TaskTemplate) => {
    setCurrentTemplate(template);
    setFormValues({
      templateId: template.templateId,
      title: template.title,
      description: template.description,
      tier1CategoryId: template.tier1CategoryId,
      tier2CategoryId: template.tier2CategoryId,
      estimatedDuration: template.estimatedDuration,
    });
    setOpenEditDialog(true);
  };

  const handleDeleteClick = (template: TaskTemplate) => {
    setCurrentTemplate(template);
    setOpenDeleteDialog(true);
  };

  const getCategoryName = (id: number | null) => {
    if (!id) return "None";
    const category = categories.find((c: TemplateCategory) => c.id === id);
    return category ? category.name : "Unknown";
  };

  const isLoading = isLoadingTemplates || isLoadingCategories;

  if (isLoading) {
    return <div className="flex justify-center p-4">Loading templates...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center">
        <div className="flex items-center bg-background rounded-md border w-full sm:w-auto">
          <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          <Input
            placeholder="Search templates..."
            className="border-0 focus-visible:ring-0"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Dialog open={openCreateDialog} onOpenChange={setOpenCreateDialog}>
          <DialogTrigger asChild>
            <Button 
              onClick={() => { resetForm(); setOpenCreateDialog(true); }}
              className="flex items-center gap-2 w-full sm:w-auto"
            >
              <Plus className="h-4 w-4" />
              Add Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create New Task Template</DialogTitle>
              <DialogDescription>
                Define a new template for creating construction tasks
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="templateId">Template ID</Label>
                  <Input
                    id="templateId"
                    placeholder="e.g. FR1, EL5, etc."
                    value={formValues.templateId}
                    onChange={(e) => setFormValues({ ...formValues, templateId: e.target.value })}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="title">Template Title</Label>
                  <Input
                    id="title"
                    placeholder="Enter task template title"
                    value={formValues.title}
                    onChange={(e) => setFormValues({ ...formValues, title: e.target.value })}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Enter task description"
                    value={formValues.description}
                    onChange={(e) => setFormValues({ ...formValues, description: e.target.value })}
                    rows={3}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="tier1CategoryId">Tier 1 Category</Label>
                  <Select
                    value={formValues.tier1CategoryId?.toString() || ""}
                    onValueChange={(value) => {
                      const id = value ? parseInt(value) : null;
                      setFormValues({ 
                        ...formValues, 
                        tier1CategoryId: id,
                        // Reset tier2CategoryId when tier1 changes
                        tier2CategoryId: null
                      });
                    }}
                  >
                    <SelectTrigger id="tier1CategoryId">
                      <SelectValue placeholder="Select main category" />
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
                <div className="grid gap-2">
                  <Label htmlFor="tier2CategoryId">Tier 2 Category</Label>
                  <Select
                    value={formValues.tier2CategoryId?.toString() || ""}
                    onValueChange={(value) => {
                      setFormValues({ 
                        ...formValues, 
                        tier2CategoryId: value ? parseInt(value) : null 
                      });
                    }}
                    disabled={!formValues.tier1CategoryId}
                  >
                    <SelectTrigger id="tier2CategoryId">
                      <SelectValue placeholder={
                        formValues.tier1CategoryId 
                          ? "Select sub-category" 
                          : "Select Tier 1 category first"
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredTier2Categories.length === 0 ? (
                        <SelectItem value="" disabled>
                          No sub-categories available
                        </SelectItem>
                      ) : (
                        filteredTier2Categories.map((cat: TemplateCategory) => (
                          <SelectItem key={cat.id} value={cat.id.toString()}>
                            {cat.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="estimatedDuration" className="flex items-center gap-2">
                    <Timer className="h-4 w-4" />
                    Estimated Duration (days)
                  </Label>
                  <Input
                    id="estimatedDuration"
                    type="number"
                    min="0.5"
                    step="0.5"
                    value={formValues.estimatedDuration}
                    onChange={(e) => setFormValues({ 
                      ...formValues, 
                      estimatedDuration: parseFloat(e.target.value) || 1 
                    })}
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Creating..." : "Create Template"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="pt-6">
          <ScrollArea className="h-[calc(100vh-300px)] pr-4">
            {filteredTemplates.length === 0 ? (
              <div className="text-center p-4 border rounded-md bg-muted/50">
                {searchQuery 
                  ? "No templates found matching your search" 
                  : "No templates found. Create your first template with the button above."}
              </div>
            ) : (
              <div className="space-y-8">
                {/* Group templates by tier1Category */}
                {tier1Categories.map((tier1Category: TemplateCategory) => {
                  // Get templates for this tier1 category
                  const categoryTemplates = filteredTemplates.filter(
                    (t: TaskTemplate) => t.tier1CategoryId === tier1Category.id
                  );
                  
                  if (categoryTemplates.length === 0) {
                    return null; // Skip categories with no templates
                  }
                  
                  // Get all tier2 categories under this tier1
                  const relatedTier2Categories = tier2Categories.filter(
                    (c: TemplateCategory) => c.parentId === tier1Category.id
                  );
                  
                  return (
                    <div key={tier1Category.id} className="space-y-2">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        {tier1Category.name}
                        <Badge variant="outline" className="ml-2">
                          {categoryTemplates.length} {categoryTemplates.length === 1 ? 'template' : 'templates'}
                        </Badge>
                      </h3>
                      
                      {/* Group by tier2Category */}
                      {relatedTier2Categories.map((tier2Category: TemplateCategory) => {
                        // Get templates for this tier2 category
                        const tier2Templates = categoryTemplates.filter(
                          (t: TaskTemplate) => t.tier2CategoryId === tier2Category.id
                        );
                        
                        if (tier2Templates.length === 0) {
                          return null; // Skip subcategories with no templates
                        }
                        
                        return (
                          <div key={tier2Category.id} className="border rounded-md overflow-hidden mb-4">
                            <div className="bg-muted/50 p-3 flex items-center justify-between">
                              <span className="font-medium">{tier2Category.name}</span>
                              <Badge variant="secondary">
                                {tier2Templates.length} {tier2Templates.length === 1 ? 'template' : 'templates'}
                              </Badge>
                            </div>
                            <div className="divide-y">
                              {tier2Templates.map((template: TaskTemplate) => (
                                <div 
                                  key={template.id} 
                                  className="p-3 flex items-center justify-between hover:bg-accent/50"
                                >
                                  <div className="flex items-center gap-3">
                                    <Badge variant="outline" className="font-mono">{template.templateId}</Badge>
                                    <div className="flex flex-col max-w-md">
                                      <span className="font-medium">{template.title}</span>
                                      {template.description && (
                                        <span className="text-sm text-muted-foreground truncate">
                                          {template.description.length > 60 
                                            ? `${template.description.substring(0, 60)}...` 
                                            : template.description}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-4">
                                    <div className="flex items-center text-muted-foreground">
                                      <Timer className="h-3 w-3 mr-1" />
                                      <span>{template.estimatedDuration} {template.estimatedDuration === 1 ? "day" : "days"}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleEditClick(template)}
                                      >
                                        <Pencil className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleDeleteClick(template)}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={openEditDialog} onOpenChange={setOpenEditDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Task Template</DialogTitle>
            <DialogDescription>
              Update task template details
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-templateId">Template ID</Label>
                <Input
                  id="edit-templateId"
                  placeholder="e.g. FR1, EL5, etc."
                  value={formValues.templateId}
                  onChange={(e) => setFormValues({ ...formValues, templateId: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-title">Template Title</Label>
                <Input
                  id="edit-title"
                  placeholder="Enter task template title"
                  value={formValues.title}
                  onChange={(e) => setFormValues({ ...formValues, title: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  placeholder="Enter task description"
                  value={formValues.description}
                  onChange={(e) => setFormValues({ ...formValues, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-tier1CategoryId">Tier 1 Category</Label>
                <Select
                  value={formValues.tier1CategoryId?.toString() || ""}
                  onValueChange={(value) => {
                    const id = value ? parseInt(value) : null;
                    setFormValues({ 
                      ...formValues, 
                      tier1CategoryId: id,
                      // Reset tier2CategoryId when tier1 changes
                      tier2CategoryId: null
                    });
                  }}
                >
                  <SelectTrigger id="edit-tier1CategoryId">
                    <SelectValue placeholder="Select main category" />
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
              <div className="grid gap-2">
                <Label htmlFor="edit-tier2CategoryId">Tier 2 Category</Label>
                <Select
                  value={formValues.tier2CategoryId?.toString() || ""}
                  onValueChange={(value) => {
                    setFormValues({ 
                      ...formValues, 
                      tier2CategoryId: value ? parseInt(value) : null 
                    });
                  }}
                  disabled={!formValues.tier1CategoryId}
                >
                  <SelectTrigger id="edit-tier2CategoryId">
                    <SelectValue placeholder={
                      formValues.tier1CategoryId 
                        ? "Select sub-category" 
                        : "Select Tier 1 category first"
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredTier2Categories.length === 0 ? (
                      <SelectItem value="" disabled>
                        No sub-categories available
                      </SelectItem>
                    ) : (
                      filteredTier2Categories.map((cat: TemplateCategory) => (
                        <SelectItem key={cat.id} value={cat.id.toString()}>
                          {cat.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-estimatedDuration" className="flex items-center gap-2">
                  <Timer className="h-4 w-4" />
                  Estimated Duration (days)
                </Label>
                <Input
                  id="edit-estimatedDuration"
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={formValues.estimatedDuration}
                  onChange={(e) => setFormValues({ 
                    ...formValues, 
                    estimatedDuration: parseFloat(e.target.value) || 1 
                  })}
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "Updating..." : "Update Template"}
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
              This will permanently delete the template <strong>{currentTemplate?.templateId}</strong>: {currentTemplate?.title}. 
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