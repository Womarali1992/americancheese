import React from "react";
import { format, eachDayOfInterval, startOfMonth, endOfMonth } from "date-fns";
import { cn } from "@/lib/utils";

interface Task {
  id: number;
  title: string;
  startDate: Date;
  endDate: Date;
  status: string;
  durationDays: number;
}

interface GanttChartProps {
  tasks: Task[];
  period?: "week" | "month" | "quarter";
  className?: string;
}

export function GanttChart({
  tasks,
  period = "month",
  className,
}: GanttChartProps) {
  const now = new Date();
  const startDate = startOfMonth(now);
  const endDate = endOfMonth(now);
  
  const days = eachDayOfInterval({ start: startDate, end: endDate });

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
  const calculateTaskPosition = (task: Task) => {
    const taskStart = new Date(task.startDate);
    const taskEnd = new Date(task.endDate);
    
    // Find the position (day index) where this task starts
    const startIndex = days.findIndex(day => 
      day.getDate() === taskStart.getDate() && 
      day.getMonth() === taskStart.getMonth()
    );
    
    // Calculate the width in "day units"
    const taskDuration = task.durationDays || 1;
    
    // Calculate left position in pixels (each day column is 32px)
    const leftPos = startIndex * 32;
    
    // Calculate width in pixels
    const widthPx = taskDuration * 32;
    
    return {
      left: `${leftPos}px`,
      width: `${widthPx}px`,
    };
  };

  return (
    <div className={cn("overflow-x-auto pb-2", className)}>
      <div className="min-w-[800px]">
        {/* Gantt Header */}
        <div className="flex border-b border-slate-200">
          <div className="w-56 py-2 px-4 font-medium text-slate-500 text-sm">Task Name</div>
          <div className="flex-1 flex">
            {days.map((day, index) => (
              <div 
                key={index}
                className={cn(
                  "w-8 flex-shrink-0 py-2 text-center text-xs font-medium text-slate-500",
                  (day.getDay() === 0 || day.getDay() === 6) && "bg-slate-50"
                )}
              >
                {day.getDate()}
              </div>
            ))}
          </div>
        </div>
        
        {/* Gantt Rows */}
        <div className="divide-y divide-slate-200">
          {tasks.map((task) => (
            <div key={task.id} className="flex items-center hover:bg-slate-50">
              <div className="w-56 py-3 px-4 flex items-center">
                <div 
                  className={cn(
                    "w-4 h-4 rounded-full mr-2",
                    task.status === "completed" ? "bg-green-500" : 
                    task.status === "in_progress" ? "bg-amber-500" : "bg-slate-500"
                  )}
                ></div>
                <span className="text-sm truncate">{task.title}</span>
              </div>
              <div className="flex-1 py-3 relative">
                <div 
                  className={cn(
                    "absolute top-1/2 -translate-y-1/2 h-6 border rounded-sm flex items-center justify-center",
                    getStatusColor(task.status)
                  )}
                  style={calculateTaskPosition(task)}
                >
                  <span className="text-xs font-medium">{task.durationDays} days</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
