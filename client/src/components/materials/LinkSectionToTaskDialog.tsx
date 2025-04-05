import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { LinkIcon, Calendar, User, ClipboardList } from "lucide-react";
import { Task } from "@/../../shared/schema";

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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { getStatusBgColor } from "@/lib/color-utils";
import { formatDate } from "@/lib/utils";

interface LinkSectionToTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId?: number;
  materialIds: number[];
  onLinkToTask: (taskId: number) => void;
  sectionName?: string;
  // New fields for the enhanced interface
  tier1?: string;
  tier2?: string;
  section?: string;
  materialCount?: number;
  onComplete?: (taskId: number) => Promise<void>;
}

export function LinkSectionToTaskDialog({
  open,
  onOpenChange,
  projectId,
  materialIds,
  onLinkToTask,
  sectionName = "Section",
  tier1,
  tier2,
  section,
  materialCount,
  onComplete,
}: LinkSectionToTaskDialogProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);

  // Reset selection when dialog closes
  useEffect(() => {
    if (!open) {
      setSearchTerm("");
      setSelectedTaskId(null);
    }
  }, [open]);

  // Query for tasks by project
  const { data: tasks = [], isLoading } = useQuery<Task[]>({
    queryKey: projectId ? [`/api/projects/${projectId}/tasks`] : ["/api/tasks"],
    queryFn: async () => {
      const url = projectId ? `/api/projects/${projectId}/tasks` : "/api/tasks";
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch tasks");
      }
      return await response.json();
    },
    enabled: !!open,
  });

  // Filter tasks by search term
  const filteredTasks = tasks.filter((task) => {
    if (!searchTerm) return true;
    
    const term = searchTerm.toLowerCase();
    return (
      task.title.toLowerCase().includes(term) ||
      (task.description && task.description.toLowerCase().includes(term)) ||
      (task.assignedTo && task.assignedTo.toLowerCase().includes(term)) ||
      task.category.toLowerCase().includes(term) ||
      task.status.toLowerCase().includes(term)
    );
  });

  // Handle task selection
  const handleSelectTask = (taskId: number) => {
    setSelectedTaskId(taskId === selectedTaskId ? null : taskId);
  };

  // Handle link confirmation
  const handleConfirm = async () => {
    if (selectedTaskId) {
      // Use onComplete if provided, otherwise fall back to onLinkToTask
      if (onComplete) {
        await onComplete(selectedTaskId);
      } else {
        onLinkToTask(selectedTaskId);
      }
      onOpenChange(false);
    }
  };

  // Function to format status for display
  const formatStatus = (status: string) => {
    return status
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LinkIcon className="h-5 w-5" /> Link {section || sectionName} Materials to Task
          </DialogTitle>
          <DialogDescription>
            {tier1 && tier2 ? (
              <>Select a task to link {materialCount || materialIds.length} materials from {tier1} &gt; {tier2} &gt; {section || sectionName}.</>
            ) : (
              <>Select a task to link {materialIds.length} materials from this section.</>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="relative mb-4">
          <Input
            placeholder="Search tasks by title, description, or status..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-8"
          />
        </div>

        <div className="border rounded-md flex-1 overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-slate-500">Loading tasks...</div>
          ) : filteredTasks.length > 0 ? (
            <ScrollArea className="h-[400px] w-full">
              <div className="p-3 space-y-3">
                {filteredTasks.map((task) => (
                  <Card
                    key={task.id}
                    className={`
                      transition-all cursor-pointer border hover:shadow-md
                      ${selectedTaskId === task.id ? "border-orange-500 ring-2 ring-orange-200" : ""}
                    `}
                    onClick={() => handleSelectTask(task.id)}
                  >
                    <CardHeader className="p-3 pb-0">
                      <div className="flex justify-between items-start gap-2">
                        <h3 className="font-medium text-base">{task.title}</h3>
                        <div
                          className={`px-2 py-1 rounded-full text-xs ${getStatusBgColor(
                            task.status
                          )}`}
                        >
                          {formatStatus(task.status)}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-3 pt-2 text-sm">
                      {task.description && (
                        <p className="text-slate-500 line-clamp-2 mb-3">
                          {task.description}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                        {task.assignedTo && (
                          <div className="flex items-center gap-1">
                            <User className="h-3.5 w-3.5" />
                            {task.assignedTo}
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {formatDate(new Date(task.endDate))}
                        </div>
                        <div className="flex items-center gap-1">
                          <ClipboardList className="h-3.5 w-3.5" />
                          {task.category
                            .split("_")
                            .map(
                              (word) =>
                                word.charAt(0).toUpperCase() + word.slice(1)
                            )
                            .join(" ")}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="p-8 text-center text-slate-500">
              {searchTerm
                ? "No tasks found matching your search"
                : "No tasks available for this project"}
            </div>
          )}
        </div>

        <DialogFooter className="mt-4">
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              className="bg-orange-500 hover:bg-orange-600"
              onClick={handleConfirm}
              disabled={!selectedTaskId}
            >
              Link to Task
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}