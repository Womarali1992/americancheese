import { useEffect, useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { X, ChevronRight, ChevronLeft } from "lucide-react";
import { getMergedTasks, isTemplateTask, fetchTemplates } from "@/components/task/TaskTemplateService";
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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest } from "@/lib/queryClient";

// Labor form schema based on the insertLaborSchema in shared/schema.ts
const laborFormSchema = z.object({
  fullName: z.string().min(1, { message: "Name is required" }),
  tier1Category: z.string().min(1, { message: "Primary category is required" }),
  tier2Category: z.string().min(1, { message: "Secondary category is required" }),
  company: z.string().default(""),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  projectId: z.number(),
  taskId: z.number().optional().nullable(),
  contactId: z.number().optional().nullable(),
  workDate: z.string(),
  taskDescription: z.string().optional().nullable(),
  areaOfWork: z.string().optional().nullable(),
  startDate: z.string(),
  endDate: z.string(),
  startTime: z.string().optional().nullable(),
  endTime: z.string().optional().nullable(),
  totalHours: z.number().optional().nullable(),
  laborCost: z.number().optional().nullable(),
  unitsCompleted: z.string().optional().nullable(),
  materialIds: z.array(z.number()).optional().default([]),
  status: z.string(),
});

// Form values type
type LaborFormValues = z.infer<typeof laborFormSchema>;

// Create mapping of tier2 categories by tier1 category
const tier2CategoriesByTier1: Record<string, string[]> = {
  "Structural": ["Foundation", "Framing", "Concrete", "Steel", "Roofing"],
  "Systems": ["Electrical", "Plumbing", "HVAC", "Communications"],
  "Sheathing": ["Walls", "Ceilings", "Windows", "Doors"],
  "Finishings": ["Drywall", "Flooring", "Painting", "Trim", "Cabinetry"]
};

interface EditLaborDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  laborId: number;
  onSuccess?: () => void;
}

