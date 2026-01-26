import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useColors } from "@/lib/colors";
import { ExternalLink, ChevronRight, Loader2, Plus, Check, Calendar } from "lucide-react";
import type { Task, Subtask } from "@shared/schema";

interface TaskPopoverProps {
  task: Task;
  compact?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export function TaskPopover({
  task,
  compact = false,
  className,
  children
}: TaskPopoverProps) {
  const [, navigate] = useLocation();
  const [open, setOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [showAddSubtask, setShowAddSubtask] = useState(false);
  const queryClient = useQueryClient();

  // Use the colors hook with project context for proper theme resolution
  const { getTier1Color, getTier2Color } = useColors(task.projectId);

  // Fetch subtasks for this task - always fetch when popover is open
  const { data: subtasks = [], isLoading: subtasksLoading } = useQuery<Subtask[]>({
    queryKey: ["/api/tasks", task.id, "subtasks"],
    queryFn: async () => {
      const res = await fetch(`/api/tasks/${task.id}/subtasks`);
      if (!res.ok) throw new Error("Failed to fetch subtasks");
      return res.json();
    },
    enabled: open,
    staleTime: 0, // Always fetch fresh data
  });

  // Mutation to update task calendarActive
  const updateTaskCalendar = useMutation({
    mutationFn: async (calendarActive: boolean) => {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ calendarActive }),
      });
      if (!res.ok) throw new Error("Failed to update task");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks", task.id] });
    },
  });

  // Mutation to update subtask completion
  const updateSubtask = useMutation({
    mutationFn: async ({ subtaskId, completed }: { subtaskId: number; completed: boolean }) => {
      const res = await fetch(`/api/subtasks/${subtaskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed }),
      });
      if (!res.ok) throw new Error("Failed to update subtask");
      return res.json();
    },
    onSuccess: () => {
      // Invalidate subtasks query to refetch
      queryClient.invalidateQueries({ queryKey: ["/api/tasks", task.id, "subtasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/subtasks"] });
    },
  });

  // Mutation to update subtask calendarActive
  const updateSubtaskCalendar = useMutation({
    mutationFn: async ({ subtaskId, calendarActive }: { subtaskId: number; calendarActive: boolean }) => {
      const res = await fetch(`/api/subtasks/${subtaskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ calendarActive }),
      });
      if (!res.ok) throw new Error("Failed to update subtask");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks", task.id, "subtasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/subtasks"] });
    },
  });

  // Mutation to create a new subtask
  const createSubtask = useMutation({
    mutationFn: async (title: string) => {
      const res = await fetch(`/api/tasks/${task.id}/subtasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          status: "not_started",
          calendarActive: true, // Show on calendar since created from calendar
        }),
      });
      if (!res.ok) throw new Error("Failed to create subtask");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks", task.id, "subtasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/subtasks"] });
      setNewSubtaskTitle("");
      setShowAddSubtask(false);
    },
  });

  const handleSubtaskToggle = (subtaskId: number, currentCompleted: boolean) => {
    updateSubtask.mutate({ subtaskId, completed: !currentCompleted });
  };

  const handleAddSubtask = () => {
    if (newSubtaskTitle.trim()) {
      createSubtask.mutate(newSubtaskTitle.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && newSubtaskTitle.trim()) {
      e.preventDefault();
      handleAddSubtask();
    } else if (e.key === "Escape") {
      setShowAddSubtask(false);
      setNewSubtaskTitle("");
    }
  };

  const handleViewTask = () => {
    setOpen(false);
    navigate(`/tasks/${task.id}`);
  };

  // Get task color based on tier2 category, fallback to tier1
  const getTaskColor = () => {
    if (task.tier2Category) {
      return getTier2Color(task.tier2Category, task.tier1Category);
    }
    if (task.tier1Category) {
      return getTier1Color(task.tier1Category);
    }
    return "#6366f1"; // Default indigo
  };

  const color = getTaskColor();
  const completedCount = subtasks.filter(s => s.completed).length;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {children || (
          <button
            className={cn(
              "w-full text-left rounded-sm px-1.5 py-0.5 text-xs font-medium truncate",
              "hover:opacity-80 transition-opacity cursor-pointer",
              "focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500",
              compact ? "py-0.5 text-[10px]" : "py-1",
              className
            )}
            style={{
              backgroundColor: `${color}20`,
              borderLeft: `3px solid ${color}`,
              color: color
            }}
            title={`${task.title} (${task.startDate} - ${task.endDate})`}
          >
            {task.title}
          </button>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        {/* Header */}
        <div
          className="p-3 border-b"
          style={{ backgroundColor: `${color}10` }}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm text-gray-900 truncate">
                {task.title}
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                {task.startDate} - {task.endDate}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  updateTaskCalendar.mutate(!task.calendarActive);
                }}
                title={task.calendarActive ? "Hide from calendar" : "Show on calendar"}
              >
                <Calendar className={cn(
                  "h-3 w-3",
                  task.calendarActive ? "text-cyan-600" : "text-gray-400"
                )} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={handleViewTask}
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                View
              </Button>
            </div>
          </div>
          {task.tier1Category && (
            <div className="flex gap-1 mt-2">
              <span
                className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium"
                style={{ backgroundColor: `${color}20`, color }}
              >
                {task.tier1Category}
              </span>
              {task.tier2Category && (
                <>
                  <ChevronRight className="h-3 w-3 text-gray-400 self-center" />
                  <span
                    className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium"
                    style={{ backgroundColor: `${color}20`, color }}
                  >
                    {task.tier2Category}
                  </span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Subtasks section */}
        <div className="p-3">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-medium text-gray-700">
              Subtasks
            </h4>
            <div className="flex items-center gap-2">
              {subtasks.length > 0 && (
                <span className="text-[10px] text-gray-500">
                  {completedCount}/{subtasks.length}
                </span>
              )}
              {/* Dropdown menu for subtasks */}
              <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 w-5 p-0"
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 max-h-64 overflow-y-auto">
                  {subtasksLoading ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                    </div>
                  ) : (
                    <>
                      {subtasks.length > 0 ? (
                        <>
                          <div className="px-2 py-1.5 text-xs font-medium text-gray-500">
                            Existing Subtasks
                          </div>
                          {subtasks.map((subtask) => (
                            <DropdownMenuItem
                              key={subtask.id}
                              className="flex items-center gap-2 cursor-pointer"
                              onClick={(e) => {
                                e.preventDefault();
                                handleSubtaskToggle(subtask.id, subtask.completed || false);
                              }}
                            >
                              <div className={cn(
                                "h-4 w-4 rounded border flex items-center justify-center",
                                subtask.completed
                                  ? "bg-green-500 border-green-500"
                                  : "border-gray-300"
                              )}>
                                {subtask.completed && (
                                  <Check className="h-3 w-3 text-white" />
                                )}
                              </div>
                              <span className={cn(
                                "flex-1 text-sm truncate",
                                subtask.completed && "line-through text-gray-400"
                              )}>
                                {subtask.title}
                              </span>
                              {subtask.status && subtask.status !== "not_started" && subtask.status !== "completed" && (
                                <span
                                  className={cn(
                                    "text-[9px] px-1 py-0.5 rounded",
                                    subtask.status === "in_progress" && "bg-amber-100 text-amber-700",
                                    subtask.status === "blocked" && "bg-red-100 text-red-700"
                                  )}
                                >
                                  {subtask.status.replace("_", " ")}
                                </span>
                              )}
                            </DropdownMenuItem>
                          ))}
                          <DropdownMenuSeparator />
                        </>
                      ) : (
                        <div className="px-2 py-2 text-xs text-gray-500 text-center">
                          No subtasks yet
                        </div>
                      )}
                      <DropdownMenuItem
                        className="cursor-pointer"
                        onClick={() => {
                          setShowAddSubtask(true);
                          setDropdownOpen(false);
                        }}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        <span>Add new subtask</span>
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Inline subtask list (shown when not using dropdown) */}
          {subtasksLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
            </div>
          ) : (
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {subtasks.map((subtask) => (
                <div
                  key={subtask.id}
                  className={cn(
                    "flex items-start gap-2 p-2 rounded-md hover:bg-gray-50 transition-colors",
                    subtask.completed && "opacity-60"
                  )}
                >
                  <Checkbox
                    checked={subtask.completed || false}
                    onCheckedChange={() => handleSubtaskToggle(subtask.id, subtask.completed || false)}
                    disabled={updateSubtask.isPending}
                    className="mt-0.5"
                  />
                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        "text-xs text-gray-900",
                        subtask.completed && "line-through text-gray-500"
                      )}
                    >
                      {subtask.title}
                    </p>
                    {subtask.startDate && subtask.endDate && (
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        {subtask.startDate} - {subtask.endDate}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 w-5 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        updateSubtaskCalendar.mutate({ 
                          subtaskId: subtask.id, 
                          calendarActive: !subtask.calendarActive 
                        });
                      }}
                      title={subtask.calendarActive ? "Hide from calendar" : "Show on calendar"}
                    >
                      <Calendar className={cn(
                        "h-3 w-3",
                        subtask.calendarActive ? "text-cyan-600" : "text-gray-400"
                      )} />
                    </Button>
                    {subtask.status && subtask.status !== "not_started" && (
                      <span
                        className={cn(
                          "text-[9px] px-1 py-0.5 rounded",
                          subtask.status === "completed" && "bg-green-100 text-green-700",
                          subtask.status === "in_progress" && "bg-amber-100 text-amber-700",
                          subtask.status === "blocked" && "bg-red-100 text-red-700"
                        )}
                      >
                        {subtask.status.replace("_", " ")}
                      </span>
                    )}
                  </div>
                </div>
              ))}
              {subtasks.length === 0 && !showAddSubtask && (
                <p className="text-xs text-gray-400 py-2 text-center">
                  No subtasks
                </p>
              )}
            </div>
          )}

          {/* Add subtask form */}
          {showAddSubtask && (
            <div className="flex items-center gap-2 mt-2 pt-2 border-t">
              <Input
                placeholder="New subtask..."
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                onKeyDown={handleKeyDown}
                className="h-7 text-xs"
                autoFocus
              />
              <Button
                size="sm"
                className="h-7 px-2"
                onClick={handleAddSubtask}
                disabled={!newSubtaskTitle.trim() || createSubtask.isPending}
              >
                {createSubtask.isPending ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Plus className="h-3 w-3" />
                )}
              </Button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-2 border-t bg-gray-50">
          <Button
            variant="ghost"
            size="sm"
            className="w-full h-7 text-xs"
            onClick={handleViewTask}
          >
            Open full task details
            <ChevronRight className="h-3 w-3 ml-1" />
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
