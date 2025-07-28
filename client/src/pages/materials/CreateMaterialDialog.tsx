import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { X, Check } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Wordbank } from "@/components/ui/wordbank";
import { getMergedTasks, isTemplateTask, fetchTemplates } from "@/components/task/TaskTemplateService";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";

// Helper function to check if a category is valid for a given material type
function isCategoryValidForType(category: string, type: string): boolean {
  if (!category || !type) return false;
  
  // Use our materialTypeCategories mapping for validation as well
  // All categories are valid for unspecified types
  if (!materialTypeCategories[type]) return true;
  
  return materialTypeCategories[type].includes(category);
}

// Material type categories mapping for dropdown options
const materialTypeCategories: Record<string, string[]> = {
  "Building Materials": [
    "Lumber & Composites",
    "Concrete, Cement & Masonry",
    "Decking",
    "Fencing",
    "Moulding & Millwork",
    "Insulation",
    "Drywall",
    "Roofing",
    "Gutter Systems",
    "Plywood",
    "Boards, Planks & Panels",
    "Siding",
    "Ladders",
    "Dimensional Lumber",
    "Building Hardware",
    "Ventilation"
  ],
  "Appliances": [
    "Kitchen Appliance Packages",
    "Refrigerators",
    "Ranges",
    "Dishwashers",
    "Microwaves",
    "Over-the-Range Microwaves",
    "Range Hoods",
    "Freezers",
    "Wall Ovens",
    "Cooktops",
    "Beverage Coolers",
    "Mini Fridges"
  ],
  "Bath & Faucets": [
    "Bathroom Vanities",
    "Bathroom Faucets",
    "Showers & Doors",
    "Bathtubs",
    "Shower Heads",
    "Toilets",
    "Toilet Seats",
    "Bidets",
    "Bathroom Sinks",
    "Bathroom Accessories",
    "Bathroom Storage",
    "Bathroom Cabinets",
    "Bathroom Mirrors",
    "Bathroom Exhaust Fans",
    "Bathroom Safety",
    "Shower Curtains",
    "Bathroom Remodeling"
  ],
  "Electrical": [
    "Conduit & Fittings",
    "Electrical Boxes & Brackets",
    "Weatherproof Boxes",
    "Circuit Breakers",
    "Breaker Boxes",
    "Safety Switches",
    "Electrical Tools",
    "Electric Testers",
    "Wire",
    "Wiring Devices & Light Controls",
    "Wall Plates",
    "Extension Cords & Surge Protectors",
    "Smoke Detectors & Fire Safety",
    "Commercial Lighting",
    "Renewable Energy",
    "Home Security",
    "Recessed Lighting"
  ],
  "Flooring": [
    "Vinyl Flooring",
    "Tile",
    "Laminate Flooring",
    "Hardwood Flooring",
    "Hybrid Resilient Flooring",
    "Carpet",
    "Gym Flooring",
    "Garage Flooring",
    "Artificial Grass",
    "Rugs",
    "Area Rugs",
    "Flooring Supplies",
    "Under Flooring Heating"
  ],
  "Hardware": [
    "Fasteners",
    "Door Hardware",
    "Door Locks",
    "Door Handles",
    "Door Lock Combo Packs",
    "Cabinet Hardware",
    "Mailboxes",
    "Address Signs",
    "Weather Stripping"
  ],
  "Heating & Cooling": [
    "Air Conditioners",
    "Central Air Conditioners",
    "Portable Air Conditioners",
    "Window Air Conditioners",
    "Wall Air Conditioners",
    "Mini Split Air Conditioners",
    "HVAC Parts & Supplies",
    "Heaters",
    "Space Heaters",
    "Fireplaces",
    "Air Filters",
    "Air Purifiers",
    "Dehumidifiers",
    "Ceiling Fans",
    "Fans",
    "Thermostats",
    "Boilers",
    "HVAC Installation"
  ],
  "Kitchen": [
    "Kitchen Cabinets",
    "Kitchen Countertops",
    "Kitchen Sinks",
    "Kitchen Faucets",
    "Kitchen Appliances",
    "Kitchen Paint"
  ],
  "Lawn & Garden": [
    "Perennials",
    "Annuals",
    "Rose Bushes",
    "Trees",
    "Succulents",
    "Garden Tools",
    "Mulch",
    "Pavers",
    "Landscape Rocks",
    "Soils",
    "Lawn Mowers",
    "Grass Seed",
    "Greenhouses",
    "Raised Garden Beds",
    "Plant Stands",
    "Patio Furniture",
    "Fire Pits"
  ],
  "Lighting & Ceiling Fans": [
    "Shop All Lighting",
    "Flush Mount Lights",
    "Chandeliers",
    "Pendants",
    "Lamps",
    "Vanity Lights",
    "Recessed Lighting",
    "Sconce",
    "Ceiling Fans",
    "Commercial Lighting",
    "Track Lighting",
    "Outdoor Lighting",
    "Wall Lights",
    "Night Lights",
    "Landscape Lighting",
    "Light Bulbs",
    "Light Fixture Installation"
  ],
  "Paint": [
    "Paint Color Wall",
    "Interior Paint",
    "Exterior Paint",
    "Paint Samples",
    "Primers",
    "Spray Paint",
    "Interior Wood Stains",
    "Exterior Wood Stains",
    "Exterior Wood Coatings",
    "Wood Finishes",
    "Paint Supplies",
    "Concrete Coatings",
    "Adhesives",
    "Caulk & Sealants",
    "Behr Paint",
    "Glidden Paint",
    "Rust-Oleum Spray Paint",
    "Patching & Repair"
  ],
  "Plumbing": [
    "Pipe",
    "Fittings",
    "PVC Pipe",
    "Drainage",
    "Valves",
    "Water Filters",
    "Water Softener Systems",
    "Tank Water Heaters",
    "Tankless Water Heaters",
    "Toilet Parts",
    "Sewer Machines",
    "Drain Snakes",
    "Drain Cleaners",
    "Toilet Plungers",
    "Water Pumps"
  ],
  "Other": ["Miscellaneous"]
};

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
  details: z.string().optional(),
});