export function EditLaborDialog({
  open,
  onOpenChange,
  laborId,
  onSuccess,
}: EditLaborDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("worker-info");
  const [isLoading, setIsLoading] = useState(false);
  const [laborData, setLaborData] = useState<any>(null);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  
  // States for enhanced task selection
  const [selectedTask, setSelectedTask] = useState<number | null>(null);
  const [selectedTaskObj, setSelectedTaskObj] = useState<any | null>(null);
  const [filteredTasks, setFilteredTasks] = useState<any[]>([]);
  const [tasksByCategory, setTasksByCategory] = useState<Record<string, Record<string, any[]>>>({});
  const [taskCount, setTaskCount] = useState(0);
  
  // Initialize form
  const form = useForm<LaborFormValues>({
    resolver: zodResolver(laborFormSchema),
    defaultValues: {
      fullName: "",
      tier1Category: "Structural",
      tier2Category: "Framing",
      company: "",
      phone: "",
      email: "",
      projectId: 0,
      taskId: null,
      contactId: null,
      workDate: new Date().toISOString().split('T')[0],
      taskDescription: "",
      areaOfWork: "",
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      startTime: "08:00",
      endTime: "17:00",
      totalHours: 8,
      laborCost: 0,
      unitsCompleted: "",
      materialIds: [],
      status: "pending",
    },
  });

  // Fetch labor data when dialog opens
  useEffect(() => {
    if (open && laborId) {
      setIsLoading(true);
      setLoadingError(null);
      
      // Use fetch directly for more control
      fetch(`/api/labor/${laborId}`, {
        credentials: 'include' // Include cookies for authentication
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error(`Failed to fetch labor data: ${response.status}`);
          }
          return response.json();
        })
        .then((data) => {
          console.log("Fetched labor data:", data);
          setLaborData(data);
          
          // Format dates properly for form input
          // Ensure all fields have appropriate default values
          const formattedData = {
            ...data,
            // Format dates for form input
            workDate: data.workDate?.split('T')[0] || new Date().toISOString().split('T')[0],
            startDate: data.startDate?.split('T')[0] || new Date().toISOString().split('T')[0],
            endDate: data.endDate?.split('T')[0] || new Date().toISOString().split('T')[0],
            // Ensure other fields have proper defaults
            startTime: data.startTime || "08:00",
            endTime: data.endTime || "17:00",
            totalHours: data.totalHours !== null && data.totalHours !== undefined 
              ? Number(data.totalHours) 
              : calculateHoursDifference(data.startTime || "08:00", data.endTime || "17:00"),
            laborCost: data.laborCost !== null && data.laborCost !== undefined
              ? Number(data.laborCost)
              : 0,
            // Ensure materialIds is an array
            materialIds: Array.isArray(data.materialIds) ? data.materialIds : [],
            // Ensure numeric fields are numbers
            projectId: Number(data.projectId),
            taskId: data.taskId !== null ? Number(data.taskId) : null,
            contactId: data.contactId !== null ? Number(data.contactId) : null
          };
          
          console.log("Formatted data for form:", formattedData);
          
          // Reset form with the labor data
          form.reset(formattedData);
        })
        .catch(error => {
          console.error("Error fetching labor data:", error);
          setLoadingError("Failed to load labor record. Please try again.");
          toast({
            title: "Error",
            description: "Failed to load labor data. Please try again.",
            variant: "destructive",
          });
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [open, laborId, form]);
  
  // Helper function to calculate hours between two time strings
  const calculateHoursDifference = (startTime: string, endTime: string): number => {
    if (!startTime || !endTime) return 8; // Default to 8 hours
    
    const [startHour, startMinute] = startTime.split(":").map(Number);
    const [endHour, endMinute] = endTime.split(":").map(Number);
    
    let totalHours = endHour - startHour;
    let totalMinutes = endMinute - startMinute;
    
    if (totalMinutes < 0) {
      totalHours -= 1;
      totalMinutes += 60;
    }
    
    return parseFloat((totalHours + (totalMinutes / 60)).toFixed(2));
  };

  // Define the Task interface
  interface Task {
    id: number;
    title: string;
    description?: string;
    status: string;
    startDate: string;
    endDate: string;
    projectId: number;
    tier1Category?: string;
    tier2Category?: string;
    [key: string]: any; // Allow for additional properties
  }
  
  // Query for tasks related to the selected project
  const { data: tasks = [] } = useQuery<any, Error, Task[]>({
    queryKey: ["/api/tasks"],
    select: (tasks: any[]) => {
      // Return only tasks for the current project
      const projectId = form.getValues().projectId;
      return projectId ? tasks.filter((task: Task) => task.projectId === projectId) : [];
    },
  });

  // Update task selection when taskId changes
  useEffect(() => {
    const taskId = form.getValues().taskId;
    if (taskId) {
      setSelectedTask(taskId);
      const task = tasks.find((t: Task) => t.id === taskId);
      if (task) {
        setSelectedTaskObj(task);
      }
    }
  }, [form.watch("taskId"), tasks]);
  
  // Filter and organize tasks by category
  useEffect(() => {
    if (!tasks || tasks.length === 0) {
      setTasksByCategory({});
      setFilteredTasks([]);
      return;
    }
    
    // Update the task count
    setTaskCount(tasks.length);
    
    // Create a new categorized tasks object
    const categorizedTasks: Record<string, Record<string, any[]>> = {
      'structural': {
        'foundation': [],
        'framing': [],
        'roofing': [],
        'other': []
      },
      'systems': {
        'electric': [],
        'plumbing': [],
        'hvac': [],
        'other': []
      },
      'sheathing': {
        'barriers': [],
        'drywall': [],
        'exteriors': [],
        'other': []
      },
      'finishings': {
        'windows': [],
        'doors': [],
        'cabinets': [],
        'fixtures': [],
        'flooring': [],
        'other': []
      },
      'other': {
        'permits': [],
        'other': []
      }
    };
    
    // Populate the categories with tasks
    tasks.forEach((task: Task) => {
      const tier1 = task.tier1Category?.toLowerCase() || 'other';
      const tier2 = task.tier2Category?.toLowerCase() || 'other';
      
      if (!categorizedTasks[tier1]) {
        categorizedTasks[tier1] = {};
      }
      
      if (!categorizedTasks[tier1][tier2]) {
        categorizedTasks[tier1][tier2] = [];
      }
      
      categorizedTasks[tier1][tier2].push(task);
    });
    
    // Update the state with the new categorized tasks
    setTasksByCategory(categorizedTasks);
    setFilteredTasks(tasks);
  }, [tasks, form.watch("projectId")]);
  
  // Update form values when a task is selected
  useEffect(() => {
    if (selectedTaskObj) {
      form.setValue("taskId", selectedTaskObj.id);
      
      // Populate task description from task info
      if (selectedTaskObj.description) {
        form.setValue("taskDescription", selectedTaskObj.description);
      }
    }
  }, [selectedTaskObj, form]);

  // Update tier2Category options when tier1Category changes
  useEffect(() => {
    const tier1 = form.getValues().tier1Category;
    if (tier1 && tier2CategoriesByTier1[tier1]) {
      // If current tier2 is not in the new list, set it to the first option
      const tier2 = form.getValues().tier2Category;
      if (tier2 && !tier2CategoriesByTier1[tier1].map(t => t.toLowerCase()).includes(tier2.toLowerCase())) {
        form.setValue("tier2Category", tier2CategoriesByTier1[tier1][0]);
      }
    }
  }, [form.watch("tier1Category")]);

  // Handle form submission
  const onSubmit = async (data: LaborFormValues) => {
    try {
      console.log("Submitting labor update:", data);
      
      // Prepare the data for submission
      // Ensure materialIds is an array
      const formattedData = {
        ...data,
        materialIds: Array.isArray(data.materialIds) ? data.materialIds : [],
        // Ensure numeric fields are properly parsed
        totalHours: data.totalHours ? Number(data.totalHours) : null,
        laborCost: data.laborCost ? Number(data.laborCost) : null,
        projectId: Number(data.projectId),
        taskId: data.taskId ? Number(data.taskId) : null,
        contactId: data.contactId ? Number(data.contactId) : null
      };
      
      console.log("Formatted data for submission:", formattedData);
      
      // Update the labor record
      const response = await fetch(`/api/labor/${laborId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: 'include', // Include cookies for authentication
        body: JSON.stringify(formattedData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to update labor record: ${response.status} ${errorText}`);
      }

      // Show success message
      toast({
        title: "Labor record updated",
        description: "Labor record has been successfully updated.",
      });

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/labor"] });
      queryClient.invalidateQueries({ queryKey: [`/api/labor/${laborId}`] });
      
      if (formattedData.contactId) {
        queryClient.invalidateQueries({ queryKey: [`/api/contacts/${formattedData.contactId}/labor`] });
      }
      
      if (formattedData.projectId) {
        queryClient.invalidateQueries({ queryKey: [`/api/projects/${formattedData.projectId}/labor`] });
      }

      // Close the dialog
      onOpenChange(false);
      
      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error updating labor record:", error);
      toast({
        title: "Error",
        description: "Failed to update labor record. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Calculate total hours when start/end time changes
  const calculateTotalHours = () => {
    const startTime = form.getValues().startTime;
    const endTime = form.getValues().endTime;
    
    if (startTime && endTime) {
      const [startHour, startMinute] = startTime.split(":").map(Number);
      const [endHour, endMinute] = endTime.split(":").map(Number);
      
      let totalHours = endHour - startHour;
      let totalMinutes = endMinute - startMinute;
      
      if (totalMinutes < 0) {
        totalHours -= 1;
        totalMinutes += 60;
      }
      
      const decimalHours = totalHours + (totalMinutes / 60);
      form.setValue("totalHours", parseFloat(decimalHours.toFixed(2)));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle>Edit Labor Record</DialogTitle>
            <Button
              variant="ghost"
              className="h-8 w-8 p-0 rounded-full"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <DialogDescription id="edit-labor-description">
            Update information for this labor record.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
          </div>
        ) : loadingError ? (
          <div className="text-center py-6">
            <p className="text-red-500 mb-4">{loadingError}</p>
            <Button onClick={() => onOpenChange(false)}>Close</Button>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 overflow-auto flex-1 pr-2">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="worker-info">Worker Info</TabsTrigger>
                  <TabsTrigger value="work-details">Work Details</TabsTrigger>
                  <TabsTrigger value="time-tracking">Time Tracking</TabsTrigger>
                </TabsList>
                
                {/* Worker Info Tab */}
                <TabsContent value="worker-info" className="space-y-4 mt-4">
                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Worker Name</FormLabel>
                        <FormControl>
                          <Input placeholder="John Smith" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="tier1Category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Primary Category</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {Object.keys(tier2CategoriesByTier1).map((tier1) => (
                                <SelectItem key={tier1} value={tier1}>{tier1}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="tier2Category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Specialty/Trade</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select specialty" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {tier2CategoriesByTier1[form.watch("tier1Category")]?.map((tier2) => (
                                <SelectItem key={tier2} value={tier2}>{tier2}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="company"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company</FormLabel>
                        <FormControl>
                          <Input placeholder="ABC Construction" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone</FormLabel>
                          <FormControl>
                            <Input placeholder="555-123-4567" {...field} value={field.value || ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input placeholder="worker@example.com" {...field} value={field.value || ""} />
                          </FormControl>
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
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="billed">Billed</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex justify-end space-x-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => onOpenChange(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      onClick={() => setActiveTab("work-details")}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Next <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </div>
                </TabsContent>
                
                {/* Work Details Tab */}
                <TabsContent value="work-details" className="space-y-4 mt-4">
                  <FormField
                    control={form.control}
                    name="workDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Work Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="areaOfWork"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Area of Work</FormLabel>
                        <FormControl>
                          <Input placeholder="Main floor, East wall" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="projectId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Project</FormLabel>
                        <FormControl>
                          <Select
                            disabled
                            value={field.value?.toString() || ""}
                            onValueChange={(value) => field.onChange(Number(value))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select project" />
                            </SelectTrigger>
                            <SelectContent>
                              {/* Project ID is fixed and cannot be changed in the edit view */}
                              <SelectItem value={field.value?.toString() || ""}>
                                Current Project
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                    
                  <FormField
                    control={form.control}
                    name="taskId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Associated Task {taskCount > 0 ? `(${taskCount} Available)` : ""}</FormLabel>
                        <FormControl>
                          <Select
                            value={field.value?.toString() || ""}
                            onValueChange={(value) => {
                              field.onChange(value ? Number(value) : null);
                              
                              // Find and set the selected task object
                              if (value) {
                                const selectedTask = tasks.find((t: Task) => t.id === Number(value));
                                if (selectedTask) {
                                  setSelectedTaskObj(selectedTask);
                                }
                              } else {
                                setSelectedTaskObj(null);
                              }
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select an associated task" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">None</SelectItem>
                              
                              {/* Group tasks by category */}
                              {Object.entries(tasksByCategory).map(([tier1, tier2Categories]) => (
                                Object.entries(tier2Categories).flatMap(([tier2, tasksInCategory]) => (
                                  tasksInCategory.length > 0 ? (
                                    <SelectGroup key={`${tier1}-${tier2}`}>
                                      <SelectLabel>{tier1.charAt(0).toUpperCase() + tier1.slice(1)} - {tier2.charAt(0).toUpperCase() + tier2.slice(1)}</SelectLabel>
                                      {tasksInCategory.map(task => (
                                        <SelectItem 
                                          key={task.id} 
                                          value={task.id.toString()}
                                        >
                                          {task.title}
                                        </SelectItem>
                                      ))}
                                    </SelectGroup>
                                  ) : null
                                ))
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                        {selectedTaskObj && (
                          <div className="mt-2 text-sm text-gray-500 dark:text-gray-400 border p-2 rounded-lg bg-gray-50 dark:bg-gray-800">
                            <p className="font-medium">Task: {selectedTaskObj.title}</p>
                            {selectedTaskObj.description && (
                              <p className="mt-1">{selectedTaskObj.description}</p>
                            )}
                          </div>
                        )}
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="taskDescription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Work Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Description of work performed"
                            className="resize-none min-h-[100px]"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex justify-between space-x-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setActiveTab("worker-info")}
                    >
                      <ChevronLeft className="mr-1 h-4 w-4" /> Previous
                    </Button>
                    <Button
                      type="button"
                      onClick={() => setActiveTab("time-tracking")}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Next <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </div>
                </TabsContent>
                
                {/* Time Tracking Tab */}
                <TabsContent value="time-tracking" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="startDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Start Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
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
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="startTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Start Time</FormLabel>
                          <FormControl>
                            <Input 
                              type="time" 
                              {...field} 
                              value={field.value || ""}
                              onChange={(e) => {
                                field.onChange(e);
                                calculateTotalHours();
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="endTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>End Time</FormLabel>
                          <FormControl>
                            <Input 
                              type="time" 
                              {...field} 
                              value={field.value || ""}
                              onChange={(e) => {
                                field.onChange(e);
                                calculateTotalHours();
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="totalHours"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Total Hours</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.25" 
                              {...field} 
                              value={field.value?.toString() || ""}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || null)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="laborCost"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Total Labor Cost</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.25" 
                              min="0"
                              placeholder="0.00"
                              {...field} 
                              value={field.value?.toString() || ""}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || null)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="unitsCompleted"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Units Completed</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="e.g., 150 linear ft" 
                              {...field} 
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="flex justify-between space-x-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setActiveTab("work-details")}
                    >
                      <ChevronLeft className="mr-1 h-4 w-4" /> Previous
                    </Button>
                    <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                      Update Labor Record
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}