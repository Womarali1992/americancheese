import { useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { useColors } from "@/lib/colors";
import { Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TaskTitleWithTime } from "@/components/task/TaskTimeDisplay";
import type { Subtask, Task } from "@shared/schema";

// Format time from 24h to 12h format (e.g., "16:00" -> "4pm")
function formatTime12h(time: string | null | undefined): string {
  if (!time) return "";
  const [hours, minutes] = time.split(":").map(Number);
  const period = hours >= 12 ? "pm" : "am";
  const hour12 = hours % 12 || 12;
  // Only show minutes if they're not :00
  if (minutes === 0) {
    return `${hour12}${period}`;
  }
  return `${hour12}:${minutes.toString().padStart(2, "0")}${period}`;
}

// Format the calendar schedule prefix (e.g., "4pm Fri Feb 14,")
function getCalendarSchedulePrefix(subtask: Subtask): string {
  if (!subtask.calendarStartDate) return "";

  try {
    const date = parseISO(subtask.calendarStartDate);
    const timeStr = formatTime12h(subtask.calendarStartTime);
    const dateStr = format(date, "EEE MMM d"); // "Fri Feb 14"

    if (timeStr) {
      return `${timeStr} ${dateStr},`;
    }
    return `${dateStr},`;
  } catch {
    return "";
  }
}

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
        title={`${codeNumber}: ${subtask.title}${subtask.calendarStartTime ? ` @ ${subtask.calendarStartTime}` : ""}${parentTask ? ` (from ${parentTask.title})` : ""}`}
      >
        {(() => {
          const schedulePrefix = getCalendarSchedulePrefix(subtask);
          return schedulePrefix ? (
            <span className="truncate">
              <span className="font-semibold">{schedulePrefix}</span>{" "}
              <span className="font-medium">{codeNumber}</span>{" "}
              {subtask.title}
            </span>
          ) : (
            <>
              <span className="font-medium">{codeNumber}</span>{" "}
              <TaskTitleWithTime
                title={subtask.title}
                startTime={subtask.startTime}
                endTime={subtask.endTime}
                compact
                titleClassName="truncate"
              />
            </>
          );
        })()}
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
