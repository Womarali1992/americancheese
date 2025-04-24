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
  const weeks = 1; // Display only 1 week (7 days) at a time as requested
  const daysPerWeek = 7;
  const totalDays = weeks * daysPerWeek;
  
  // Calculate date range for the Gantt chart
  const startDate = periodStart;
  const endDate = addDays(startDate, totalDays - 1);
  
  // Generate weeks for header with dates
  const weekHeaders = Array.from({ length: weeks }, (_, weekIndex) => {
    const weekStart = addDays(startDate, weekIndex * daysPerWeek);
    const weekEnd = addDays(weekStart, daysPerWeek - 1);
    return {
      weekNumber: weekIndex + 1,
      startDate: weekStart,
      endDate: weekEnd,
      dateRange: `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d')}`
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
  
  // Get dot color based on task category with special handling for common categories
  const getDotColor = (task: GanttTask) => {
    // Check for specific categories directly in the title or category fields
    const title = task.title?.toLowerCase() || '';
    const category = (task.category || '').toLowerCase();
    const tier1 = (task.tier1Category || '').toLowerCase();
    const tier2 = (task.tier2Category || '').toLowerCase();
    
    // First check for common categories by keyword
    if (title.includes('electrical') || category.includes('electrical') || 
        tier1.includes('electrical') || tier2.includes('electrical') || 
        title.includes('elect') || category.startsWith('el')) {
      // Yellow for electrical tasks
      return task.completed || task.status === 'completed' 
        ? 'bg-yellow-700 border-yellow-800' 
        : 'bg-yellow-500 border-yellow-600';
    }
    
    if (title.includes('plumbing') || category.includes('plumbing') || 
        tier1.includes('plumbing') || tier2.includes('plumbing') || 
        title.includes('plumb') || category.startsWith('pl')) {
      // Blue for plumbing tasks
      return task.completed || task.status === 'completed' 
        ? 'bg-blue-700 border-blue-800' 
        : 'bg-blue-500 border-blue-600';
    }
    
    if (title.includes('hvac') || category.includes('hvac') || 
        tier1.includes('hvac') || tier2.includes('hvac') || 
        title.includes('heat') || title.includes('air') || 
        category.startsWith('hv')) {
      // Gray for HVAC tasks
      return task.completed || task.status === 'completed' 
        ? 'bg-slate-700 border-slate-800' 
        : 'bg-slate-500 border-slate-600';
    }
    
    if (title.includes('foundation') || category.includes('foundation') || 
        tier1.includes('foundation') || tier2.includes('foundation') || 
        title.includes('concrete') || title.includes('cement') ||
        title.startsWith('fn') || category.startsWith('fn')) {
      // Brown for foundation tasks
      return task.completed || task.status === 'completed' 
        ? 'bg-stone-800 border-stone-900' 
        : 'bg-stone-600 border-stone-700';
    }
    
    if (title.includes('roof') || category.includes('roof') || 
        tier1.includes('roof') || tier2.includes('roof') || 
        title.includes('shingle') || category.startsWith('rf')) {
      // Red for roofing tasks
      return task.completed || task.status === 'completed' 
        ? 'bg-red-800 border-red-900' 
        : 'bg-red-600 border-red-700';
    }
    
    if (title.includes('framing') || category.includes('framing') || 
        tier1.includes('framing') || tier2.includes('framing') || 
        title.includes('frame') || category.startsWith('fr')) {
      // Amber for framing tasks
      return task.completed || task.status === 'completed' 
        ? 'bg-amber-800 border-amber-900' 
        : 'bg-amber-600 border-amber-700';
    }
    
    if (title.includes('insulation') || category.includes('insulation') || 
        tier1.includes('insulation') || tier2.includes('insulation') || 
        title.includes('insulate') || category.startsWith('in')) {
      // Green for insulation tasks
      return task.completed || task.status === 'completed' 
        ? 'bg-green-800 border-green-900' 
        : 'bg-green-600 border-green-700';
    }
    
    if (title.includes('drywall') || category.includes('drywall') || 
        tier1.includes('drywall') || tier2.includes('drywall') || 
        title.includes('wall') || category.startsWith('dr')) {
      // Neutral for drywall tasks
      return task.completed || task.status === 'completed' 
        ? 'bg-neutral-800 border-neutral-900' 
        : 'bg-neutral-500 border-neutral-600';
    }
    
    if (title.includes('floor') || category.includes('floor') || 
        tier1.includes('floor') || tier2.includes('floor') || 
        title.includes('tile') || category.startsWith('fl')) {
      // Orange for flooring tasks
      return task.completed || task.status === 'completed' 
        ? 'bg-orange-800 border-orange-900' 
        : 'bg-orange-500 border-orange-600';
    }
    
    if (title.includes('paint') || category.includes('paint') || 
        tier1.includes('paint') || tier2.includes('paint') || 
        title.includes('finish') || category.startsWith('pt')) {
      // Indigo for painting tasks
      return task.completed || task.status === 'completed' 
        ? 'bg-indigo-800 border-indigo-900' 
        : 'bg-indigo-500 border-indigo-600';
    }
    
    if (title.includes('landscape') || category.includes('landscape') || 
        tier1.includes('landscape') || tier2.includes('landscape') || 
        title.includes('yard') || title.includes('lawn') || 
        category.startsWith('ld')) {
      // Emerald for landscaping tasks
      return task.completed || task.status === 'completed' 
        ? 'bg-emerald-800 border-emerald-900' 
        : 'bg-emerald-500 border-emerald-600';
    }
    
    // Fall back to getCategoryColor for other categories
    const categoryToUse = task.tier2Category || task.tier1Category || task.category;
    let baseClasses = getCategoryColor(categoryToUse);
    
    // If task is completed, use a darker variant
    if (task.completed || task.status === 'completed') {
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
      
      {/* Week and day headers */}
      <div className="overflow-x-auto mb-4">
        <div className="min-w-full">
          {/* Week header row */}
          <div className="flex mb-1">
            {/* Task name column placeholder */}
            <div className="w-48 flex-shrink-0"></div>
            
            {/* Week columns */}
            <div className="flex-1 flex">
              {weekHeaders.map((week) => (
                <div 
                  key={`week-${week.weekNumber}`}
                  className="bg-stone-700 text-white text-center py-2 rounded-t-md flex-grow mx-px"
                  style={{ width: `${(daysPerWeek / totalDays) * 100}%` }}
                >
                  <div className="font-semibold">Week {week.weekNumber}</div>
                  <div className="text-xs opacity-80">{week.dateRange}</div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Day header row */}
          <div className="flex mb-2 border-b border-stone-400 pb-2">
            {/* Task name column label */}
            <div className="w-48 flex-shrink-0 pl-2 font-medium text-stone-800">
              Task Name
            </div>
            
            {/* Day columns */}
            <div className="flex-1 flex">
              {days.map((day, dayIndex) => (
                <div 
                  key={`day-${dayIndex}`}
                  className={cn(
                    "text-center text-xs font-medium w-12 flex-shrink-0",
                    day.getDay() === 0 || day.getDay() === 6 
                      ? "text-stone-500 bg-stone-100 bg-opacity-50" 
                      : "text-stone-800"
                  )}
                >
                  <div className="mb-1">{format(day, 'EEE')}</div>
                  <div className="font-bold">{format(day, 'd')}</div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Task rows with dot matrix */}
          {visibleTasks.map((task, taskIndex) => (
            <div key={`task-${task.id}`} className="flex mb-3 hover:bg-stone-100 rounded py-1">
              {/* Task name column */}
              <div className="w-48 flex-shrink-0 pl-2">
                <div className="flex items-center">
                  <span className="w-6 text-gray-700 font-medium">{taskIndex + 1}.</span>
                  <h3 className="text-sm font-medium text-gray-700 truncate">
                    {task.title}
                  </h3>
                </div>
              </div>
              
              {/* Dot matrix row for this task */}
              <div className="flex-1 flex">
                {Array.from({ length: totalDays }).map((_, dayIndex) => {
                  const currentDay = addDays(startDate, dayIndex);
                  const isActive = isDotActive(task, currentDay);
                  
                  return (
                    <div 
                      key={`task-${task.id}-day-${dayIndex}`}
                      className={cn(
                        "w-12 flex-shrink-0 flex items-center justify-center h-12",
                        currentDay.getDay() === 0 || currentDay.getDay() === 6 ? "bg-stone-50 bg-opacity-30" : ""
                      )}
                    >
                      <div 
                        className={cn(
                          "rounded-full border w-8 h-8 transition-all",
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