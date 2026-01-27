import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format, addDays } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Loader2, Clock, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import type { Task } from "@shared/schema";

interface ScheduleTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task | null;
}

export function ScheduleTaskDialog({
  open,
  onOpenChange,
  task,
}: ScheduleTaskDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Initialize with task's existing calendar dates or planned dates
  const [calendarStartDate, setCalendarStartDate] = useState<Date>(new Date());
  const [calendarEndDate, setCalendarEndDate] = useState<Date>(addDays(new Date(), 1));
  const [calendarStartTime, setCalendarStartTime] = useState<string>("");
  const [calendarEndTime, setCalendarEndTime] = useState<string>("");

  // Reset dates when dialog opens with a task
  useEffect(() => {
    if (open && task) {
      // Use existing calendar dates if available, otherwise use task's planned dates
      if (task.calendarStartDate) {
        setCalendarStartDate(new Date(task.calendarStartDate));
      } else if (task.startDate) {
        setCalendarStartDate(new Date(task.startDate));
      } else {
        setCalendarStartDate(new Date());
      }

      if (task.calendarEndDate) {
        setCalendarEndDate(new Date(task.calendarEndDate));
      } else if (task.endDate) {
        setCalendarEndDate(new Date(task.endDate));
      } else {
        setCalendarEndDate(addDays(new Date(), 1));
      }

      // Use existing calendar times if available, otherwise use task's times
      setCalendarStartTime(task.calendarStartTime || task.startTime || "");
      setCalendarEndTime(task.calendarEndTime || task.endTime || "");
    }
  }, [open, task]);

  // Schedule task mutation
  const scheduleTask = useMutation({
    mutationFn: async () => {
      if (!task) throw new Error("No task selected");

      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          calendarActive: true,
          calendarStartDate: format(calendarStartDate, "yyyy-MM-dd"),
          calendarEndDate: format(calendarEndDate, "yyyy-MM-dd"),
          calendarStartTime: calendarStartTime || null,
          calendarEndTime: calendarEndTime || null,
        }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to schedule task");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Task scheduled",
        description: "The task has been added to the calendar with your selected dates.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: [`/api/tasks/${task?.id}`] });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Remove from calendar mutation
  const removeFromCalendar = useMutation({
    mutationFn: async () => {
      if (!task) throw new Error("No task selected");

      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          calendarActive: false,
          calendarStartDate: null,
          calendarEndDate: null,
          calendarStartTime: null,
          calendarEndTime: null,
        }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to remove from calendar");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Removed from calendar",
        description: "The task has been removed from the calendar.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: [`/api/tasks/${task?.id}`] });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSchedule = () => {
    scheduleTask.mutate();
  };

  const handleRemove = () => {
    removeFromCalendar.mutate();
  };

  const isOnCalendar = task?.calendarActive ?? false;

  if (!task) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-cyan-600" />
            Schedule Task on Calendar
          </DialogTitle>
          <DialogDescription>
            Choose when this task should appear on the calendar. These dates are separate from the task's planned dates.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Task Info */}
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <p className="font-medium text-slate-900">{task.title}</p>
            <p className="text-sm text-slate-500 mt-1">
              Planned: {task.startDate} to {task.endDate}
            </p>
          </div>

          {/* Calendar Date Selection */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Start Date */}
              <div className="space-y-2">
                <Label>Calendar Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !calendarStartDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {calendarStartDate ? format(calendarStartDate, "MMM d, yyyy") : "Pick date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={calendarStartDate}
                      onSelect={(date) => date && setCalendarStartDate(date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* End Date */}
              <div className="space-y-2">
                <Label>Calendar End Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !calendarEndDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {calendarEndDate ? format(calendarEndDate, "MMM d, yyyy") : "Pick date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={calendarEndDate}
                      onSelect={(date) => date && setCalendarEndDate(date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Time Selection */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="calendarStartTime" className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Start Time (optional)
                </Label>
                <Input
                  id="calendarStartTime"
                  type="time"
                  value={calendarStartTime}
                  onChange={(e) => setCalendarStartTime(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="calendarEndTime" className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  End Time (optional)
                </Label>
                <Input
                  id="calendarEndTime"
                  type="time"
                  value={calendarEndTime}
                  onChange={(e) => setCalendarEndTime(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between gap-2 pt-4 border-t">
            {isOnCalendar && (
              <Button
                type="button"
                variant="outline"
                onClick={handleRemove}
                disabled={removeFromCalendar.isPending}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                {removeFromCalendar.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Remove from Calendar
              </Button>
            )}
            <div className="flex gap-2 ml-auto">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSchedule}
                disabled={scheduleTask.isPending}
                className="bg-cyan-600 hover:bg-cyan-700"
              >
                {scheduleTask.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isOnCalendar ? "Update Schedule" : "Add to Calendar"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
