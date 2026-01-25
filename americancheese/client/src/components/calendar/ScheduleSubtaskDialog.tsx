import { useState, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, addDays } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Loader2, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useTier1Categories, useTier2Categories } from "@/lib/unified-category-hooks";
import type { Project, Task, Subtask } from "@shared/schema";

interface ScheduleSubtaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultDate?: Date;
  defaultProjectId?: number;
}

export function ScheduleSubtaskDialog({
  open,
  onOpenChange,
  defaultDate = new Date(),
  defaultProjectId,
}: ScheduleSubtaskDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    defaultProjectId?.toString() || ""
  );
  const [selectedTier1, setSelectedTier1] = useState<string>("");
  const [selectedTier2, setSelectedTier2] = useState<string>("");
  const [selectedTaskId, setSelectedTaskId] = useState<string>("");
  const [selectedSubtaskId, setSelectedSubtaskId] = useState<string>("");
  const [startDate, setStartDate] = useState<Date>(defaultDate);
  const [endDate, setEndDate] = useState<Date>(addDays(defaultDate, 1));

  // Fetch projects
  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  // Fetch all tasks
  const { data: allTasks = [] } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  // Fetch all subtasks
  const { data: allSubtasks = [], isLoading: subtasksLoading } = useQuery<Subtask[]>({
    queryKey: ["/api/subtasks"],
  });

  // Fetch tier1 categories for selected project
  const { data: tier1Categories = [] } = useTier1Categories(
    selectedProjectId ? parseInt(selectedProjectId) : undefined
  );

  // Fetch tier2 categories based on selected tier1
  const { data: tier2Categories = [] } = useTier2Categories(
    selectedProjectId ? parseInt(selectedProjectId) : undefined,
    selectedTier1 || undefined
  );

  // Create a map of taskId -> projectId
  const taskProjectMap = useMemo(() => {
    const map = new Map<number, number>();
    allTasks.forEach((task) => {
      map.set(task.id, task.projectId);
    });
    return map;
  }, [allTasks]);

  // Filter tasks by project and categories
  const filteredTasks = useMemo(() => {
    let tasks = allTasks;

    if (selectedProjectId) {
      tasks = tasks.filter(task => task.projectId === parseInt(selectedProjectId));
    }
    if (selectedTier1) {
      tasks = tasks.filter(task => task.tier1Category === selectedTier1);
    }
    if (selectedTier2) {
      tasks = tasks.filter(task => task.tier2Category === selectedTier2);
    }

    return tasks;
  }, [allTasks, selectedProjectId, selectedTier1, selectedTier2]);

  // Filter subtasks by selected task (and project/categories if no task selected)
  const filteredSubtasks = useMemo(() => {
    if (selectedTaskId) {
      return allSubtasks.filter(s => s.parentTaskId === parseInt(selectedTaskId));
    }

    // Get task IDs that match our filters
    const matchingTaskIds = new Set(filteredTasks.map(t => t.id));
    return allSubtasks.filter(s => matchingTaskIds.has(s.parentTaskId));
  }, [allSubtasks, selectedTaskId, filteredTasks]);

  // Get selected subtask details
  const selectedSubtask = useMemo(() => {
    if (!selectedSubtaskId) return null;
    return allSubtasks.find(s => s.id === parseInt(selectedSubtaskId));
  }, [allSubtasks, selectedSubtaskId]);

  // Update subtask mutation
  const updateSubtask = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/subtasks/${selectedSubtaskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startDate: format(startDate, "yyyy-MM-dd"),
          endDate: format(endDate, "yyyy-MM-dd"),
          calendarActive: true,
        }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to schedule subtask");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Subtask scheduled",
        description: "The subtask has been added to the calendar.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/subtasks"] });
      handleClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSchedule = () => {
    if (!selectedSubtaskId) {
      toast({
        title: "Error",
        description: "Please select a subtask to schedule",
        variant: "destructive",
      });
      return;
    }
    updateSubtask.mutate();
  };

  const handleClose = () => {
    setSelectedProjectId(defaultProjectId?.toString() || "");
    setSelectedTier1("");
    setSelectedTier2("");
    setSelectedTaskId("");
    setSelectedSubtaskId("");
    setStartDate(defaultDate);
    setEndDate(addDays(defaultDate, 1));
    onOpenChange(false);
  };

  // When subtask is selected, pre-fill dates if available
  const handleSubtaskSelect = (subtaskId: string) => {
    setSelectedSubtaskId(subtaskId);
    const subtask = allSubtasks.find(s => s.id === parseInt(subtaskId));
    if (subtask) {
      if (subtask.startDate) {
        setStartDate(new Date(subtask.startDate));
      }
      if (subtask.endDate) {
        setEndDate(new Date(subtask.endDate));
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Schedule Existing Subtask</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Project Filter */}
          <div className="space-y-2">
            <Label>Project *</Label>
            <Select
              value={selectedProjectId || ""}
              onValueChange={(value) => {
                setSelectedProjectId(value);
                setSelectedTier1("");
                setSelectedTier2("");
                setSelectedTaskId("");
                setSelectedSubtaskId("");
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id.toString()}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Category Filters - only show when project is selected */}
          {selectedProjectId && (
            <div className="grid grid-cols-2 gap-4">
              {/* Tier 1 Category */}
              <div className="space-y-2">
                <Label>Category (optional)</Label>
                <Select
                  value={selectedTier1 || "all"}
                  onValueChange={(value) => {
                    setSelectedTier1(value === "all" ? "" : value);
                    setSelectedTier2("");
                    setSelectedTaskId("");
                    setSelectedSubtaskId("");
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All categories</SelectItem>
                    {tier1Categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.name}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Tier 2 Category */}
              <div className="space-y-2">
                <Label>Subcategory (optional)</Label>
                <Select
                  value={selectedTier2 || "all"}
                  onValueChange={(value) => {
                    setSelectedTier2(value === "all" ? "" : value);
                    setSelectedTaskId("");
                    setSelectedSubtaskId("");
                  }}
                  disabled={!selectedTier1}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={selectedTier1 ? "All subcategories" : "Select category first"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All subcategories</SelectItem>
                    {tier2Categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.name}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Task Filter (optional) */}
          {selectedProjectId && (
            <div className="space-y-2">
              <Label>Filter by Task (optional)</Label>
              <Select
                value={selectedTaskId || "all"}
                onValueChange={(value) => {
                  setSelectedTaskId(value === "all" ? "" : value);
                  setSelectedSubtaskId("");
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All tasks" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  <SelectItem value="all">All tasks ({filteredTasks.length})</SelectItem>
                  {filteredTasks.map((task) => (
                    <SelectItem key={task.id} value={task.id.toString()}>
                      <div className="flex flex-col items-start">
                        <span>{task.title}</span>
                        <span className="text-xs text-gray-500">
                          {task.tier1Category} → {task.tier2Category}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Subtask Selection */}
          {selectedProjectId && (
            <div className="space-y-2">
              <Label>Subtask to Schedule *</Label>
              <Select
                value={selectedSubtaskId}
                onValueChange={handleSubtaskSelect}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a subtask" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {filteredSubtasks.length === 0 ? (
                    <div className="px-2 py-4 text-sm text-gray-500 text-center">
                      No subtasks available
                    </div>
                  ) : (
                    filteredSubtasks.map((subtask) => {
                      const parentTask = allTasks.find(t => t.id === subtask.parentTaskId);
                      const isScheduled = subtask.calendarActive && subtask.startDate;
                      return (
                        <SelectItem key={subtask.id} value={subtask.id.toString()}>
                          <div className="flex items-center gap-2">
                            {isScheduled && (
                              <Check className="h-3 w-3 text-green-500 shrink-0" />
                            )}
                            <div className="flex flex-col items-start">
                              <span className={cn(
                                subtask.completed && "line-through text-gray-400"
                              )}>
                                {subtask.title}
                              </span>
                              <span className="text-xs text-gray-500">
                                {parentTask?.title}
                              </span>
                            </div>
                          </div>
                        </SelectItem>
                      );
                    })
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Selected subtask info */}
          {selectedSubtask && (
            <div className="p-3 bg-gray-50 rounded-md text-sm">
              <p className="font-medium">{selectedSubtask.title}</p>
              {selectedSubtask.description && (
                <p className="text-gray-500 text-xs mt-1">{selectedSubtask.description}</p>
              )}
              {selectedSubtask.calendarActive && selectedSubtask.startDate && (
                <p className="text-green-600 text-xs mt-1">
                  Already scheduled: {selectedSubtask.startDate} - {selectedSubtask.endDate}
                </p>
              )}
            </div>
          )}

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

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              onClick={handleSchedule}
              disabled={!selectedSubtaskId || updateSubtask.isPending}
            >
              {updateSubtask.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Schedule Subtask
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
