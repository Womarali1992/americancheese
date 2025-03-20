import React, { useState } from "react";
import { format, eachDayOfInterval, startOfMonth, endOfMonth, addMonths, subMonths } from "date-fns";
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
  Plus 
} from "lucide-react";

interface Task {
  id: number;
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  status: string;
  durationDays: number;
  assignedTo?: string;
  contactIds?: string[] | number[];
  materialIds?: string[] | number[];
  category?: string;
}

interface TaskDayInfo {
  task: Task;
  date: Date;
  dayIndex: number;
}

interface GanttChartProps {
  tasks: Task[];
  period?: "week" | "month" | "quarter";
  className?: string;
  onAddTask?: () => void;
}

export function GanttChart({
  tasks,
  period = "month",
  className,
  onAddTask,
}: GanttChartProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedTaskDay, setSelectedTaskDay] = useState<TaskDayInfo | null>(null);
  
  const startDate = startOfMonth(currentMonth);
  const endDate = endOfMonth(currentMonth);
  
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  // Navigate to previous month
  const goToPreviousMonth = () => {
    setCurrentMonth(prevMonth => subMonths(prevMonth, 1));
  };

  // Navigate to next month
  const goToNextMonth = () => {
    setCurrentMonth(prevMonth => addMonths(prevMonth, 1));
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
  const calculateTaskPosition = (task: Task) => {
    const taskStart = new Date(task.startDate);
    const taskEnd = new Date(task.endDate);
    
    // Find the position (day index) where this task starts
    const startIndex = days.findIndex(day => 
      day.getDate() === taskStart.getDate() && 
      day.getMonth() === taskStart.getMonth() &&
      day.getFullYear() === taskStart.getFullYear()
    );
    
    // If the task starts before the current month, adjust start index to 0
    const adjustedStartIndex = startIndex === -1 ? 0 : startIndex;
    
    // Calculate the width in "day units"
    let taskDuration = task.durationDays || 1;
    
    // If task extends beyond current month, cap the duration
    if (adjustedStartIndex + taskDuration > days.length) {
      taskDuration = days.length - adjustedStartIndex;
    }
    
    // Calculate left position in pixels (each day column is 32px)
    const leftPos = adjustedStartIndex * 32;
    
    // Calculate width in pixels
    const widthPx = taskDuration * 32;
    
    return {
      left: `${leftPos}px`,
      width: `${widthPx}px`,
      startIndex: adjustedStartIndex,
      visibleDuration: taskDuration
    };
  };

  // Handle clicking on a specific day within a task bar
  const handleTaskDayClick = (task: Task, dayIndex: number) => {
    const position = calculateTaskPosition(task);
    const dayDate = days[position.startIndex + dayIndex];
    
    setSelectedTaskDay({
      task,
      date: dayDate,
      dayIndex
    });
  };

  // Generate array of individual days for a task
  const generateTaskDays = (task: Task) => {
    const position = calculateTaskPosition(task);
    const days = [];
    
    for (let i = 0; i < position.visibleDuration; i++) {
      days.push(i);
    }
    
    return days;
  };

  return (
    <div className={cn("overflow-x-auto pb-2", className)}>
      <div className="mb-4 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8 w-8 p-0" 
            onClick={goToPreviousMonth}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h3 className="text-lg font-medium">
            {format(currentMonth, 'MMMM yyyy')}
          </h3>
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8 w-8 p-0" 
            onClick={goToNextMonth}
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
                  "w-8 flex-shrink-0 py-2 text-center text-xs font-medium text-slate-600",
                  (day.getDay() === 0 || day.getDay() === 6) && "bg-slate-100"
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
              <div className="w-56 py-3 px-4 flex items-center border-r border-slate-200">
                <div 
                  className={cn(
                    "w-4 h-4 rounded-full mr-2",
                    task.status === "completed" ? "bg-green-500" : 
                    task.status === "in_progress" ? "bg-amber-500" : "bg-slate-500"
                  )}
                ></div>
                <span className="text-sm font-medium truncate">{task.title}</span>
              </div>
              <div className="flex-1 py-3 relative">
                <div 
                  className={cn(
                    "absolute top-1/2 -translate-y-1/2 h-8 border rounded-md flex",
                    getStatusColor(task.status)
                  )}
                  style={calculateTaskPosition(task)}
                >
                  {/* Individual days within the task bar */}
                  <div className="flex h-full w-full divide-x divide-slate-300/50">
                    {generateTaskDays(task).map((dayIndex) => (
                      <div
                        key={dayIndex}
                        className="w-8 h-full cursor-pointer hover:bg-white/30 flex items-center justify-center transition-colors"
                        onClick={() => handleTaskDayClick(task, dayIndex)}
                      >
                        {dayIndex === 0 && (
                          <span className="text-xs font-medium">{task.durationDays}d</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Task Day Detail Dialog */}
      <Dialog open={!!selectedTaskDay} onOpenChange={(open) => !open && setSelectedTaskDay(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-xl">{selectedTaskDay?.task.title}</DialogTitle>
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
                    {format(selectedTaskDay?.task.startDate || new Date(), 'dd MMM yyyy')}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-slate-500" />
                <div>
                  <p className="text-xs text-slate-500">End Date</p>
                  <p className="text-sm font-medium">
                    {format(selectedTaskDay?.task.endDate || new Date(), 'dd MMM yyyy')}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-slate-500" />
                <div>
                  <p className="text-xs text-slate-500">Status</p>
                  <div className="mt-1">
                    <span className={cn(
                      "text-xs px-2 py-1 rounded-full font-medium",
                      selectedTaskDay?.task.status === "completed" ? "bg-green-100 text-green-800" : 
                      selectedTaskDay?.task.status === "in_progress" ? "bg-amber-100 text-amber-800" : 
                      "bg-slate-100 text-slate-700"
                    )}>
                      {selectedTaskDay?.task.status === "completed" ? "Completed" :
                       selectedTaskDay?.task.status === "in_progress" ? "In Progress" : 
                       "Not Started"}
                    </span>
                  </div>
                </div>
              </div>
              
              {selectedTaskDay?.task.category && (
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-slate-500" />
                  <div>
                    <p className="text-xs text-slate-500">Category</p>
                    <p className="text-sm font-medium">{selectedTaskDay?.task.category}</p>
                  </div>
                </div>
              )}
              
              {selectedTaskDay?.task.assignedTo && (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-slate-500" />
                  <div>
                    <p className="text-xs text-slate-500">Assigned To</p>
                    <p className="text-sm font-medium">{selectedTaskDay?.task.assignedTo}</p>
                  </div>
                </div>
              )}
            </div>
            
            {(selectedTaskDay?.task.contactIds?.length || selectedTaskDay?.task.materialIds?.length) ? (
              <div className="border-t border-slate-200 pt-3 mt-3">
                {selectedTaskDay?.task.contactIds?.length ? (
                  <div className="flex items-start gap-2 mb-3">
                    <Users className="h-4 w-4 text-slate-500 mt-0.5" />
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Associated Contacts</p>
                      <div className="flex flex-wrap gap-1">
                        {/* Display contact count since actual contacts aren't available here */}
                        <div className="bg-slate-100 text-slate-700 text-xs px-2 py-1 rounded-full">
                          {selectedTaskDay.task.contactIds.length} contact(s)
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}
                
                {selectedTaskDay?.task.materialIds?.length ? (
                  <div className="flex items-start gap-2">
                    <Package className="h-4 w-4 text-slate-500 mt-0.5" />
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Required Materials</p>
                      <div className="flex flex-wrap gap-1">
                        {/* Display material count since actual materials aren't available here */}
                        <div className="bg-slate-100 text-slate-700 text-xs px-2 py-1 rounded-full">
                          {selectedTaskDay.task.materialIds.length} material(s)
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}
            
            <div className="border-t border-slate-200 pt-3 mt-3">
              <p className="text-xs text-slate-500 mb-1">Selected Date</p>
              <p className="text-sm font-medium">
                {selectedTaskDay ? format(selectedTaskDay.date, 'EEEE, dd MMMM yyyy') : ''}
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
