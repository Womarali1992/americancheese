import React, { useState, useEffect } from "react";
import { format, eachDayOfInterval, addDays, subDays, differenceInDays } from "date-fns";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { 
  Calendar, Clock, User, Tag, CheckCircle, ChevronLeft, 
  ChevronRight, Users, Package, Plus, Edit
} from "lucide-react";
import { EditTaskDialog } from "@/pages/tasks/EditTaskDialog";
import { Task } from "@/../../shared/schema";
import { TaskAttachments } from "@/components/task/TaskAttachments";

interface GanttTask {
  id: number;
  title: string;
  description: string | null;
  startDate: Date;
  endDate: Date;
  status: string;
  assignedTo: string | null;
  category: string; 
  contactIds: string[] | number[] | null;
  materialIds: string[] | number[] | null;
  projectId: number;
  completed: boolean | null;
  materialsNeeded: string | null;
  durationDays?: number;
}

// Convert GanttTask to Task for EditTaskDialog
const convertGanttTaskToTask = (ganttTask: GanttTask): Task => {
  return {
    id: ganttTask.id,
    title: ganttTask.title,
    description: ganttTask.description || "",
    status: ganttTask.status,
    startDate: ganttTask.startDate.toISOString(),
    endDate: ganttTask.endDate.toISOString(),
    assignedTo: ganttTask.assignedTo || "",
    projectId: ganttTask.projectId,
    completed: ganttTask.completed || false,
    category: ganttTask.category,
    contactIds: ganttTask.contactIds ? ganttTask.contactIds.map(id => id.toString()) : [],
    materialIds: ganttTask.materialIds ? ganttTask.materialIds.map(id => id.toString()) : [],
    materialsNeeded: ganttTask.materialsNeeded || ""
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
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedTask, setSelectedTask] = useState<GanttTask | null>(null);
  const [editTaskOpen, setEditTaskOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  
  // Create a 10-day view
  const startDate = currentDate;
  const endDate = addDays(startDate, 9);
  const days = eachDayOfInterval({ start: startDate, end: endDate });
  
  // Navigation
  const goToPreviousPeriod = () => setCurrentDate(prevDate => subDays(prevDate, 10));
  const goToNextPeriod = () => setCurrentDate(prevDate => addDays(prevDate, 10));
  
  // Status colors
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "in_progress": return "bg-blue-100 border-blue-400 text-blue-700";
      case "completed": return "bg-green-100 border-green-400 text-green-700";
      case "delayed": return "bg-amber-100 border-amber-400 text-amber-700";
      case "cancelled": return "bg-rose-100 border-rose-400 text-rose-700";
      default: return "bg-slate-100 border-slate-500 text-slate-700";
    }
  };

  const calculateTaskBar = (task: GanttTask) => {
    // Responsive column width
    const isMobile = window.innerWidth < 768;
    const columnWidth = isMobile ? 60 : 100; // Width of each day column in pixels - smaller on mobile
    
    // Convert task dates to Date objects if they're not already
    const taskStart = task.startDate instanceof Date ? task.startDate : new Date(task.startDate);
    const taskEnd = task.endDate instanceof Date ? task.endDate : new Date(task.endDate);
    
    // Reset hours, minutes, seconds to do accurate day comparisons
    const taskStartNoTime = new Date(taskStart);
    taskStartNoTime.setHours(0, 0, 0, 0);
    
    const taskEndNoTime = new Date(taskEnd);
    taskEndNoTime.setHours(0, 0, 0, 0);
    
    const viewStartNoTime = new Date(days[0]);
    viewStartNoTime.setHours(0, 0, 0, 0);
    
    // Calculate days difference between task start and view start
    // Use a date with time parts reset to avoid time-of-day issues
    const millisecondsPerDay = 1000 * 60 * 60 * 24;
    const dayDiff = Math.round(
      (taskStartNoTime.getTime() - viewStartNoTime.getTime()) / millisecondsPerDay
    );
    
    // Position the task based on day difference
    let left = dayDiff * columnWidth;
    
    // For tasks that start before the visible range
    if (dayDiff < 0) {
      left = 0;
    }
    
    // Calculate width based on task duration in days
    // Add 1 to include both start and end days
    const taskDuration = Math.round(
      (taskEndNoTime.getTime() - taskStartNoTime.getTime()) / millisecondsPerDay
    ) + 1;
    
    // Ensure minimum width to display the task name
    let width = Math.max(columnWidth, taskDuration * columnWidth);
    
    // If task starts before the view, adjust width accordingly
    if (dayDiff < 0) {
      // Reduce width by the number of days before view start
      width = Math.max(columnWidth, (taskDuration + dayDiff) * columnWidth);
    }
    
    // Always show at least the minimum width
    width = Math.max(columnWidth, width);
    
    return { 
      left, 
      width, 
      isVisible: true 
    };
  };

  const handleTaskClick = (task: GanttTask) => {
    setSelectedTask(task);
  };

  const handleEditClick = () => {
    if (selectedTask) {
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
    <div className={cn("overflow-x-auto pb-2", className)}>
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
      
      {/* Gantt Chart */}
      <div className="border rounded-md w-full" style={{ minWidth: isMobile ? "800px" : "1000px" }}>
        {/* Header - Days */}
        <div className="flex border-b border-slate-200 bg-slate-50">
          <div className="flex-1 flex">
            {days.map((day, index) => (
              <div 
                key={index}
                className={cn(
                  `${isMobile ? 'w-[60px]' : 'w-[100px]'} flex-shrink-0 text-center py-3 text-xs font-medium border-r border-slate-200 last:border-r-0`,
                  day.getDay() === 0 || day.getDay() === 6 
                    ? "bg-slate-100 text-slate-500" 
                    : "text-slate-600"
                )}
              >
                <div className="mb-1">{format(day, isMobile ? 'E' : 'EEE')}</div>
                <div>{format(day, 'd')}</div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Task Rows */}
        <div className="bg-white">
          {tasks.map((task) => {
            const { left, width, isVisible } = calculateTaskBar(task);
            const taskDuration = differenceInDays(new Date(task.endDate), new Date(task.startDate)) + 1;
            
            return (
              <div 
                key={task.id}
                className="border-b border-slate-200 last:border-b-0 relative h-16"
              >
                {/* Timeline with task bar */}
                {isVisible && (
                  <div 
                    className="absolute my-4 cursor-pointer"
                    style={{ 
                      left: `${left}px`, 
                      width: `${width}px`,
                    }}
                    onClick={() => handleTaskClick(task)}
                  >
                    <div 
                      className={cn(
                        "h-8 rounded flex items-center justify-center px-3 transition-colors w-full",
                        "hover:brightness-95 shadow-sm",
                        getStatusColor(task.status)
                      )}
                    >
                      <div className="flex justify-between items-center w-full">
                        <span className="text-xs font-medium truncate flex-1 text-center">{task.title}</span>
                      </div>
                    </div>
                  </div>
                )}
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
                {selectedTask?.title || "Task Details"}
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
                      {format(new Date(selectedTask.startDate), 'dd MMM yyyy')}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-slate-500" />
                  <div>
                    <p className="text-xs text-slate-500">End Date</p>
                    <p className="text-sm font-medium">
                      {format(new Date(selectedTask.endDate), 'dd MMM yyyy')}
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
                      {differenceInDays(new Date(selectedTask.endDate), new Date(selectedTask.startDate)) + 1} days
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Always show contacts section with TaskAttachments component */}
              <div className="mt-4 border-t pt-4 border-slate-200">
                <h4 className="text-sm font-medium text-slate-700 mb-2">Attachments</h4>
                {/* Use the TaskAttachments component to display contacts and materials */}
                {selectedTask && (
                  <div className="p-2 bg-slate-50 rounded-md">
                    <TaskAttachments 
                      task={{
                        id: selectedTask.id,
                        title: selectedTask.title,
                        description: selectedTask.description || undefined,
                        status: selectedTask.status,
                        startDate: selectedTask.startDate.toISOString(),
                        endDate: selectedTask.endDate.toISOString(),
                        assignedTo: selectedTask.assignedTo || undefined,
                        projectId: selectedTask.projectId,
                        completed: selectedTask.completed || false,
                        category: selectedTask.category,
                        contactIds: selectedTask.contactIds || [],
                        materialIds: selectedTask.materialIds || [],
                        materialsNeeded: selectedTask.materialsNeeded || undefined
                      }} 
                    />
                  </div>
                )}
              </div>
              
              {/* Show materials needed if specified */}
              {selectedTask.materialsNeeded && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-slate-700 mb-2">Materials Needed</h4>
                  <p className="text-sm text-slate-600">{selectedTask.materialsNeeded}</p>
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
          task={taskToEdit}
        />
      )}
    </div>
  );
}