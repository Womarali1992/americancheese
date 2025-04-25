import React, { useState, useRef, useEffect } from "react";
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
import { ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { TaskDetailsDialog } from "@/components/tasks/TaskDetailsDialog";

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
  
  // Task modification state
  const [pendingTaskUpdate, setPendingTaskUpdate] = useState<{taskId: number, startDate: Date, endDate: Date} | null>(null);
  
  // Calculate view parameters
  const weeks = 1; // Display only 1 week (7 days) at a time as requested
  const daysPerWeek = 7;
  const totalDays = weeks * daysPerWeek;
  
  // Reference for sticky header
  const headerRef = useRef<HTMLDivElement>(null);
  const [headerHeight, setHeaderHeight] = useState(0);
  const [isSticky, setIsSticky] = useState(false);
  
  // Effect to handle scroll for sticky header
  useEffect(() => {
    // Set initial header height
    if (headerRef.current) {
      setHeaderHeight(headerRef.current.offsetHeight);
    }
    
    const handleScroll = () => {
      if (headerRef.current) {
        const parentContainer = headerRef.current.closest('.rounded-lg');
        if (!parentContainer) return;
        
        const headerRect = headerRef.current.getBoundingClientRect();
        const containerRect = parentContainer.getBoundingClientRect();
        
        // Get the initial position once
        const headerOffsetTop = headerRef.current.offsetTop + containerRect.top;
        
        // Check if we've scrolled past the header's original position
        // but not past the bottom of the container
        const shouldStick = window.scrollY > headerOffsetTop && 
                           window.scrollY < (containerRect.bottom + window.scrollY - headerRect.height * 2);
        
        setIsSticky(shouldStick);
        
        if (shouldStick) {
          // Apply sticky styles
          headerRef.current.style.position = 'fixed';
          headerRef.current.style.top = '0';
          headerRef.current.style.zIndex = '50';
          headerRef.current.style.backgroundColor = '#f5f5f4'; // stone-100
          headerRef.current.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
          headerRef.current.style.width = `${containerRect.width - 48}px`; // Adjust for padding
          headerRef.current.style.borderRadius = '0';
          headerRef.current.style.borderBottom = '2px solid #e7e5e4'; // stone-200
        } else {
          // Reset to normal styles
          headerRef.current.style.position = 'static';
          headerRef.current.style.boxShadow = 'none';
          headerRef.current.style.width = '100%';
          headerRef.current.style.borderRadius = '0';
          headerRef.current.style.borderBottom = '1px solid #a8a29e'; // stone-400
        }
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
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

  // Helper for toggling a date's active status
  const toggleDate = (task: GanttTask, day: Date) => {
    if (!onUpdateTask) return;
    
    console.log('Toggling date for task:', task.id, 'on day:', format(day, 'MMM d'));
    
    const taskStartDate = task.startDate instanceof Date ? task.startDate : new Date(task.startDate);
    const taskEndDate = task.endDate instanceof Date ? task.endDate : new Date(task.endDate);
    
    const isActive = isDotActive(task, day);
    
    if (isActive) {
      // If day is active, try to remove it
      
      // Don't remove if it's the only day
      if (isSameDay(taskStartDate, taskEndDate)) {
        console.log('Cannot remove - only one day in task');
        return;
      }
      
      // If it's the start day, move start date forward
      if (isSameDay(day, taskStartDate)) {
        const newStartDate = addDays(taskStartDate, 1);
        console.log('Removing from start, new start:', format(newStartDate, 'MMM d'));
        onUpdateTask(task.id, { startDate: newStartDate });
      } 
      // If it's the end day, move end date backward
      else if (isSameDay(day, taskEndDate)) {
        const newEndDate = subDays(taskEndDate, 1);
        console.log('Removing from end, new end:', format(newEndDate, 'MMM d'));
        onUpdateTask(task.id, { endDate: newEndDate });
      }
      // Cannot remove days in the middle
      else {
        console.log('Cannot remove day in the middle of task');
      }
    } else {
      // If day is inactive, add it
      
      // If day is before current start, extend start backward
      if (day < taskStartDate) {
        const newStartDate = startOfDay(day);
        console.log('Adding before current start, new start:', format(newStartDate, 'MMM d'));
        onUpdateTask(task.id, { startDate: newStartDate });
      } 
      // If day is after current end, extend end forward
      else if (day > taskEndDate) {
        const newEndDate = endOfDay(day);
        console.log('Adding after current end, new end:', format(newEndDate, 'MMM d'));
        onUpdateTask(task.id, { endDate: newEndDate });
      }
    }
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
          
      {/* Day header row - sticky when scrolling */}
      <div 
        ref={headerRef}
        className="grid grid-cols-7 mb-2 border-b border-stone-400 pb-2 transition-all"
      >
        {days.map((day, i) => (
          <div 
            key={`day-${i}`}
            className={cn(
              "text-center text-xs font-medium py-2",
              day.getDay() === 0 || day.getDay() === 6 ? "text-stone-500 bg-stone-100" : "text-stone-800"
            )}
          >
            <div className="mb-1">{format(day, 'EEE')}</div>
            <div className="font-bold">{format(day, 'd')}</div>
          </div>
        ))}
      </div>
      
      {/* Spacer element to prevent content jumping when header becomes fixed */}
      {isSticky && (
        <div style={{ height: `${headerHeight}px` }} className="mb-2" />
      )}
          
      {/* Task rows */}
      {visibleTasks.map((task, taskIndex) => {
        // Check if this task is active on any day
        const hasActiveDays = days.some(day => isDotActive(task, day));
        
        return (
          <div key={`task-${task.id}`} className="relative mb-6">
            {/* Small index marker */}
            <span className="absolute -left-1 top-3 text-xs text-gray-500">{taskIndex + 1}</span>
            
            {/* Task dots in grid layout */}
            <div className="grid grid-cols-7 hover:bg-stone-100 rounded py-1">
              {days.map((day, dayIndex) => {
                const isActive = isDotActive(task, day);
                
                return (
                  <div 
                    key={`task-${task.id}-day-${dayIndex}`}
                    className={cn(
                      "flex items-center justify-center py-1", 
                      day.getDay() === 0 || day.getDay() === 6 ? "bg-stone-50 bg-opacity-30" : ""
                    )}
                  >
                    <div
                      className={cn(
                        "rounded-full border w-9 h-9 cursor-pointer relative group",
                        isActive 
                          ? getDotColor(task)
                          : "bg-stone-50 border-stone-300 hover:bg-stone-200"
                      )}
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        toggleDate(task, day);
                      }}
                    >
                      {/* Add visual indicators */}
                      {!isActive && (
                        <div 
                          className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-green-500 flex items-center justify-center text-white text-[8px] font-bold border border-white animate-pulse"
                        >
                          +
                        </div>
                      )}
                      {isActive && (
                        <div 
                          className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-red-500 flex items-center justify-center text-white text-[8px] font-bold border border-white"
                        >
                          -
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Task name under the entire row, only display once if active */}
            {hasActiveDays && (
              <Button 
                variant="outline" 
                size="sm"
                className="text-xs text-gray-700 font-medium w-full mt-2 px-2 h-auto py-1 border-dashed border-stone-300 hover:bg-stone-100 hover:border-stone-400 transition-colors"
                onClick={() => {
                  setSelectedTask(task);
                  setTaskDetailsOpen(true);
                }}
              >
                <span className="flex items-center justify-center gap-1">
                  {task.title}
                  <ExternalLink className="h-3 w-3 ml-1 opacity-50" />
                </span>
              </Button>
            )}
          </div>
        );
      })}
          
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
        projectId={projectId}
      />
    </div>
  );
}