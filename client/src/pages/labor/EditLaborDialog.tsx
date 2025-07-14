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
  taskDescription: z.string().optional().nullable(),
  areaOfWork: z.string().optional().nullable(),
  // Time period fields are the primary date sources for labor entries
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
  
  // States for task filtering
  const [taskFilterTier1, setTaskFilterTier1] = useState<string | null>(null);
  const [taskFilterTier2, setTaskFilterTier2] = useState<string | null>(null);
  const [availableTier2Categories, setAvailableTier2Categories] = useState<string[]>([]);
  const [uniqueTier1Categories, setUniqueTier1Categories] = useState<string[]>([]);
  
  // State for delete confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
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
      taskDescription: "",
      areaOfWork: "",
      // Time period fields are the primary date sources for labor entries
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
            // Format dates for form input - using time period as the main date source
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

  // Function to update total hours when time changes
  const updateTotalHours = () => {
    const startTime = form.getValues().startTime;
    const endTime = form.getValues().endTime;
    
    if (startTime && endTime) {
      const calculatedHours = calculateHoursDifference(startTime, endTime);
      form.setValue("totalHours", calculatedHours);
    }
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
  
  // Query for projects
  const { data: projects = [] } = useQuery<any[]>({
    queryKey: ["/api/projects"],
  });

  // Query for all tasks
  const { data: allTasks = [] } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  // Watch projectId changes to filter tasks
  const watchedProjectId = form.watch("projectId");
  
  // Filter tasks based on selected project
  const tasks = useMemo(() => {
    return watchedProjectId ? allTasks.filter((task: Task) => task.projectId === watchedProjectId) : [];
  }, [allTasks, watchedProjectId]);

  // Clear task selection when project changes
  useEffect(() => {
    if (watchedProjectId) {
      form.setValue("taskId", null);
      setSelectedTask(null);
      setSelectedTaskObj(null);
    }
  }, [watchedProjectId]);

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
  
  // Extract unique tier1 and tier2 categories from tasks
  useEffect(() => {
    if (!tasks || tasks.length === 0) {
      setUniqueTier1Categories([]);
      return;
    }
    
    // Extract unique tier1 categories
    const tier1Set = new Set<string>();
    tasks.forEach((task: Task) => {
      if (task.tier1Category) {
        tier1Set.add(task.tier1Category.toLowerCase());
      }
    });
    
    // Convert set to array and sort
    const tier1Categories = Array.from(tier1Set).sort();
    setUniqueTier1Categories(tier1Categories);
    
  }, [tasks]);
  
  // Update available tier2 categories when tier1 filter changes
  useEffect(() => {
    if (!tasks || tasks.length === 0 || !taskFilterTier1) {
      setAvailableTier2Categories([]);
      return;
    }
    
    // Extract unique tier2 categories for the selected tier1
    const tier2Set = new Set<string>();
    tasks.forEach((task: Task) => {
      if (
        task.tier1Category?.toLowerCase() === taskFilterTier1.toLowerCase() && 
        task.tier2Category
      ) {
        tier2Set.add(task.tier2Category.toLowerCase());
      }
    });
    
    // Convert set to array and sort
    const tier2Categories = Array.from(tier2Set).sort();
    setAvailableTier2Categories(tier2Categories);
    
    // Reset tier2 filter if it's not in the available categories
    if (
      taskFilterTier2 && 
      !tier2Categories.includes(taskFilterTier2.toLowerCase())
    ) {
      setTaskFilterTier2(null);
    }
    
  }, [tasks, taskFilterTier1, taskFilterTier2]);

  // Filter and organize tasks by category
  useEffect(() => {
    if (!tasks || tasks.length === 0) {
      setTasksByCategory({});
      setFilteredTasks([]);
      return;
    }
    
    // Filter tasks based on selected filters
    let filtered = [...tasks];
    
    if (taskFilterTier1) {
      filtered = filtered.filter(task => 
        task.tier1Category?.toLowerCase() === taskFilterTier1.toLowerCase()
      );
    }
    
    if (taskFilterTier2) {
      filtered = filtered.filter(task => 
        task.tier2Category?.toLowerCase() === taskFilterTier2.toLowerCase()
      );
    }
    
    // Update the task count with filtered tasks
    setTaskCount(filtered.length);
    
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
    
    // Populate the categories with filtered tasks
    filtered.forEach((task: Task) => {
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
    setFilteredTasks(filtered);
  }, [tasks, form.watch("projectId"), taskFilterTier1, taskFilterTier2]);
  
  // Update form values when a task is selected
  useEffect(() => {
    if (selectedTaskObj) {
      form.setValue("taskId", selectedTaskObj.id);
      
      // Do not auto-populate task description - let user write their own
      // The task description should be specific to the actual work performed
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

  // Handle delete confirmation
  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/labor/${laborId}`, {
        method: "DELETE",
        credentials: 'include',
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to delete labor record: ${response.status} ${errorText}`);
      }

      // Show success message
      toast({
        title: "Labor record deleted",
        description: "Labor record has been successfully deleted.",
        variant: "default",
      });

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/labor"] });
      
      if (laborData?.contactId) {
        queryClient.invalidateQueries({ queryKey: [`/api/contacts/${laborData.contactId}/labor`] });
      }
      
      if (laborData?.projectId) {
        queryClient.invalidateQueries({ queryKey: [`/api/projects/${laborData.projectId}/labor`] });
      }

      // Close the dialog
      onOpenChange(false);
      
      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error deleting labor record:", error);
      toast({
        title: "Error",
        description: "Failed to delete labor record. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

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
        contactId: data.contactId ? Number(data.contactId) : null,
        // Set workDate to same as startDate to ensure DB constraint is satisfied
        workDate: data.startDate
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



  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="pb-3 border-b mb-2">
          <div className="flex justify-between items-center">
            <DialogTitle>Edit Labor Record</DialogTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isDeleting}
              >
                Delete
              </Button>
              <Button
                variant="ghost"
                className="h-8 w-8 p-0 rounded-full"
                onClick={() => onOpenChange(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
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
          <div className="overflow-y-auto pr-2 flex-grow" style={{ maxHeight: "calc(90vh - 120px)" }}>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pb-4">
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
                  {/* Work date field removed - using time period (startDate/endDate) instead */}
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
                            value={field.value?.toString() || ""}
                            onValueChange={(value) => field.onChange(Number(value))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select project" />
                            </SelectTrigger>
                            <SelectContent>
                              {projects.map((project: any) => (
                                <SelectItem key={project.id} value={project.id.toString()}>
                                  {project.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                    
                  {/* Task Filter Controls */}
                  <div className="space-y-4 border rounded-md p-3 bg-muted/30 mb-4">
                    <h3 className="text-sm font-medium mb-2">Filter Tasks</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium mb-1 block">Primary Type</label>
                        <Select
                          value={taskFilterTier1 || ""}
                          onValueChange={(value) => {
                            setTaskFilterTier1(value || null);
                            // Reset tier2 filter when tier1 changes
                            setTaskFilterTier2(null);
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="All Types" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all_types">All Types</SelectItem>
                            {uniqueTier1Categories.map((category) => (
                              <SelectItem key={category} value={category}>
                                {category.charAt(0).toUpperCase() + category.slice(1)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium mb-1 block">Secondary Type</label>
                        <Select
                          value={taskFilterTier2 || ""}
                          onValueChange={(value) => setTaskFilterTier2(value || null)}
                          disabled={!taskFilterTier1 || availableTier2Categories.length === 0}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={taskFilterTier1 ? "All Subtypes" : "Select Primary Type First"} />
                          </SelectTrigger>
                          <SelectContent>
                            {taskFilterTier1 && <SelectItem value="all_subtypes">All Subtypes</SelectItem>}
                            {availableTier2Categories.map((category) => (
                              <SelectItem key={category} value={category}>
                                {category.charAt(0).toUpperCase() + category.slice(1)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  
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
                              field.onChange(value && value !== "none" ? Number(value) : null);
                              
                              // Find and set the selected task object
                              if (value && value !== "none") {
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
                              <SelectItem value="none">None</SelectItem>
                              
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
                            className="resize-none min-h-[100px] whitespace-pre-wrap"
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
                          <FormLabel>Start Hour</FormLabel>
                          <Select
                            value={field.value ? field.value.split(':')[0] : ""}
                            onValueChange={(value) => {
                              const timeString = `${value}:00`;
                              field.onChange(timeString);
                              setTimeout(updateTotalHours, 0);
                            }}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select start hour" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {Array.from({ length: 24 }, (_, i) => (
                                <SelectItem key={i} value={i.toString().padStart(2, '0')}>
                                  {i === 0 ? "12 AM" : i < 12 ? `${i} AM` : i === 12 ? "12 PM" : `${i - 12} PM`}
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
                      name="endTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>End Hour</FormLabel>
                          <Select
                            value={field.value ? field.value.split(':')[0] : ""}
                            onValueChange={(value) => {
                              const timeString = `${value}:00`;
                              field.onChange(timeString);
                              setTimeout(updateTotalHours, 0);
                            }}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select end hour" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {Array.from({ length: 24 }, (_, i) => (
                                <SelectItem key={i} value={i.toString().padStart(2, '0')}>
                                  {i === 0 ? "12 AM" : i < 12 ? `${i} AM` : i === 12 ? "12 PM" : `${i - 12} PM`}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
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
                          <FormLabel>Total Hours (Calculated)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              {...field} 
                              value={field.value || 0}
                              readOnly
                              className="bg-gray-50 text-gray-700"
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
          </div>
        )}
      </DialogContent>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Labor Record</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this labor record? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}