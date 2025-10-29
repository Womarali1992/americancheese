import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, useMemo } from "react";
import { X, Check, ChevronRight, ChevronLeft } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { getMergedTasks, isTemplateTask, fetchTemplates } from "@/components/task/TaskTemplateService";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

interface Task {
  id: number;
  title: string;
  description?: string;
  status: string;
  startDate: string;
  endDate: string;
  assignedTo?: string;
  projectId: number;
  completed?: boolean;
  category?: string;
  tier1Category?: string;
  tier2Category?: string;
  contactIds?: string[] | number[] | null;
  materialIds?: string[] | number[] | null;
  materialsNeeded?: string | null;
}

interface Contact {
  id: number;
  name: string;
  role: string;
  company?: string;
  phone?: string;
  email?: string;
  type: string;
  initials?: string;
}

interface Material {
  id: number;
  name: string;
  type: string;
  quantity: number;
  projectId: number;
  supplier?: string;
  status: string;
  unit?: string;
  cost?: number;
  category?: string;
  taskIds?: number[] | null;
  contactIds?: number[] | null;
  tier?: string;
  tier2Category?: string;
  section?: string;
  subsection?: string;
  details?: string;
}

interface Subtask {
  id: number;
  parentTaskId: number;
  title: string;
  description?: string;
  completed: boolean;
  sortOrder: number;
  assignedTo?: string;
  startDate?: string;
  endDate?: string;
  status: string;
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

// Extending the labor schema with validation
const laborFormSchema = z.object({
  fullName: z.string().min(2, { message: "Worker name must be at least 2 characters" }),
  tier1Category: z.string().min(2, { message: "Primary category is required" }),
  tier2Category: z.string().min(2, { message: "Secondary category is required" }),
  company: z.string().min(2, { message: "Company name is required" }),
  phone: z.string().optional(),
  email: z.string().email({ message: "Invalid email address" }).optional().or(z.literal('')),
  projectId: z.coerce.number(),
  taskId: z.coerce.number().optional().nullable(),
  subtaskId: z.coerce.number().optional().nullable(),
  contactId: z.coerce.number().min(1, { message: "Please select a contact" }),
  taskDescription: z.string().optional(),
  workDescription: z.string().optional(),
  areaOfWork: z.string().optional(),
  // Time period fields are the primary date sources for labor entries
  startDate: z.string().min(2, { message: "Start date is required" }),
  // workDate will be set equal to startDate in the submit handler
  workDate: z.string().optional(),
  endDate: z.string().min(2, { message: "End date is required" }),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  totalHours: z.union([z.string().optional(), z.coerce.number().min(0)]),
  laborCost: z.union([z.string().optional(), z.coerce.number().min(0)]),
  unitsCompleted: z.string().optional(),
  materialIds: z.array(z.coerce.number()).optional(),
  status: z.string().default("pending"),
  isQuote: z.boolean().default(false), // Flag to indicate if this is a quote and should not count towards budget
});

type LaborFormValues = z.infer<typeof laborFormSchema>;

interface CreateLaborDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId?: number;
  preselectedTaskId?: number;
  preselectedContactId?: number;
}

