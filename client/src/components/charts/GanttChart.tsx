import React, { useState } from "react";
import { format, eachDayOfInterval, startOfMonth, endOfMonth, addMonths, subMonths } from "date-fns";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
  Edit,
  Calendar as CalendarIcon
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";

interface Task {
  id: number;
  title: string;
  description?: string;
  startDate: Date | string;
  endDate: Date | string;
  status: string;
  durationDays?: number;
  assignedTo?: string;
  contactIds?: string[] | number[];
  materialIds?: string[] | number[];
  category?: string;
  projectId?: number;
}

interface TaskDayInfo {
  task: Task;
  date: Date;
  dayIndex: number;
}

// Task form validation schema
const taskFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  status: z.string().min(1, "Status is required"),
  startDate: z.date(),
  endDate: z.date(),
  assignedTo: z.string().optional(),
  category: z.string().optional()
}).refine(
  data => data.endDate >= data.startDate,
  {
    message: "End date must be after start date",
    path: ["endDate"]
  }
);

type TaskFormValues = z.infer<typeof taskFormSchema>;

// Task Edit Form Component
function TaskEditForm({ task, onSave, onCancel }: {
  task: Task;
  onSave: (data: TaskFormValues) => void;
  onCancel: () => void;
}) {
  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: task.title,
      description: task.description || "",
      status: task.status,
      startDate: new Date(task.startDate),
      endDate: new Date(task.endDate),
      assignedTo: task.assignedTo || "",
      category: task.category || "",
    }
  });
  
  function onSubmit(data: TaskFormValues) {
    onSave(data);
  }
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Start Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button 
                        variant="outline"
                        className={cn(
                          "pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="endDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>End Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button 
                        variant="outline"
                        className={cn(
                          "pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="not_started">Not Started</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="foundation">Foundation</SelectItem>
                    <SelectItem value="electrical">Electrical</SelectItem>
                    <SelectItem value="plumbing">Plumbing</SelectItem>
                    <SelectItem value="roof">Roof</SelectItem>
                    <SelectItem value="windows & doors">Windows & Doors</SelectItem>
                    <SelectItem value="permits & approvals">Permits & Approvals</SelectItem>
                    <SelectItem value="exterior">Exterior</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="assignedTo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Assigned To</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex justify-between pt-3">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">Save Changes</Button>
        </div>
      </form>
    </Form>
  );
}

interface GanttChartProps {
  tasks: Task[];
  period?: "week" | "month" | "quarter";
  className?: string;
  onAddTask?: () => void;
  onUpdateTask?: (id: number, task: Partial<TaskFormValues>) => void;
}

export function GanttChart({
  tasks,
  period = "month",
  className,
  onAddTask,
  onUpdateTask,
}: GanttChartProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedTaskDay, setSelectedTaskDay] = useState<TaskDayInfo | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  
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
      taskDuration = task.durationDays || 1;
      
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
    
    // If the task isn't visible in the current view, return empty array
    if (!position.isVisible) {
      return [];
    }
    
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
      <Dialog open={!!selectedTaskDay} onOpenChange={(open) => {
        if (!open) {
          setSelectedTaskDay(null);
          setIsEditing(false);
        }
      }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <div className="flex justify-between items-center">
              <DialogTitle className="text-xl">{selectedTaskDay?.task.title}</DialogTitle>
              {!isEditing && onUpdateTask && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-1"
                >
                  <Edit className="h-4 w-4" /> Edit
                </Button>
              )}
            </div>
          </DialogHeader>
          
          {isEditing && selectedTaskDay ? (
            <TaskEditForm 
              task={selectedTaskDay.task} 
              onSave={(data) => {
                if (onUpdateTask && selectedTaskDay) {
                  onUpdateTask(selectedTaskDay.task.id, data);
                  setIsEditing(false);
                }
              }}
              onCancel={() => setIsEditing(false)}
            />
          ) : (
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
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}