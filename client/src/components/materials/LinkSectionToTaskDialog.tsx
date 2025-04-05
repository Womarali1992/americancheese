import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Task, Material } from "@/types";
import { Link } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface LinkSectionToTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: number;
  tier1: string;
  tier2: string;
  section: string;
  materials: Material[];
}

export function LinkSectionToTaskDialog({
  open,
  onOpenChange,
  projectId,
  tier1,
  tier2,
  section,
  materials,
}: LinkSectionToTaskDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get all tasks for this project
  const { data: tasks = [], isLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
    select: (allTasks) => allTasks.filter(task => task.projectId === projectId),
    enabled: !!projectId,
  });

  // Get tasks that match the section's category (tier1/tier2)
  const relevantTasks = tasks.filter(task => {
    const matchesTier1 = !tier1 || task.tier1Category?.toLowerCase() === tier1.toLowerCase();
    const matchesTier2 = !tier2 || task.tier2Category?.toLowerCase() === tier2.toLowerCase();
    return matchesTier1 && matchesTier2;
  });

  // Reset task selection when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedTaskId(null);
    }
  }, [open]);

  // Update materials to link them to the selected task
  const updateMaterialsMutation = useMutation({
    mutationFn: async (materialIds: number[]) => {
      if (!selectedTaskId) throw new Error("No task selected");
      
      // For each material, we need to update its taskIds array
      const updatePromises = materialIds.map(async (materialId) => {
        // First get the current material to get its existing taskIds
        const materialResponse = await fetch(`/api/materials/${materialId}`);
        if (!materialResponse.ok) {
          throw new Error(`Failed to fetch material ${materialId}`);
        }
        const material = await materialResponse.json();
        
        // Add the selected task ID to the material's taskIds array (if not already there)
        const existingTaskIds = Array.isArray(material.taskIds) 
          ? material.taskIds.map((id: string | number) => typeof id === 'string' ? parseInt(id) : id)
          : [];
          
        // Only add the task ID if it's not already in the array
        if (!existingTaskIds.includes(selectedTaskId)) {
          const updatedTaskIds = [...existingTaskIds, selectedTaskId];
          
          // Update the material with the new taskIds array
          return apiRequest(`/api/materials/${materialId}`, "PUT", {
            ...material,
            taskIds: updatedTaskIds
          });
        }
        
        // If task is already linked, no need to update
        return Promise.resolve();
      });
      
      return Promise.all(updatePromises);
    },
    onSuccess: () => {
      // Invalidate materials queries to refresh the lists
      queryClient.invalidateQueries({ queryKey: ["/api/materials"] });
      if (projectId) {
        queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "materials"] });
      }
      
      // Invalidate tasks queries to refresh task-material associations
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      
      toast({
        title: "Materials linked successfully",
        description: `Linked ${materials.length} materials to the selected task.`,
      });
      
      onOpenChange(false);
    },
    onError: (error) => {
      console.error("Failed to link materials to task:", error);
      toast({
        title: "Error",
        description: "Failed to link materials to the task. Please try again.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsSubmitting(false);
    }
  });

  const handleSubmit = async () => {
    if (!selectedTaskId) {
      toast({
        title: "No task selected",
        description: "Please select a task to link materials to.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    updateMaterialsMutation.mutate(materials.map(m => m.id));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link className="h-5 w-5" /> Link Materials to Task
          </DialogTitle>
          <DialogDescription>
            Link all {materials.length} materials from the "{section}" section to a task.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label>Materials Section</Label>
              <div className="text-sm bg-slate-50 p-3 rounded-md">
                <div className="font-medium">{section}</div>
                <div className="text-xs text-slate-500 mt-1">
                  {tier1.charAt(0).toUpperCase() + tier1.slice(1)} &rarr; {tier2.charAt(0).toUpperCase() + tier2.slice(1)}
                </div>
                <div className="text-xs mt-2 bg-orange-100 text-orange-800 px-2 py-1 rounded-full inline-block">
                  {materials.length} materials
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="task-select">Select Task</Label>
              <Select
                value={selectedTaskId?.toString() || ""}
                onValueChange={(value) => setSelectedTaskId(parseInt(value))}
              >
                <SelectTrigger id="task-select" className="w-full">
                  <SelectValue placeholder="Select a task" />
                </SelectTrigger>
                <SelectContent>
                  {isLoading ? (
                    <SelectItem value="loading" disabled>
                      Loading tasks...
                    </SelectItem>
                  ) : relevantTasks.length > 0 ? (
                    <>
                      <div className="px-2 py-1.5 text-xs font-medium text-slate-500 border-b">
                        Matching Tasks ({relevantTasks.length})
                      </div>
                      {relevantTasks.map((task) => (
                        <SelectItem key={task.id} value={task.id.toString()}>
                          {task.title}
                        </SelectItem>
                      ))}
                      
                      {tasks.length > relevantTasks.length && (
                        <>
                          <div className="px-2 py-1.5 text-xs font-medium text-slate-500 border-b border-t">
                            Other Tasks
                          </div>
                          {tasks
                            .filter(task => !relevantTasks.includes(task))
                            .map((task) => (
                              <SelectItem key={task.id} value={task.id.toString()}>
                                {task.title}
                              </SelectItem>
                            ))
                          }
                        </>
                      )}
                    </>
                  ) : (
                    <SelectItem value="none" disabled>
                      No tasks found for this project
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!selectedTaskId || isSubmitting}
            className="bg-orange-500 hover:bg-orange-600"
          >
            {isSubmitting ? "Linking..." : "Link Materials"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}