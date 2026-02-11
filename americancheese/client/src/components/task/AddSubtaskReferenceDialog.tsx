import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, CheckCircle2, ListTodo } from "lucide-react";
import { Task } from "@/types";
import { Subtask } from "@shared/schema";

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

interface AddSubtaskReferenceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: number;
  currentTaskId: number;
  existingSubtaskIds: number[]; // IDs of subtasks already owned by this task
  existingReferencedSubtaskIds: number[]; // IDs of subtasks already referenced
  onAddSubtasks: (subtaskIds: number[]) => void;
}

export function AddSubtaskReferenceDialog({
  open,
  onOpenChange,
  projectId,
  currentTaskId,
  existingSubtaskIds,
  existingReferencedSubtaskIds,
  onAddSubtasks,
}: AddSubtaskReferenceDialogProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // Fetch all tasks for this project
  const { data: allTasks = [] } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  // Fetch all subtasks
  const { data: allSubtasks = [], isLoading } = useQuery<Subtask[]>({
    queryKey: ["/api/subtasks"],
  });

  // Build a map of task ID -> task for quick lookups
  const taskMap = useMemo(() => {
    const map: Record<number, Task> = {};
    allTasks.forEach((t) => { map[t.id] = t; });
    return map;
  }, [allTasks]);

  // Filter subtasks: from other tasks in the same project, not already owned or referenced
  const availableSubtasks = useMemo(() => {
    return allSubtasks.filter((subtask) => {
      // Must belong to a task in the same project
      const parentTask = taskMap[subtask.parentTaskId];
      if (!parentTask || parentTask.projectId !== projectId) return false;
      // Exclude subtasks owned by current task
      if (subtask.parentTaskId === currentTaskId) return false;
      // Exclude already referenced subtasks
      if (existingReferencedSubtaskIds.includes(subtask.id)) return false;
      // Filter by search term
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        return (
          subtask.title.toLowerCase().includes(search) ||
          parentTask.title.toLowerCase().includes(search) ||
          subtask.assignedTo?.toLowerCase().includes(search)
        );
      }
      return true;
    });
  }, [allSubtasks, taskMap, projectId, currentTaskId, existingReferencedSubtaskIds, searchTerm]);

  // Group subtasks by parent task
  const subtasksByParentTask = useMemo(() => {
    const grouped: Record<string, { task: Task; subtasks: Subtask[] }> = {};
    availableSubtasks.forEach((subtask) => {
      const parentTask = taskMap[subtask.parentTaskId];
      if (!parentTask) return;
      const key = parentTask.id.toString();
      if (!grouped[key]) {
        grouped[key] = { task: parentTask, subtasks: [] };
      }
      grouped[key].subtasks.push(subtask);
    });
    return grouped;
  }, [availableSubtasks, taskMap]);

  const toggleSubtask = (subtaskId: number) => {
    setSelectedIds((prev) =>
      prev.includes(subtaskId)
        ? prev.filter((id) => id !== subtaskId)
        : [...prev, subtaskId]
    );
  };

  const handleAdd = () => {
    if (selectedIds.length > 0) {
      onAddSubtasks(selectedIds);
      setSelectedIds([]);
      setSearchTerm("");
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setSelectedIds([]);
      setSearchTerm("");
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Link Subtask from Another Task</DialogTitle>
          <DialogDescription>
            Select subtasks to link. They will appear in this task's subtask list and stay in sync with the original.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search subtasks or tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          <ScrollArea className="h-[300px] border rounded-md">
            {isLoading ? (
              <div className="p-4 text-center text-muted-foreground">
                Loading subtasks...
              </div>
            ) : Object.keys(subtasksByParentTask).length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                {searchTerm
                  ? "No subtasks match your search"
                  : "No subtasks available to link"}
              </div>
            ) : (
              <div className="p-2 space-y-4">
                {Object.entries(subtasksByParentTask).map(([key, { task, subtasks }]) => (
                  <div key={key}>
                    <div className="flex items-center gap-2 px-2 py-1 text-xs font-medium text-muted-foreground uppercase">
                      <ListTodo className="h-3 w-3" />
                      {task.title}
                      {task.tier2Category && (
                        <span className="text-[10px] normal-case opacity-60">
                          ({task.tier1Category} &gt; {task.tier2Category})
                        </span>
                      )}
                    </div>
                    <div className="space-y-1">
                      {subtasks.map((subtask) => {
                        const isSelected = selectedIds.includes(subtask.id);
                        return (
                          <div
                            key={subtask.id}
                            className={`flex items-center gap-3 p-2 rounded-md cursor-pointer hover:bg-muted/50 ${
                              isSelected ? "bg-blue-50 border border-blue-200" : ""
                            }`}
                            onClick={() => toggleSubtask(subtask.id)}
                          >
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => toggleSubtask(subtask.id)}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm truncate">
                                {subtask.title}
                              </div>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                {subtask.assignedTo && (
                                  <span>{subtask.assignedTo}</span>
                                )}
                                <span className={
                                  subtask.completed
                                    ? "text-green-600"
                                    : subtask.status === "in_progress"
                                    ? "text-blue-600"
                                    : ""
                                }>
                                  {subtask.completed ? "Completed" : subtask.status?.replace("_", " ")}
                                </span>
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

          {selectedIds.length > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <Badge variant="secondary">
                {selectedIds.length} subtask{selectedIds.length > 1 ? "s" : ""} selected
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
            disabled={selectedIds.length === 0}
          >
            Link Subtask{selectedIds.length > 1 ? "s" : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
