import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Wordbank } from "@/components/ui/wordbank";
import { getMergedTasks, isTemplateTask, fetchTemplates } from "@/components/task/TaskTemplateService";

// Helper function to check if a category is valid for a given material type
function isCategoryValidForType(category: string, type: string): boolean {
  if (!category || !type) return false;
  
  const typeCategories: Record<string, string[]> = {
    "Building Materials": ["wood", "concrete", "glass", "metal"],
    "Electrical": ["electrical"],
    "Plumbing": ["plumbing"],
    "Finishes": ["finishing"],
    "Tools": ["tools"],
    "Other": ["other"]
  };
  
  // All categories are valid for unspecified types
  if (!typeCategories[type]) return true;
  
  return typeCategories[type].includes(category);
}

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

// Extending the material schema with validation
const materialFormSchema = z.object({
  name: z.string().min(2, { message: "Material name must be at least 2 characters" }),
  type: z.string().min(2, { message: "Material type is required" }),
  category: z.string().min(2, { message: "Category is required" }).default("other"),
  // Hierarchical classification fields
  tier: z.string().optional(),
  tier2Category: z.string().optional(),
  section: z.string().optional(),
  subsection: z.string().optional(),
  quantity: z.union([z.string().optional(), z.coerce.number().min(0)]),
  supplier: z.string().optional(),
  status: z.string().default("ordered"),
  projectId: z.coerce.number(),
  taskIds: z.array(z.coerce.number()).optional(),
  contactIds: z.array(z.coerce.number()).optional(),
  unit: z.string().optional(),
  cost: z.union([z.string().optional(), z.coerce.number().min(0)]),
});

type MaterialFormValues = z.infer<typeof materialFormSchema>;

interface CreateMaterialDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId?: number;
  preselectedTaskId?: number;
}

