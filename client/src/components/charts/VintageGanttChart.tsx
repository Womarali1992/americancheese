import React, { useState } from "react";
import { 
  format, 
  eachDayOfInterval, 
  addDays, 
  subDays,
  isWithinInterval, 
  isSameDay,
  startOfDay,
  endOfDay
} from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { getCategoryColor } from "@/lib/color-utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { TaskDetailsDialog } from "@/components/tasks/TaskDetailsDialog";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger 
} from "@/components/ui/tooltip";

// Interface for tasks in the Gantt chart
interface GanttTask {
  id: number;
  title: string;
  tier1Category?: string;
  tier2Category?: string;
  category: string;
  startDate: Date;
  endDate: Date;
  completed?: boolean;
  status: string;
}

interface VintageGanttChartProps {
  tasks: GanttTask[];
  className?: string;
  title?: string;
  subtitle?: string;
  projectId?: number;
  showDotMatrix?: boolean;
  backgroundClass?: string;
  onUpdateTask?: (taskId: number, updates: any) => Promise<void>;
}

export function VintageGanttChart({
  tasks,
  className,
  title = "Gantt Chart",
  subtitle = "project plan",
  projectId,
  showDotMatrix = true,
  backgroundClass = "bg-amber-100",
  onUpdateTask
}: VintageGanttChartProps) {
  // Set state for controlling the date range
  const [periodStart, setPeriodStart] = useState(new Date());
  const [selectedTask, setSelectedTask] = useState<GanttTask | null>(null);
  const [taskDetailsOpen, setTaskDetailsOpen] = useState(false);
  
  // Calculate view parameters
  const weeks = 1; // Display only 1 week (7 days) at a time as requested
  const daysPerWeek = 7;
  const totalDays = weeks * daysPerWeek;
  
  // Calculate date range for the Gantt chart
  const startDate = periodStart;
  const endDate = addDays(startDate, totalDays - 1);
  
  // Generate all days in the period
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  // Get tasks that are active within the chart date range
  const visibleTasks = tasks.filter(task => {
    const taskStartDate = task.startDate instanceof Date ? task.startDate : new Date(task.startDate);
    const taskEndDate = task.endDate instanceof Date ? task.endDate : new Date(task.endDate);
    
    // Check if task overlaps with view range
    return (
      (taskStartDate <= endDate && taskEndDate >= startDate) || 
      (taskStartDate >= startDate && taskStartDate <= endDate) ||
      (taskEndDate >= startDate && taskEndDate <= endDate)
    );
  }).sort((a, b) => {
    // Sort by start date, then by category
    const startDateA = a.startDate instanceof Date ? a.startDate : new Date(a.startDate);
    const startDateB = b.startDate instanceof Date ? b.startDate : new Date(b.startDate);
    
    if (startDateA.getTime() !== startDateB.getTime()) {
      return startDateA.getTime() - startDateB.getTime();
    }
    
    // If start dates are the same, sort by category
    return a.category.localeCompare(b.category);
  });
  
  // Determine dots visibility for a task on a specific day
  const isDotActive = (task: GanttTask, day: Date) => {
    const taskStartDate = task.startDate instanceof Date ? task.startDate : new Date(task.startDate);
    const taskEndDate = task.endDate instanceof Date ? task.endDate : new Date(task.endDate);
    
    // Check if the day is within the task's date range
    return isWithinInterval(day, { 
      start: taskStartDate,
      end: taskEndDate 
    }) || isSameDay(day, taskStartDate) || isSameDay(day, taskEndDate);
  };
  
  // Get dot color based on task category
  const getDotColor = (task: GanttTask) => {
    const tier = task.tier2Category || task.tier1Category || task.category;
    const title = task.title?.toLowerCase() || '';

    // Color mapping based on category keywords
    if (title.includes('electrical') || tier.toLowerCase().includes('electrical')) {
      return 'bg-yellow-500 border-yellow-600';
    }
    if (title.includes('plumbing') || tier.toLowerCase().includes('plumbing')) {
      return 'bg-blue-500 border-blue-600';
    }
    if (title.includes('framing') || tier.toLowerCase().includes('framing')) {
      return 'bg-amber-600 border-amber-700';
    }
    
    // Fall back to getCategoryColor
    return getCategoryColor(tier);
  };

  // Navigation functions
  const goToPreviousPeriod = () => {
    setPeriodStart(prevDate => subDays(prevDate, totalDays));
  };

  const goToNextPeriod = () => {
    setPeriodStart(prevDate => addDays(prevDate, totalDays));
  };

  return (
    <div className={cn("rounded-lg p-6 shadow-md", backgroundClass, className)}>
      {/* Header with navigation */}
      <div className="flex justify-between items-center mb-6">
        <div className="text-center w-full">
          <h2 className="text-2xl font-serif font-semibold text-gray-800">{title}</h2>
          <p className="text-sm text-gray-600 italic">{subtitle}</p>
        </div>
      </div>
      
      {/* Navigation buttons */}
      <div className="flex justify-between mb-4">
        <Button 
          variant="outline" 
          size="sm" 
          className="border-stone-500 text-stone-700"
          onClick={goToPreviousPeriod}
        >
          <ChevronLeft className="h-4 w-4 mr-1" /> Previous
        </Button>
        
        <Button 
          variant="outline"
          size="sm"
          className="border-stone-500 text-stone-700"
          onClick={goToNextPeriod}
        >
          Next <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
      
      {/* Week header */}
      <div className="grid grid-cols-7 mb-2 bg-stone-700 text-white text-center py-2 rounded-t-md">
        <div className="col-span-7">
          <div className="font-semibold">Week {format(startDate, 'w')}</div>
          <div className="text-xs">{format(startDate, 'MMM d')} - {format(endDate, 'MMM d')}</div>
        </div>
      </div>
          
      {/* Day header row */}
      <div className="grid grid-cols-7 mb-2 border-b border-stone-400 pb-2">
        {days.map((day, i) => (
          <div 
            key={`day-${i}`}
            className={cn(
              "text-center text-xs font-medium",
              day.getDay() === 0 || day.getDay() === 6 ? "text-stone-500 bg-stone-100" : "text-stone-800"
            )}
          >
            <div className="mb-1">{format(day, 'EEE')}</div>
            <div className="font-bold">{format(day, 'd')}</div>
          </div>
        ))}
      </div>
          
      {/* Task rows */}
      {visibleTasks.map((task, taskIndex) => (
        <div key={`task-${task.id}`} className="grid grid-cols-7 mb-6 hover:bg-stone-100 rounded py-1">
          {/* Small index marker */}
          <span className="absolute -left-1 text-xs text-gray-500">{taskIndex + 1}</span>
            
          {/* Task dots in grid layout */}
          {days.map((day, dayIndex) => {
            const isActive = isDotActive(task, day);
            
            // Toggle date function
            const toggleDate = () => {
              if (!onUpdateTask) return;
              
              const taskStartDate = task.startDate instanceof Date ? task.startDate : new Date(task.startDate);
              const taskEndDate = task.endDate instanceof Date ? task.endDate : new Date(task.endDate);
              
              let newStartDate = taskStartDate;
              let newEndDate = taskEndDate;
              
              if (isActive) {
                // Remove this day if it's the start or end date
                if (isSameDay(day, taskStartDate)) {
                  // If length is 1, don't allow removal
                  if (isSameDay(taskStartDate, taskEndDate)) return;
                  newStartDate = addDays(taskStartDate, 1);
                } else if (isSameDay(day, taskEndDate)) {
                  newEndDate = subDays(taskEndDate, 1);
                }
              } else {
                // Add this day to the task dates
                if (day < taskStartDate) {
                  newStartDate = startOfDay(day);
                } else if (day > taskEndDate) {
                  newEndDate = endOfDay(day);
                }
              }
              
              onUpdateTask(task.id, {
                startDate: newStartDate,
                endDate: newEndDate
              });
            };
            
            return (
              <div 
                key={`task-${task.id}-day-${dayIndex}`}
                className={cn(
                  "flex flex-col items-center justify-center py-1", 
                  day.getDay() === 0 || day.getDay() === 6 ? "bg-stone-50 bg-opacity-30" : ""
                )}
                onClick={() => {
                  if (isActive) {
                    setSelectedTask(task);
                    setTaskDetailsOpen(true);
                  }
                }}
              >
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div
                        className={cn(
                          "rounded-full border w-9 h-9 cursor-pointer",
                          isActive 
                            ? getDotColor(task)
                            : "bg-stone-50 border-stone-300 hover:bg-stone-200"
                        )}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleDate();
                        }}
                      />
                    </TooltipTrigger>
                    <TooltipContent>
                      {isActive 
                        ? `${task.title} - Click to remove ${format(day, 'MMM d')}`
                        : `${task.title} - Click to add ${format(day, 'MMM d')}`}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                
                {/* Task name under the dot */}
                <div className="text-xs text-gray-700 font-medium mt-1 max-w-[80px] truncate text-center">
                  {isActive ? task.title : ""}
                </div>
              </div>
            );
          })}
        </div>
      ))}
          
      {/* Empty state */}
      {visibleTasks.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No tasks scheduled for this time period
        </div>
      )}
      
      {/* Date range display */}
      <div className="text-center mt-4 font-medium text-gray-700">
        {format(startDate, 'MMM d')} - {format(endDate, 'MMM d, yyyy')}
      </div>

      {/* Task details dialog */}
      <TaskDetailsDialog 
        open={taskDetailsOpen}
        onOpenChange={setTaskDetailsOpen}
        task={selectedTask}
      />
    </div>
  );
}