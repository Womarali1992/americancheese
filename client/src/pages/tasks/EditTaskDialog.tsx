import React, { useEffect, useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { X, Calendar as CalendarIcon, PaperclipIcon } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Task, Contact, Material } from "@/../../shared/schema";
import { Wordbank, WordbankItem } from "@/components/ui/wordbank";
import { TaskAttachmentsPanel } from "@/components/task/TaskAttachmentsPanel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Define Project interface directly to avoid import issues
interface Project {
  id: number;
  name: string;
  description?: string;
  location?: string;
  startDate: string;
  endDate: string;
  status: string;
  progress?: number;
}

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn, formatDate } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";

// Extending the task schema with validation
const taskFormSchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters" }),
  description: z.string().optional(),
  projectId: z.coerce.number(),
  category: z.string().default("other"),
  materialsNeeded: z.string().optional(),
  startDate: z.date(),
  endDate: z.date(),
  status: z.string().default("not_started"),
  assignedTo: z.string().optional(),
  completed: z.boolean().default(false),
  contactIds: z.array(z.number()).default([]),
  materialIds: z.array(z.number()).default([]),
  estimatedCost: z.coerce.number().optional().nullable(),
  actualCost: z.coerce.number().optional().nullable(),
});

type TaskFormValues = z.infer<typeof taskFormSchema>;

interface EditTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task | null;
}

