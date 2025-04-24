import React, { useState } from "react";
import { 
  format, 
  eachDayOfInterval, 
  addDays, 
  subDays,
  isWithinInterval, 
  isSameDay 
} from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { getCategoryColor } from "@/lib/color-utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

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
}

export function VintageGanttChart({
  tasks,
  className,
  title = "Gantt Chart",
  subtitle = "project plan",
  projectId,
  showDotMatrix = true,
  backgroundClass = "bg-amber-100"
}: VintageGanttChartProps) {
  // Set state for controlling the date range
  const [periodStart, setPeriodStart] = useState(new Date());
  
  // Calculate view parameters
  const weeks = 4; // Display 4 weeks
  const daysPerWeek = 7;
  const totalDays = weeks * daysPerWeek;
  
  // Calculate date range for the Gantt chart
  const startDate = periodStart;
  const endDate = addDays(startDate, totalDays - 1);
  
  // Generate weeks for header
  const weekHeaders = Array.from({ length: weeks }, (_, weekIndex) => {
    const weekStart = addDays(startDate, weekIndex * daysPerWeek);
    return {
      weekNumber: weekIndex + 1,
      startDate: weekStart
    };
  });
  
  // Navigate through periods
  const goToPreviousPeriod = () => {
    setPeriodStart(prevDate => subDays(prevDate, totalDays));
  };

  const goToNextPeriod = () => {
    setPeriodStart(prevDate => addDays(prevDate, totalDays));
  };
  
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
    // Prioritize tier2Category, then tier1Category, then category for color selection
    const categoryToUse = task.tier2Category || task.tier1Category || task.category;
    
    // Customize color based on task status
    let baseClasses = getCategoryColor(categoryToUse);
    
    // If task is completed, use a darker variant
    if (task.completed || task.status === 'completed') {
      // Extract color name from the bg class (e.g., "bg-amber-700" -> "amber")
      const matches = baseClasses.match(/bg-([a-z]+)-/);
      if (matches && matches[1]) {
        const colorName = matches[1];
        return `bg-${colorName}-900 border-${colorName}-950`;
      }
    }
    
    // Get just the background class
    const bgClass = baseClasses.split(' ')[0] || 'bg-gray-400';
    const borderMatches = baseClasses.match(/border-([a-z]+)-([0-9]+)/);
    
    if (borderMatches) {
      const colorName = borderMatches[1];
      return `${bgClass} border-${colorName}-${borderMatches[2]}`;
    }
    
    return bgClass;
  };

  return (
    <div className={cn(
      "rounded-lg p-6 shadow-md overflow-hidden", 
      backgroundClass,
      className
    )}>
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
          className="border-stone-500 text-stone-700 hover:bg-stone-200"
          onClick={goToPreviousPeriod}
        >
          <ChevronLeft className="h-4 w-4 mr-1" /> Previous
        </Button>
        
        <Button 
          variant="outline"
          size="sm"
          className="border-stone-500 text-stone-700 hover:bg-stone-200"
          onClick={goToNextPeriod}
        >
          Next <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
      
      {/* Week headers */}
      <div className="grid grid-cols-4 gap-1 mb-2">
        {weekHeaders.map((week) => (
          <div 
            key={`week-${week.weekNumber}`} 
            className="bg-stone-600 text-white text-center py-2 px-3 rounded-md"
          >
            Week {week.weekNumber}
          </div>
        ))}
      </div>
      
      {/* Days grid with dot matrix */}
      <div className="overflow-x-auto">
        <div className="min-w-full">
          {/* Task rows */}
          {visibleTasks.map((task, taskIndex) => (
            <div key={`task-${task.id}`} className="mb-4">
              <div className="flex items-center mb-1">
                <span className="w-6 text-gray-700 font-medium">{taskIndex + 1}</span>
                <h3 className="text-sm font-medium text-gray-700 truncate max-w-[250px]">
                  {task.title}
                </h3>
              </div>
              
              {/* Dot matrix row for this task */}
              <div className="flex ml-6">
                {Array.from({ length: totalDays }).map((_, dayIndex) => {
                  const currentDay = addDays(startDate, dayIndex);
                  const isActive = isDotActive(task, currentDay);
                  
                  return (
                    <div 
                      key={`task-${task.id}-day-${dayIndex}`}
                      className={cn(
                        "w-6 h-6 flex items-center justify-center",
                        currentDay.getDay() === 0 || currentDay.getDay() === 6 ? "bg-stone-50 bg-opacity-30" : ""
                      )}
                    >
                      <div 
                        className={cn(
                          "rounded-full border w-4 h-4",
                          isActive 
                            ? getDotColor(task)
                            : "bg-stone-50 border-stone-300"
                        )}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
                  
          {/* Show empty state if no tasks */}
          {visibleTasks.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No tasks scheduled for this time period
            </div>
          )}
        </div>
      </div>
      
      {/* Date range display */}
      <div className="text-center mt-4 font-medium text-gray-700">
        {format(startDate, 'MMM d')} - {format(endDate, 'MMM d, yyyy')}
      </div>
    </div>
  );
}