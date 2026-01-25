import { useState, useMemo } from "react";
import {
  format,
  eachDayOfInterval,
  addDays,
  subDays,
  parseISO,
  differenceInDays,
  isWithinInterval,
  isSameDay
} from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLocation } from "wouter";
import { useColors } from "@/lib/colors";
import type { Task, Subtask } from "@shared/schema";

interface TaskGanttViewProps {
  tasks: Task[];
  subtasks?: Subtask[];
  taskMap?: Map<number, Task>;
  projectId?: number;
  viewPeriod?: number;
  className?: string;
  title?: string;
  subtitle?: string;
}

interface GanttItem {
  id: number;
  title: string;
  startDate: Date;
  endDate: Date;
  tier1Category?: string | null;
  tier2Category?: string | null;
  projectId: number;
  isSubtask: boolean;
  parentTaskId?: number;
  status?: string | null;
  completed?: boolean | null;
}

export function TaskGanttView({
  tasks,
  subtasks = [],
  taskMap = new Map(),
  projectId,
  viewPeriod = 7,
  className,
  title = "Task Timeline",
  subtitle = "tasks and subtasks schedule"
}: TaskGanttViewProps) {
  const [, navigate] = useLocation();
  const { getTier1Color, getTier2Color } = useColors(projectId);

  // Calculate initial date based on earliest task
  const initialDate = useMemo(() => {
    const allDates: Date[] = [];

    tasks.forEach(task => {
      if (task.startDate) {
        try {
          allDates.push(parseISO(task.startDate));
        } catch {}
      }
    });

    subtasks.forEach(subtask => {
      if (subtask.startDate) {
        try {
          allDates.push(parseISO(subtask.startDate));
        } catch {}
      }
    });

    if (allDates.length === 0) {
      return new Date();
    }

    // Start from the earliest date
    const earliest = new Date(Math.min(...allDates.map(d => d.getTime())));
    return earliest;
  }, [tasks, subtasks]);

  const [currentDate, setCurrentDate] = useState(initialDate);

  // Generate days for the view
  const days = useMemo(() => {
    return eachDayOfInterval({
      start: currentDate,
      end: addDays(currentDate, viewPeriod - 1)
    });
  }, [currentDate, viewPeriod]);

  // Convert tasks and subtasks to gantt items
  const ganttItems = useMemo(() => {
    const items: GanttItem[] = [];

    // Add tasks
    tasks.forEach(task => {
      if (!task.startDate || !task.endDate) return;

      try {
        const startDate = parseISO(task.startDate);
        const endDate = parseISO(task.endDate);

        items.push({
          id: task.id,
          title: task.title,
          startDate,
          endDate,
          tier1Category: task.tier1Category,
          tier2Category: task.tier2Category,
          projectId: task.projectId,
          isSubtask: false,
          status: task.status,
          completed: task.completed
        });
      } catch {}
    });

    // Add subtasks
    subtasks.forEach(subtask => {
      if (!subtask.startDate || !subtask.endDate) return;

      const parentTask = taskMap.get(subtask.parentTaskId);
      const codeNumber = parentTask
        ? `${parentTask.id}.${(subtask.sortOrder ?? 0) + 1}`
        : `-.${(subtask.sortOrder ?? 0) + 1}`;

      try {
        const startDate = parseISO(subtask.startDate);
        const endDate = parseISO(subtask.endDate);

        items.push({
          id: subtask.id + 1000000,
          title: `${codeNumber}: ${subtask.title}`,
          startDate,
          endDate,
          tier1Category: parentTask?.tier1Category,
          tier2Category: parentTask?.tier2Category,
          projectId: parentTask?.projectId || 0,
          isSubtask: true,
          parentTaskId: subtask.parentTaskId,
          status: subtask.status,
          completed: subtask.completed
        });
      } catch {}
    });

    // Sort by start date
    items.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

    return items;
  }, [tasks, subtasks, taskMap]);

  // Filter items visible in current date range
  const visibleItems = useMemo(() => {
    const rangeStart = days[0];
    const rangeEnd = days[days.length - 1];

    return ganttItems.filter(item => {
      // Item is visible if it overlaps with the view range
      return item.endDate >= rangeStart && item.startDate <= rangeEnd;
    });
  }, [ganttItems, days]);

  // Navigation
  const goToPrevious = () => setCurrentDate(d => subDays(d, viewPeriod));
  const goToNext = () => setCurrentDate(d => addDays(d, viewPeriod));
  const goToToday = () => setCurrentDate(new Date());

  // Get item color
  const getItemColor = (item: GanttItem) => {
    if (item.tier2Category) {
      return getTier2Color(item.tier2Category, item.tier1Category || undefined);
    }
    if (item.tier1Category) {
      return getTier1Color(item.tier1Category);
    }
    return "#6366f1"; // Default indigo
  };

  // Calculate bar position and width
  const calculateBar = (item: GanttItem) => {
    const rangeStart = days[0];
    const rangeEnd = days[days.length - 1];
    const columnWidth = 100 / viewPeriod;

    // Calculate start position
    let startOffset = differenceInDays(item.startDate, rangeStart);
    if (startOffset < 0) startOffset = 0;

    // Calculate end position
    let endOffset = differenceInDays(item.endDate, rangeStart) + 1;
    if (endOffset > viewPeriod) endOffset = viewPeriod;

    const left = startOffset * columnWidth;
    const width = (endOffset - startOffset) * columnWidth;

    return { left, width: Math.max(width, columnWidth) };
  };

  // Handle item click
  const handleItemClick = (item: GanttItem) => {
    if (item.isSubtask && item.parentTaskId) {
      navigate(`/tasks/${item.parentTaskId}`);
    } else {
      navigate(`/tasks/${item.id}`);
    }
  };

  return (
    <div className={cn("bg-white rounded-lg border border-gray-200 overflow-hidden", className)}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-500">{subtitle}</p>
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={goToPrevious}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" className="h-8" onClick={goToToday}>
              Today
            </Button>
            <h3 className="font-medium text-base min-w-[180px] text-center">
              {format(days[0], "MMM d")} - {format(days[days.length - 1], "MMM d, yyyy")}
            </h3>
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={goToNext}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Gantt Chart */}
      <div className="overflow-x-auto" style={{ minWidth: "600px" }}>
        {/* Day headers */}
        <div className="flex border-b border-gray-200 bg-gray-50 sticky top-0 z-10">
          {days.map((day, index) => {
            const isWeekend = day.getDay() === 0 || day.getDay() === 6;
            const isToday = isSameDay(day, new Date());

            return (
              <div
                key={index}
                className={cn(
                  "flex-1 text-center py-2 text-sm border-r border-gray-200 last:border-r-0 flex flex-col justify-center min-w-[80px]",
                  isWeekend && "bg-gray-100 text-gray-500",
                  isToday && "bg-cyan-50"
                )}
              >
                <div className="font-medium text-xs">{format(day, "EEE")}</div>
                <div className={cn(
                  "text-lg font-medium",
                  isToday && "text-cyan-600"
                )}>
                  {format(day, "d")}
                </div>
              </div>
            );
          })}
        </div>

        {/* Task rows */}
        <div className="bg-white min-h-[200px]">
          {visibleItems.length === 0 ? (
            <div className="flex items-center justify-center h-[200px] text-gray-500">
              No tasks in this date range
            </div>
          ) : (
            visibleItems.map(item => {
              const { left, width } = calculateBar(item);
              const color = getItemColor(item);

              return (
                <div
                  key={item.id}
                  className="relative h-16 border-b border-gray-100 last:border-b-0"
                >
                  {/* Grid lines for each day */}
                  <div className="absolute inset-0 flex">
                    {days.map((day, i) => (
                      <div
                        key={i}
                        className={cn(
                          "flex-1 border-r border-gray-100 last:border-r-0",
                          (day.getDay() === 0 || day.getDay() === 6) && "bg-gray-50/50"
                        )}
                      />
                    ))}
                  </div>

                  {/* Task bar */}
                  <div
                    className="absolute top-2 bottom-2 cursor-pointer transition-opacity hover:opacity-90"
                    style={{
                      left: `${left}%`,
                      width: `${width}%`,
                    }}
                    onClick={() => handleItemClick(item)}
                  >
                    <div
                      className={cn(
                        "h-full rounded-md flex items-center px-3 shadow-sm border-l-4",
                        item.completed && "opacity-60"
                      )}
                      style={{
                        backgroundColor: `${color}20`,
                        borderLeftColor: color,
                        color: color
                      }}
                    >
                      <div className="truncate text-sm font-medium">
                        {item.title}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Footer with count */}
      <div className="p-2 border-t border-gray-200 bg-gray-50 text-center text-sm text-gray-500">
        {visibleItems.length} item{visibleItems.length !== 1 ? "s" : ""} in view
        {ganttItems.length > visibleItems.length && (
          <span> ({ganttItems.length} total)</span>
        )}
      </div>
    </div>
  );
}
