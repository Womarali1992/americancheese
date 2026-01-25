import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, addDays } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import type { Project, Task } from "@shared/schema";

interface QuickAddSubtaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultDate?: Date;
  defaultProjectId?: number;
  defaultTaskId?: number;
}

interface SubtaskFormData {
  title: string;
  description: string;
  projectId: string;
  parentTaskId: string;
  startDate: Date;
  endDate: Date;
}

export function QuickAddSubtaskDialog({
  open,
  onOpenChange,
  defaultDate = new Date(),
  defaultProjectId,
  defaultTaskId,
}: QuickAddSubtaskDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [startDate, setStartDate] = useState<Date>(defaultDate);
  const [endDate, setEndDate] = useState<Date>(addDays(defaultDate, 1));

  const { register, handleSubmit, reset, setValue, watch } = useForm<SubtaskFormData>({
    defaultValues: {
      title: "",
      description: "",
      projectId: defaultProjectId?.toString() || "",
      parentTaskId: defaultTaskId?.toString() || "",
      startDate: defaultDate,
      endDate: addDays(defaultDate, 1),
    },
  });

  const selectedProjectId = watch("projectId");
  const selectedTaskId = watch("parentTaskId");

  // Fetch projects
  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  // Fetch all tasks
  const { data: allTasks = [] } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  // Filter tasks by selected project
  const filteredTasks = useMemo(() => {
    if (!selectedProjectId) return allTasks;
    return allTasks.filter(task => task.projectId === parseInt(selectedProjectId));
  }, [allTasks, selectedProjectId]);

  // Reset task selection when project changes
  useEffect(() => {
    if (selectedProjectId) {
      // Check if current task is still valid for this project
      const currentTask = allTasks.find(t => t.id.toString() === selectedTaskId);
      if (currentTask && currentTask.projectId !== parseInt(selectedProjectId)) {
        setValue("parentTaskId", "");
      }
    }
  }, [selectedProjectId, selectedTaskId, allTasks, setValue]);

  // Auto-select project when task is selected
  useEffect(() => {
    if (selectedTaskId) {
      const task = allTasks.find(t => t.id.toString() === selectedTaskId);
      if (task && task.projectId.toString() !== selectedProjectId) {
        setValue("projectId", task.projectId.toString());
      }
    }
  }, [selectedTaskId, allTasks, selectedProjectId, setValue]);

  // Create subtask mutation
  const createSubtask = useMutation({
    mutationFn: async (data: SubtaskFormData) => {
      const res = await fetch(`/api/tasks/${data.parentTaskId}/subtasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: data.title,
          description: data.description || null,
          startDate: format(startDate, "yyyy-MM-dd"),
          endDate: format(endDate, "yyyy-MM-dd"),
          status: "not_started",
          calendarActive: true, // Show on calendar since created from calendar
        }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to create subtask");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Subtask created",
        description: "The subtask has been added.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/subtasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      reset();
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: SubtaskFormData) => {
    if (!data.parentTaskId) {
      toast({
        title: "Error",
        description: "Please select a parent task",
        variant: "destructive",
      });
      return;
    }
    createSubtask.mutate(data);
  };

  const handleClose = () => {
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Quick Add Subtask</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Subtask Title *</Label>
            <Input
              id="title"
              placeholder="Enter subtask title"
              {...register("title", { required: true })}
            />
          </div>

          {/* Project Filter (optional) */}
          <div className="space-y-2">
            <Label>Filter by Project (optional)</Label>
            <Select
              value={selectedProjectId || "all"}
              onValueChange={(value) => setValue("projectId", value === "all" ? "" : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All projects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All projects</SelectItem>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id.toString()}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Parent Task */}
          <div className="space-y-2">
            <Label>Parent Task *</Label>
            <Select
              value={selectedTaskId || ""}
              onValueChange={(value) => setValue("parentTaskId", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a task" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {filteredTasks.length === 0 ? (
                  <div className="px-2 py-4 text-sm text-gray-500 text-center">
                    No tasks available
                  </div>
                ) : (
                  filteredTasks.map((task) => (
                    <SelectItem key={task.id} value={task.id.toString()}>
                      <div className="flex flex-col items-start">
                        <span>{task.title}</span>
                        {!selectedProjectId && (
                          <span className="text-xs text-gray-500">
                            {projects.find(p => p.id === task.projectId)?.name}
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "MMM d, yyyy") : "Pick date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(date) => date && setStartDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>End Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "MMM d, yyyy") : "Pick date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={(date) => date && setEndDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              placeholder="Add a description..."
              rows={2}
              {...register("description")}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={createSubtask.isPending}>
              {createSubtask.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Create Subtask
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
