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
import { Button } from "@/components/ui/button";
import { Plus, ListTree, Folder, X } from "lucide-react";
import { useNavPills } from "@/hooks/useNavPills";
import type { Task, Project, Subtask } from "@shared/schema";

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<CalendarView>("month");
  const [selectedProjectId, setSelectedProjectId] = useState<number | undefined>(undefined);
  const [addTaskDialogOpen, setAddTaskDialogOpen] = useState(false);
  const [addSubtaskDialogOpen, setAddSubtaskDialogOpen] = useState(false);
  const [addTaskDate, setAddTaskDate] = useState<Date>(new Date());
  const [hoveredFolderId, setHoveredFolderId] = useState<number | null>(null);

  // Inject nav pills for TopNav
  useNavPills("events");

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

  const { data: projectFolders = [] } = useQuery<any[]>({
    queryKey: ["/api/project-folders"],
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
      if (task.calendarActive === false) return false;
      if (selectedProjectId !== undefined && task.projectId !== selectedProjectId) {
        return false;
      }
      const effectiveStartDate = task.calendarStartDate || task.startDate;
      const effectiveEndDate = task.calendarEndDate || task.endDate;
      if (!effectiveStartDate || !effectiveEndDate) return false;
      try {
        const taskStart = parseISO(effectiveStartDate);
        const taskEnd = parseISO(effectiveEndDate);
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
      if (subtask.calendarActive === false) return false;
      const projectId = taskProjectMap.get(subtask.parentTaskId);
      if (selectedProjectId !== undefined && projectId !== selectedProjectId) {
        return false;
      }
      const effectiveStartDate = subtask.calendarStartDate || subtask.startDate;
      const effectiveEndDate = subtask.calendarEndDate || subtask.endDate;
      if (!effectiveStartDate || !effectiveEndDate) return false;
      try {
        const subtaskStart = parseISO(effectiveStartDate);
        const subtaskEnd = parseISO(effectiveEndDate);
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
        {/* Unified Header Card */}
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm w-full min-w-0 overflow-x-hidden"
          onMouseLeave={() => setHoveredFolderId(null)}
        >
          {/* Row 1: Title + Folder badges + Controls */}
          <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-[#0891b2] to-[#0e7490] bg-clip-text text-transparent flex-shrink-0">Calendar</h1>

            {/* Folder badges */}
            <div className="flex items-center gap-1.5 flex-wrap flex-1 min-w-0">
              {projectFolders.map((folder: any) => {
                const folderProjectCount = projects.filter((p: any) => p.folderId === folder.id).length;
                const isHovered = hoveredFolderId === folder.id;
                const hasSelectedProject = selectedProjectId !== undefined && projects.find((p: any) => p.id === selectedProjectId)?.folderId === folder.id;
                return (
                  <div
                    key={folder.id}
                    className="relative"
                    onMouseEnter={() => setHoveredFolderId(folder.id)}
                  >
                    <button
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
                        hasSelectedProject
                          ? 'bg-cyan-600 text-white border-cyan-600'
                          : isHovered
                            ? 'bg-cyan-50 text-cyan-600 border-cyan-600'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-cyan-600 hover:text-cyan-600'
                      }`}
                    >
                      <Folder className="h-3 w-3" />
                      {folder.name}
                      <span className="opacity-60">({folderProjectCount})</span>
                    </button>
                  </div>
                );
              })}
              {/* Unfiled projects badge */}
              {(() => {
                const unfiledCount = projects.filter((p: any) => !p.folderId).length;
                if (unfiledCount === 0) return null;
                const isHovered = hoveredFolderId === -1;
                const hasSelectedProject = selectedProjectId !== undefined && !projects.find((p: any) => p.id === selectedProjectId)?.folderId;
                return (
                  <div
                    className="relative"
                    onMouseEnter={() => setHoveredFolderId(-1)}
                  >
                    <button
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
                        hasSelectedProject
                          ? 'bg-cyan-600 text-white border-cyan-600'
                          : isHovered
                            ? 'bg-cyan-50 text-cyan-600 border-cyan-600'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-cyan-600 hover:text-cyan-600'
                      }`}
                    >
                      Unfiled
                      <span className="opacity-60">({unfiledCount})</span>
                    </button>
                  </div>
                );
              })()}

              {selectedProjectId !== undefined && (
                <button
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-slate-500 hover:text-cyan-600 hover:bg-slate-50 transition-colors"
                  onClick={() => handleProjectChange("all")}
                >
                  <X className="h-3 w-3" />
                  Clear
                </button>
              )}
            </div>

            {/* Right-side controls: Quick Add + Calendar Nav */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setAddTaskDialogOpen(true)}
                className="gap-1 h-8 text-xs"
              >
                <Plus className="h-3.5 w-3.5" />
                Task
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setAddSubtaskDialogOpen(true)}
                className="gap-1 h-8 text-xs"
              >
                <ListTree className="h-3.5 w-3.5" />
                Subtask
              </Button>
            </div>
          </div>

          {/* Row 2: Calendar navigation controls */}
          <div className="px-3 sm:px-4 pb-3 border-t border-slate-100 pt-2">
            <CalendarHeader
              currentDate={currentDate}
              view={view}
              onPrevious={handlePrevious}
              onNext={handleNext}
              onToday={handleToday}
              onViewChange={handleViewChange}
            />
          </div>

          {/* Hover dropdown: projects in selected folder */}
          {hoveredFolderId !== null && (() => {
            const folderProjects = hoveredFolderId === -1
              ? projects.filter((p: any) => !p.folderId)
              : projects.filter((p: any) => p.folderId === hoveredFolderId);
            if (folderProjects.length === 0) return null;
            return (
              <div className="px-3 sm:px-4 pb-3 flex items-center gap-1.5 flex-wrap border-t border-slate-100 pt-2">
                {folderProjects.map((project: any) => {
                  const isSelected = selectedProjectId === project.id;
                  return (
                    <button
                      key={project.id}
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-cyan-600 text-white border-cyan-600'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-cyan-50 hover:border-cyan-600 hover:text-cyan-600'
                      }`}
                      onClick={() => handleProjectChange(project.id.toString())}
                    >
                      {project.name}
                    </button>
                  );
                })}
              </div>
            );
          })()}
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
