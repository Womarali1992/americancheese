import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { Project } from "@/types";
import { Save, X, Pencil, RotateCcw } from "lucide-react";
import { getCategoryNames } from "@/lib/category-names";

// Category option interface
interface CategoryOption {
  id: string;
  label: string;
  description: string;
}

// Default category options
const DEFAULT_CATEGORY_OPTIONS: CategoryOption[] = [
  // Tier 1 Categories
  { id: "structural", label: "Structural", description: "Foundation, framing, and structural elements" },
  { id: "systems", label: "Systems", description: "Plumbing, electrical, HVAC" },
  { id: "sheathing", label: "Sheathing", description: "Siding, insulation, drywall" },
  { id: "finishings", label: "Finishings", description: "Cabinetry, trim, flooring, painting" },
  
  // Tier 2 Categories - Structural
  { id: "foundation", label: "Foundation", description: "Foundation work and concrete" },
  { id: "framing", label: "Framing", description: "Structural framing and lumber" },
  { id: "roofing", label: "Roofing", description: "Roof installation and materials" },
  
  // Tier 2 Categories - Systems
  { id: "electrical", label: "Electrical", description: "Electrical wiring and fixtures" },
  { id: "plumbing", label: "Plumbing", description: "Plumbing and water systems" },
  { id: "hvac", label: "HVAC", description: "Heating, ventilation, and air conditioning" },
  
  // Tier 2 Categories - Sheathing
  { id: "barriers", label: "Barriers", description: "Weather barriers and house wrap" },
  { id: "drywall", label: "Drywall", description: "Drywall installation and finishing" },
  { id: "exteriors", label: "Exteriors", description: "Exterior siding and materials" },
  { id: "insulation", label: "Insulation", description: "Insulation materials and installation" },
  { id: "siding", label: "Siding", description: "Exterior siding installation" },
  
  // Tier 2 Categories - Finishings
  { id: "cabinetry", label: "Cabinetry", description: "Cabinet installation and trim" },
  { id: "flooring", label: "Flooring", description: "Floor installation and materials" },
  { id: "painting", label: "Painting", description: "Interior and exterior painting" },
  { id: "trim", label: "Trim", description: "Interior trim and molding" }
];

interface ManageCategoriesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: number;
  projectName: string;
}

