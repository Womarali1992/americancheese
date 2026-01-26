import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { useColors } from "@/lib/colors";
import { Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Subtask, Task } from "@shared/schema";

interface SubtaskBarProps {
  subtask: Subtask;
  parentTask?: Task;
  compact?: boolean;
  className?: string;
}

export function SubtaskBar({
  subtask,
  parentTask,
  compact = false,
  className
}: SubtaskBarProps) {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();

  // Use the colors hook with parent task's project context
  const { getTier1Color, getTier2Color } = useColors(parentTask?.projectId);

  // Mutation to update subtask calendarActive
  const updateSubtaskCalendar = useMutation({
    mutationFn: async (calendarActive: boolean) => {
      const res = await fetch(`/api/subtasks/${subtask.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ calendarActive }),
      });
      if (!res.ok) throw new Error("Failed to update subtask");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subtasks"] });
      if (parentTask) {
        queryClient.invalidateQueries({ queryKey: ["/api/tasks", parentTask.id, "subtasks"] });
      }
    },
  });

  const handleClick = () => {
    // Navigate to the parent task
    if (subtask.parentTaskId) {
      navigate(`/tasks/${subtask.parentTaskId}`);
    }
  };

  // Get color from parent task's category
  const getSubtaskColor = () => {
    if (!parentTask) return "#9ca3af"; // Gray fallback

    if (parentTask.tier2Category) {
      return getTier2Color(parentTask.tier2Category, parentTask.tier1Category);
    }
    if (parentTask.tier1Category) {
      return getTier1Color(parentTask.tier1Category);
    }
    return "#9ca3af"; // Gray fallback
  };

  const color = getSubtaskColor();

  // Generate code number like "3.2" (parentTaskId.subtaskOrder)
  // Using sortOrder + 1 for 1-based numbering
  const codeNumber = parentTask
    ? `${parentTask.id}.${(subtask.sortOrder ?? 0) + 1}`
    : `-.${(subtask.sortOrder ?? 0) + 1}`;

  return (
    <div className="group relative w-full">
      <button
        onClick={handleClick}
        className={cn(
          "w-full text-left rounded-sm px-1.5 text-xs truncate",
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
        title={`${codeNumber}: ${subtask.title}${parentTask ? ` (from ${parentTask.title})` : ""}`}
      >
        <span className="font-medium">{codeNumber}</span> {subtask.title}
      </button>
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          "absolute right-0 top-0 h-full opacity-0 group-hover:opacity-100 transition-opacity",
          "h-5 w-5 p-0 hover:bg-gray-200"
        )}
        onClick={(e) => {
          e.stopPropagation();
          updateSubtaskCalendar.mutate(!subtask.calendarActive);
        }}
        title={subtask.calendarActive ? "Hide from calendar" : "Show on calendar"}
      >
        <Calendar className={cn(
          "h-3 w-3",
          subtask.calendarActive ? "text-cyan-600" : "text-gray-400"
        )} />
      </Button>
    </div>
  );
}