export function EditTaskDialog({
  open,
  onOpenChange,
  task
}: EditTaskDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query for projects to populate the project selector
  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });
  
  // Query for contacts to populate contact selection
  const { data: contacts = [] } = useQuery<Contact[]>({
    queryKey: ["/api/contacts"],
  });
  
  // Query for materials to populate material selection
  const { data: materials = [] } = useQuery<Material[]>({
    queryKey: ["/api/materials"],
  });

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: task?.title || "",
      description: task?.description || "",
      projectId: task?.projectId || undefined,
      category: task?.category || "other",
      materialsNeeded: task?.materialsNeeded || "",
      startDate: task?.startDate ? new Date(task.startDate) : new Date(),
      endDate: task?.endDate ? new Date(task.endDate) : new Date(new Date().setDate(new Date().getDate() + 7)),
      status: task?.status || "not_started",
      assignedTo: task?.assignedTo || "",
      completed: task?.completed || false,
      contactIds: Array.isArray(task?.contactIds) ? task?.contactIds.map(id => Number(id)) : [],
      materialIds: Array.isArray(task?.materialIds) ? task?.materialIds.map(id => Number(id)) : [],
      estimatedCost: task?.estimatedCost || null,
      actualCost: task?.actualCost || null,
    },
  });

  // Update form values when task changes
  useEffect(() => {
    if (task && open) {
      form.reset({
        title: task.title,
        description: task.description || "",
        projectId: task.projectId,
        category: task.category || "other",
        materialsNeeded: task.materialsNeeded || "",
        startDate: new Date(task.startDate),
        endDate: new Date(task.endDate),
        status: task.status,
        assignedTo: task.assignedTo || "",
        completed: !!task.completed, // Convert to boolean with !!
        contactIds: Array.isArray(task.contactIds) ? task.contactIds.map(id => Number(id)) : [],
        materialIds: Array.isArray(task.materialIds) ? task.materialIds.map(id => Number(id)) : [],
        estimatedCost: task.estimatedCost || null,
        actualCost: task.actualCost || null,
      });
    }
  }, [form, task, open]);

  const updateTask = useMutation({
    mutationFn: async (data: TaskFormValues) => {
      if (!task) return null;
      
      // Convert Date objects to ISO strings for the API
      // Ensure contactIds and materialIds are stored as string arrays
      const apiData = {
        ...data,
        startDate: data.startDate.toISOString(),
        endDate: data.endDate.toISOString(),
        contactIds: data.contactIds.map(id => id.toString()),
        materialIds: data.materialIds.map(id => id.toString())
      };
      return apiRequest(`/api/tasks/${task.id}`, "PUT", apiData);
    },
    onSuccess: () => {
      toast({
        title: "Task updated",
        description: "Your task has been updated successfully.",
      });
      // Invalidate tasks query to refresh task data
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      
      // Invalidate projects query to ensure dashboard progress bars update correctly
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      
      // If the task is associated with a specific project, also invalidate that specific project's tasks
      if (task?.projectId) {
        queryClient.invalidateQueries({ 
          queryKey: [`/api/projects/${task.projectId}/tasks`] 
        });
      }
      
      form.reset();
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update task. Please try again.",
        variant: "destructive",
      });
      console.error("Failed to update task:", error);
    },
  });

  async function onSubmit(data: TaskFormValues) {
    updateTask.mutate(data);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]" aria-describedby="edit-task-description">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle>Edit Task</DialogTitle>
            <Button
              variant="ghost"
              className="h-8 w-8 p-0 rounded-full"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="projectId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(parseInt(value))}
                    value={field.value?.toString()}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a project" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {projects?.map((project) => (
                        <SelectItem
                          key={project.id}
                          value={project.id.toString()}
                        >
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Task Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter task title" {...field} />
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
                    <Textarea
                      placeholder="Enter task description"
                      className="h-24 resize-none"
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
                  <FormItem>
                    <FormLabel>Start Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              formatDate(field.value)
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
                  <FormItem>
                    <FormLabel>End Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              formatDate(field.value)
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="foundation">Foundation</SelectItem>
                        <SelectItem value="framing">Framing</SelectItem>
                        <SelectItem value="roof">Roof</SelectItem>
                        <SelectItem value="windows_doors">Windows/Doors</SelectItem>
                        <SelectItem value="electrical">Electrical</SelectItem>
                        <SelectItem value="plumbing">Plumbing</SelectItem>
                        <SelectItem value="hvac">HVAC</SelectItem>
                        <SelectItem value="insulation">Insulation</SelectItem>
                        <SelectItem value="drywall">Drywall</SelectItem>
                        <SelectItem value="flooring">Flooring</SelectItem>
                        <SelectItem value="painting">Painting</SelectItem>
                        <SelectItem value="landscaping">Landscaping</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        // Update the status field
                        field.onChange(value);
                        
                        // Automatically update the 'completed' checkbox when status changes
                        if (value === "completed") {
                          form.setValue("completed", true);
                        } else if (form.getValues("completed") === true) {
                          form.setValue("completed", false);
                        }
                      }}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="not_started">Not Started</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="on_hold">On Hold</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="assignedTo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assigned To</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter name of person assigned"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
                
              <FormField
                control={form.control}
                name="materialsNeeded"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Materials Needed</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="List materials needed for this task"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="estimatedCost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estimated Cost ($)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0.00"
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) => {
                          const value = e.target.value === "" ? null : Number(e.target.value);
                          field.onChange(value);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
                
              <FormField
                control={form.control}
                name="actualCost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Actual Cost ($)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0.00"
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) => {
                          const value = e.target.value === "" ? null : Number(e.target.value);
                          field.onChange(value);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="contactIds"
              render={({ field }) => {
                // Transform contacts to WordbankItems
                const contactItems: WordbankItem[] = contacts.map(contact => ({
                  id: contact.id,
                  label: contact.name,
                  subtext: contact.role,
                  color: contact.type === 'client' ? 'text-blue-500' : 
                          contact.type === 'contractor' ? 'text-green-500' : 
                          contact.type === 'supplier' ? 'text-orange-500' : 'text-gray-500'
                }));
                
                return (
                  <FormItem>
                    <FormLabel>Contacts</FormLabel>
                    <FormControl>
                      <Wordbank
                        items={contactItems}
                        selectedItems={field.value || []}
                        onItemSelect={(id) => {
                          const currentIds = [...field.value];
                          field.onChange([...currentIds, id]);
                        }}
                        onItemRemove={(id) => {
                          const currentIds = [...field.value];
                          field.onChange(currentIds.filter(itemId => itemId !== id));
                        }}
                        emptyText="No contacts assigned"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />

            <FormField
              control={form.control}
              name="materialIds"
              render={({ field }) => {
                // Transform materials to WordbankItems
                const materialItems: WordbankItem[] = materials.map(material => ({
                  id: material.id,
                  label: material.name,
                  subtext: material.type,
                  color: material.status === 'available' ? 'text-green-500' :
                          material.status === 'ordered' ? 'text-orange-500' :
                          material.status === 'low_stock' ? 'text-red-500' : 'text-gray-500'
                }));
                
                return (
                  <FormItem>
                    <FormLabel>Materials</FormLabel>
                    <FormControl>
                      <Wordbank
                        items={materialItems}
                        selectedItems={field.value || []}
                        onItemSelect={(id) => {
                          const currentIds = [...field.value];
                          field.onChange([...currentIds, id]);
                        }}
                        onItemRemove={(id) => {
                          const currentIds = [...field.value];
                          field.onChange(currentIds.filter(itemId => itemId !== id));
                        }}
                        emptyText="No materials attached"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />

            <FormField
              control={form.control}
              name="completed"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-2">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={(checked) => {
                        // Update the completed field
                        field.onChange(!!checked);
                        
                        // Automatically set status to "completed" if checked
                        // or "in_progress" if unchecked from a completed state
                        if (!!checked) {
                          form.setValue("status", "completed");
                        } else if (form.getValues("status") === "completed") {
                          form.setValue("status", "in_progress");
                        }
                      }}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Mark as completed</FormLabel>
                  </div>
                </FormItem>
              )}
            />

            {/* Task Attachments Panel (only visible for existing tasks) */}
            {task && (
              <div className="mt-6 border-t pt-4">
                <h3 className="text-lg font-medium mb-4">Task Attachments</h3>
                <TaskAttachmentsPanel task={task} />
              </div>
            )}

            <DialogFooter>
              <Button 
                type="submit" 
                className="bg-green-600 hover:bg-green-700 text-white"
                disabled={updateTask.isPending}
              >
                {updateTask.isPending ? "Updating..." : "Update Task"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}