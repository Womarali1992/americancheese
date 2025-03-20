import { useState } from "react";
import { 
  format, 
  eachDayOfInterval, 
  startOfMonth, 
  endOfMonth, 
  addMonths, 
  subMonths, 
  addDays, 
  subDays 
} from "date-fns";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { 
  Calendar, 
  Clock, 
  User, 
  Tag, 
  CheckCircle, 
  ChevronLeft, 
  ChevronRight, 
  Users, 
  Package, 
  Plus,
  Edit
} from "lucide-react";
import { EditTaskDialog } from "@/pages/tasks/EditTaskDialog";
import { Task } from "@/../../shared/schema";

// Interface for tasks with dates as Date objects (coming from TasksTabView)
interface GanttTask {
  id: number;
  title: string;
  description: string | null;
  startDate: Date;  // Important: these come in as Date objects from TasksTabView
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

// Helper function to convert GanttTask to Task for EditTaskDialog
const convertGanttTaskToTask = (ganttTask: GanttTask): Task => {
  // Convert any number[] to string[] for compatibility with Task type
  const contactIdsStringArray = ganttTask.contactIds 
    ? ganttTask.contactIds.map(id => id.toString()) 
    : [];
    
  const materialIdsStringArray = ganttTask.materialIds 
    ? ganttTask.materialIds.map(id => id.toString()) 
    : [];
    
  // Create a Task object with the correct types
  const task: Task = {
    id: ganttTask.id,
    title: ganttTask.title,
    description: ganttTask.description || '',
    status: ganttTask.status,
    startDate: format(ganttTask.startDate, 'yyyy-MM-dd'),
    endDate: format(ganttTask.endDate, 'yyyy-MM-dd'),
    assignedTo: ganttTask.assignedTo || '',
    projectId: ganttTask.projectId,
    completed: ganttTask.completed || false,
    category: ganttTask.category,
    contactIds: contactIdsStringArray,
    materialIds: materialIdsStringArray,
    materialsNeeded: ganttTask.materialsNeeded || ''
  };
  
  return task;
}

interface TaskDayInfo {
  task: GanttTask;
  date: Date;
  dayIndex: number;
}

interface GanttChartProps {
  tasks: GanttTask[];
  period?: "week" | "month" | "quarter";
  className?: string;
  onAddTask?: () => void;
  onUpdateTask?: (id: number, task: Partial<Task>) => void;
}

export function GanttChart({
  tasks,
  period = "month",
  className,
  onAddTask,
  onUpdateTask,
}: GanttChartProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedTaskDay, setSelectedTaskDay] = useState<TaskDayInfo | null>(null);
  const [editTaskOpen, setEditTaskOpen] = useState(false);
  // For compatibility with EditTaskDialog, convert GanttTask back to Task format
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  
  // Use 10-day view instead of monthly view
  const startDate = currentDate;
  const endDate = addDays(currentDate, 9); // 10 days total (including start date)
  
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  // Navigate to previous 10 days
  const goToPreviousPeriod = () => {
    setCurrentDate(prevDate => subDays(prevDate, 10));
  };

