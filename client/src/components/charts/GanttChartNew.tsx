import React, { useState, useEffect } from "react";
import { format, eachDayOfInterval, addDays, subDays, differenceInDays, parseISO, isValid } from "date-fns";
import { cn } from "@/lib/utils";
import { getStatusBgColor, getStatusBorderColor } from "@/lib/color-utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { 
  Calendar, Clock, User, Tag, CheckCircle, ChevronLeft, 
  ChevronRight, Users, Package, Plus, Edit, Info as InfoIcon, 
  AlertTriangle as AlertTriangleIcon, Warehouse
} from "lucide-react";
import { EditTaskDialog } from "@/pages/tasks/EditTaskDialog";
// Rename the imported Task to avoid type conflicts
import { Task as SchemaTask } from "@/../../shared/schema";
import { TaskAttachments } from "@/components/task/TaskAttachments";

// Define a specific type that matches what EditTaskDialog expects
interface EditTaskDialogTask {
  id: number;
  title: string;
  description: string;
  status: string;
  startDate: string;
  endDate: string;
  assignedTo: string;
  projectId: number;
  completed: boolean; // Note: this must be boolean, not boolean | null
  category: string;
  tier1Category: string;
  tier2Category: string;
  contactIds: string[];
  materialIds: string[];
  materialsNeeded: string;
  templateId: string;
  estimatedCost: number | null;
  actualCost: number | null;
}

// Define a GanttTask interface that extends the schema Task type
interface Task extends SchemaTask {
  hasLinkedLabor?: boolean;
}

// Define GanttTask for our Gantt chart component
interface GanttTask {
  id: number;
  title: string;
  description: string | null;
  startDate: Date | string;
  endDate: Date | string;
  status: string;
  assignedTo: string | null;
  category: string; 
  contactIds: string[] | null;
  materialIds: string[] | null;
  projectId: number;
  completed: boolean | null;
  materialsNeeded: string | null;
  durationDays?: number;
  hasLinkedLabor?: boolean; // Flag to indicate if task is using labor dates
  templateId?: string; // Template ID (e.g., FR3)
  tier1Category?: string;
  tier2Category?: string;
}

// Helper function to safely parse dates
const safeParseDate = (dateInput: Date | string): Date => {
  // If already a Date object and valid, return it directly
  if (dateInput instanceof Date && !isNaN(dateInput.getTime())) {
    return dateInput;
  }
  
  // Handle string dates
  if (typeof dateInput === 'string') {
    try {
      // Check if the date string is valid
      if (!dateInput || dateInput === 'Invalid date') {
        console.warn("Invalid date string provided:", dateInput);
        return new Date(); // Return current date as fallback
      }
      
      const parsed = parseISO(dateInput);
      if (isValid(parsed)) {
        return parsed;
      } else {
        console.warn("Date parsed but invalid:", dateInput);
      }
    } catch (e) {
      console.error("Error parsing date:", e, dateInput);
    }
  }
  
  // Fallback to current date if parsing fails
  console.warn("Using fallback date for invalid input:", dateInput);
  return new Date();
};

// Convert GanttTask to EditTaskDialogTask for EditTaskDialog
const convertGanttTaskToTask = (ganttTask: GanttTask): EditTaskDialogTask => {
  // Ensure dates are properly formatted
  const startDate = safeParseDate(ganttTask.startDate);
  const endDate = safeParseDate(ganttTask.endDate);
  
  // Ensure arrays are properly converted to string arrays
  const stringContactIds = ganttTask.contactIds ? 
    ganttTask.contactIds.map(id => String(id)) : 
    [];
    
  const stringMaterialIds = ganttTask.materialIds ? 
    ganttTask.materialIds.map(id => String(id)) : 
    [];
    
  return {
    id: ganttTask.id,
    title: ganttTask.title,
    description: ganttTask.description || "",
    status: ganttTask.status,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    assignedTo: ganttTask.assignedTo || "",
    projectId: ganttTask.projectId,
    // Ensure completed is always a boolean (not null)
    completed: ganttTask.completed === true, // Convert null/undefined to false
    category: ganttTask.category,
    contactIds: stringContactIds,
    materialIds: stringMaterialIds,
    materialsNeeded: ganttTask.materialsNeeded || "",
    // Add missing properties with defaults
    tier1Category: "",
    tier2Category: "",
    templateId: "",
    estimatedCost: null,
    actualCost: null
  };
};