export function ManageCategoriesDialog({ open, onOpenChange, projectId, projectName }: ManageCategoriesDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [hiddenCategories, setHiddenCategories] = useState<string[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<CategoryOption[]>(DEFAULT_CATEGORY_OPTIONS);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editingLabel, setEditingLabel] = useState("");
  const [editingDescription, setEditingDescription] = useState("");
  const [activeTab, setActiveTab] = useState("visibility");

  // Load settings when dialog opens
  useEffect(() => {
    if (open) {
      fetchProjectSettings();
      loadCustomCategoryNames();
    }
  }, [open, projectId]);

  // Load custom category names from localStorage
  const loadCustomCategoryNames = () => {
    try {
      // Get merged category names using the centralized function
      const mergedCategories = getCategoryNames(projectId);
      setCategoryOptions(mergedCategories);
    } catch (error) {
      console.error("Failed to load custom category names:", error);
      setCategoryOptions(DEFAULT_CATEGORY_OPTIONS);
    }
  };

  // Save custom category names to localStorage
  const saveCustomCategoryNames = () => {
    try {
      localStorage.setItem(`categoryNames_${projectId}`, JSON.stringify(categoryOptions));
      toast({
        title: "Success",
        description: "Category names saved successfully",
      });
    } catch (error) {
      console.error("Failed to save category names:", error);
      toast({
        title: "Error",
        description: "Failed to save category names",
        variant: "destructive",
      });
    }
  };

  // Start editing a category
  const startEditing = (categoryId: string) => {
    const category = categoryOptions.find(c => c.id === categoryId);
    if (category) {
      setEditingCategory(categoryId);
      setEditingLabel(category.label);
      setEditingDescription(category.description);
    }
  };

  // Save category edits
  const saveEditedCategory = () => {
    if (!editingCategory) return;

    setCategoryOptions(prev => 
      prev.map(cat => 
        cat.id === editingCategory 
          ? { ...cat, label: editingLabel, description: editingDescription }
          : cat
      )
    );

    setEditingCategory(null);
    setEditingLabel("");
    setEditingDescription("");

    toast({
      title: "Category Updated",
      description: "Category has been updated. Remember to save changes.",
    });
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingCategory(null);
    setEditingLabel("");
    setEditingDescription("");
  };

  // Reset to defaults
  const resetToDefaults = () => {
    setCategoryOptions(DEFAULT_CATEGORY_OPTIONS);
    try {
      localStorage.removeItem(`categoryNames_${projectId}`);
      toast({
        title: "Reset Complete",
        description: "Category names have been reset to defaults",
      });
    } catch (error) {
      console.error("Failed to reset category names:", error);
    }
  };

  // Fetch project's current category settings
  const fetchProjectSettings = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}`);
      if (response.ok) {
        const project: Project = await response.json();
        setHiddenCategories(project.hiddenCategories || []);
      } else {
        toast({
          title: "Error",
          description: "Failed to load project settings",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching project settings:", error);
      toast({
        title: "Error",
        description: "Failed to connect to server",
        variant: "destructive",
      });
    }
  };

  // Handle category visibility toggling
  const toggleCategory = (categoryId: string) => {
    setHiddenCategories(prev => {
      if (prev.includes(categoryId)) {
        return prev.filter(id => id !== categoryId);
      } else {
        return [...prev, categoryId];
      }
    });
  };

  // Save category preferences
  const saveSettings = async () => {
    setIsLoading(true);
    try {
      // Save custom category names to localStorage first
      try {
        localStorage.setItem(`categoryNames_${projectId}`, JSON.stringify(categoryOptions));
        console.log('Saved category names to localStorage:', categoryOptions);
      } catch (error) {
        console.error("Failed to save category names to localStorage:", error);
      }

      const response = await fetch(`/api/projects/${projectId}/categories`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ hiddenCategories }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Category settings updated successfully",
        });
        
        // Invalidate relevant queries to refresh data
        queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
        queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "tasks"] });
        queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
        
        // Trigger a page refresh to ensure category names update everywhere
        setTimeout(() => {
          window.location.reload();
        }, 500);
        
        onOpenChange(false);
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: errorData.message || "Failed to update category settings",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error saving category settings:", error);
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Manage Categories</DialogTitle>
          <DialogDescription>
            Customize how categories appear in project "{projectName}".
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="visibility" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="visibility">Visibility</TabsTrigger>
            <TabsTrigger value="names">Category Names</TabsTrigger>
          </TabsList>
          
          <TabsContent value="visibility" className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Hide or show task categories. Hidden categories will be removed from both task dashboard and project overview.
            </p>
            
            <div className="space-y-4 mt-4">
              {categoryOptions.map((category) => (
                <div key={category.id} className="flex items-start space-x-3 p-2 hover:bg-slate-50 rounded-md">
                  <Checkbox 
                    id={`category-${category.id}`}
                    checked={!hiddenCategories.includes(category.id)} 
                    onCheckedChange={() => toggleCategory(category.id)}
                  />
                  <div className="grid gap-1">
                    <Label 
                      htmlFor={`category-${category.id}`} 
                      className="font-medium cursor-pointer"
                    >
                      {category.label}
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {category.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="names" className="space-y-4 py-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Customize category names and descriptions for this project.
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={resetToDefaults}>
                  Reset to Defaults
                </Button>
                <Button size="sm" onClick={saveCustomCategoryNames}>
                  Save Names
                </Button>
              </div>
            </div>
            
            <div className="space-y-6 mt-4">
              {/* Tier 1 Categories */}
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Main Categories</h3>
                <div className="space-y-3">
                  {categoryOptions.filter(cat => ['structural', 'systems', 'sheathing', 'finishings'].includes(cat.id)).map((category) => (
                    <div key={category.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          {editingCategory === category.id ? (
                            <div className="space-y-3">
                              <div>
                                <Label htmlFor={`edit-label-${category.id}`} className="text-sm font-medium">
                                  Category Name
                                </Label>
                                <Input
                                  id={`edit-label-${category.id}`}
                                  value={editingLabel}
                                  onChange={(e) => setEditingLabel(e.target.value)}
                                  className="mt-1"
                                  placeholder="Enter category name"
                                />
                              </div>
                              <div>
                                <Label htmlFor={`edit-desc-${category.id}`} className="text-sm font-medium">
                                  Description
                                </Label>
                                <Input
                                  id={`edit-desc-${category.id}`}
                                  value={editingDescription}
                                  onChange={(e) => setEditingDescription(e.target.value)}
                                  className="mt-1"
                                  placeholder="Enter category description"
                                />
                              </div>
                              <div className="flex gap-2">
                                <Button size="sm" onClick={saveEditedCategory} className="gap-1">
                                  <Save className="h-3 w-3" />
                                  Save
                                </Button>
                                <Button size="sm" variant="outline" onClick={cancelEditing} className="gap-1">
                                  <X className="h-3 w-3" />
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-medium text-sm">{category.label}</h4>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => startEditing(category.id)}
                                  className="h-6 w-6 p-0"
                                >
                                  <Pencil className="h-3 w-3" />
                                </Button>
                              </div>
                              <p className="text-xs text-muted-foreground">{category.description}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Subcategories organized by parent category */}
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wider">Subcategories</h3>
                
                {/* Structural Subcategories */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-green-700 mb-2 flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-600"></div>
                    Structural Subcategories
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 ml-5">
                    {categoryOptions.filter(cat => ['foundation', 'framing', 'roofing'].includes(cat.id)).map((category) => (
                      <div key={category.id} className="border rounded-lg p-2 space-y-1">
                        {editingCategory === category.id ? (
                          <div className="space-y-2">
                            <Input
                              value={editingLabel}
                              onChange={(e) => setEditingLabel(e.target.value)}
                              className="text-xs"
                              placeholder="Category name"
                            />
                            <Input
                              value={editingDescription}
                              onChange={(e) => setEditingDescription(e.target.value)}
                              className="text-xs"
                              placeholder="Description"
                            />
                            <div className="flex gap-1">
                              <Button size="sm" onClick={saveEditedCategory}>
                                <Save className="h-3 w-3" />
                              </Button>
                              <Button size="sm" variant="outline" onClick={cancelEditing}>
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div className="flex items-center gap-1 mb-1">
                              <h5 className="font-medium text-xs">{category.label}</h5>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => startEditing(category.id)}
                                className="h-4 w-4 p-0"
                              >
                                <Pencil className="h-2 w-2" />
                              </Button>
                            </div>
                            <p className="text-xs text-muted-foreground">{category.description}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Systems Subcategories */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-blue-700 mb-2 flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-600"></div>
                    Systems Subcategories
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 ml-5">
                    {categoryOptions.filter(cat => ['electrical', 'plumbing', 'hvac'].includes(cat.id)).map((category) => (
                      <div key={category.id} className="border rounded-lg p-2 space-y-1">
                        {editingCategory === category.id ? (
                          <div className="space-y-2">
                            <Input
                              value={editingLabel}
                              onChange={(e) => setEditingLabel(e.target.value)}
                              className="text-xs"
                              placeholder="Category name"
                            />
                            <Input
                              value={editingDescription}
                              onChange={(e) => setEditingDescription(e.target.value)}
                              className="text-xs"
                              placeholder="Description"
                            />
                            <div className="flex gap-1">
                              <Button size="sm" onClick={saveEditedCategory}>
                                <Save className="h-3 w-3" />
                              </Button>
                              <Button size="sm" variant="outline" onClick={cancelEditing}>
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div className="flex items-center gap-1 mb-1">
                              <h5 className="font-medium text-xs">{category.label}</h5>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => startEditing(category.id)}
                                className="h-4 w-4 p-0"
                              >
                                <Pencil className="h-2 w-2" />
                              </Button>
                            </div>
                            <p className="text-xs text-muted-foreground">{category.description}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Sheathing Subcategories */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-red-700 mb-2 flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-600"></div>
                    Sheathing Subcategories
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 ml-5">
                    {categoryOptions.filter(cat => ['barriers', 'drywall', 'exteriors', 'insulation', 'siding'].includes(cat.id)).map((category) => (
                      <div key={category.id} className="border rounded-lg p-2 space-y-1">
                        {editingCategory === category.id ? (
                          <div className="space-y-2">
                            <Input
                              value={editingLabel}
                              onChange={(e) => setEditingLabel(e.target.value)}
                              className="text-xs"
                              placeholder="Category name"
                            />
                            <Input
                              value={editingDescription}
                              onChange={(e) => setEditingDescription(e.target.value)}
                              className="text-xs"
                              placeholder="Description"
                            />
                            <div className="flex gap-1">
                              <Button size="sm" onClick={saveEditedCategory}>
                                <Save className="h-3 w-3" />
                              </Button>
                              <Button size="sm" variant="outline" onClick={cancelEditing}>
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div className="flex items-center gap-1 mb-1">
                              <h5 className="font-medium text-xs">{category.label}</h5>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => startEditing(category.id)}
                                className="h-4 w-4 p-0"
                              >
                                <Pencil className="h-2 w-2" />
                              </Button>
                            </div>
                            <p className="text-xs text-muted-foreground">{category.description}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Finishings Subcategories */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-orange-700 mb-2 flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-orange-600"></div>
                    Finishings Subcategories
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 ml-5">
                    {categoryOptions.filter(cat => ['cabinetry', 'flooring', 'painting', 'trim'].includes(cat.id)).map((category) => (
                      <div key={category.id} className="border rounded-lg p-2 space-y-1">
                        {editingCategory === category.id ? (
                          <div className="space-y-2">
                            <Input
                              value={editingLabel}
                              onChange={(e) => setEditingLabel(e.target.value)}
                              className="text-xs"
                              placeholder="Category name"
                            />
                            <Input
                              value={editingDescription}
                              onChange={(e) => setEditingDescription(e.target.value)}
                              className="text-xs"
                              placeholder="Description"
                            />
                            <div className="flex gap-1">
                              <Button size="sm" onClick={saveEditedCategory}>
                                <Save className="h-3 w-3" />
                              </Button>
                              <Button size="sm" variant="outline" onClick={cancelEditing}>
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div className="flex items-center gap-1 mb-1">
                              <h5 className="font-medium text-xs">{category.label}</h5>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => startEditing(category.id)}
                                className="h-4 w-4 p-0"
                              >
                                <Pencil className="h-2 w-2" />
                              </Button>
                            </div>
                            <p className="text-xs text-muted-foreground">{category.description}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button 
            onClick={saveSettings}
            disabled={isLoading}
          >
            {isLoading ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}