import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Package, Building2, CheckCircle2 } from "lucide-react";
import { Task, Material } from "@/types";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface AddTaskReferenceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: number;
  currentTaskId: number;
  existingReferencedTaskIds: number[];
  onAddTasks: (taskIds: number[]) => void;
}

export function AddTaskReferenceDialog({
  open,
  onOpenChange,
  projectId,
  currentTaskId,
  existingReferencedTaskIds,
  onAddTasks,
}: AddTaskReferenceDialogProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTaskIds, setSelectedTaskIds] = useState<number[]>([]);

  // Fetch all tasks
  const { data: allTasks = [], isLoading: tasksLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  // Fetch materials to show count per task
  const { data: allMaterials = [] } = useQuery<Material[]>({
    queryKey: ["/api/materials"],
  });

  // Filter tasks: same project, exclude current task, exclude already referenced
  const availableTasks = useMemo(() => {
    return allTasks.filter((task) => {
      // Must be same project
      if (task.projectId !== projectId) return false;
      // Exclude current task
      if (task.id === currentTaskId) return false;
      // Exclude already referenced tasks
      if (existingReferencedTaskIds.includes(task.id)) return false;
      // Filter by search term
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        return (
          task.title.toLowerCase().includes(search) ||
          task.tier1Category?.toLowerCase().includes(search) ||
          task.tier2Category?.toLowerCase().includes(search)
        );
      }
      return true;
    });
  }, [allTasks, projectId, currentTaskId, existingReferencedTaskIds, searchTerm]);

  // Get material count for a task
  const getMaterialCount = (taskId: number) => {
    return allMaterials.filter((m) =>
      m.taskIds?.includes(taskId.toString())
    ).length;
  };

  // Toggle task selection
  const toggleTask = (taskId: number) => {
    setSelectedTaskIds((prev) =>
      prev.includes(taskId)
        ? prev.filter((id) => id !== taskId)
        : [...prev, taskId]
    );
  };

  // Handle add
  const handleAdd = () => {
    if (selectedTaskIds.length > 0) {
      onAddTasks(selectedTaskIds);
      setSelectedTaskIds([]);
      setSearchTerm("");
    }
  };

  // Reset state when dialog closes
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setSelectedTaskIds([]);
      setSearchTerm("");
    }
    onOpenChange(newOpen);
  };

  // Group tasks by tier1Category
  const tasksByTier1 = useMemo(() => {
    const grouped: Record<string, Task[]> = {};
    availableTasks.forEach((task) => {
      const tier1 = task.tier1Category || "Other";
      if (!grouped[tier1]) {
        grouped[tier1] = [];
      }
      grouped[tier1].push(task);
    });
    return grouped;
  }, [availableTasks]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Task Reference</DialogTitle>
          <DialogDescription>
            Select tasks to reference. Their materials will be shown in this task's materials section.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Task list */}
          <ScrollArea className="h-[300px] border rounded-md">
            {tasksLoading ? (
              <div className="p-4 text-center text-muted-foreground">
                Loading tasks...
              </div>
            ) : availableTasks.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                {searchTerm
                  ? "No tasks match your search"
                  : "No tasks available to reference"}
              </div>
            ) : (
              <div className="p-2 space-y-4">
                {Object.entries(tasksByTier1).map(([tier1, tasks]) => (
                  <div key={tier1}>
                    <div className="flex items-center gap-2 px-2 py-1 text-xs font-medium text-muted-foreground uppercase">
                      <Building2 className="h-3 w-3" />
                      {tier1}
                    </div>
                    <div className="space-y-1">
                      {tasks.map((task) => {
                        const materialCount = getMaterialCount(task.id);
                        const isSelected = selectedTaskIds.includes(task.id);
                        return (
                          <div
                            key={task.id}
                            className={`flex items-center gap-3 p-2 rounded-md cursor-pointer hover:bg-muted/50 ${
                              isSelected ? "bg-blue-50 border border-blue-200" : ""
                            }`}
                            onClick={() => toggleTask(task.id)}
                          >
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => toggleTask(task.id)}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm truncate">
                                {task.title}
                              </div>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                {task.tier2Category && (
                                  <span>{task.tier2Category}</span>
                                )}
                                {materialCount > 0 && (
                                  <span className="flex items-center gap-1 text-orange-600">
                                    <Package className="h-3 w-3" />
                                    {materialCount}
                                  </span>
                                )}
                              </div>
                            </div>
                            {isSelected && (
                              <CheckCircle2 className="h-4 w-4 text-blue-600" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Selection summary */}
          {selectedTaskIds.length > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <Badge variant="secondary">
                {selectedTaskIds.length} task{selectedTaskIds.length > 1 ? "s" : ""} selected
              </Badge>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleAdd}
            disabled={selectedTaskIds.length === 0}
          >
            Add Reference{selectedTaskIds.length > 1 ? "s" : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