type MaterialFormValues = z.infer<typeof materialFormSchema>;

interface CreateMaterialDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId?: number;
  preselectedTaskId?: number;
  initialTier1?: string;
  initialTier2?: string;
  initialMaterial?: any; // Material to duplicate
}

export function CreateMaterialDialog({
  open,
  onOpenChange,
  projectId,
  preselectedTaskId,
  initialTier1,
  initialTier2,
  initialMaterial,
}: CreateMaterialDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTasks, setSelectedTasks] = useState<number[]>(
    initialMaterial?.taskIds ? initialMaterial.taskIds.map(id => 
      typeof id === 'string' ? parseInt(id) : id
    ).filter(id => !isNaN(id)) : []
  );
  const [selectedContacts, setSelectedContacts] = useState<number[]>(
    initialMaterial?.contactIds ? initialMaterial.contactIds.map(id => 
      typeof id === 'string' ? parseInt(id) : id
    ).filter(id => !isNaN(id)) : []
  );
  
  // State for task selection
  const [selectedTask, setSelectedTask] = useState<number | null>(null);
  const [selectedTaskObj, setSelectedTaskObj] = useState<Task | null>(null);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  
  // State for tier selection
  const [selectedTier1, setSelectedTier1] = useState<string | null>(
    initialMaterial?.tier || initialMaterial?.tier1Category || null
  );
  const [selectedTier2, setSelectedTier2] = useState<string | null>(
    initialMaterial?.tier2Category || null
  );
  const [taskFilterTier1, setTaskFilterTier1] = useState<string | null>(null);
  const [taskFilterTier2, setTaskFilterTier2] = useState<string | null>(null);

  // Initialize form first so it can be used in queries and effects
  const form = useForm<MaterialFormValues>({
    resolver: zodResolver(materialFormSchema),
    defaultValues: {
      name: initialMaterial?.name || "",
      type: initialMaterial?.type || "",
      category: initialMaterial?.category || "other",
      tier: initialMaterial?.tier || initialMaterial?.tier1Category || "",
      tier2Category: initialMaterial?.tier2Category || "",
      section: initialMaterial?.section || "",
      subsection: initialMaterial?.subsection || "",
      quantity: initialMaterial?.quantity || 1,
      supplier: initialMaterial?.supplier || "",
      status: initialMaterial?.status || "ordered",
      projectId: initialMaterial?.projectId || projectId || undefined,
      taskIds: initialMaterial?.taskIds || [],
      contactIds: initialMaterial?.contactIds || [],
      unit: initialMaterial?.unit || "pieces",
      cost: initialMaterial?.cost || 0,
      details: initialMaterial?.details || "",
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

  // Get current projectId for project-specific categories
  const currentProjectId = form.watch("projectId") || projectId;

  // Query for project-specific categories
  const { data: projectCategories = [] } = useQuery<any[]>({
    queryKey: ['/api/projects', currentProjectId, 'template-categories'],
    enabled: open && !!currentProjectId && currentProjectId > 0,
  });
  
  // Add task filtering state
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
  
  // Extract tier1 and tier2 categories from project categories
  const tier1Categories = projectCategories
    .filter((cat: any) => cat.type === 'tier1')
    .map((cat: any) => cat.name)
    .sort();

  // Get tier2 categories for a specific tier1 category  
  const getTier2Categories = (tier1Name: string) => {
    return projectCategories
      .filter((cat: any) => cat.type === 'tier2' && cat.parentName === tier1Name)
      .map((cat: any) => cat.name)
      .sort();
  };

  // Fallback to predefined categories if no project categories are available
  const predefinedTier1Categories = [
    'structural',
    'systems',
    'sheathing',
    'finishings',
    'other'
  ];
  
  // Predefined tier2 categories for each tier1 category (fallback)
  const predefinedTier2Categories: Record<string, string[]> = {
    'structural': ['foundation', 'framing', 'lumber', 'roofing', 'shingles'],
    'systems': ['electrical', 'plumbing', 'hvac'],
    'sheathing': ['insulation', 'drywall', 'siding', 'exteriors'],
    'finishings': ['windows', 'doors', 'cabinets', 'fixtures', 'flooring', 'paint'],
    'other': ['permits', 'other']
  };

  // Use project-specific categories if available, otherwise fallback to predefined
  const availableTier1Categories = tier1Categories.length > 0 ? tier1Categories : predefinedTier1Categories;

  // Debug logging for project categories
  useEffect(() => {
    if (open && currentProjectId) {
      console.log("CreateMaterialDialog - ProjectId:", currentProjectId);
      console.log("CreateMaterialDialog - Project Categories:", projectCategories.length);
      console.log("CreateMaterialDialog - Tier1 Categories:", tier1Categories);
      console.log("CreateMaterialDialog - Available Tier1 Categories:", availableTier1Categories);
    }
  }, [open, currentProjectId, projectCategories, tier1Categories, availableTier1Categories]);
  
  // Get available tier1 categories (only those that have tasks) - for task filtering
  const availableTier1CategoriesWithTasks = Object.keys(tasksByCategory).filter(
    tier1 => Object.values(tasksByCategory[tier1]).some(tasks => tasks.length > 0)
  );
  
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
      
      // Find the task in the tasks array - convert IDs to strings for proper comparison
      const task = tasks.find(t => String(t.id) === String(preselectedTaskId));
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
      }
    }
  }, [open, preselectedTaskId, tasks, form]);

  // Handle initial material for duplication
  useEffect(() => {
    if (open && initialMaterial) {
      console.log("Populating form with initial material for duplication:", initialMaterial);
      
      // Reset the form with the initial material data
      const resetData = {
        name: initialMaterial.name || '',
        type: initialMaterial.type || '',
        category: initialMaterial.category || 'other',
        tier: initialMaterial.tier || initialMaterial.tier1Category || '',
        tier2Category: initialMaterial.tier2Category || '',
        section: initialMaterial.section || '',
        subsection: initialMaterial.subsection || '',
        quantity: initialMaterial.quantity || 1,
        supplier: initialMaterial.supplier || '',
        status: initialMaterial.status || 'ordered',
        unit: initialMaterial.unit || 'pieces',
        cost: initialMaterial.cost || 0,
        details: initialMaterial.details || '',
        projectId: initialMaterial.projectId || projectId || undefined,
        taskIds: initialMaterial.taskIds ? initialMaterial.taskIds.map(id => 
          typeof id === 'string' ? parseInt(id) : id
        ).filter(id => !isNaN(id)) : [],
        contactIds: initialMaterial.contactIds ? initialMaterial.contactIds.map(id => 
          typeof id === 'string' ? parseInt(id) : id
        ).filter(id => !isNaN(id)) : []
      };
      
      console.log("Resetting form with data:", resetData);
      form.reset(resetData);
      
      // Set tier state variables
      if (initialMaterial.tier || initialMaterial.tier1Category) {
        setSelectedTier1(initialMaterial.tier || initialMaterial.tier1Category);
      }
      if (initialMaterial.tier2Category) {
        setSelectedTier2(initialMaterial.tier2Category);
      }
      
      // Set task and contact selections
      if (initialMaterial.taskIds && Array.isArray(initialMaterial.taskIds)) {
        const taskIdsArray = initialMaterial.taskIds.map(id => 
          typeof id === 'string' ? parseInt(id) : id
        ).filter(id => !isNaN(id));
        setSelectedTasks(taskIdsArray);
        console.log("Loaded material with task IDs:", taskIdsArray);
      }
      
      if (initialMaterial.contactIds && Array.isArray(initialMaterial.contactIds)) {
        const contactIdsArray = initialMaterial.contactIds.map(id => 
          typeof id === 'string' ? parseInt(id) : id
        ).filter(id => !isNaN(id));
        setSelectedContacts(contactIdsArray);
      }
    } else if (open && !initialMaterial) {
      // Reset form for new material creation
      form.reset({
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
        details: "",
      });
      setSelectedTasks([]);
      setSelectedContacts([]);
      setSelectedTier1(null);
      setSelectedTier2(null);
    }
  }, [open, initialMaterial, form, projectId]);
  
  // Handle initial tier information when provided directly from a task context
  useEffect(() => {
    if (open && initialTier1 && initialTier2) {
      console.log(`Pre-filling tier information: ${initialTier1} -> ${initialTier2}`);
      
      // Set the tier information in the form
      form.setValue("tier", initialTier1.toLowerCase());
      form.setValue("tier2Category", initialTier2.toLowerCase());
      
      // Set the filter states to show relevant tasks
      setTaskFilterTier1(initialTier1.toLowerCase());
      setTaskFilterTier2(initialTier2.toLowerCase());
      setSelectedTier1(initialTier1.toLowerCase());
      setSelectedTier2(initialTier2.toLowerCase());
    }
  }, [open, initialTier1, initialTier2, form]);
  
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
      
      // Invalidate task queries for each selected task to refresh their materials
      selectedTasks.forEach(taskId => {
        queryClient.invalidateQueries({ queryKey: ["/api/tasks", String(taskId)] });
        queryClient.invalidateQueries({ queryKey: [`/api/tasks/${taskId}/materials`] });
      });
      
      // Also invalidate the general tasks query to refresh task data
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      
      form.reset();
      setSelectedTasks([]);
      setSelectedContacts([]);
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
    console.log("Form submission attempted with data:", data);
    console.log("Form validation errors:", form.formState.errors);
    console.log("Form is valid:", form.formState.isValid);
    console.log("Selected tasks:", selectedTasks);
    console.log("Selected contacts:", selectedContacts);
    
    // Ensure taskIds and contactIds are properly set
    const submissionData = {
      ...data,
      taskIds: selectedTasks,
      contactIds: selectedContacts
    };
    
    console.log("Final submission data:", submissionData);
    createMaterial.mutate(submissionData);
  }

  // State for active tab
  const [activeTab, setActiveTab] = useState("project-setup");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-hidden flex flex-col" aria-describedby="create-material-description">
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

        <Form {...form} key={initialMaterial?.id || 'new'}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 overflow-y-auto pr-1">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-full grid grid-cols-4">
                <TabsTrigger value="project-setup">Project Setup</TabsTrigger>
                <TabsTrigger value="material-details">Material Details</TabsTrigger>
                <TabsTrigger value="inventory-cost">Inventory & Cost</TabsTrigger>
                <TabsTrigger value="contractors">Contractors</TabsTrigger>
              </TabsList>
              
              {/* Tab 1: Project Setup */}
              <TabsContent value="project-setup" className="space-y-4 focus:outline-none">
                <fieldset className="border p-4 rounded-lg bg-slate-50 mb-4">
                  <legend className="text-lg font-medium text-slate-800 px-2">Project Information</legend>
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
                          <SelectTrigger>
                            <SelectValue placeholder="Select a project" />
                          </SelectTrigger>
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
                </fieldset>

                <fieldset className="border p-4 rounded-lg bg-slate-50">
                  <legend className="text-lg font-medium text-slate-800 px-2">Task Classification</legend>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="tier"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Primary Task Type</FormLabel>
                            <Select
                              onValueChange={(value) => {
                                field.onChange(value);
                                if (matchTasksByCategory) {
                                  setTaskFilterTier1(value || '');
                                }
                              }}
                              value={field.value || ""}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select primary task type" />
                              </SelectTrigger>
                              <SelectContent>
                                {availableTier1Categories.map((tier) => (
                                  <SelectItem key={tier} value={tier}>
                                    {tier.charAt(0).toUpperCase() + tier.slice(1)}
                                  </SelectItem>
                                ))}
                                {availableTier1Categories.length === 0 && (
                                  <SelectItem value="other-tier1">Other</SelectItem>
                                )}
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
                              onValueChange={(value) => {
                                field.onChange(value);
                                if (matchTasksByCategory) {
                                  setTaskFilterTier2(value || null);
                                }
                              }}
                              value={field.value || ""}
                              disabled={!form.watch("tier")}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select secondary task type" />
                              </SelectTrigger>
                              <SelectContent>
                                {(() => {
                                  const tier1 = form.watch("tier");
                                  if (tier1) {
                                    const tier2Categories = getTier2Categories(tier1);
                                    if (tier2Categories.length > 0) {
                                      return tier2Categories.map((category: string) => (
                                        <SelectItem key={category} value={category}>
                                          {category.charAt(0).toUpperCase() + category.slice(1)}
                                        </SelectItem>
                                      ));
                                    } else {
                                      // Fallback to predefined categories if no project categories available
                                      const fallbackCategories = predefinedTier2Categories[tier1] || [];
                                      if (fallbackCategories.length > 0) {
                                        return fallbackCategories.map((category: string) => (
                                          <SelectItem key={category} value={category}>
                                            {category.charAt(0).toUpperCase() + category.slice(1)}
                                          </SelectItem>
                                        ));
                                      }
                                    }
                                  }
                                  return (
                                    <SelectItem value="no-categories" disabled>
                                      {form.watch("tier") 
                                        ? "No tier2 categories available for this tier1" 
                                        : "Select a primary type first"
                                      }
                                    </SelectItem>
                                  );
                                })()}
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
                    
                    {/* Task Association - Show when at least a tier is selected */}
                    {form.watch("tier") && (
                      <div className="border-t pt-4 mt-2">
                        <div className="flex justify-between items-center mb-3">
                          <h4 className="font-medium">Associated Task</h4>
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
                        
                        <p className="text-xs font-medium text-slate-700 mb-2">
                          Showing tasks for {form.watch("tier")} {form.watch("tier2Category") ? `/ ${form.watch("tier2Category")}` : "(any category)"}
                        </p>
                        <div className="mb-3">
                          {/* Task dropdown for single task selection */}
                          <div className="space-y-4">
                            <FormItem>
                              <FormLabel>Select Task</FormLabel>
                              <Select
                                onValueChange={(value) => {
                                  const taskId = parseInt(value);
                                  // Set selected task as the only task
                                  setSelectedTasks([taskId]);
                                  
                                  // Find the task and set it as the selected task object
                                  const task = tasks.find(t => t.id === taskId);
                                  if (task) {
                                    setSelectedTask(taskId);
                                    setSelectedTaskObj(task);
                                  }
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a task" />
                                </SelectTrigger>
                                <SelectContent>
                                  {(() => {
                                    const tier1 = form.watch("tier");
                                    const tier2 = form.watch("tier2Category");
                                    
                                    // Filter tasks based on tier1/tier2
                                    const filteredTasks = tasks.filter(task => {
                                      // Match tier1 category (required)
                                      const matchesTier1 = task.tier1Category?.toLowerCase() === tier1?.toLowerCase();
                                      
                                      // Match tier2 category if specified
                                      const matchesTier2 = !tier2 || 
                                        task.tier2Category?.toLowerCase() === tier2?.toLowerCase();
                                      
                                      return matchesTier1 && matchesTier2;
                                    });
                                    
                                    // Show count of matching tasks
                                    if (filteredTasks.length === 0 && tasks.length > 0) {
                                      return (
                                        <div className="px-2 py-2 text-center text-sm text-muted-foreground">
                                          No matching tasks available
                                        </div>
                                      );
                                    }
                                    
                                    return (
                                      <>
                                        <div className="px-2 py-1.5 text-xs text-muted-foreground">
                                          Tasks found: {filteredTasks.length} matching tasks
                                        </div>
                                        {filteredTasks.map(task => (
                                          <SelectItem key={task.id} value={task.id.toString()}>
                                            {task.title} {task.tier1Category && `(${task.tier1Category}${task.tier2Category ? ` / ${task.tier2Category}` : ''})`}
                                          </SelectItem>
                                        ))}
                                      </>
                                    );
                                  })()}
                                </SelectContent>
                              </Select>
                            </FormItem>
                          </div>
                          
                          {/* Display selected task (if any) */}
                          {selectedTask && (
                            <div className="mt-3">
                              <p className="text-xs font-medium mb-2">Selected Task:</p>
                              <div className="border rounded-md p-2 bg-slate-50">
                                <div className="font-medium text-sm">
                                  {tasks.find(t => t.id === selectedTask)?.title}
                                </div>
                                <div className="text-xs text-slate-500">
                                  {tasks.find(t => t.id === selectedTask)?.tier1Category} / {tasks.find(t => t.id === selectedTask)?.tier2Category}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <p className="text-xs text-muted-foreground mt-2">
                          Each material can only be assigned to one matching task.
                          {selectedTasks.length > 0 ? ` ${selectedTasks.length} tasks selected.` : ''}
                        </p>
                      </div>
                    )}
                  </div>
                </fieldset>
                <div className="flex justify-end mt-4">
                  <Button 
                    type="button" 
                    onClick={() => setActiveTab("material-details")}
                    className="bg-orange-500 hover:bg-orange-600 text-white"
                  >
                    Next
                  </Button>
                </div>
              </TabsContent>
              
              {/* Tab 2: Material Details */}
              <TabsContent value="material-details" className="space-y-4 focus:outline-none">
                <fieldset className="border p-4 rounded-lg bg-slate-50 mb-4">
                  <legend className="text-lg font-medium text-slate-800 px-2">Basic Information</legend>
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
                    
                    <FormField
                      control={form.control}
                      name="details"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Additional Details</FormLabel>
                          <FormControl>
                            <textarea 
                              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                              placeholder="Enter additional details or notes about this material" 
                              {...field} 
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </fieldset>
                
                <fieldset className="border p-4 rounded-lg bg-slate-50">
                  <legend className="text-lg font-medium text-slate-800 px-2">Classification</legend>
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
                                if (form.getValues("category") && 
                                    !isCategoryValidForType(form.getValues("category"), value)) {
                                  form.setValue("category", "");
                                }
                              }}
                              value={field.value}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select material type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Building Materials">Building Materials</SelectItem>
                                <SelectItem value="Appliances">Appliances</SelectItem>
                                <SelectItem value="Bath & Faucets">Bath & Faucets</SelectItem>
                                <SelectItem value="Electrical">Electrical</SelectItem>
                                <SelectItem value="Flooring">Flooring</SelectItem>
                                <SelectItem value="Hardware">Hardware</SelectItem>
                                <SelectItem value="Heating & Cooling">Heating & Cooling</SelectItem>
                                <SelectItem value="Kitchen">Kitchen</SelectItem>
                                <SelectItem value="Lawn & Garden">Lawn & Garden</SelectItem>
                                <SelectItem value="Lighting & Ceiling Fans">Lighting & Ceiling Fans</SelectItem>
                                <SelectItem value="Paint">Paint</SelectItem>
                                <SelectItem value="Plumbing">Plumbing</SelectItem>
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
                              <SelectTrigger>
                                <SelectValue placeholder="Select material sub type" />
                              </SelectTrigger>
                              <SelectContent>
                                {form.watch("type") && materialTypeCategories[form.watch("type")]?.map((category) => (
                                  <SelectItem key={category} value={category}>
                                    {category.charAt(0).toUpperCase() + category.slice(1)}
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
                <div className="flex justify-between mt-4">
                  <Button 
                    type="button" 
                    onClick={() => setActiveTab("project-setup")}
                    variant="outline"
                  >
                    Previous
                  </Button>
                  <Button 
                    type="button" 
                    onClick={() => setActiveTab("inventory-cost")}
                    className="bg-orange-500 hover:bg-orange-600 text-white"
                  >
                    Next
                  </Button>
                </div>
              </TabsContent>
              
              {/* Tab 3: Inventory & Cost */}
              <TabsContent value="inventory-cost" className="space-y-4 focus:outline-none">
                <fieldset className="border p-4 rounded-lg bg-slate-50 mb-4">
                  <legend className="text-lg font-medium text-slate-800 px-2">Inventory Information</legend>
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
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
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
                </fieldset>
                
                <fieldset className="border p-4 rounded-lg bg-slate-50">
                  <legend className="text-lg font-medium text-slate-800 px-2">Unit & Cost</legend>
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
                            <SelectTrigger>
                              <SelectValue placeholder="Select unit" />
                            </SelectTrigger>
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
                </fieldset>
                <div className="flex justify-between mt-4">
                  <Button 
                    type="button" 
                    onClick={() => setActiveTab("material-details")}
                    variant="outline"
                  >
                    Previous
                  </Button>
                  <Button 
                    type="button" 
                    onClick={() => setActiveTab("contractors")}
                    className="bg-orange-500 hover:bg-orange-600 text-white"
                  >
                    Next
                  </Button>
                </div>
              </TabsContent>
              
              {/* Tab 4: Contractors */}
              <TabsContent value="contractors" className="space-y-4 focus:outline-none">
                <fieldset className="border p-4 rounded-lg bg-slate-50">
                  <legend className="text-lg font-medium text-slate-800 px-2">Associated Contractors</legend>
                  <div className="space-y-2">
                    <FormLabel>Select Contractors for this Material</FormLabel>
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
                      className="min-h-[150px]"
                    />
                    <p className="text-xs text-muted-foreground mt-4">Select contractors responsible for this material</p>
                  </div>
                </fieldset>
                <div className="flex justify-between mt-4">
                  <Button 
                    type="button" 
                    onClick={() => setActiveTab("inventory-cost")}
                    variant="outline"
                  >
                    Previous
                  </Button>
                  <Button 
                    type="submit" 
                    className="bg-orange-500 hover:bg-orange-600 text-white"
                    disabled={createMaterial.isPending}
                  >
                    {createMaterial.isPending ? "Adding..." : "Add to Inventory"}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}