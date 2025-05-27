import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, useMemo } from "react";
import { X, Check } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { getMergedTasks, isTemplateTask, fetchTemplates } from "@/components/task/TaskTemplateService";

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
  contactId: z.coerce.number().optional().nullable(),
  taskDescription: z.string().optional(),
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
  const [activeTab, setActiveTab] = useState("worker-info");
  const [selectedMaterials, setSelectedMaterials] = useState<number[]>([]);
  
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
      contactId: preselectedContactId || null,
      taskDescription: "",
      areaOfWork: "",
      // Time period (startDate/endDate) is now the main date source for labor entries
      startDate: new Date().toISOString().split('T')[0],
      workDate: new Date().toISOString().split('T')[0], // Set default for backend compatibility
      endDate: new Date().toISOString().split('T')[0],
      startTime: "08:00",
      endTime: "17:00",
      totalHours: 8,
      laborCost: 0,
      unitsCompleted: "",
      materialIds: [],
      status: "pending",
      isQuote: false, // Default to false (not a quote)
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

  // Update projectId when it changes from props
  useEffect(() => {
    if (projectId) {
      form.setValue("projectId", projectId);
    }
  }, [projectId]);

  // Update task ID when it changes from props
  useEffect(() => {
    if (preselectedTaskId) {
      form.setValue("taskId", preselectedTaskId);
    }
  }, [preselectedTaskId]);

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
  }, [preselectedContactId, contacts]);

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

  // Handle tab selection
  const handleTabChange = (value: string) => {
    setActiveTab(value);
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
  }, [watchedTier1Category]);
  
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
      
      // Populate task description from task info
      if (selectedTaskObj.description) {
        form.setValue("taskDescription", selectedTaskObj.description);
      }
    }
  }, [selectedTaskObj]);

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
            Create a new labor record to track worker information, tasks, and productivity.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 flex-1 overflow-hidden flex flex-col">
            <ScrollArea className="flex-1 pr-4">
              <Tabs value={activeTab} onValueChange={handleTabChange}>
                <TabsList className="w-full grid grid-cols-4">
                  <TabsTrigger value="worker-info">Worker Info</TabsTrigger>
                  <TabsTrigger value="work-details">Work Details</TabsTrigger>
                  <TabsTrigger value="time-tracking">Time Tracking</TabsTrigger>
                  <TabsTrigger value="productivity">Productivity</TabsTrigger>
                </TabsList>
                
                {/* Tab 1: Worker Information */}
                <TabsContent value="worker-info" className="space-y-4 focus:outline-none">
                  <fieldset className="border p-4 rounded-lg bg-slate-50 mb-4">
                    <legend className="text-lg font-medium text-slate-800 px-2">Worker Information</legend>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="fullName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Full Name</FormLabel>
                              <FormControl>
                                <Input placeholder="John Smith" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="company"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Company/Subcontractor</FormLabel>
                              <FormControl>
                                <Input placeholder="ABC Construction" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="tier1Category"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Trade Category</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select trade category" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {tier1Categories.map((category) => (
                                    <SelectItem key={category} value={category}>
                                      {category}
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
                          name="tier2Category"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Role/Specialization</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select role" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {tier2CategoriesByTier1[form.watch("tier1Category") || 'Other']?.map((category) => (
                                    <SelectItem key={category} value={category}>
                                      {category}
                                    </SelectItem>
                                  ))}
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
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Phone Number</FormLabel>
                              <FormControl>
                                <Input placeholder="555-123-4567" {...field} />
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
                                <Input placeholder="john@example.com" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </fieldset>
                  
                  <fieldset className="border p-4 rounded-lg bg-slate-50 mb-4">
                    <legend className="text-lg font-medium text-slate-800 px-2">Associations</legend>
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="projectId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Project</FormLabel>
                            <Select
                              onValueChange={(value) => field.onChange(parseInt(value))}
                              defaultValue={field.value?.toString()}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select project" />
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
                      <div className="grid grid-cols-1 gap-4">
                        <FormField
                          control={form.control}
                          name="contactId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Associated Contact</FormLabel>
                              <Select
                                onValueChange={(value) => field.onChange(value === "none" ? null : parseInt(value))}
                                defaultValue={field.value?.toString()}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select contact (optional)" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="none">None</SelectItem>
                                  {contacts.map((contact) => (
                                    <SelectItem key={contact.id} value={contact.id.toString()}>
                                      {contact.name} {contact.company ? `(${contact.company})` : ''}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </fieldset>
                </TabsContent>
                
                {/* Tab 2: Work Details */}
                <TabsContent value="work-details" className="space-y-4 focus:outline-none">
                  <fieldset className="border p-4 rounded-lg bg-slate-50 mb-4">
                    <legend className="text-lg font-medium text-slate-800 px-2">Work Details</legend>
                    <div className="space-y-4">
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
                            <Select
                              onValueChange={(value) => {
                                if (value === "none") {
                                  field.onChange(null);
                                  setSelectedTask(null);
                                  setSelectedTaskObj(null);
                                  form.setValue("taskDescription", "");
                                } else {
                                  const taskId = parseInt(value);
                                  field.onChange(taskId);
                                  setSelectedTask(taskId);
                                  const task = tasks.find(t => t.id === taskId);
                                  if (task) {
                                    setSelectedTaskObj(task);
                                  }
                                }
                              }}
                              value={selectedTask?.toString() || field.value?.toString() || undefined}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select task (optional)" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="max-h-[300px]">
                                <SelectItem value="none">None</SelectItem>
                                {(() => {
                                  // Get available tier1 categories (only those that have tasks)
                                  const availableTier1Categories = Object.keys(tasksByCategory).filter(
                                    tier1 => Object.values(tasksByCategory[tier1]).some(tasks => tasks.length > 0)
                                  );

                                  const projectTasks = filteredTasks.length > 0 ? filteredTasks : tasks.filter(task => task.projectId === form.getValues().projectId);
                                  
                                  if (projectTasks.length === 0) {
                                    return <div className="p-2 text-sm text-muted-foreground">No tasks found for this project</div>;
                                  }
                                  
                                  return (
                                    <>
                                      <div className="p-2 text-xs text-muted-foreground">
                                        {taskCount} tasks available - select one to associate with this labor record
                                      </div>
                                      {projectTasks.map(task => (
                                        <SelectItem key={task.id} value={task.id.toString()}>
                                          {task.title} {task.tier1Category && `(${task.tier1Category}${task.tier2Category ? ` / ${task.tier2Category}` : ''})`}
                                        </SelectItem>
                                      ))}
                                    </>
                                  );
                                })()}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Display selected task (if any) */}
                      {selectedTaskObj && (
                        <div className="mt-2">
                          <h3 className="text-sm font-medium">Selected Task:</h3>
                          <div className="pl-3 border-l-2 border-blue-300 mt-1">
                            <p className="text-sm">{selectedTaskObj.title}</p>
                            {selectedTaskObj.description && (
                              <p className="text-xs text-muted-foreground mt-1">{selectedTaskObj.description}</p>
                            )}
                          </div>
                        </div>
                      )}
                    
                      {/* Work date field removed - using time period tab's startDate/endDate instead */}
                      <FormField
                        control={form.control}
                        name="areaOfWork"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Area of Work</FormLabel>
                            <FormControl>
                              <Input placeholder="First floor, Kitchen, etc." {...field} />
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
                            <FormLabel>
                              Work Description 
                              {selectedTaskObj && (
                                <span className="text-xs font-normal text-slate-500 ml-2">
                                  (Based on selected task)
                                </span>
                              )}
                            </FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder={selectedTaskObj 
                                  ? "Add more details about the work performed related to this task" 
                                  : "Describe the work performed"}
                                className="min-h-[100px]" 
                                {...field} 
                              />
                            </FormControl>
                            {selectedTaskObj && selectedTaskObj.description && (
                              <div className="text-xs text-slate-600 mt-1">
                                <span className="font-medium">Task context: </span>
                                {selectedTaskObj.description}
                              </div>
                            )}
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
                              onValueChange={field.onChange}
                              defaultValue={field.value}
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
                                <SelectItem value="invoiced">Invoiced</SelectItem>
                                <SelectItem value="paid">Paid</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </fieldset>
                </TabsContent>
                
                {/* Tab 3: Time Tracking */}
                <TabsContent value="time-tracking" className="space-y-4 focus:outline-none">
                  <fieldset className="border p-4 rounded-lg bg-slate-50 mb-4">
                    <legend className="text-lg font-medium text-slate-800 px-2">Time Tracking</legend>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="startTime"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Start Time</FormLabel>
                              <FormControl>
                                <Input type="time" {...field} />
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
                                <Input type="time" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="totalHours"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Total Hours</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  min="0" 
                                  step="0.5"
                                  {...field} 
                                  onChange={(e) => field.onChange(e.target.value === '' ? '' : Number(e.target.value))}
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
                                  min="0" 
                                  step="0.5"
                                  placeholder="0.00"
                                  {...field} 
                                  onChange={(e) => field.onChange(e.target.value === '' ? '' : Number(e.target.value))}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      {/* Quote Option */}
                      <div className="col-span-2 mt-2">
                        <FormField
                          control={form.control}
                          name="isQuote"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 bg-slate-50">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel className="text-sm font-medium">Quote Only (won't affect budget)</FormLabel>
                                <p className="text-xs text-muted-foreground">
                                  This labor entry will be marked as a quote and won't count towards project budget calculations.
                                </p>
                              </div>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </fieldset>
                </TabsContent>
                
                {/* Tab 4: Productivity */}
                <TabsContent value="productivity" className="space-y-4 focus:outline-none">
                  <fieldset className="border p-4 rounded-lg bg-slate-50 mb-4">
                    <legend className="text-lg font-medium text-slate-800 px-2">Productivity Tracking</legend>
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="unitsCompleted"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Units Completed</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., 120 linear ft, 5 doors, etc." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </fieldset>
                  
                  <fieldset className="border p-4 rounded-lg bg-slate-50 mb-4">
                    <legend className="text-lg font-medium text-slate-800 px-2">Materials Used</legend>
                    <div className="space-y-4">
                      <FormLabel>Select Materials Used</FormLabel>
                      <ScrollArea className="h-48 w-full rounded-md border">
                        <div className="p-4">
                          {materials.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                              No materials available for this project.
                            </p>
                          ) : (
                            materials.map((material) => (
                              <div key={material.id} className="flex items-center space-x-2 py-2">
                                <Checkbox
                                  id={`material-${material.id}`}
                                  checked={selectedMaterials.includes(material.id)}
                                  onCheckedChange={() => toggleMaterial(material.id)}
                                />
                                <label
                                  htmlFor={`material-${material.id}`}
                                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                  {material.name}
                                  {material.tier2Category && <span className="text-muted-foreground ml-2">({material.tier2Category})</span>}
                                </label>
                              </div>
                            ))
                          )}
                        </div>
                      </ScrollArea>
                    </div>
                  </fieldset>
                </TabsContent>
              </Tabs>
            </ScrollArea>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createLaborMutation.isPending}>
                {createLaborMutation.isPending ? (
                  <span className="flex items-center gap-1">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Saving...
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <Check className="h-4 w-4" />
                    Create Labor Record
                  </span>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}