  // Navigate to next 10 days
  const goToNextPeriod = () => {
    setCurrentDate(prevDate => addDays(prevDate, 10));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 border-green-500 text-green-800";
      case "in_progress":
        return "bg-amber-100 border-amber-500 text-amber-800";
      case "not_started":
        return "bg-slate-100 border-slate-500 text-slate-700";
      default:
        return "bg-slate-100 border-slate-500 text-slate-700";
    }
  };

  // Calculate position and width of task bar based on start and end dates
  const calculateTaskPosition = (task: GanttTask) => {
    const taskStart = new Date(task.startDate);
    const taskEnd = new Date(task.endDate);
    
    // Check if task starts or ends within the current month view
    const startOfView = days[0];
    const endOfView = days[days.length - 1];
    
    // A task is in view if any part of it falls within the current view period
    const taskIsInView = (
      // Task starts within current view
      (taskStart >= startOfView && taskStart <= endOfView) ||
      // Task ends within current view
      (taskEnd >= startOfView && taskEnd <= endOfView) ||
      // Task spans the entire view (starts before and ends after)
      (taskStart <= startOfView && taskEnd >= endOfView)
    );
    
    // For backwards compatibility
    const startInView = days.some(day => 
      day.getDate() === taskStart.getDate() && 
      day.getMonth() === taskStart.getMonth() &&
      day.getFullYear() === taskStart.getFullYear()
    );
    
    const endInView = days.some(day => 
      day.getDate() === taskEnd.getDate() &&
      day.getMonth() === taskEnd.getMonth() &&
      day.getFullYear() === taskEnd.getFullYear()
    );
    
    // Find the position (day index) where this task starts
    let startIndex;
    
    if (startInView) {
      // If task starts within the current view, find its exact day index
      startIndex = days.findIndex(day => 
        day.getDate() === taskStart.getDate() && 
        day.getMonth() === taskStart.getMonth() &&
        day.getFullYear() === taskStart.getFullYear()
      );
    } else {
      // If task starts before the current view, check if it overlaps with the current view
      if (taskStart < days[0] && taskEnd >= days[0]) {
        startIndex = 0; // Task starts before current month but extends into it
      } else {
        startIndex = -1; // Task is not visible in current view
      }
    }
    
    // If the task doesn't overlap with current view, return empty values
    if (!taskIsInView || (startIndex === -1 && !endInView)) {
      return {
        left: "0px",
        width: "0px",
        startIndex: 0,
        visibleDuration: 0,
        isVisible: false
      };
    }
    
    // If the task starts before the current month, adjust start index to 0
    const adjustedStartIndex = startIndex === -1 ? 0 : startIndex;
    
    // Calculate the width in "day units"
    let taskDuration;
    
    if (endInView) {
      // Find the end day index
      const endIndex = days.findIndex(day => 
        day.getDate() === taskEnd.getDate() && 
        day.getMonth() === taskEnd.getMonth() &&
        day.getFullYear() === taskEnd.getFullYear()
      );
      
      taskDuration = endIndex - adjustedStartIndex + 1;
    } else if (taskEnd > days[days.length - 1]) {
      // Task extends beyond current view
      taskDuration = days.length - adjustedStartIndex;
    } else {
      // Fallback to calculated duration
      const durationDays = Math.ceil((taskEnd.getTime() - taskStart.getTime()) / (1000 * 60 * 60 * 24));
      taskDuration = durationDays || 1;
      
      // If task extends beyond current month, cap the duration
      if (adjustedStartIndex + taskDuration > days.length) {
        taskDuration = days.length - adjustedStartIndex;
      }
    }
    
    // Calculate left position in pixels (each day column is 32px)
    const leftPos = adjustedStartIndex * 32;
    
    // Calculate width in pixels
    const widthPx = taskDuration * 32;
    
    return {
      left: `${leftPos}px`,
      width: `${widthPx}px`,
      startIndex: adjustedStartIndex,
      visibleDuration: taskDuration,
      isVisible: true
    };
  };

  // Handle clicking on a specific day within a task bar
  const handleTaskDayClick = (task: GanttTask, dayIndex: number) => {
    const position = calculateTaskPosition(task);
    const dayDate = days[position.startIndex + dayIndex];
    
    setSelectedTaskDay({
      task,
      date: dayDate,
      dayIndex
    });
  };

  // Generate array of individual days for a task
  const generateTaskDays = (task: GanttTask) => {
    const position = calculateTaskPosition(task);
    
    // If the task isn't visible in the current view, return empty array
    if (!position.isVisible) {
      return [];
    }
    
    const taskDays = [];
    for (let i = 0; i < position.visibleDuration; i++) {
      taskDays.push(i);
    }
    
    return taskDays;
  };

  const handleEditClick = () => {
    if (selectedTaskDay?.task) {
      // Use the conversion helper function
      const taskForEdit = convertGanttTaskToTask(selectedTaskDay.task);
      setTaskToEdit(taskForEdit);
      setEditTaskOpen(true);
    }
  };

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
          <h3 className="text-lg font-medium">
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
            <Plus className="h-4 w-4 mr-2" /> Add Task
          </Button>
        )}
      </div>
      
      <div className="min-w-[800px] border rounded-md">
        {/* Gantt Header */}
        <div className="flex border-b border-slate-200 bg-slate-50">
          <div className="w-56 py-3 px-4 font-medium text-slate-600 text-sm border-r border-slate-200">
            Task Name
          </div>
          <div className="flex-1 flex">
            {days.map((day, index) => (
              <div 
                key={index}
                className={cn(
                  "w-8 flex-shrink-0 text-center py-3 text-xs font-medium border-r border-slate-200 last:border-r-0",
                  day.getDay() === 0 || day.getDay() === 6 
                    ? "bg-slate-100 text-slate-500" 
                    : "text-slate-600"
                )}
              >
                <div className="mb-1">{format(day, 'EEE')}</div>
                <div>{format(day, 'd')}</div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Gantt Body */}
        <div className="bg-white">
          {tasks.map((task) => (
            <div 
              key={task.id}
              className="flex border-b border-slate-200 last:border-b-0"
            >
              <div className="w-56 py-3 px-4 text-sm border-r border-slate-200 flex items-center">
                <div className="flex-1">
                  <h4 className="font-medium text-slate-700 text-sm mb-1 truncate">{task.title}</h4>
                  <div className="flex items-center gap-2">
                    <span 
                      className={cn(
                        "px-2 py-1 rounded-full text-xs",
                        getStatusColor(task.status)
                      )}
                    >
                      {task.status.replace("_", " ")}
                    </span>
                    {task.assignedTo && (
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {task.assignedTo}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex-1 h-16 relative">
                <div className="absolute inset-0">
                  {/* Task Bar - Single continuous bar */}
                  <div 
                    className={cn(
                      "absolute h-full cursor-pointer",
                      calculateTaskPosition(task).isVisible && "my-4"
                    )}
                    style={{
                      left: calculateTaskPosition(task).left,
                      width: calculateTaskPosition(task).width,
                    }}
                    onClick={() => handleTaskDayClick(task, 0)}
                  >
                    <div 
                      className={cn(
                        "h-8 rounded flex items-center justify-start px-2 transition-colors w-full",
                        "hover:brightness-95",
                        getStatusColor(task.status)
                      )}
                    >
                      <span className="text-xs font-medium whitespace-nowrap overflow-hidden text-ellipsis">
                        {Math.ceil((new Date(task.endDate).getTime() - new Date(task.startDate).getTime()) / (1000 * 60 * 60 * 24))}d
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Task Detail Dialog */}
      <Dialog open={!!selectedTaskDay && !editTaskOpen} onOpenChange={(open) => {
        if (!open) {
          setSelectedTaskDay(null);
        }
      }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <div className="flex justify-between items-center">
              <DialogTitle className="text-xl">{selectedTaskDay?.task.title}</DialogTitle>
              {onUpdateTask && (
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
          
          <div className="py-4 space-y-4">
            {selectedTaskDay?.task.description && (
              <p className="text-sm text-slate-600">{selectedTaskDay.task.description}</p>
            )}
            
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-slate-500" />
                <div>
                  <p className="text-xs text-slate-500">Start Date</p>
                  <p className="text-sm font-medium">
                    {format(selectedTaskDay ? new Date(selectedTaskDay.task.startDate) : new Date(), 'dd MMM yyyy')}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-slate-500" />
                <div>
                  <p className="text-xs text-slate-500">End Date</p>
                  <p className="text-sm font-medium">
                    {format(selectedTaskDay ? new Date(selectedTaskDay.task.endDate) : new Date(), 'dd MMM yyyy')}
                  </p>
                </div>
              </div>
              
              {selectedTaskDay?.task.assignedTo && (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-slate-500" />
                  <div>
                    <p className="text-xs text-slate-500">Assigned To</p>
                    <p className="text-sm font-medium">{selectedTaskDay.task.assignedTo}</p>
                  </div>
                </div>
              )}
              
              {selectedTaskDay?.task.category && (
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-slate-500" />
                  <div>
                    <p className="text-xs text-slate-500">Category</p>
                    <p className="text-sm font-medium">
                      {selectedTaskDay.task.category.replace("_", " ")}
                    </p>
                  </div>
                </div>
              )}
              
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-slate-500" />
                <div>
                  <p className="text-xs text-slate-500">Status</p>
                  <p className="text-sm font-medium">
                    {selectedTaskDay?.task.status.replace("_", " ") || "Not Started"}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-slate-500" />
                <div>
                  <p className="text-xs text-slate-500">Duration</p>
                  <p className="text-sm font-medium">
                    {selectedTaskDay ? Math.ceil((new Date(selectedTaskDay.task.endDate).getTime() - new Date(selectedTaskDay.task.startDate).getTime()) / (1000 * 60 * 60 * 24)) : 0} days
                  </p>
                </div>
              </div>
            </div>
            
            {/* Show attached contacts if any */}
            {selectedTaskDay?.task.contactIds && selectedTaskDay.task.contactIds.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-1">
                  <Users className="h-4 w-4" /> Contacts
                </h4>
                <div className="text-sm text-slate-600">
                  {/* Contact summary would go here */}
                  {selectedTaskDay.task.contactIds.length} contacts assigned
                </div>
              </div>
            )}
            
            {/* Show attached materials if any */}
            {selectedTaskDay?.task.materialIds && selectedTaskDay.task.materialIds.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-1">
                  <Package className="h-4 w-4" /> Materials
                </h4>
                <div className="text-sm text-slate-600">
                  {/* Materials summary would go here */}
                  {selectedTaskDay.task.materialIds.length} materials assigned
                </div>
              </div>
            )}
            
            {/* Show materials needed if specified */}
            {selectedTaskDay?.task.materialsNeeded && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-slate-700 mb-2">Materials Needed</h4>
                <p className="text-sm text-slate-600">{selectedTaskDay.task.materialsNeeded}</p>
              </div>
            )}
          </div>
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
              // Close the task detail dialog too when editing is done
              setSelectedTaskDay(null);
            }
          }}
          task={taskToEdit}
        />
      )}
    </div>
  );
}