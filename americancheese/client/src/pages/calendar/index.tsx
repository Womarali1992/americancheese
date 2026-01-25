import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { addMonths, subMonths, addWeeks, subWeeks, addDays, subDays, parseISO, isWithinInterval, startOfMonth, endOfMonth, startOfWeek, endOfWeek, startOfDay, endOfDay } from "date-fns";
import { Layout } from "@/components/layout/Layout";
import { CalendarHeader, type CalendarView } from "@/components/calendar/CalendarHeader";
import { MonthView } from "@/components/calendar/MonthView";
import { WeekView } from "@/components/calendar/WeekView";
import { DayView } from "@/components/calendar/DayView";
import { CalendarGanttView } from "@/components/calendar/CalendarGanttView";
import { QuickAddTaskDialog } from "@/components/calendar/QuickAddTaskDialog";
import { ScheduleSubtaskDialog } from "@/components/calendar/ScheduleSubtaskDialog";
import { ProjectSelector } from "@/components/project/ProjectSelector";
import { Button } from "@/components/ui/button";
import { Plus, ListTree } from "lucide-react";
import type { Task, Project, Subtask } from "@shared/schema";

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<CalendarView>("month");
  const [selectedProjectId, setSelectedProjectId] = useState<number | undefined>(undefined);
  const [addTaskDialogOpen, setAddTaskDialogOpen] = useState(false);
  const [addSubtaskDialogOpen, setAddSubtaskDialogOpen] = useState(false);
  const [addTaskDate, setAddTaskDate] = useState<Date>(new Date());

  const handleAddTask = (date: Date) => {
    setAddTaskDate(date);
    setAddTaskDialogOpen(true);
  };

  const handleAddSubtask = (date: Date) => {
    setAddTaskDate(date);
    setAddSubtaskDialogOpen(true);
  };

  // Fetch all tasks
  const { data: tasks = [], isLoading: tasksLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  // Fetch all subtasks
  const { data: subtasks = [], isLoading: subtasksLoading } = useQuery<Subtask[]>({
    queryKey: ["/api/subtasks"],
  });

  // Fetch all projects for filter and color lookup
  const { data: projects = [], isLoading: projectsLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  // Create a map of taskId -> projectId for subtask filtering
  const taskProjectMap = useMemo(() => {
    const map = new Map<number, number>();
    tasks.forEach((task) => {
      map.set(task.id, task.projectId);
    });
    return map;
  }, [tasks]);

  // Create a map of taskId -> task for subtask parent lookup
  const taskMap = useMemo(() => {
    const map = new Map<number, Task>();
    tasks.forEach((task) => {
      map.set(task.id, task);
    });
    return map;
  }, [tasks]);

  // Navigation handlers
  const handlePrevious = () => {
    if (view === "day") {
      setCurrentDate((d) => subDays(d, 1));
    } else if (view === "month") {
      setCurrentDate((d) => subMonths(d, 1));
    } else {
      setCurrentDate((d) => subWeeks(d, 1));
    }
  };

  const handleNext = () => {
    if (view === "day") {
      setCurrentDate((d) => addDays(d, 1));
    } else if (view === "month") {
      setCurrentDate((d) => addMonths(d, 1));
    } else {
      setCurrentDate((d) => addWeeks(d, 1));
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleViewChange = (newView: CalendarView) => {
    setView(newView);
  };

  // Click on a day to switch to day view
  const handleDayClick = (date: Date) => {
    setCurrentDate(date);
    setView("day");
  };

  // Go back from day view to previous view
  const handleBackFromDayView = () => {
    setView("month");
  };

  const handleProjectChange = (projectIdStr: string) => {
    if (projectIdStr === "all") {
      setSelectedProjectId(undefined);
    } else {
      setSelectedProjectId(Number(projectIdStr));
    }
  };

  // Get the visible date range based on current view
  const dateRange = useMemo(() => {
    if (view === "day") {
      return {
        start: startOfDay(currentDate),
        end: endOfDay(currentDate)
      };
    } else if (view === "month") {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      // Include days from prev/next months that appear in the view
      return {
        start: startOfWeek(monthStart, { weekStartsOn: 0 }),
        end: endOfWeek(monthEnd, { weekStartsOn: 0 })
      };
    } else {
      return {
        start: startOfWeek(currentDate, { weekStartsOn: 0 }),
        end: endOfWeek(currentDate, { weekStartsOn: 0 })
      };
    }
  }, [currentDate, view]);

  // Filter tasks based on project selection, calendarActive flag, and visible date range
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // Hide tasks only if explicitly set to calendarActive = false
      // Show tasks if calendarActive is true, null, or undefined (backwards compatible)
      if (task.calendarActive === false) return false;

      // Filter by project
      if (selectedProjectId !== undefined && task.projectId !== selectedProjectId) {
        return false;
      }

      // Filter by date range
      if (!task.startDate || !task.endDate) return false;

      try {
        const taskStart = parseISO(task.startDate);
        const taskEnd = parseISO(task.endDate);

        // Check if task overlaps with visible range
        return (
          isWithinInterval(taskStart, dateRange) ||
          isWithinInterval(taskEnd, dateRange) ||
          (taskStart <= dateRange.start && taskEnd >= dateRange.end)
        );
      } catch {
        return false;
      }
    });
  }, [tasks, selectedProjectId, dateRange]);

  // Filter subtasks based on project selection, calendarActive flag, and visible date range
  const filteredSubtasks = useMemo(() => {
    return subtasks.filter((subtask) => {
      // Hide subtasks only if explicitly set to calendarActive = false
      // Show subtasks if calendarActive is true, null, or undefined (backwards compatible)
      if (subtask.calendarActive === false) return false;

      // Get parent task's project ID
      const projectId = taskProjectMap.get(subtask.parentTaskId);

      // Filter by project
      if (selectedProjectId !== undefined && projectId !== selectedProjectId) {
        return false;
      }

      // Subtasks need dates to appear on calendar
      if (!subtask.startDate || !subtask.endDate) return false;

      try {
        const subtaskStart = parseISO(subtask.startDate);
        const subtaskEnd = parseISO(subtask.endDate);

        // Check if subtask overlaps with visible range
        return (
          isWithinInterval(subtaskStart, dateRange) ||
          isWithinInterval(subtaskEnd, dateRange) ||
          (subtaskStart <= dateRange.start && subtaskEnd >= dateRange.end)
        );
      } catch {
        return false;
      }
    });
  }, [subtasks, selectedProjectId, dateRange, taskProjectMap]);

  const isLoading = tasksLoading || subtasksLoading || projectsLoading;

  return (
    <Layout title="Calendar" fullWidth>
      <div className="space-y-4">
        {/* Header section */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Left: Title & Project Filter */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-1">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-600 to-cyan-700 bg-clip-text text-transparent shrink-0">
                Calendar
              </h1>
              <div className="w-full sm:max-w-xs">
                <ProjectSelector
                  selectedProjectId={selectedProjectId}
                  onChange={handleProjectChange}
                  className="w-full border-slate-200"
                  theme="slate"
                />
              </div>
              {/* Quick Add Buttons */}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setAddTaskDialogOpen(true)}
                  className="gap-1"
                >
                  <Plus className="h-4 w-4" />
                  Task
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setAddSubtaskDialogOpen(true)}
                  className="gap-1"
                >
                  <ListTree className="h-4 w-4" />
                  Schedule Subtask
                </Button>
              </div>
            </div>

            {/* Right: Calendar Navigation & View Toggle */}
            <CalendarHeader
              currentDate={currentDate}
              view={view}
              onPrevious={handlePrevious}
              onNext={handleNext}
              onToday={handleToday}
              onViewChange={handleViewChange}
            />
          </div>
        </div>

        {/* Calendar View */}
        {isLoading ? (
          <div className="bg-white rounded-lg border border-gray-200 p-8 flex items-center justify-center">
            <div className="text-gray-500">Loading calendar...</div>
          </div>
        ) : (
          <>
            {view === "day" && (
              <DayView
                selectedDate={currentDate}
                tasks={filteredTasks}
                subtasks={filteredSubtasks}
                taskMap={taskMap}
                onBack={handleBackFromDayView}
                onAddTask={handleAddTask}
              />
            )}
            {view === "month" && (
              <MonthView
                currentDate={currentDate}
                tasks={filteredTasks}
                subtasks={filteredSubtasks}
                taskMap={taskMap}
                onAddTask={handleAddTask}
                onDayClick={handleDayClick}
              />
            )}
            {view === "week" && (
              <WeekView
                currentDate={currentDate}
                tasks={filteredTasks}
                subtasks={filteredSubtasks}
                taskMap={taskMap}
                onAddTask={handleAddTask}
                onDayClick={handleDayClick}
              />
            )}
            {view === "gantt" && (
              <CalendarGanttView
                tasks={filteredTasks}
                subtasks={filteredSubtasks}
                taskMap={taskMap}
              />
            )}
          </>
        )}

        {/* Task count summary */}
        <div className="text-sm text-gray-500 text-center">
          {filteredTasks.length} task{filteredTasks.length !== 1 ? "s" : ""}
          {filteredSubtasks.length > 0 && (
            <span>, {filteredSubtasks.length} subtask{filteredSubtasks.length !== 1 ? "s" : ""}</span>
          )}
          {" "}in view
          {selectedProjectId !== undefined && (
            <span className="ml-1">
              (filtered by project)
            </span>
          )}
        </div>
      </div>

      {/* Quick Add Task Dialog */}
      <QuickAddTaskDialog
        open={addTaskDialogOpen}
        onOpenChange={setAddTaskDialogOpen}
        defaultDate={addTaskDate}
        defaultProjectId={selectedProjectId}
      />

      {/* Schedule Existing Subtask Dialog */}
      <ScheduleSubtaskDialog
        open={addSubtaskDialogOpen}
        onOpenChange={setAddSubtaskDialogOpen}
        defaultDate={addTaskDate}
        defaultProjectId={selectedProjectId}
      />
    </Layout>
  );
}
