import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { CalendarIcon, X } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Project } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { getPresetOptions } from "@shared/presets.ts";
import {
  EnhancedSelect,
  EnhancedSelectContent,
  EnhancedSelectItem,
  EnhancedSelectTrigger,
  EnhancedSelectValue,
  EnhancedSelectRichTrigger,
} from "@/components/ui/enhanced-select";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// Form schema
const projectFormSchema = z.object({
  name: z.string().min(2, "Project name must be at least 2 characters"),
  location: z.string().min(2, "Location must be at least 2 characters"),
  description: z.string().optional(),
  startDate: z.date(),
  endDate: z.date(),
  status: z.string(),
  useGlobalTheme: z.boolean().default(true),
  colorTheme: z.string().optional(),
  presetId: z.string().optional(),
});

type ProjectFormValues = z.infer<typeof projectFormSchema>;

interface EditProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project | null;
  onDelete?: (projectId: number) => void;
}

export function EditProjectDialog({
  open,
  onOpenChange,
  project,
  onDelete
}: EditProjectDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [useGlobalTheme, setUseGlobalTheme] = React.useState(project?.useGlobalTheme ?? true);

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: project ? {
      name: project.name,
      location: project.location || "",
      description: project.description || "",
      startDate: project.startDate ? new Date(project.startDate) : new Date(),
      endDate: project.endDate ? new Date(project.endDate) : new Date(),
      status: project.status,
      useGlobalTheme: project.useGlobalTheme ?? true,
      colorTheme: project.colorTheme || "earth-tone",
      presetId: project.presetId || "software-development",
    } : {
      name: "",
      location: "",
      description: "",
      startDate: new Date(),
      endDate: new Date(),
      status: "active",
      useGlobalTheme: true,
      colorTheme: "earth-tone",
      presetId: "software-development",
    },
  });

  React.useEffect(() => {
    if (project) {
      setUseGlobalTheme(project.useGlobalTheme ?? true);
      form.reset({
        name: project.name,
        location: project.location || "",
        description: project.description || "",
        startDate: project.startDate ? new Date(project.startDate) : new Date(),
        endDate: project.endDate ? new Date(project.endDate) : new Date(),
        status: project.status,
        useGlobalTheme: project.useGlobalTheme ?? true,
        colorTheme: project.colorTheme || "earth-tone",
        presetId: project.presetId || "software-development",
      });
    }
  }, [project, form]);

  async function onSubmit(data: ProjectFormValues) {
    if (!project) return;
    
    try {
      const updatedProject = await apiRequest(`/api/projects/${project.id}`, "PUT", {
        name: data.name,
        location: data.location,
        description: data.description,
        startDate: data.startDate.toISOString(),
        endDate: data.endDate.toISOString(),
        status: data.status,
        useGlobalTheme: data.useGlobalTheme,
        colorTheme: data.useGlobalTheme ? null : data.colorTheme,
        presetId: data.presetId,
      });

      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${project.id}`] });
      
      toast({
        title: "Project Updated",
        description: "The project has been successfully updated.",
      });
      
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating project:", error);
      toast({
        title: "Error",
        description: "Failed to update the project. Please try again.",
        variant: "destructive",
      });
    }
  }

  const handleDelete = async () => {
    if (!project || !project.id) {
      console.error('Cannot delete project: project or project.id is undefined', project);
      toast({
        title: "Error",
        description: "Project information is missing. Please try refreshing the page.",
        variant: "destructive",
      });
      return;
    }
    
    if (confirm("Are you sure you want to delete this project? This action cannot be undone.")) {
      try {
        await apiRequest(`/api/projects/${project.id}`, "DELETE");
        
        // Close dialog first to prevent any additional fetches of the deleted project
        onOpenChange(false);
        
        // Invalidate projects query to update the list
        queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
        
        toast({
          title: "Project Deleted",
          description: "The project has been successfully deleted.",
        });
        
        // Redirect to projects list page using onDelete callback if provided
        if (onDelete) {
          onDelete(project.id);
        } else {
          // Try to navigate to projects page if we're in a detailed view
          window.location.href = '/projects';
        }
      } catch (error) {
        console.error("Error deleting project:", error);
        toast({
          title: "Error",
          description: "Failed to delete the project. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]" aria-describedby="edit-project-description">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle>Edit Project</DialogTitle>
            <Button
              variant="ghost"
              className="h-8 w-8 p-0 rounded-full"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <DialogDescription>
            Make changes to your project here. Click save when you're done.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter project name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter project location" {...field} />
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
                  <FormLabel>Description (optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter project description" 
                      className="min-h-[80px]" 
                      {...field} 
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                            variant={"outline"}
                            className="w-full pl-3 text-left font-normal"
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
                        <Calendar
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
                            variant={"outline"}
                            className="w-full pl-3 text-left font-normal"
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
                        <Calendar
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

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="on_hold">On Hold</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="presetId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Preset</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select preset" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {getPresetOptions().map(preset => (
                        <SelectItem key={preset.value} value={preset.value}>
                          <div className="flex flex-col">
                            <span className="font-medium">{preset.label}</span>
                            <span className="text-xs text-muted-foreground">{preset.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Theme settings removed - can be configured in project details */}

            <DialogFooter className="sm:justify-between border-t border-slate-200 pt-4 mt-4 gap-2">
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
              >
                Delete Project
              </Button>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-project hover:bg-blue-600"
                >
                  Save Changes
                </Button>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}