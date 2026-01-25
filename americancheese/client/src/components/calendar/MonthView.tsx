import { useMemo } from "react";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
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

interface MonthViewProps {
  currentDate: Date;
  tasks: Task[];
  subtasks?: Subtask[];
  taskMap?: Map<number, Task>;
  onAddTask?: (date: Date) => void;
  onDayClick?: (date: Date) => void;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MAX_VISIBLE_TASKS = 3;

export function MonthView({
  currentDate,
  tasks,
  subtasks = [],
  taskMap = new Map(),
  onAddTask,
  onDayClick
}: MonthViewProps) {
  // Get all days to display in the month view (includes days from prev/next months)
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
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
        calendarDays.forEach((day) => {
          if (isWithinInterval(day, { start, end })) {
            const key = format(day, "yyyy-MM-dd");
            const existing = map.get(key) || [];
            map.set(key, [...existing, task]);
          }
        });
      } catch {
        // Skip invalid dates
      }
    });

    return map;
  }, [tasks, calendarDays]);

  // Group subtasks by date for efficient lookup
  const subtasksByDate = useMemo(() => {
    const map = new Map<string, Subtask[]>();

    subtasks.forEach((subtask) => {
      if (!subtask.startDate || !subtask.endDate) return;

      try {
        const start = parseISO(subtask.startDate);
        const end = parseISO(subtask.endDate);

        // Add subtask to each day it spans
        calendarDays.forEach((day) => {
          if (isWithinInterval(day, { start, end })) {
            const key = format(day, "yyyy-MM-dd");
            const existing = map.get(key) || [];
            map.set(key, [...existing, subtask]);
          }
        });
      } catch {
        // Skip invalid dates
      }
    });

    return map;
  }, [subtasks, calendarDays]);

  // Split days into weeks for rendering
  const weeks = useMemo(() => {
    const result: Date[][] = [];
    for (let i = 0; i < calendarDays.length; i += 7) {
      result.push(calendarDays.slice(i, i + 7));
    }
    return result;
  }, [calendarDays]);

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Weekday headers */}
      <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="divide-y divide-gray-200">
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="grid grid-cols-7 divide-x divide-gray-200">
            {week.map((day) => {
              const dateKey = format(day, "yyyy-MM-dd");
              const dayTasks = tasksByDate.get(dateKey) || [];
              const daySubtasks = subtasksByDate.get(dateKey) || [];
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isCurrentDay = isToday(day);
              const totalItems = dayTasks.length + daySubtasks.length;
              const hasMoreItems = totalItems > MAX_VISIBLE_TASKS;

              // Show tasks first, then subtasks, limited to MAX_VISIBLE_TASKS total
              const visibleTasks = dayTasks.slice(0, MAX_VISIBLE_TASKS);
              const remainingSlots = MAX_VISIBLE_TASKS - visibleTasks.length;
              const visibleSubtasks = remainingSlots > 0 ? daySubtasks.slice(0, remainingSlots) : [];

              return (
                <div
                  key={dateKey}
                  className={cn(
                    "min-h-[100px] p-1 group relative",
                    !isCurrentMonth && "bg-gray-50"
                  )}
                >
                  {/* Day number and add button */}
                  <div className="flex justify-between items-center mb-1">
                    {onAddTask && (
                      <button
                        onClick={() => onAddTask(day)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity h-5 w-5 flex items-center justify-center rounded hover:bg-gray-200 text-gray-500 hover:text-gray-700"
                        title="Add task"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    )}
                    {!onAddTask && <div />}
                    <button
                      onClick={() => onDayClick?.(day)}
                      className={cn(
                        "inline-flex items-center justify-center h-6 w-6 text-sm rounded-full cursor-pointer hover:ring-2 hover:ring-cyan-300 transition-all",
                        isCurrentDay && "bg-cyan-600 text-white font-semibold",
                        !isCurrentDay && isCurrentMonth && "text-gray-900 hover:bg-gray-100",
                        !isCurrentDay && !isCurrentMonth && "text-gray-400 hover:bg-gray-100"
                      )}
                      title="Click to view day"
                    >
                      {format(day, "d")}
                    </button>
                  </div>

                  {/* Task and subtask bars */}
                  <div className="space-y-0.5">
                    {visibleTasks.map((task) => (
                      <TaskBar
                        key={`task-${task.id}`}
                        task={task}
                        compact
                      />
                    ))}
                    {visibleSubtasks.map((subtask) => (
                      <SubtaskBar
                        key={`subtask-${subtask.id}`}
                        subtask={subtask}
                        parentTask={taskMap.get(subtask.parentTaskId)}
                        compact
                      />
                    ))}
                    {hasMoreItems && (
                      <button
                        onClick={() => onDayClick?.(day)}
                        className="text-[10px] text-cyan-600 px-1 py-0.5 hover:underline cursor-pointer w-full text-left"
                      >
                        +{totalItems - MAX_VISIBLE_TASKS} more
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
