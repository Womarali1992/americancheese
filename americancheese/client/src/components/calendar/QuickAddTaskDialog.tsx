import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, addDays } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useTier1Categories, useTier2Categories } from "@/lib/unified-category-hooks";
import type { Project } from "@shared/schema";

interface QuickAddTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultDate?: Date;
  defaultProjectId?: number;
}

interface TaskFormData {
  title: string;
  description: string;
  projectId: string;
  tier1Category: string;
  tier2Category: string;
  startDate: Date;
  endDate: Date;
  startTime: string;
  endTime: string;
}

export function QuickAddTaskDialog({
  open,
  onOpenChange,
  defaultDate = new Date(),
  defaultProjectId,
}: QuickAddTaskDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [startDate, setStartDate] = useState<Date>(defaultDate);
  const [endDate, setEndDate] = useState<Date>(addDays(defaultDate, 1));

  // Reset dates when dialog opens with a new default date
  useState(() => {
    if (open) {
      setStartDate(defaultDate);
      setEndDate(addDays(defaultDate, 1));
    }
  });

  const { register, handleSubmit, reset, setValue, watch } = useForm<TaskFormData>({
    defaultValues: {
      title: "",
      description: "",
      projectId: defaultProjectId?.toString() || "",
      tier1Category: "",
      tier2Category: "",
      startDate: defaultDate,
      endDate: addDays(defaultDate, 1),
      startTime: "",
      endTime: "",
    },
  });

  const selectedProjectId = watch("projectId");
  const selectedTier1 = watch("tier1Category");
  const selectedTier2 = watch("tier2Category");

  // Fetch projects
  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  // Fetch tier1 categories for selected project
  const { data: tier1Categories = [], isLoading: tier1Loading } = useTier1Categories(
    selectedProjectId ? parseInt(selectedProjectId) : undefined
  );

  // Fetch tier2 categories based on selected tier1
  const { data: tier2Categories = [], isLoading: tier2Loading } = useTier2Categories(
    selectedProjectId ? parseInt(selectedProjectId) : undefined,
    selectedTier1 || undefined
  );

  // Reset tier1 and tier2 when project changes
  useEffect(() => {
    if (selectedProjectId) {
      setValue("tier1Category", "");
      setValue("tier2Category", "");
    }
  }, [selectedProjectId, setValue]);

  // Reset tier2 when tier1 changes
  useEffect(() => {
    setValue("tier2Category", "");
  }, [selectedTier1, setValue]);

  // Auto-select first tier1 when categories load
  useEffect(() => {
    if (tier1Categories.length > 0 && !selectedTier1) {
      setValue("tier1Category", tier1Categories[0].name);
    }
  }, [tier1Categories, selectedTier1, setValue]);

  // Auto-select first tier2 when categories load
  useEffect(() => {
    if (tier2Categories.length > 0 && !selectedTier2) {
      setValue("tier2Category", tier2Categories[0].name);
    }
  }, [tier2Categories, selectedTier2, setValue]);

  // Create task mutation
  const createTask = useMutation({
    mutationFn: async (data: TaskFormData) => {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: data.title,
          description: data.description || null,
          projectId: parseInt(data.projectId),
          startDate: format(startDate, "yyyy-MM-dd"),
          endDate: format(endDate, "yyyy-MM-dd"),
          startTime: data.startTime || null,
          endTime: data.endTime || null,
          status: "not_started",
          tier1Category: data.tier1Category,
          tier2Category: data.tier2Category,
          calendarActive: true, // Show on calendar since created from calendar
        }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to create task");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Task created",
        description: "The task has been added to the calendar.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      reset();
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

  const onSubmit = (data: TaskFormData) => {
    if (!data.projectId) {
      toast({
        title: "Error",
        description: "Please select a project",
        variant: "destructive",
      });
      return;
    }
    if (!data.tier1Category) {
      toast({
        title: "Error",
        description: "Please select a category",
        variant: "destructive",
      });
      return;
    }
    if (!data.tier2Category) {
      toast({
        title: "Error",
        description: "Please select a subcategory",
        variant: "destructive",
      });
      return;
    }
    createTask.mutate(data);
  };

  const handleClose = () => {
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Quick Add Task</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Task Title *</Label>
            <Input
              id="title"
              placeholder="Enter task title"
              {...register("title", { required: true })}
            />
          </div>

          {/* Project */}
          <div className="space-y-2">
            <Label>Project *</Label>
            <Select
              value={selectedProjectId}
              onValueChange={(value) => setValue("projectId", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id.toString()}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Category Dropdowns */}
          {selectedProjectId && (
            <div className="grid grid-cols-2 gap-4">
              {/* Tier 1 Category */}
              <div className="space-y-2">
                <Label>Category *</Label>
                <Select
                  value={selectedTier1}
                  onValueChange={(value) => setValue("tier1Category", value)}
                  disabled={tier1Loading || tier1Categories.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={tier1Loading ? "Loading..." : "Select category"} />
                  </SelectTrigger>
                  <SelectContent>
                    {tier1Categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.name}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Tier 2 Category */}
              <div className="space-y-2">
                <Label>Subcategory *</Label>
                <Select
                  value={selectedTier2}
                  onValueChange={(value) => setValue("tier2Category", value)}
                  disabled={tier2Loading || !selectedTier1 || tier2Categories.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={
                      !selectedTier1
                        ? "Select category first"
                        : tier2Loading
                          ? "Loading..."
                          : "Select subcategory"
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {tier2Categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.name}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "MMM d, yyyy") : "Pick date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(date) => date && setStartDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>End Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "MMM d, yyyy") : "Pick date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={(date) => date && setEndDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Time Range (optional) */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime">Start Time (optional)</Label>
              <Input
                id="startTime"
                type="time"
                {...register("startTime")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endTime">End Time (optional)</Label>
              <Input
                id="endTime"
                type="time"
                {...register("endTime")}
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              placeholder="Add a description..."
              rows={2}
              {...register("description")}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={createTask.isPending}>
              {createTask.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Create Task
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
