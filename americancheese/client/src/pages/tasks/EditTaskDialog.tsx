import React, { useEffect, useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { X, Calendar as CalendarIcon, PaperclipIcon, Package, Trash2, AlertTriangle, FileCode2, ChevronDown } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { Contact, Material } from "@/../../shared/schema";
import { Wordbank, WordbankItem } from "@/components/ui/wordbank";
import { TaskAttachmentsPanel } from "@/components/task/TaskAttachmentsPanel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AddSectionMaterialsDialog } from "@/components/materials/AddSectionMaterialsDialog";
import { useLocation } from "wouter";

// Define interfaces directly to avoid import issues
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

// Define Task interface to match the schema
interface Task {
  id: number;
  title: string;
  description: string | null;
  status: string;
  startDate: string;
  endDate: string;
  assignedTo: string | null;
  projectId: number;
  completed: boolean;
  category: string;
  tier1Category: string;
  tier2Category: string;
  contactIds: string[] | null;
  materialIds: string[] | null;
  materialsNeeded: string | null;
  templateId: string | null;
  estimatedCost: number | null;
  actualCost: number | null;
}

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
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
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ContextEditor } from "@/components/context";
import { ContextData } from "@shared/context-types";

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
  const [, navigate] = useLocation();
  const [sectionMaterialsDialogOpen, setSectionMaterialsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [contextOpen, setContextOpen] = useState(false);
  const [contextData, setContextData] = useState<ContextData | null>(null);

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
      
      // Invalidate the specific task detail query
      if (task) {
        queryClient.invalidateQueries({ queryKey: [`/api/tasks/${task.id}`] });
      }
      
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

  // Handle delete task
  const handleDeleteTask = async () => {
    if (!task) return;
    
    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        // If deletion was successful
        toast({
          title: "Task Deleted",
          description: `"${task.title}" has been successfully deleted.`,
          variant: "default",
        });

        // Invalidate queries to refresh the tasks list
        queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
        if (task.projectId) {
          queryClient.invalidateQueries({ queryKey: ['/api/projects', task.projectId, 'tasks'] });
        }
        
        // Close dialogs
        setIsDeleteDialogOpen(false);
        onOpenChange(false);
        
        // Navigate back to the tasks list
        navigate('/tasks');
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: errorData.message || "Failed to delete task. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error deleting task:", error);
      toast({
        title: "Error",
        description: "Something went wrong while deleting the task. Please try again.",
        variant: "destructive",
      });
    }
  };

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

            {/* AI Context Section */}
            <Collapsible open={contextOpen} onOpenChange={setContextOpen}>
              <CollapsibleTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full flex items-center justify-between px-3 py-2 border border-dashed border-slate-300 rounded-lg hover:bg-slate-50"
                >
                  <div className="flex items-center gap-2">
                    <FileCode2 className="h-4 w-4 text-slate-500" />
                    <span className="text-sm font-medium text-slate-700">AI Context</span>
                    {contextData && (
                      <Badge variant="secondary" className="text-xs">Configured</Badge>
                    )}
                  </div>
                  <ChevronDown className={`h-4 w-4 text-slate-500 transition-transform ${contextOpen ? 'rotate-180' : ''}`} />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2">
                <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/50">
                  <p className="text-xs text-slate-500 mb-3">
                    Configure structured context for AI/LLM assistants.
                  </p>
                  <ContextEditor
                    entityId={`task-${task?.id}`}
                    entityType="task"
                    initialContext={contextData}
                    onChange={setContextData}
                    compact
                  />
                </div>
              </CollapsibleContent>
            </Collapsible>

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
                // Transform materials to WordbankItems, grouped by section
                // First, filter to selected materials
                const selectedMaterials = materials.filter(material => 
                  field.value?.includes(material.id)
                );
                
                // Group materials by section
                const materialsBySection: Record<string, Material[]> = {};
                
                // First group the selected materials
                selectedMaterials.forEach(material => {
                  const section = material.section || 'General';
                  if (!materialsBySection[section]) {
                    materialsBySection[section] = [];
                  }
                  materialsBySection[section].push(material);
                });
                
                // Also group unselected materials to show in the selection list
                const unselectedMaterials = materials.filter(material => 
                  !field.value?.includes(material.id)
                );
                
                unselectedMaterials.forEach(material => {
                  const section = material.section || 'General';
                  if (!materialsBySection[section]) {
                    materialsBySection[section] = [];
                  }
                  materialsBySection[section].push(material);
                });
                
                // Create wordbank items for each section
                const materialItems: WordbankItem[] = Object.entries(materialsBySection).map(([section, sectionMaterials]) => {
                  // Check if any material in this section is already selected
                  const hasSelectedMaterials = sectionMaterials.some(material => 
                    field.value?.includes(material.id)
                  );
                  
                  // Get IDs of materials in this section
                  const sectionMaterialIds = sectionMaterials.map(material => material.id);
                  
                  // Choose the first material's ID as representative for the section
                  return {
                    id: section.toLowerCase().replace(/\s+/g, '_'),  // Create a unique string ID for the section
                    label: section,
                    subtext: `${sectionMaterials.length} material${sectionMaterials.length !== 1 ? 's' : ''}`,
                    color: hasSelectedMaterials ? 'text-green-500' : 'text-gray-500',
                    // Store additional data in a custom property
                    metadata: {
                      materialIds: sectionMaterialIds,
                      isSelected: hasSelectedMaterials
                    }
                  };
                });
                
                // Handler for adding materials by section
                const handleAddSectionMaterials = (materialIds: number[]) => {
                  // Get current material IDs
                  const currentIds = [...field.value];
                  // Filter out any IDs that are already selected
                  const newIds = materialIds.filter(id => !currentIds.includes(id));
                  // Add the new IDs to the current selection
                  field.onChange([...currentIds, ...newIds]);
                };

                return (
                  <FormItem>
                    <div className="flex justify-between items-center">
                      <FormLabel>Materials</FormLabel>
                      <Button 
                        type="button"
                        variant="outline" 
                        size="sm" 
                        className="flex items-center gap-1 text-xs"
                        onClick={() => setSectionMaterialsDialogOpen(true)}
                      >
                        <Package className="h-3.5 w-3.5" />
                        Add Section
                      </Button>
                    </div>
                    <FormControl>
                      <Wordbank
                        items={materialItems}
                        selectedItems={Object.keys(materialsBySection)
                          .filter(section => {
                            // A section is considered selected if any of its materials are selected
                            const sectionMaterials = materialsBySection[section];
                            return sectionMaterials.some(material => field.value?.includes(material.id));
                          })
                          .map(section => section.toLowerCase().replace(/\s+/g, '_') as string)
                        }
                        onItemSelect={(id) => {
                          // Find the corresponding wordbank item with its metadata
                          const item = materialItems.find(item => item.id === id);
                          if (item?.metadata?.materialIds) {
                            // Get current material IDs
                            const currentIds = [...field.value];
                            // Add all material IDs from this section that aren't already selected
                            const newIds = item.metadata.materialIds.filter(
                              (materialId: number) => !currentIds.includes(materialId)
                            );
                            field.onChange([...currentIds, ...newIds]);
                          }
                        }}
                        onItemRemove={(id) => {
                          // Find the corresponding wordbank item with its metadata
                          const item = materialItems.find(item => item.id === id);
                          if (item?.metadata?.materialIds) {
                            // Get current material IDs
                            const currentIds = [...field.value];
                            // Remove all material IDs from this section
                            const materialIds = item.metadata?.materialIds || [];
                            field.onChange(currentIds.filter(
                              itemId => !materialIds.includes(itemId)
                            ));
                          }
                        }}
                        emptyText="No materials attached"
                      />
                    </FormControl>
                    <FormMessage />
                    
                    {/* Section Materials Dialog */}
                    <AddSectionMaterialsDialog
                      open={sectionMaterialsDialogOpen}
                      onOpenChange={setSectionMaterialsDialogOpen}
                      projectId={task?.projectId}
                      onAddMaterials={handleAddSectionMaterials}
                      existingMaterialIds={field.value || []}
                      initialTier1={task?.tier1Category}
                      initialTier2={task?.tier2Category}
                    />
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

            <DialogFooter className="flex justify-between">
              <Button 
                type="button"
                variant="destructive"
                onClick={() => setIsDeleteDialogOpen(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Task
              </Button>
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Confirm Task Deletion
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete task "{task?.title}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="pt-2">
            <p className="text-sm text-muted-foreground">
              Deleting this task will remove it permanently from the system. Any associated labor records, materials, and attachments may also be affected.
            </p>
          </div>
          <DialogFooter className="flex sm:justify-end gap-2 mt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              type="button" 
              variant="destructive" 
              onClick={handleDeleteTask}
            >
              Delete Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}