export function CreateLaborDialog({
  open,
  onOpenChange,
  projectId,
  preselectedTaskId,
  preselectedContactId,
}: CreateLaborDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedMaterials, setSelectedMaterials] = useState<number[]>([]);
  const [activeTab, setActiveTab] = useState("worker-info");

  // State for task selection with enhanced UI
  const [selectedTask, setSelectedTask] = useState<number | null>(null);
  const [selectedTaskObj, setSelectedTaskObj] = useState<Task | null>(null);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [tasksByCategory, setTasksByCategory] = useState<Record<string, Record<string, Task[]>>>({});
  const [taskCount, setTaskCount] = useState(0);

  // States for task filtering
  const [taskFilterTier1, setTaskFilterTier1] = useState<string | null>(null);
  const [taskFilterTier2, setTaskFilterTier2] = useState<string | null>(null);
  const [availableTier2Categories, setAvailableTier2Categories] = useState<string[]>([]);
  const [uniqueTier1Categories, setUniqueTier1Categories] = useState<string[]>([]);
  
  // Initialize form with default values
  const form = useForm<LaborFormValues>({
    resolver: zodResolver(laborFormSchema),
    defaultValues: {
      fullName: "",
      tier1Category: "Structural",
      tier2Category: "Framing",
      company: "",
      phone: "",
      email: "",
      projectId: projectId || undefined,
      taskId: preselectedTaskId || null,
      subtaskId: null,
      contactId: preselectedContactId || undefined,
      taskDescription: "",
      workDescription: "",
      areaOfWork: "",
      startDate: new Date().toISOString().split('T')[0],
      workDate: new Date().toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      startTime: "08:00",
      endTime: "17:00",
      totalHours: 8,
      laborCost: 0,
      unitsCompleted: "",
      materialIds: [],
      status: "pending",
      isQuote: false,
    },
  });

  // Query for projects to populate the project selector
  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });
  
  // Query for tasks related to the selected project
  const { data: tasks = [] } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });
  
  // Query for contacts
  const { data: contacts = [] } = useQuery<Contact[]>({
    queryKey: ["/api/contacts"],
  });
  
  // Query for materials related to the selected project
  const { data: materials = [] } = useQuery<Material[]>({
    queryKey: ["/api/materials"],
  });

  // Watch taskId for subtask fetching
  const watchedTaskIdForSubtasks = form.watch("taskId");

  // Query for subtasks when a task is selected
  const { data: subtasks = [] } = useQuery<Subtask[]>({
    queryKey: [`/api/tasks/${watchedTaskIdForSubtasks}/subtasks`],
    enabled: !!watchedTaskIdForSubtasks,
  });

  // Update projectId when it changes from props
  useEffect(() => {
    if (projectId) {
      form.setValue("projectId", projectId);
    }
  }, [projectId, form]);

  // Update task ID when it changes from props
  useEffect(() => {
    if (preselectedTaskId) {
      form.setValue("taskId", preselectedTaskId);
    }
  }, [preselectedTaskId, form]);

  // Update contact ID when it changes from props
  useEffect(() => {
    if (preselectedContactId) {
      form.setValue("contactId", preselectedContactId);
      
      // If we have a contact ID, try to find the contact and use their information
      if (contacts.length > 0) {
        const contact = contacts.find(c => c.id === preselectedContactId);
        if (contact) {
          form.setValue("fullName", contact.name);
          form.setValue("company", contact.company || "");
          form.setValue("phone", contact.phone || "");
          form.setValue("email", contact.email || "");
        }
      }
    }
  }, [preselectedContactId, contacts, form]);

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

  // Define material tier categories
  const tier1Categories = [
    'Structural',
    'Systems',
    'Sheathing',
    'Finishings',
    'Other'
  ];

  // Predefined tier2 categories
  const tier2CategoriesByTier1: Record<string, string[]> = {
    'Structural': ['Foundation', 'Framing', 'Lumber', 'Roofing', 'Shingles'],
    'Systems': ['Electrical', 'Plumbing', 'HVAC'],
    'Sheathing': ['Insulation', 'Drywall', 'Siding', 'Exteriors'],
    'Finishings': ['Windows', 'Doors', 'Cabinets', 'Fixtures', 'Flooring', 'Paint'],
    'Other': ['Permits', 'Other']
  };

  // Handle form submission
  const createLaborMutation = useMutation({
    mutationFn: async (laborData: LaborFormValues) => {
      return apiRequest('/api/labor', 'POST', laborData);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/labor'] });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${form.getValues().projectId}/labor`] });
      
      if (form.getValues().contactId) {
        queryClient.invalidateQueries({ queryKey: [`/api/contacts/${form.getValues().contactId}/labor`] });
      }
      
      onOpenChange(false);
      toast({
        title: "Success",
        description: "Labor record created successfully",
        variant: "default",
      });
    },
    onError: (error) => {
      console.error("Error creating labor record:", error);
      toast({
        title: "Error",
        description: "Failed to create labor record. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Submit handler
  function onSubmit(values: LaborFormValues) {
    // Add selected materials to the form values
    values.materialIds = selectedMaterials;

    // Set workDate to same as startDate to ensure DB constraint is satisfied
    // This is critical as the database has a not-null constraint on work_date
    values.workDate = values.startDate;

    // Make sure workDate is never null or undefined
    if (!values.workDate) {
      values.workDate = new Date().toISOString().split('T')[0];
    }

    // Debug: Log the values being submitted
    console.log('[CreateLaborDialog] Submitting labor with values:', {
      ...values,
      taskId: values.taskId,
      preselectedTaskId
    });

    // Submit the form
    createLaborMutation.mutate(values);
  }

  // Handle material selection
  const toggleMaterial = (materialId: number) => {
    if (selectedMaterials.includes(materialId)) {
      setSelectedMaterials(selectedMaterials.filter(id => id !== materialId));
    } else {
      setSelectedMaterials([...selectedMaterials, materialId]);
    }
  };

  // Watch tier1Category for changes
  const watchedTier1Category = form.watch("tier1Category");
  
  // Update tier2Category options when tier1Category changes
  useEffect(() => {
    if (watchedTier1Category && tier2CategoriesByTier1[watchedTier1Category]) {
      // If current tier2 is not in the new list, set it to the first option
      const tier2 = form.getValues().tier2Category;
      if (tier2 && !tier2CategoriesByTier1[watchedTier1Category].map(t => t.toLowerCase()).includes(tier2.toLowerCase())) {
        form.setValue("tier2Category", tier2CategoriesByTier1[watchedTier1Category][0]);
      }
    }
  }, [watchedTier1Category, form]);
  
  // Watch taskId for changes
  const watchedTaskId = form.watch("taskId");
  
  // Update task selection when a task ID is selected
  useEffect(() => {
    if (watchedTaskId) {
      setSelectedTask(watchedTaskId);
      const task = tasks.find(t => t.id === watchedTaskId);
      if (task) {
        setSelectedTaskObj(task);
      }
    }
  }, [watchedTaskId, tasks]);
  
  // Extract unique tier1 categories from tasks
  useEffect(() => {
    if (!tasks || tasks.length === 0) {
      setUniqueTier1Categories([]);
      return;
    }
    
    // Extract unique tier1 categories
    const tier1Set = new Set<string>();
    tasks.forEach((task) => {
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
    tasks.forEach((task) => {
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
  
  // Watch projectId for changes
  const watchedProjectId = form.watch("projectId");
  
  // Filter and organize tasks by category
  useEffect(() => {
    if (!tasks || tasks.length === 0) {
      setTasksByCategory({});
      setFilteredTasks([]);
      return;
    }
    
    // Filter tasks by project
    let projectTasks = tasks.filter(task => task.projectId === watchedProjectId);
    console.log("All tasks:", tasks.length);
    console.log("Project tasks before filtering:", projectTasks.length, "projectId:", watchedProjectId);
    
    // Filter tasks based on selected filters
    if (taskFilterTier1) {
      projectTasks = projectTasks.filter(task => 
        task.tier1Category?.toLowerCase() === taskFilterTier1.toLowerCase()
      );
      console.log("Tasks after tier1 filtering:", projectTasks.length, "tier1:", taskFilterTier1);
    }
    
    if (taskFilterTier2) {
      projectTasks = projectTasks.filter(task => 
        task.tier2Category?.toLowerCase() === taskFilterTier2.toLowerCase()
      );
      console.log("Tasks after tier2 filtering:", projectTasks.length, "tier2:", taskFilterTier2);
    }
    
    // Update the task count with filtered tasks
    setTaskCount(projectTasks.length);
    console.log("Final task count:", projectTasks.length);
    
    // Create a new categorized tasks object
    const categorizedTasks: Record<string, Record<string, Task[]>> = {
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
    projectTasks.forEach(task => {
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
    setFilteredTasks(projectTasks);
  }, [tasks, watchedProjectId, taskFilterTier1, taskFilterTier2]);
  
  // Update form values when a task is selected
  useEffect(() => {
    if (selectedTaskObj) {
      form.setValue("taskId", selectedTaskObj.id);
      
      // Do not auto-populate task description - let user write their own
      // The task description should be specific to the actual work performed
    }
  }, [selectedTaskObj, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle>Add Labor Record</DialogTitle>
            <Button
              variant="ghost"
              className="h-8 w-8 p-0 rounded-full"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <DialogDescription id="create-labor-description">
            Create a new labor record to track worker time and productivity.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 flex-1 overflow-hidden flex flex-col">
            <div className="flex-1 overflow-hidden">
              <ScrollArea className="h-[600px] pr-4">
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
                            <Input
                              placeholder="Enter worker's full name"
                              {...field}
                            />
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
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {tier1Categories.map((tier1) => (
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
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select specialty" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {tier2CategoriesByTier1[watchedTier1Category]?.map((tier2) => (
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
                            <Input
                              placeholder="Enter company name"
                              {...field}
                            />
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
                            <FormLabel>Phone (Optional)</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Phone number"
                                {...field}
                              />
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
                            <FormLabel>Email (Optional)</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Email address"
                                type="email"
                                {...field}
                              />
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

                    <FormField
                      control={form.control}
                      name="contactId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Choose from Existing Contacts</FormLabel>
                          <Select
                            onValueChange={(value) => {
                              if (value === "none") {
                                field.onChange(null);
                                // Clear form fields when "none" is selected
                                form.setValue("fullName", "");
                                form.setValue("company", "");
                                form.setValue("phone", "");
                                form.setValue("email", "");
                              } else {
                                const contactId = parseInt(value);
                                field.onChange(contactId);
                                // Auto-populate fields from selected contact
                                const contact = contacts.find(c => c.id === contactId);
                                if (contact) {
                                  form.setValue("fullName", contact.name);
                                  form.setValue("company", contact.company || "");
                                  form.setValue("phone", contact.phone || "");
                                  form.setValue("email", contact.email || "");
                                }
                              }
                            }}
                            value={field.value?.toString() || "none"}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select an existing contact or enter new details above" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="none">Create New Contact</SelectItem>
                              {contacts.map((contact) => (
                                <SelectItem key={contact.id} value={contact.id.toString()}>
                                  <div className="flex flex-col">
                                    <span className="font-medium">{contact.name}</span>
                                    {contact.company && <span className="text-sm text-muted-foreground">{contact.company}</span>}
                                  </div>
                                </SelectItem>
                              ))}
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
                      name="projectId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Project</FormLabel>
                          <Select
                            onValueChange={(value) => field.onChange(parseInt(value))}
                            value={field.value?.toString() || ""}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a project" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {projects.map((project) => (
                                <SelectItem key={project.id} value={project.id.toString()}>
                                  {project.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
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
                                field.onChange(value && value !== "none" ? parseInt(value) : null);

                                // Reset subtask when task changes
                                form.setValue("subtaskId", null);

                                // Find and set the selected task object
                                if (value && value !== "none") {
                                  const selectedTask = tasks.find((t: Task) => t.id === parseInt(value));
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

                    {/* Subtask Selection - only show when a task is selected */}
                    {watchedTaskIdForSubtasks && subtasks.length > 0 && (
                      <FormField
                        control={form.control}
                        name="subtaskId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Specific Subtask (Optional)</FormLabel>
                            <FormControl>
                              <Select
                                value={field.value?.toString() || ""}
                                onValueChange={(value) => {
                                  field.onChange(value && value !== "none" ? parseInt(value) : null);
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a specific subtask" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="none">None (applies to main task)</SelectItem>
                                  {subtasks.map((subtask) => (
                                    <SelectItem key={subtask.id} value={subtask.id.toString()}>
                                      {subtask.title}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    <FormField
                      control={form.control}
                      name="areaOfWork"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Area of Work</FormLabel>
                          <FormControl>
                            <Input placeholder="Main floor, East wall" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="taskDescription"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Task Description (Optional)</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Brief task reference or notes"
                              className="resize-none min-h-[60px] whitespace-pre-wrap"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="workDescription"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Work Description</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Describe the work performed, materials used, progress made, etc."
                              className="resize-none min-h-[100px] whitespace-pre-wrap"
                              {...field}
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
                            <div className="flex gap-2">
                              <Select
                                value={field.value ? field.value.split(':')[0] : ""}
                                onValueChange={(value) => {
                                  const currentMinute = field.value ? field.value.split(':')[1] : "00";
                                  const timeString = `${value}:${currentMinute}`;
                                  field.onChange(timeString);
                                  setTimeout(updateTotalHours, 0);
                                }}
                              >
                                <FormControl>
                                  <SelectTrigger className="flex-1">
                                    <SelectValue placeholder="Hour" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {Array.from({ length: 24 }, (_, i) => (
                                    <SelectItem key={i} value={i.toString().padStart(2, '0')}>
                                      {i === 0 ? "12 AM" : i < 12 ? `${i} AM` : i === 12 ? "12 Noon" : `${i - 12} PM`}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Select
                                value={field.value ? field.value.split(':')[1] : "00"}
                                onValueChange={(value) => {
                                  const currentHour = field.value ? field.value.split(':')[0] : "08";
                                  const timeString = `${currentHour}:${value}`;
                                  field.onChange(timeString);
                                  setTimeout(updateTotalHours, 0);
                                }}
                              >
                                <FormControl>
                                  <SelectTrigger className="w-20">
                                    <SelectValue placeholder="Min" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {Array.from({ length: 60 }, (_, i) => (
                                    <SelectItem key={i} value={i.toString().padStart(2, '0')}>
                                      {i.toString().padStart(2, '0')}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
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
                            <div className="flex gap-2">
                              <Select
                                value={field.value ? field.value.split(':')[0] : ""}
                                onValueChange={(value) => {
                                  const currentMinute = field.value ? field.value.split(':')[1] : "00";
                                  const timeString = `${value}:${currentMinute}`;
                                  field.onChange(timeString);
                                  setTimeout(updateTotalHours, 0);
                                }}
                              >
                                <FormControl>
                                  <SelectTrigger className="flex-1">
                                    <SelectValue placeholder="Hour" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {Array.from({ length: 24 }, (_, i) => (
                                    <SelectItem key={i} value={i.toString().padStart(2, '0')}>
                                      {i === 0 ? "12 AM" : i < 12 ? `${i} AM` : i === 12 ? "12 Noon" : `${i - 12} PM`}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Select
                                value={field.value ? field.value.split(':')[1] : "00"}
                                onValueChange={(value) => {
                                  const currentHour = field.value ? field.value.split(':')[0] : "17";
                                  const timeString = `${currentHour}:${value}`;
                                  field.onChange(timeString);
                                  setTimeout(updateTotalHours, 0);
                                }}
                              >
                                <FormControl>
                                  <SelectTrigger className="w-20">
                                    <SelectValue placeholder="Min" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {Array.from({ length: 60 }, (_, i) => (
                                    <SelectItem key={i} value={i.toString().padStart(2, '0')}>
                                      {i.toString().padStart(2, '0')}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
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
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
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
                      <Button type="submit" disabled={createLaborMutation.isPending} className="bg-blue-600 hover:bg-blue-700">
                        {createLaborMutation.isPending ? "Creating..." : "Create Labor Record"}
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
              </ScrollArea>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
