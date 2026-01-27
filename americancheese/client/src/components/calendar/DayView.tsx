import { useMemo } from "react";
import { format, parseISO, isWithinInterval, isSameDay } from "date-fns";
import { cn } from "@/lib/utils";
import { TaskPopover } from "./TaskPopover";
import { SubtaskBar } from "./SubtaskBar";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus, Calendar } from "lucide-react";
import { useUnifiedColors } from "@/hooks/useUnifiedColors";
import { TaskTitleWithTime, TaskTimeDisplay } from "@/components/task/TaskTimeDisplay";
import type { Task, Subtask } from "@shared/schema";

interface DayViewProps {
  selectedDate: Date;
  tasks: Task[];
  subtasks?: Subtask[];
  taskMap?: Map<number, Task>;
  onBack: () => void;
  onAddTask?: (date: Date) => void;
}

export function DayView({
  selectedDate,
  tasks,
  subtasks = [],
  taskMap = new Map(),
  onBack,
  onAddTask
}: DayViewProps) {
  // Filter tasks for the selected day
  // Uses calendarStartDate/calendarEndDate when available (actual schedule),
  // falls back to startDate/endDate (planned schedule)
  const dayTasks = useMemo(() => {
    return tasks.filter((task) => {
      // Use calendar dates if available (actual schedule), otherwise use task dates (planned schedule)
      const effectiveStartDate = task.calendarStartDate || task.startDate;
      const effectiveEndDate = task.calendarEndDate || task.endDate;

      if (!effectiveStartDate || !effectiveEndDate) return false;

      try {
        const start = parseISO(effectiveStartDate);
        const end = parseISO(effectiveEndDate);
        return isWithinInterval(selectedDate, { start, end }) ||
               isSameDay(selectedDate, start) ||
               isSameDay(selectedDate, end);
      } catch {
        return false;
      }
    });
  }, [tasks, selectedDate]);

  // Filter subtasks for the selected day
  // Uses calendarStartDate/calendarEndDate when available (actual schedule),
  // falls back to startDate/endDate (planned schedule)
  const daySubtasks = useMemo(() => {
    return subtasks.filter((subtask) => {
      // Use calendar dates if available (actual schedule), otherwise use subtask dates (planned schedule)
      const effectiveStartDate = subtask.calendarStartDate || subtask.startDate;
      const effectiveEndDate = subtask.calendarEndDate || subtask.endDate;

      if (!effectiveStartDate || !effectiveEndDate) return false;

      try {
        const start = parseISO(effectiveStartDate);
        const end = parseISO(effectiveEndDate);
        return isWithinInterval(selectedDate, { start, end }) ||
               isSameDay(selectedDate, start) ||
               isSameDay(selectedDate, end);
      } catch {
        return false;
      }
    });
  }, [subtasks, selectedDate]);

  const totalItems = dayTasks.length + daySubtasks.length;

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="gap-1"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-cyan-600" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {format(selectedDate, "EEEE, MMMM d, yyyy")}
              </h2>
              <p className="text-sm text-gray-500">
                {totalItems} {totalItems === 1 ? "item" : "items"} scheduled
              </p>
            </div>
          </div>
        </div>
        {onAddTask && (
          <Button
            size="sm"
            onClick={() => onAddTask(selectedDate)}
            className="gap-1"
          >
            <Plus className="h-4 w-4" />
            Add Task
          </Button>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {totalItems === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <Calendar className="h-12 w-12 mb-3 opacity-50" />
            <p className="text-lg font-medium">No items scheduled</p>
            <p className="text-sm">Click "Add Task" to schedule something for this day</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Tasks Section */}
            {dayTasks.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <span className="bg-cyan-100 text-cyan-700 px-2 py-0.5 rounded text-xs font-semibold">
                    {dayTasks.length}
                  </span>
                  Tasks
                </h3>
                <div className="space-y-2">
                  {dayTasks.map((task) => (
                    <DayViewTaskCard key={task.id} task={task} />
                  ))}
                </div>
              </div>
            )}

            {/* Subtasks Section */}
            {daySubtasks.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-xs font-semibold">
                    {daySubtasks.length}
                  </span>
                  Subtasks
                </h3>
                <div className="space-y-2">
                  {daySubtasks.map((subtask) => (
                    <DayViewSubtaskCard
                      key={subtask.id}
                      subtask={subtask}
                      parentTask={taskMap.get(subtask.parentTaskId)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Task card component for day view
function DayViewTaskCard({ task }: { task: Task }) {
  const { getTier1Color, getTier2Color } = useUnifiedColors(task.projectId);

  const color = task.tier2Category
    ? getTier2Color(task.tier2Category, task.tier1Category)
    : task.tier1Category
    ? getTier1Color(task.tier1Category)
    : "#6366f1";

  return (
    <TaskPopover task={task}>
      <div
        className={cn(
          "p-3 rounded-lg border cursor-pointer",
          "hover:shadow-md transition-shadow"
        )}
        style={{
          backgroundColor: `${color}10`,
          borderColor: `${color}40`,
          borderLeftWidth: "4px",
          borderLeftColor: color
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-gray-900 truncate">
              <TaskTitleWithTime
                title={task.title}
                startTime={task.startTime}
                endTime={task.endTime}
                titleClassName="truncate"
              />
            </h4>
            {task.description && (
              <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                {task.description}
              </p>
            )}
            <div className="flex items-center gap-2 mt-2">
              {task.tier1Category && (
                <span
                  className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                  style={{ backgroundColor: `${color}20`, color }}
                >
                  {task.tier1Category}
                </span>
              )}
              {task.tier2Category && (
                <span
                  className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                  style={{ backgroundColor: `${color}20`, color }}
                >
                  {task.tier2Category}
                </span>
              )}
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-xs text-gray-500">
              {task.startDate} - {task.endDate}
            </div>
            {task.status && (
              <span
                className={cn(
                  "inline-block mt-1 text-xs px-2 py-0.5 rounded",
                  task.status === "completed" && "bg-green-100 text-green-700",
                  task.status === "in_progress" && "bg-amber-100 text-amber-700",
                  task.status === "not_started" && "bg-gray-100 text-gray-600",
                  task.status === "blocked" && "bg-red-100 text-red-700"
                )}
              >
                {task.status.replace("_", " ")}
              </span>
            )}
          </div>
        </div>
      </div>
    </TaskPopover>
  );
}

// Subtask card component for day view
function DayViewSubtaskCard({
  subtask,
  parentTask
}: {
  subtask: Subtask;
  parentTask?: Task;
}) {
  const { getTier1Color, getTier2Color } = useUnifiedColors(parentTask?.projectId);

  const color = parentTask?.tier2Category
    ? getTier2Color(parentTask.tier2Category, parentTask.tier1Category)
    : parentTask?.tier1Category
    ? getTier1Color(parentTask.tier1Category)
    : "#9ca3af";

  const codeNumber = parentTask
    ? `${parentTask.id}.${(subtask.sortOrder ?? 0) + 1}`
    : `-.${(subtask.sortOrder ?? 0) + 1}`;

  return (
    <div
      className={cn(
        "p-3 rounded-lg border cursor-pointer",
        "hover:shadow-md transition-shadow",
        subtask.completed && "opacity-60"
      )}
      style={{
        backgroundColor: `${color}10`,
        borderColor: `${color}40`,
        borderLeftWidth: "4px",
        borderLeftColor: color
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span
              className="font-semibold text-sm"
              style={{ color }}
            >
              {codeNumber}
            </span>
            <h4
              className={cn(
                "font-medium text-gray-900 truncate",
                subtask.completed && "line-through"
              )}
            >
              <TaskTitleWithTime
                title={subtask.title}
                startTime={subtask.startTime}
                endTime={subtask.endTime}
                titleClassName="truncate"
              />
            </h4>
          </div>
          {subtask.description && (
            <p className="text-sm text-gray-500 mt-1 line-clamp-2">
              {subtask.description}
            </p>
          )}
          {parentTask && (
            <p className="text-xs text-gray-400 mt-2">
              From: {parentTask.title}
            </p>
          )}
        </div>
        <div className="text-right shrink-0">
          <div className="text-xs text-gray-500">
            {subtask.startDate} - {subtask.endDate}
          </div>
          {subtask.status && (
            <span
              className={cn(
                "inline-block mt-1 text-xs px-2 py-0.5 rounded",
                subtask.status === "completed" && "bg-green-100 text-green-700",
                subtask.status === "in_progress" && "bg-amber-100 text-amber-700",
                subtask.status === "not_started" && "bg-gray-100 text-gray-600",
                subtask.status === "blocked" && "bg-red-100 text-red-700"
              )}
            >
              {subtask.status.replace("_", " ")}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
