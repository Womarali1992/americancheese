import { TaskGanttView } from "@/components/charts/TaskGanttView";
import type { Task, Subtask } from "@shared/schema";

interface CalendarGanttViewProps {
  tasks: Task[];
  subtasks?: Subtask[];
  taskMap?: Map<number, Task>;
  projectId?: number;
}

export function CalendarGanttView({
  tasks,
  subtasks = [],
  taskMap = new Map(),
  projectId
}: CalendarGanttViewProps) {
  return (
    <TaskGanttView
      tasks={tasks}
      subtasks={subtasks}
      taskMap={taskMap}
      projectId={projectId}
      title="Calendar Gantt View"
      subtitle="Tasks and subtasks timeline"
      viewPeriod={7}
    />
  );
}
