import { TaskPopover } from "./TaskPopover";
import type { Task } from "@shared/schema";

interface TaskBarProps {
  task: Task;
  compact?: boolean;
  className?: string;
}

export function TaskBar({
  task,
  compact = false,
  className
}: TaskBarProps) {
  return (
    <TaskPopover
      task={task}
      compact={compact}
      className={className}
    />
  );
}
