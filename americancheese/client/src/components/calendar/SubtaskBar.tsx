import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useColors } from "@/lib/colors";
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

  // Use the colors hook with parent task's project context
  const { getTier1Color, getTier2Color } = useColors(parentTask?.projectId);

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
  );
}
