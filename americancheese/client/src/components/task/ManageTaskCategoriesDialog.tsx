import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Star, Plus, X, ChevronRight } from "lucide-react";
import { TaskCategory, ProjectCategory } from "@/types";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { CategoryBadge } from "@/components/ui/category-badge";

interface ManageTaskCategoriesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskId: number;
  projectId: number;
  onCategoriesChanged?: () => void;
}

export function ManageTaskCategoriesDialog({
  open,
  onOpenChange,
  taskId,
  projectId,
  onCategoriesChanged,
}: ManageTaskCategoriesDialogProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch current task categories
  const { data: taskCategories = [], refetch: refetchTaskCategories } = useQuery<TaskCategory[]>({
    queryKey: [`/api/tasks/${taskId}/categories`],
    enabled: open && taskId > 0,
  });

  // Fetch project categories (the available tier1/tier2 pairs)
  const { data: projectCategories = [] } = useQuery<ProjectCategory[]>({
    queryKey: [`/api/projects/${projectId}/categories`],
    enabled: open && projectId > 0,
  });

  // Build tier1 -> tier2[] hierarchy
  const categoryHierarchy = useMemo(() => {
    const tier1s = projectCategories.filter((c) => c.type === "tier1");
    const tier2s = projectCategories.filter((c) => c.type === "tier2");

    return tier1s.map((t1) => ({
      tier1: t1,
      tier2s: tier2s.filter((t2) => t2.parentId === t1.id),
    }));
  }, [projectCategories]);

  // Check if a category pair is already assigned
  const isAssigned = (tier1Name: string, tier2Name: string) => {
    return taskCategories.some(
      (tc) => tc.tier1Category === tier1Name && tc.tier2Category === tier2Name
    );
  };

  const getAssignedCategory = (tier1Name: string, tier2Name: string) => {
    return taskCategories.find(
      (tc) => tc.tier1Category === tier1Name && tc.tier2Category === tier2Name
    );
  };

  const handleAddCategory = async (tier1Name: string, tier2Name: string) => {
    try {
      await apiRequest(`/api/tasks/${taskId}/categories`, "POST", {
        tier1Category: tier1Name,
        tier2Category: tier2Name,
        isPrimary: taskCategories.length === 0, // First one becomes primary
      });

      refetchTaskCategories();
      queryClient.invalidateQueries({ queryKey: [`/api/tasks/${taskId}`] });
      onCategoriesChanged?.();

      toast({ title: "Category Added", description: `${tier1Name} > ${tier2Name}` });
    } catch (error) {
      toast({ title: "Error", description: "Failed to add category", variant: "destructive" });
    }
  };

  const handleRemoveCategory = async (taskCategoryId: number) => {
    try {
      await apiRequest(`/api/task-categories/${taskCategoryId}`, "DELETE");

      refetchTaskCategories();
      queryClient.invalidateQueries({ queryKey: [`/api/tasks/${taskId}`] });
      onCategoriesChanged?.();

      toast({ title: "Category Removed" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to remove category", variant: "destructive" });
    }
  };

  const handleSetPrimary = async (taskCategoryId: number) => {
    try {
      await apiRequest(`/api/task-categories/${taskCategoryId}`, "PUT", {
        isPrimary: true,
      });

      refetchTaskCategories();
      queryClient.invalidateQueries({ queryKey: [`/api/tasks/${taskId}`] });
      onCategoriesChanged?.();

      toast({ title: "Primary Category Updated" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to update primary", variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Manage Task Categories</DialogTitle>
          <DialogDescription>
            Assign this task to multiple categories. The primary category is used for default filtering and display.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current assignments */}
          {taskCategories.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">Assigned Categories</h4>
              <div className="space-y-1">
                {taskCategories.map((tc) => (
                  <div
                    key={tc.id}
                    className={`flex items-center justify-between p-2 rounded-md border ${
                      tc.isPrimary ? "bg-amber-50 border-amber-200" : "bg-muted/30"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => !tc.isPrimary && handleSetPrimary(tc.id)}
                        className={`p-0.5 rounded ${
                          tc.isPrimary
                            ? "text-amber-500"
                            : "text-muted-foreground hover:text-amber-500"
                        }`}
                        title={tc.isPrimary ? "Primary category" : "Set as primary"}
                      >
                        <Star className={`h-3.5 w-3.5 ${tc.isPrimary ? "fill-current" : ""}`} />
                      </button>
                      <span className="text-sm">
                        {tc.tier1Category}
                        {tc.tier2Category && (
                          <>
                            <ChevronRight className="inline h-3 w-3 mx-0.5 text-muted-foreground" />
                            {tc.tier2Category}
                          </>
                        )}
                      </span>
                      {tc.isPrimary && (
                        <Badge variant="outline" className="text-[10px] px-1 py-0 text-amber-600 border-amber-300">
                          Primary
                        </Badge>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                      onClick={() => handleRemoveCategory(tc.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Available categories to add */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Available Categories</h4>
            <ScrollArea className="h-[250px] border rounded-md">
              <div className="p-2 space-y-3">
                {categoryHierarchy.map(({ tier1, tier2s }) => (
                  <div key={tier1.id}>
                    <div className="text-xs font-medium text-muted-foreground uppercase px-2 py-1">
                      {tier1.name}
                    </div>
                    <div className="space-y-0.5">
                      {tier2s.map((tier2) => {
                        const assigned = isAssigned(tier1.name, tier2.name);
                        return (
                          <div
                            key={tier2.id}
                            className={`flex items-center justify-between p-2 rounded-md ${
                              assigned
                                ? "bg-muted/50 text-muted-foreground"
                                : "hover:bg-muted/50 cursor-pointer"
                            }`}
                            onClick={() => !assigned && handleAddCategory(tier1.name, tier2.name)}
                          >
                            <div className="flex items-center gap-2 text-sm">
                              <ChevronRight className="h-3 w-3 text-muted-foreground" />
                              {tier2.name}
                            </div>
                            {assigned ? (
                              <Badge variant="secondary" className="text-[10px]">
                                Assigned
                              </Badge>
                            ) : (
                              <Plus className="h-3.5 w-3.5 text-muted-foreground" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
                {categoryHierarchy.length === 0 && (
                  <div className="p-4 text-center text-muted-foreground text-sm">
                    No project categories found. Add categories to the project first.
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
