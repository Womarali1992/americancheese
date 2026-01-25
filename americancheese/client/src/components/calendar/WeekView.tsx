import { useMemo } from "react";
import {
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
  isToday,
  parseISO,
  isWithinInterval,
  format
} from "date-fns";
import { cn } from "@/lib/utils";
import { TaskBar } from "./TaskBar";
import { SubtaskBar } from "./SubtaskBar";
import { Plus } from "lucide-react";
import type { Task, Subtask } from "@shared/schema";

interface WeekViewProps {
  currentDate: Date;
  tasks: Task[];
  subtasks?: Subtask[];
  taskMap?: Map<number, Task>;
  onAddTask?: (date: Date) => void;
  onDayClick?: (date: Date) => void;
}

export function WeekView({
  currentDate,
  tasks,
  subtasks = [],
  taskMap = new Map(),
  onAddTask,
  onDayClick
}: WeekViewProps) {
  // Get all days in the current week
  const weekDays = useMemo(() => {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
    const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 });

    return eachDayOfInterval({ start: weekStart, end: weekEnd });
  }, [currentDate]);

  // Group tasks by date for efficient lookup
  const tasksByDate = useMemo(() => {
    const map = new Map<string, Task[]>();

    tasks.forEach((task) => {
      if (!task.startDate || !task.endDate) return;

      try {
        const start = parseISO(task.startDate);
        const end = parseISO(task.endDate);

        // Add task to each day it spans
        weekDays.forEach((day) => {
          if (isWithinInterval(day, { start, end })) {
            const key = format(day, "yyyy-MM-dd");
            const existing = map.get(key) || [];
            // Avoid duplicates
            if (!existing.find(t => t.id === task.id)) {
              map.set(key, [...existing, task]);
            }
          }
        });
      } catch {
        // Skip invalid dates
      }
    });

    return map;
  }, [tasks, weekDays]);

  // Group subtasks by date for efficient lookup
  const subtasksByDate = useMemo(() => {
    const map = new Map<string, Subtask[]>();

    subtasks.forEach((subtask) => {
      if (!subtask.startDate || !subtask.endDate) return;

      try {
        const start = parseISO(subtask.startDate);
        const end = parseISO(subtask.endDate);

        // Add subtask to each day it spans
        weekDays.forEach((day) => {
          if (isWithinInterval(day, { start, end })) {
            const key = format(day, "yyyy-MM-dd");
            const existing = map.get(key) || [];
            // Avoid duplicates
            if (!existing.find(s => s.id === subtask.id)) {
              map.set(key, [...existing, subtask]);
            }
          }
        });
      } catch {
        // Skip invalid dates
      }
    });

    return map;
  }, [subtasks, weekDays]);

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Day headers */}
      <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
        {weekDays.map((day) => {
          const isCurrentDay = isToday(day);
          return (
            <div
              key={day.toISOString()}
              className={cn(
                "px-2 py-3 text-center border-r last:border-r-0 border-gray-200",
                isCurrentDay && "bg-cyan-50"
              )}
            >
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                {format(day, "EEE")}
              </div>
              <button
                onClick={() => onDayClick?.(day)}
                className={cn(
                  "mt-1 inline-flex items-center justify-center h-8 w-8 text-lg rounded-full cursor-pointer hover:ring-2 hover:ring-cyan-300 transition-all",
                  isCurrentDay && "bg-cyan-600 text-white font-semibold",
                  !isCurrentDay && "text-gray-900 hover:bg-gray-100"
                )}
                title="Click to view day"
              >
                {format(day, "d")}
              </button>
            </div>
          );
        })}
      </div>

      {/* Task grid */}
      <div className="grid grid-cols-7 divide-x divide-gray-200 min-h-[400px]">
        {weekDays.map((day) => {
          const dateKey = format(day, "yyyy-MM-dd");
          const dayTasks = tasksByDate.get(dateKey) || [];
          const daySubtasks = subtasksByDate.get(dateKey) || [];
          const isCurrentDay = isToday(day);
          const hasItems = dayTasks.length > 0 || daySubtasks.length > 0;

          return (
            <div
              key={dateKey}
              className={cn(
                "p-2 space-y-1.5 overflow-y-auto group",
                isCurrentDay && "bg-cyan-50/30"
              )}
            >
              {/* Add task button */}
              {onAddTask && (
                <button
                  onClick={() => onAddTask(day)}
                  className="w-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1 py-1 px-2 rounded border border-dashed border-gray-300 hover:border-gray-400 hover:bg-gray-50 text-xs text-gray-500 hover:text-gray-700"
                >
                  <Plus className="h-3 w-3" />
                  Add Task
                </button>
              )}

              {/* Task and subtask list */}
              {dayTasks.map((task) => (
                <TaskBar
                  key={`task-${task.id}`}
                  task={task}
                />
              ))}
              {daySubtasks.map((subtask) => (
                <SubtaskBar
                  key={`subtask-${subtask.id}`}
                  subtask={subtask}
                  parentTask={taskMap.get(subtask.parentTaskId)}
                />
              ))}

              {/* Empty state */}
              {!hasItems && !onAddTask && (
                <div className="text-xs text-gray-400 text-center py-4">
                  No tasks
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