export function CreateMaterialDialog({
  open,
  onOpenChange,
  projectId,
  preselectedTaskId,
}: CreateMaterialDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTasks, setSelectedTasks] = useState<number[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<number[]>([]);
  
  // State for task selection
  const [selectedTask, setSelectedTask] = useState<number | null>(null);
  const [selectedTaskObj, setSelectedTaskObj] = useState<Task | null>(null);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  
  // State for tier selection
  const [selectedTier1, setSelectedTier1] = useState<string | null>(null);
  const [selectedTier2, setSelectedTier2] = useState<string | null>(null);

  // Initialize form first so it can be used in queries and effects
  const form = useForm<MaterialFormValues>({
    resolver: zodResolver(materialFormSchema),
    defaultValues: {
      name: "",
      type: "",
      category: "other",
      tier: "",
      tier2Category: "",
      section: "",
      subsection: "",
      quantity: 1,
      supplier: "",
      status: "ordered",
      projectId: projectId || undefined,
      taskIds: [],
      contactIds: [],
      unit: "pieces",
      cost: 0,
    },
  });

  // Query for projects to populate the project selector
  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });
  
  // Query for tasks related to the selected project
  const { data: tasks = [], isFetching: isLoadingTasks } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
    select: (tasks) => {
      if (!form.getValues().projectId) return tasks;
      return tasks.filter(task => task.projectId === form.getValues().projectId);
    },
    staleTime: 0, // Don't cache the data
    refetchOnMount: true, // Always refetch when component mounts
    refetchOnWindowFocus: true, // Refetch when window gets focus
  });
  
  // Query for task templates
  const { data: templates = [] } = useQuery({
    queryKey: ["/api/task-templates"],
  });
  
  // Fetch templates on component mount
  useEffect(() => {
    fetchTemplates();
  }, []);
  
  // Query for contacts
  const { data: contacts = [] } = useQuery<Contact[]>({
    queryKey: ["/api/contacts"],
  });
  
  // Add task filtering state
  const [taskFilterTier1, setTaskFilterTier1] = useState<string | null>(null);
  const [taskFilterTier2, setTaskFilterTier2] = useState<string | null>(null);
  const [taskCount, setTaskCount] = useState<number>(0);
  
  // Define the tasks categorization state
  const [matchTasksByCategory, setMatchTasksByCategory] = useState<boolean>(false);
  const [materialType, setMaterialType] = useState<'primaryTaskType' | 'secondaryTaskType' | 'both'>('both');
  
  const [tasksByCategory, setTasksByCategory] = useState<Record<string, Record<string, Task[]>>>({
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
  });
  
  // Populate the tasksByCategory object with the tasks
  useEffect(() => {
    if (!tasks || tasks.length === 0) {
      setTaskCount(0);
      return;
    }
    
    // Update the task count
    setTaskCount(tasks.length);
    console.log(`Loaded ${tasks.length} tasks`);
    
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
    
    // Populate the categories with tasks
    tasks.forEach(task => {
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
  }, [tasks]);
  
  // Update form values when a task is selected
  useEffect(() => {
    if (selectedTaskObj) {
      form.setValue("type", selectedTaskObj.tier1Category || "");
      form.setValue("category", selectedTaskObj.tier2Category || "");
      
      // Set tier fields
      if (selectedTaskObj.tier1Category) {
        form.setValue("tier", selectedTaskObj.tier1Category.toLowerCase() || "");
      }
      if (selectedTaskObj.tier2Category) {
        form.setValue("tier2Category", selectedTaskObj.tier2Category.toLowerCase() || "");
      }
      
      // Automatically add task to selectedTasks if it's not already there
      if (!selectedTasks.includes(selectedTaskObj.id)) {
        setSelectedTasks([...selectedTasks, selectedTaskObj.id]);
      }
    }
  }, [selectedTaskObj, form]);
  
  // Get available tier1 categories (only those that have tasks)
  const availableTier1Categories = Object.keys(tasksByCategory).filter(
    tier1 => Object.values(tasksByCategory[tier1]).some(tasks => tasks.length > 0)
  );
  
  // Predefined tier1 categories
  const predefinedTier1Categories = [
    'structural',
    'systems',
    'sheathing',
    'finishings',
    'other'
  ];
  
  // Predefined tier2 categories for each tier1 category, updated to match the requested hierarchy
  const predefinedTier2Categories: Record<string, string[]> = {
    'structural': ['foundation', 'framing', 'lumber', 'roofing', 'shingles'],
    'systems': ['electrical', 'plumbing', 'hvac'],
    'sheathing': ['insulation', 'drywall', 'siding', 'exteriors'],
    'finishings': ['windows', 'doors', 'cabinets', 'fixtures', 'flooring', 'paint'],
    'other': ['permits', 'other']
  };
  
  // Update projectId when it changes from props
  useEffect(() => {
    if (projectId) {
      form.setValue("projectId", projectId);
    }
  }, [projectId, form]);
  
  // Handle preselected task when the dialog opens
  useEffect(() => {
    if (open && preselectedTaskId && tasks.length > 0) {
      console.log(`Looking for preselected task ID: ${preselectedTaskId} in ${tasks.length} tasks`);
      
      // Find the task in the tasks array
      const task = tasks.find(t => t.id === preselectedTaskId);
      if (task) {
        console.log(`Found preselected task: ${task.title} (ID: ${task.id}) for project ${task.projectId}`);
        
        // Set the selected task
        setSelectedTask(preselectedTaskId);
        setSelectedTaskObj(task);
        
        // If the task has a project, set the project as well
        if (task.projectId) {
          console.log(`Setting project ID to: ${task.projectId}`);
          form.setValue("projectId", task.projectId);
        }
        
        // Set the task properties in the form
        if (task.tier1Category) {
          console.log(`Setting type to: ${task.tier1Category}`);
          form.setValue("type", task.tier1Category);
          form.setValue("tier", task.tier1Category.toLowerCase() || "");
        }
        if (task.tier2Category) {
          console.log(`Setting category to: ${task.tier2Category}`);
          form.setValue("category", task.tier2Category);
          form.setValue("tier2Category", task.tier2Category.toLowerCase() || "");
        }
        
        // Add the task to selected tasks if not already there
        if (!selectedTasks.includes(preselectedTaskId)) {
          console.log(`Adding task ID ${preselectedTaskId} to selected tasks`);
          setSelectedTasks(prev => [...prev, preselectedTaskId]);
        }
      } else {
        console.log(`Could not find task with ID: ${preselectedTaskId}`);
      }
    }
  }, [open, preselectedTaskId, tasks]);
  
  // Reset tier filters when project changes
  useEffect(() => {
    setSelectedTier1(null);
    setSelectedTier2(null);
    setFilteredTasks([]);
  }, [form.getValues().projectId]);
  
  // Update the form values when selections change
  useEffect(() => {
    form.setValue("taskIds", selectedTasks);
  }, [selectedTasks, form]);
  
  useEffect(() => {
    form.setValue("contactIds", selectedContacts);
  }, [selectedContacts, form]);

  const createMaterial = useMutation({
    mutationFn: async (data: MaterialFormValues) => {
      return apiRequest("/api/materials", "POST", data);
    },
    onSuccess: (response) => {
      toast({
        title: "Inventory item created",
        description: "Your inventory item has been added successfully.",
      });
      // Invalidate general materials list
      queryClient.invalidateQueries({ queryKey: ["/api/materials"] });
      
      // Invalidate project-specific materials list if we have a projectId
      const formData = form.getValues();
      if (formData.projectId) {
        queryClient.invalidateQueries({ 
          queryKey: ["/api/projects", formData.projectId, "materials"] 
        });
      }
      
      form.reset();
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add inventory item. Please try again.",
        variant: "destructive",
      });
      console.error("Failed to create material:", error);
    },
  });

  async function onSubmit(data: MaterialFormValues) {
    createMaterial.mutate(data);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]" aria-describedby="create-material-description">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle>Add Inventory Item</DialogTitle>
            <Button
              variant="ghost"
              className="h-8 w-8 p-0 rounded-full"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <DialogDescription>
            Add materials and supplies to your inventory
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Project Selection */}
            <div className="rounded-lg border p-4 bg-slate-50">
              <h3 className="text-lg font-medium mb-4 text-slate-800">Project Information</h3>
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
            </div>
            
            {/* Task Selection */}
            <div className="space-y-4 border p-4 rounded-lg bg-slate-50">
              <div className="flex justify-between items-center">
                <h3 className="font-medium">Task Association</h3>
                <div className={`text-xs px-2 py-1 rounded-full ${
                  isLoadingTasks 
                    ? 'bg-blue-100 text-blue-800' 
                    : taskCount > 0 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-amber-100 text-amber-800'
                }`}>
                  {isLoadingTasks 
                    ? 'Loading tasks...' 
                    : `${taskCount} tasks available`}
                </div>
              </div>
              
              {/* Task Filtering */}
              <div className="flex flex-col space-y-2 mb-4">
                <div className="flex items-center justify-between">
                  <FormLabel className="text-sm font-medium mb-0">Task Finder</FormLabel>
                  <div className="flex items-center space-x-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      className="text-xs h-7 px-2"
                      onClick={() => {
                        setTaskFilterTier1(null);
                        setTaskFilterTier2(null);
                      }}
                    >
                      Show All Tasks
                    </Button>
                    {form.watch("tier") && (
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        className="text-xs h-7 px-2"
                        onClick={() => {
                          // Filter by the material's own task type
                          setTaskFilterTier1(form.getValues().tier || '');
                          setTaskFilterTier2(form.getValues().tier2Category || null);
                        }}
                      >
                        Match Material Category
                      </Button>
                    )}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-0">
                  Find tasks to associate with this material. Use the buttons above to show all tasks 
                  or filter by the material's classification.
                </p>
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <FormLabel>Select Task</FormLabel>
                  {isLoadingTasks ? (
                    <div className="h-10 flex items-center justify-center bg-slate-100 rounded-md border">
                      <span className="text-sm text-slate-500">Loading tasks...</span>
                    </div>
                  ) : taskCount === 0 ? (
                    <div className="h-10 flex items-center justify-center bg-amber-50 rounded-md border border-amber-200">
                      <span className="text-sm text-amber-700">No tasks available. Please create a task first.</span>
                    </div>
                  ) : (
                    <Select
                      onValueChange={(value) => {
                        if (value === 'none') {
                          setSelectedTask(null);
                          setSelectedTaskObj(null);
                          return;
                        }
                        
                        const taskId = parseInt(value);
                        setSelectedTask(taskId);
                        // Find the task object
                        const task = tasks.find(t => t.id === taskId);
                        if (task) {
                          setSelectedTaskObj(task);
                        }
                      }}
                      value={selectedTask?.toString() || "none"}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select task to associate material with" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">-- Select a task --</SelectItem>
                        {availableTier1Categories
                          .filter(tier1 => !taskFilterTier1 || tier1 === taskFilterTier1)
                          .map((tier1) => (
                            <SelectGroup key={tier1}>
                              <SelectLabel>{tier1.charAt(0).toUpperCase() + tier1.slice(1)}</SelectLabel>
                              {Object.entries(tasksByCategory[tier1])
                                .filter(([tier2, tasks]) => 
                                  tasks.length > 0 && (!taskFilterTier2 || tier2 === taskFilterTier2)
                                )
                                .map(([tier2, tasks]) => (
                                  tasks.map(task => (
                                    <SelectItem key={task.id} value={task.id.toString()}>
                                      {task.title}
                                    </SelectItem>
                                  ))
                                ))}
                            </SelectGroup>
                          ))}
                      </SelectContent>
                    </Select>
                  )}
                  <div className="text-xs text-muted-foreground mt-1">
                    Selected task's category will be used for the material
                  </div>
                </div>
              </div>
            </div>

            {/* Section 1: Basic Material Information */}
            <div className="rounded-lg border p-4 bg-slate-50">
              <h3 className="text-lg font-medium mb-4 text-slate-800">Basic Material Information</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Material Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter material name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="supplier"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Supplier</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter supplier name" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>
            
            {/* Section 2: Material Classification */}
            <div className="rounded-lg border p-4 bg-slate-50">
              <h3 className="text-lg font-medium mb-4 text-slate-800">Material Classification</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Material Type</FormLabel>
                        <Select
                          onValueChange={(value) => {
                            field.onChange(value);
                            // Reset category when type changes if it's not valid for the new type
                            if (form.getValues("category") && 
                                !isCategoryValidForType(form.getValues("category"), value)) {
                              form.setValue("category", "");
                            }
                          }}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select material type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Building Materials">Building Materials</SelectItem>
                            <SelectItem value="Electrical">Electrical</SelectItem>
                            <SelectItem value="Plumbing">Plumbing</SelectItem>
                            <SelectItem value="HVAC">HVAC</SelectItem>
                            <SelectItem value="Finishes">Finishes</SelectItem>
                            <SelectItem value="Tools">Tools</SelectItem>
                            <SelectItem value="Safety Equipment">Safety Equipment</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
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
                        <FormLabel>Material Sub Type</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          disabled={!form.watch("type")}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select material sub type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {form.watch("type") === "Building Materials" && (
                              <>
                                <SelectItem value="wood">Wood</SelectItem>
                                <SelectItem value="concrete">Concrete</SelectItem>
                                <SelectItem value="glass">Glass</SelectItem>
                                <SelectItem value="metal">Metal</SelectItem>
                              </>
                            )}
                            {form.watch("type") === "Electrical" && (
                              <SelectItem value="electrical">Electrical</SelectItem>
                            )}
                            {form.watch("type") === "Plumbing" && (
                              <SelectItem value="plumbing">Plumbing</SelectItem>
                            )}
                            {form.watch("type") === "Finishes" && (
                              <SelectItem value="finishing">Finishing</SelectItem>
                            )}
                            {!form.watch("type") && (
                              <>
                                <SelectItem value="wood">Wood</SelectItem>
                                <SelectItem value="concrete">Concrete</SelectItem>
                                <SelectItem value="electrical">Electrical</SelectItem>
                                <SelectItem value="plumbing">Plumbing</SelectItem>
                                <SelectItem value="glass">Glass</SelectItem>
                                <SelectItem value="metal">Metal</SelectItem>
                                <SelectItem value="finishing">Finishing</SelectItem>
                              </>
                            )} 
                            <SelectItem value="tools">Tools</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                {/* Task Association */}
                <div className="space-y-4 mt-4">
                  <FormLabel>Associated Tasks</FormLabel>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        className="text-xs h-7 px-2"
                        onClick={() => {
                          setMatchTasksByCategory(false);
                          setTaskFilterTier1(null);
                          setTaskFilterTier2(null);
                        }}
                      >
                        Show All Tasks
                      </Button>
                      {form.watch("tier") && (
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm"
                          className={`text-xs h-7 px-2 ${matchTasksByCategory ? 'bg-orange-100 text-orange-800 border-orange-200' : ''}`}
                          onClick={() => {
                            // Filter by the material's own task type
                            setMatchTasksByCategory(true);
                            setMaterialType('both');
                            setTaskFilterTier1(form.getValues().tier || '');
                            setTaskFilterTier2(form.getValues().tier2Category || null);
                          }}
                        >
                          Match Material Category
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  <Wordbank
                    items={tasks
                      .filter(task => {
                        // If match material category is enabled, filter by material tier categories
                        if (matchTasksByCategory) {
                          if (materialType === 'primaryTaskType') {
                            return task.tier1Category?.toLowerCase() === form.watch('tier')?.toLowerCase();
                          } 
                          if (materialType === 'secondaryTaskType') {
                            return task.tier2Category?.toLowerCase() === form.watch('tier2Category')?.toLowerCase();
                          }
                          if (materialType === 'both') {
                            // If only tier1 is set, match on that
                            if (form.watch('tier') && !form.watch('tier2Category')) {
                              return task.tier1Category?.toLowerCase() === form.watch('tier')?.toLowerCase();
                            }
                            // If both are set, match on both
                            return (
                              task.tier1Category?.toLowerCase() === form.watch('tier')?.toLowerCase() &&
                              task.tier2Category?.toLowerCase() === form.watch('tier2Category')?.toLowerCase()
                            );
                          }
                        }
                        
                        // Apply tier1 filter if set
                        if (taskFilterTier1 && task.tier1Category?.toLowerCase() !== taskFilterTier1) {
                          return false;
                        }
                        
                        // Apply tier2 filter if set
                        if (taskFilterTier2 && task.tier2Category?.toLowerCase() !== taskFilterTier2) {
                          return false;
                        }
                        
                        // If a task is selected, filter by its categories
                        if (selectedTaskObj) {
                          const sameTier1 = task.tier1Category === selectedTaskObj.tier1Category;
                          const sameTier2 = task.tier2Category === selectedTaskObj.tier2Category;
                          return sameTier1 && sameTier2;
                        }
                        
                        return true;
                      })
                      .map(task => ({
                        id: task.id,
                        label: task.title,
                        color: task.category,
                        subtext: `${task.tier1Category || ''} / ${task.tier2Category || ''}`
                      }))
                    }
                    selectedItems={selectedTasks}
                    onItemSelect={(id) => setSelectedTasks([...selectedTasks, id as number])}
                    onItemRemove={(id) => setSelectedTasks(selectedTasks.filter(taskId => taskId !== (id as number)))}
                    emptyText={tasks.length > 0 ? "No tasks match current filters" : "No tasks available"}
                    className="min-h-[120px]"
                  />
                  <p className="text-xs text-muted-foreground">
                    Associate this material with specific tasks. Tasks matching the material's Primary/Secondary Task Type will be shown first.
                  </p>
                </div>
              </div>
            </div>
            
            {/* Section 3: Inventory & Cost Information */}
            <div className="rounded-lg border p-4 bg-slate-50">
              <h3 className="text-lg font-medium mb-4 text-slate-800">Inventory & Cost Information</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="quantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quantity</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="1"
                            placeholder="Enter quantity" 
                            {...field}
                            onChange={(e) => {
                              // Allow empty input or parse as int
                              if (e.target.value === '') {
                                field.onChange('');
                              } else {
                                const value = parseInt(e.target.value);
                                field.onChange(isNaN(value) ? '' : value);
                              }
                            }} 
                          />
                        </FormControl>
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
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="ordered">Ordered</SelectItem>
                            <SelectItem value="delivered">Delivered</SelectItem>
                            <SelectItem value="used">Used</SelectItem>
                            <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>

            {/* Task Type Classification */}
            <div className="rounded-lg border p-4 bg-slate-50">
              <h3 className="text-lg font-medium mb-4 text-slate-800">Task Type Classification</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="tier"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Primary Task Type</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value || ""}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select primary task type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {predefinedTier1Categories.map((tier) => (
                              <SelectItem key={tier} value={tier}>
                                {tier.charAt(0).toUpperCase() + tier.slice(1)}
                              </SelectItem>
                            ))}
                            <SelectItem value="other">Other</SelectItem>
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
                        <FormLabel>Secondary Task Type</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value || ""}
                          disabled={!form.watch("tier")}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select secondary task type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {form.watch("tier") && predefinedTier2Categories[form.watch("tier") || "other"] ? 
                              predefinedTier2Categories[form.watch("tier") || "other"].map((category) => (
                                <SelectItem key={category} value={category}>
                                  {category.charAt(0).toUpperCase() + category.slice(1)}
                                </SelectItem>
                              )) : 
                              <SelectItem value="other">Other</SelectItem>
                            }
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
                    name="section"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Section</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter section (e.g., Subfloor)" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="subsection"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subsection</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter subsection (e.g., Subfloor Walls)" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>
            
            {/* Unit & Cost Information */}
            <div className="rounded-lg border p-4 bg-slate-50">
              <h3 className="text-lg font-medium mb-4 text-slate-800">Unit & Cost Information</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="unit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unit</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select unit" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="pieces">Pieces</SelectItem>
                            <SelectItem value="sq ft">Square Feet</SelectItem>
                            <SelectItem value="cubic yards">Cubic Yards</SelectItem>
                            <SelectItem value="gallons">Gallons</SelectItem>
                            <SelectItem value="feet">Feet</SelectItem>
                            <SelectItem value="board feet">Board Feet</SelectItem>
                            <SelectItem value="tons">Tons</SelectItem>
                            <SelectItem value="pounds">Pounds</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="cost"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cost per Unit</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="Enter cost per unit"
                            {...field}
                            onChange={(e) => {
                              // Allow empty input or parse as float
                              if (e.target.value === '') {
                                field.onChange('');
                              } else {
                                const value = parseFloat(e.target.value);
                                field.onChange(isNaN(value) ? '' : value);
                              }
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>

            {/* Associated Contractors Section */}
            <div className="rounded-lg border p-4 bg-slate-50">
              <h3 className="text-lg font-medium mb-4 text-slate-800">Contractor Association</h3>
              <div className="space-y-2">
                <FormLabel>Associated Contractors</FormLabel>
                <Wordbank
                  items={contacts.filter(contact => contact.type === 'contractor').map(contact => ({
                    id: contact.id,
                    label: contact.name,
                    color: 'orange',
                    subtext: contact.role
                  }))}
                  selectedItems={selectedContacts}
                  onItemSelect={(id) => setSelectedContacts([...selectedContacts, id as number])}
                  onItemRemove={(id) => setSelectedContacts(selectedContacts.filter(contactId => contactId !== (id as number)))}
                  emptyText="No contractors selected"
                  className="min-h-[60px]"
                />
                <p className="text-xs text-muted-foreground">Select contractors responsible for this material</p>
              </div>
            </div>

            <DialogFooter>
              <Button 
                type="submit" 
                className="bg-orange-500 hover:bg-orange-600 text-white"
                disabled={createMaterial.isPending}
              >
                {createMaterial.isPending ? "Adding..." : "Add to Inventory"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}