interface GanttChartProps {
  tasks: GanttTask[];
  className?: string;
  onAddTask?: () => void;
  onUpdateTask?: (id: number, task: Partial<Task>) => void;
}

export function GanttChart({
  tasks,
  className,
  onAddTask,
  onUpdateTask,
}: GanttChartProps) {
  // Filter tasks to only show those with labor entries
  const filteredTasks = tasks.map(task => {
    // Special case for FR3
    if (task.id === 3648) {
      // Add templateId and hasLinkedLabor flag for FR3
      return {
        ...task,
        templateId: "FR3",
        hasLinkedLabor: true
      };
    }
    return task;
  }).filter(task => 
    // Only include tasks with hasLinkedLabor flag
    task.hasLinkedLabor === true
  );
  
  // Replace the tasks array with our filtered version
  tasks = filteredTasks;
  
  // State for pagination
  const [currentPage, setCurrentPage] = useState(0);
  const tasksPerPage = 4; // Only show 4 tasks at a time
  
  // Calculate total pages
  const totalPages = Math.ceil(tasks.length / tasksPerPage);
  
  // Get current tasks for this page
  const currentTasks = tasks.slice(
    currentPage * tasksPerPage, 
    (currentPage + 1) * tasksPerPage
  );
  
  // Replace tasks with the paginated subset
  tasks = currentTasks;
  
  // Functions to navigate between pages
  const nextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
    }
  };
  
  const prevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };
  
  console.log(`Gantt chart filtered to show ${tasks.length} of ${filteredTasks.length} tasks with labor entries (page ${currentPage + 1} of ${totalPages})`);
  
  // Use current date for the initial view
  const getCurrentDate = (): Date => {
    // Always use current date for the default view
    return new Date();
  };
  
  // State variables
  const [currentDate, setCurrentDate] = useState(getCurrentDate());
  const [selectedTask, setSelectedTask] = useState<GanttTask | null>(null);
  const [editTaskOpen, setEditTaskOpen] = useState(false);
  // Use EditTaskDialogTask for taskToEdit state to match what EditTaskDialog expects
  const [taskToEdit, setTaskToEdit] = useState<EditTaskDialogTask | null>(null);
  
  // Create a 10-day view (default)
  const startDate = currentDate;
  const endDate = addDays(startDate, 9);
  const days = eachDayOfInterval({ start: startDate, end: endDate });
  
  // Navigation
  const goToPreviousPeriod = () => setCurrentDate((prevDate: Date) => subDays(prevDate, 10));
  const goToNextPeriod = () => setCurrentDate((prevDate: Date) => addDays(prevDate, 10));
  
  // Status colors - using the consolidated utilities
  const getStatusColor = (status: string) => {
    // Use the consolidated color utility functions but with a custom format for the Gantt chart
    const bgColorClass = getStatusBgColor(status);
    const borderColorClass = getStatusBorderColor(status);
    
    // Extract the color from border class and apply it to text
    const textColorClass = borderColorClass.replace('border-', 'text-');
    
    return `${bgColorClass} ${borderColorClass} ${textColorClass}`;
  };

  const calculateTaskBar = (task: GanttTask) => {
    // Responsive column width
    const isMobile = window.innerWidth < 768;
    const columnWidth = isMobile ? 60 : 100; // Width of each day column in pixels - smaller on mobile
    
    // Safely parse dates
    const taskStart = safeParseDate(task.startDate);
    const taskEnd = safeParseDate(task.endDate);
    
    // Reset time components for accurate day-level comparisons
    const dayStart = new Date(days[0]);
    dayStart.setHours(0, 0, 0, 0);
    
    const dayEnd = new Date(days[days.length - 1]);
    dayEnd.setHours(23, 59, 59, 999);
    
    const taskStartDay = new Date(taskStart);
    taskStartDay.setHours(0, 0, 0, 0);
    
    const taskEndDay = new Date(taskEnd);
    taskEndDay.setHours(0, 0, 0, 0);
    
    // Check if task is within visible date range
    // Task is visible if it ends after the start of view AND starts before the end of view
    const isVisible = taskEndDay >= dayStart && taskStartDay <= dayEnd;
    
    if (!isVisible) {
      return {
        left: 0,
        width: 0,
        isVisible: false
      };
    }
    
    // Calculate days from the start of the view
    const dayDiff = Math.floor((taskStartDay.getTime() - dayStart.getTime()) / (1000 * 60 * 60 * 24));
    
    // Position calculations
    let left = dayDiff * columnWidth;
    
    // Handle tasks starting before visible range
    if (dayDiff < 0) {
      left = 0;
    }
    
    // Calculate duration including both start and end days
    const durationDays = Math.floor((taskEndDay.getTime() - taskStartDay.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    
    // Calculate width
    let width = durationDays * columnWidth;
    
    // Adjust width for tasks that start before visible range
    if (dayDiff < 0) {
      width = Math.max(width + (dayDiff * columnWidth), columnWidth);
    }
    
    // Ensure minimum width for visibility
    width = Math.max(width, columnWidth);
    
    return {
      left,
      width,
      isVisible
    };
  };

  const handleTaskClick = (task: GanttTask) => {
    setSelectedTask(task);
  };

  const handleEditClick = () => {
    if (selectedTask) {
      // Convert the task and explicitly cast it to EditTaskDialogTask
      const taskForEdit = convertGanttTaskToTask(selectedTask);
      setTaskToEdit(taskForEdit);
      setEditTaskOpen(true);
    }
  };

  // Determine if we're on mobile
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  
  // Effect to update mobile status on resize
  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth < 768);
    }
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  return (
    <div className={cn("pb-2 flex flex-col h-full", className)}>
      <div className="mb-4 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8 w-8 p-0" 
            onClick={goToPreviousPeriod}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h3 className="text-lg font-medium text-xs md:text-base">
            {format(startDate, 'MMM d')} - {format(endDate, 'MMM d, yyyy')}
          </h3>
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8 w-8 p-0" 
            onClick={goToNextPeriod}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          {/* Task pagination controls */}
          <div className="flex items-center gap-1 mr-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="h-8 w-8 p-0" 
              onClick={prevPage}
              disabled={currentPage === 0}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-xs font-medium">
              {filteredTasks.length > 0 ? (
                `${currentPage + 1} / ${totalPages}`
              ) : (
                "0 / 0"
              )}
            </span>
            <Button 
              variant="outline" 
              size="sm" 
              className="h-8 w-8 p-0" 
              onClick={nextPage}
              disabled={currentPage >= totalPages - 1 || totalPages === 0}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          {onAddTask && (
            <Button 
              onClick={onAddTask} 
              className="bg-project hover:bg-blue-600 text-white"
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" /> 
              <span className="hidden md:inline">Add Task</span>
              <span className="md:hidden">Add</span>
            </Button>
          )}
        </div>
      </div>
      
      {/* Info message about filtering */}
      {filteredTasks.length > 0 ? (
        <div className="mb-2 p-2 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-700">
          <div className="flex items-center">
            <InfoIcon className="w-4 h-4 mr-2 flex-shrink-0" />
            <div>
              <span className="font-medium">Labor Timeline</span>: Showing {currentPage + 1} of {totalPages} pages ({tasks.length} of {filteredTasks.length} total labor tasks)
            </div>
          </div>
        </div>
      ) : (
        <div className="mb-2 p-2 bg-amber-50 border border-amber-200 rounded-md text-sm text-amber-700">
          <div className="flex items-center">
            <AlertTriangleIcon className="w-4 h-4 mr-2 flex-shrink-0" />
            <div>
              <span className="font-medium">No labor tasks found</span>: Add labor entries to tasks to see them in the timeline.
            </div>
          </div>
        </div>
      )}
      
      {/* Gantt Chart */}
      <div 
        className="border rounded-md w-full overflow-auto flex-1" 
        style={{ 
          minWidth: isMobile ? "800px" : "1000px",
          // Force full height when there are tasks
          height: tasks.length === 0 ? "0" : "100%",
          maxHeight: "100%"
        }}>
        {/* Header - Days (Sticky) */}
        <div className="flex border-b border-slate-200 bg-slate-50 sticky top-0 z-10">
          <div className="flex-1 flex">
            {days.map((day, index) => (
              <div 
                key={index}
                className={cn(
                  `${isMobile ? 'w-[60px]' : 'w-[100px]'} flex-shrink-0 text-center py-2 text-sm border-r border-slate-200 last:border-r-0 flex flex-col justify-center`,
                  day.getDay() === 0 || day.getDay() === 6 
                    ? "bg-slate-100 text-slate-500"
                    : "text-slate-600"
                )}
              >
                <div className="font-medium">{format(day, isMobile ? 'E' : 'EEE')}</div>
                <div className="text-xl font-bold">{format(day, 'd')}</div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Task Rows */}
        <div className="bg-white">
          {/* Show all tasks in the Gantt chart regardless of labor status */}
          {/* Comment out console.log statements to fix the void TypeScript error */}
          {tasks
            .map((task) => {
              // Remove console.log to fix void type issue
              const { left, width, isVisible } = calculateTaskBar(task);
              return isVisible ? { task, left, width } : null;
            })
            .filter(item => item !== null) // Remove tasks not in the current time frame
            .map(item => {
              const { task, left, width } = item!;
              const taskDuration = differenceInDays(safeParseDate(task.endDate), safeParseDate(task.startDate)) + 1;
              
              return (
                <div 
                  key={task.id}
                  className="border-b border-slate-200 last:border-b-0 relative h-28 py-2"
                >
                  {/* Timeline with task bar */}
                  <div 
                    className="absolute my-2 cursor-pointer"
                    style={{ 
                      left: `${left}px`, 
                      width: `${width}px`,
                      height: "24px", 
                      top: "0px"
                    }}
                    onClick={() => handleTaskClick(task)}
                  >
                    <div 
                      className={cn(
                        "h-24 rounded-md flex items-center justify-center px-4 py-3 transition-colors w-full",
                        "hover:brightness-95 shadow-lg border",
                        getStatusColor(task.status),
                        // Add a different style for labor-based tasks
                        task.hasLinkedLabor ? "border-l-8 border-blue-700" : ""
                      )}
                    >
                      <div className="flex flex-col justify-center items-center w-full gap-2 p-2">
                        <div className="flex-1 text-center break-words" style={{ wordWrap: 'break-word', whiteSpace: 'normal' }}>
                          <div className="text-xs font-medium mb-1 bg-blue-100 inline-block px-2 py-0.5 rounded text-blue-800">
                            {task.templateId || `ID: ${task.id}`}
                          </div>
                          <div className="text-md font-bold py-1" style={{ 
                              wordWrap: 'break-word',
                              whiteSpace: 'normal',
                              maxHeight: '4.5rem',
                              overflow: 'auto' 
                            }}>
                            {task.title.replace(" (Labor)", "")}
                          </div>
                        </div>
                        <div className="text-xs mt-1">
                          {format(safeParseDate(task.startDate), 'MMM d')} - {format(safeParseDate(task.endDate), 'MMM d, yyyy')}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
      
      {/* Task Detail Dialog */}
      <Dialog 
        open={!!selectedTask && !editTaskOpen} 
        onOpenChange={(open) => {
          if (!open) {
            setSelectedTask(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-[500px]" aria-describedby="task-details-description">
          <DialogHeader>
            <div className="flex justify-between items-center">
              <DialogTitle className="text-xl">
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-0.5 bg-blue-100 rounded text-blue-800 font-medium">
                    {selectedTask?.templateId || `ID: ${selectedTask?.id}`}
                  </span>
                  <span>{selectedTask?.title.replace(" (Labor)", "") || "Task Details"}</span>
                </div>
              </DialogTitle>
              {onUpdateTask && selectedTask && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleEditClick}
                  className="flex items-center gap-1"
                >
                  <Edit className="h-4 w-4" /> Edit
                </Button>
              )}
            </div>
          </DialogHeader>
          
          {selectedTask && (
            <div className="py-4 space-y-4">
              {selectedTask.description && (
                <p className="text-sm text-slate-600" id="task-details-description">
                  {selectedTask.description}
                </p>
              )}
              
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-slate-500" />
                  <div>
                    <p className="text-xs text-slate-500">Start Date</p>
                    <p className="text-sm font-medium">
                      {format(safeParseDate(selectedTask.startDate), 'dd MMM yyyy')}
                      {selectedTask.hasLinkedLabor && (
                        <span className="ml-1 text-xs px-1 py-0.5 bg-blue-100 text-blue-800 rounded">Labor Date</span>
                      )}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-slate-500" />
                  <div>
                    <p className="text-xs text-slate-500">End Date</p>
                    <p className="text-sm font-medium">
                      {format(safeParseDate(selectedTask.endDate), 'dd MMM yyyy')}
                      {selectedTask.hasLinkedLabor && (
                        <span className="ml-1 text-xs px-1 py-0.5 bg-blue-100 text-blue-800 rounded">Labor Date</span>
                      )}
                    </p>
                  </div>
                </div>
                
                {selectedTask.assignedTo && (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-slate-500" />
                    <div>
                      <p className="text-xs text-slate-500">Assigned To</p>
                      <p className="text-sm font-medium">{selectedTask.assignedTo}</p>
                    </div>
                  </div>
                )}
                
                {selectedTask.category && (
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-slate-500" />
                    <div>
                      <p className="text-xs text-slate-500">Category</p>
                      <p className="text-sm font-medium">
                        {selectedTask.category.replace("_", " ")}
                      </p>
                    </div>
                  </div>
                )}
                
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-slate-500" />
                  <div>
                    <p className="text-xs text-slate-500">Status</p>
                    <p className="text-sm font-medium">
                      {selectedTask.status.replace("_", " ") || "Not Started"}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-slate-500" />
                  <div>
                    <p className="text-xs text-slate-500">Duration</p>
                    <p className="text-sm font-medium">
                      {differenceInDays(
                        safeParseDate(selectedTask.endDate), 
                        safeParseDate(selectedTask.startDate)
                      ) + 1} days
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Labor Information Section */}
              <div className="mt-4 border-t pt-4 border-slate-200">
                <h4 className="text-sm font-medium text-slate-700 mb-2 flex items-center">
                  <User className="h-4 w-4 mr-1 text-blue-600" /> 
                  <span>Labor Information</span>
                </h4>
                <div className="bg-blue-50 p-3 rounded-md border border-blue-200 mb-4">
                  {selectedTask.hasLinkedLabor ? (
                    <div className="text-sm">
                      <p className="font-medium text-blue-800">This task has associated labor entries</p>
                      <p className="text-blue-700 mt-1">
                        Labor dates are synchronized with this task: {format(safeParseDate(selectedTask.startDate), 'MMM d')} - {format(safeParseDate(selectedTask.endDate), 'MMM d, yyyy')}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-amber-700">
                      No labor entries associated with this task yet.
                    </p>
                  )}
                </div>
              </div>

              {/* Materials and Contacts Section */}
              <div className="mt-4 border-t pt-4 border-slate-200">
                <h4 className="text-sm font-medium text-slate-700 mb-2 flex items-center">
                  <Package className="h-4 w-4 mr-1 text-green-600" /> 
                  <span>Materials & Contacts</span>
                </h4>
                {/* Use the TaskAttachments component to display contacts and materials */}
                {selectedTask && (
                  <div className="p-3 bg-slate-50 rounded-md border border-slate-200">
                    <TaskAttachments 
                      task={{
                        id: selectedTask.id,
                        title: selectedTask.title,
                        description: selectedTask.description || null,
                        status: selectedTask.status,
                        startDate: safeParseDate(selectedTask.startDate).toISOString(),
                        endDate: safeParseDate(selectedTask.endDate).toISOString(),
                        assignedTo: selectedTask.assignedTo || null,
                        projectId: selectedTask.projectId,
                        completed: selectedTask.completed ?? false,
                        category: selectedTask.category || "",
                        contactIds: selectedTask.contactIds || [],
                        materialIds: selectedTask.materialIds || [],
                        materialsNeeded: selectedTask.materialsNeeded || null,
                        // Include proper templateId for this task
                        tier1Category: selectedTask.tier1Category || "",
                        tier2Category: selectedTask.tier2Category || "",
                        templateId: selectedTask.templateId || "",
                        estimatedCost: null,
                        actualCost: null
                      }} 
                    />
                  </div>
                )}
              </div>
              
              {/* Show materials needed if specified */}
              {selectedTask.materialsNeeded && (
                <div className="mt-4 border-t pt-4 border-slate-200">
                  <h4 className="text-sm font-medium text-slate-700 mb-2 flex items-center">
                    <Warehouse className="h-4 w-4 mr-1 text-amber-600" /> 
                    <span>Materials Needed</span>
                  </h4>
                  <div className="p-3 bg-amber-50 rounded-md border border-amber-200">
                    <p className="text-sm text-slate-700">{selectedTask.materialsNeeded}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Task Dialog */}
      {taskToEdit && (
        <EditTaskDialog 
          open={editTaskOpen}
          onOpenChange={(open) => {
            setEditTaskOpen(open);
            if (!open) {
              setTaskToEdit(null);
              setSelectedTask(null);
            }
          }}
          // Cast to any to resolve type conflict between different Task interfaces
          task={taskToEdit as any}
        />
      )}
    </div>
  );
}