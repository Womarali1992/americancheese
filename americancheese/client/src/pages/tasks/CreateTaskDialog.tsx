
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { X, Calendar as CalendarIcon, FileCode2, ChevronDown } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useEffect, useState } from "react";
import React from "react";
import { useToast } from "@/hooks/use-toast";
import { useTier1Categories, useTier2Categories } from "@/lib/unified-category-hooks";

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

// Simple interface for task templates (for backwards compatibility)
interface TaskTemplate {
  id: string;
  title: string;
  description: string;
  tier1Category: string;
  tier2Category: string;
  category: string;
  estimatedDuration: number;
}

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

// Section header component with green theme
function SectionHeader({ number, title }: { number: number; title: string }) {
  return (
    <div className="flex items-center gap-3 py-2 border-b-2 border-green-200 mb-4">
      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-green-600 text-white text-sm font-semibold">
        {number}
      </span>
      <h3 className="text-sm font-semibold text-green-700 uppercase tracking-wide">
        {title}
      </h3>
    </div>
  );
}
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
  tier1Category: z.string().min(1, "Please select a main category"),
  tier2Category: z.string().min(1, "Please select a subcategory").refine(val => val !== "other", "Please select a proper subcategory"),
  templateId: z.string().optional().nullable(),
  materialsNeeded: z.string().optional(),
  startDate: z.date(),
  endDate: z.date(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  status: z.string().default("not_started"),
  assignedTo: z.string().optional(),
  completed: z.boolean().default(false),
  contactIds: z.array(z.number()).default([]),
  materialIds: z.array(z.number()).default([]),
  estimatedCost: z.coerce.number().optional().nullable(),
  actualCost: z.coerce.number().optional().nullable(),
});

type TaskFormValues = z.infer<typeof taskFormSchema>;

// Define the allowed types for preselectedCategory
type CategoryPreselection = string | { tier1Category: string, tier2Category: string, category: string } | null;

interface CreateTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId?: number;
  preselectedCategory?: CategoryPreselection;
}

// Predefined foundation tasks
const foundationTasks = [
  {
    title: "Foundation Form & Soil Preparation",
    description: "Set foundation slab forms accurately per blueprint; compact foundation sub-soil thoroughly with moisture and tamper (CN31, CN32)."
  },
  {
    title: "Foundation Utilities Installation & Inspection",
    description: "Install foundation stub plumbing (with foam collars, termite shields) and HVAC gas lines; inspect utility placement and integrity (CN33–35)."
  },
  {
    title: "Foundation Base & Reinforcement",
    description: "Prepare foundation base with crushed stone; install vapor barrier, reinforcing wire mesh, and perimeter insulation (CN36–39)."
  },
  {
    title: "Foundation Concrete Scheduling & Pre-Pour Inspection",
    description: "Schedule foundation concrete delivery and confirm finishers; inspect foundation forms and utility alignment before pour (CN40, CN41)."
  },
  {
    title: "Foundation Slab Pour, Finish & Final Inspection",
    description: "Pour foundation slab promptly, complete professional finish; inspect slab smoothness, drainage, and correct defects (CN42–44)."
  },
  {
    title: "Foundation Concrete Payment",
    description: "Pay concrete supplier upon satisfactory foundation slab inspection (CN45)."
  }
];

// Predefined framing tasks
const framingTasks = [
  {
    title: "Bidding & Materials (FR1-FR4)",
    description: "Bid materials/labor, confirm terms, order special items, arrange temporary electric."
  },
  {
    title: "Site Prep (FR5-FR8)",
    description: "Order lumber, mark foundation, install sill barrier, secure sill plates, set basement supports."
  },
  {
    title: "Daily Supervision (FR9)",
    description: "Daily oversight, verify measurements, secure materials, maintain levels/plumb."
  },
  {
    title: "First Floor (FR10-FR14)",
    description: "Frame joists/subfloor, place fixtures, build stairs/walls, plumb and brace."
  },
  {
    title: "Second Floor & Roof (FR15-FR21, FR23)",
    description: "Frame joists/subfloor, walls, ceiling joists, openings; align framing; frame roof; apply decking and tar paper."
  },
  {
    title: "Specialized Framing (FR24-FR27)",
    description: "Frame chimneys, dormers, skylights, tray ceilings, bays, shafts."
  },
  {
    title: "Wall Sheathing (FR28-FR29)",
    description: "Install sheathing, inspect, and repair."
  },
  {
    title: "Windows & Doors (FR31)",
    description: "Install and waterproof windows/doors, coordinate subcontractors."
  },
  {
    title: "Interior Prep (FR32)",
    description: "Install drywall backing."
  },
  {
    title: "Roof & Decks (FR33-FR34)",
    description: "Install roof vents, frame decks with treated lumber."
  },
  {
    title: "Inspections & Payments (FR22, FR30, FR35-FR39)",
    description: "Inspect framing, remove supports, correct issues, coordinate inspection, manage payments, finalize affidavit."
  }
];

// Predefined roofing tasks
const roofingTasks = [
  {
    title: "Materials & Bidding (RF1-RF3)",
    description: "Select shingles, bid labor/materials, order materials, confirm with roofer."
  },
  {
    title: "Drip Edges & Flashing (RF4 & RF6)",
    description: "Install drip edges and necessary flashing."
  },
  {
    title: "Underlayment & Shingles (RF5 & RF7)",
    description: "Install roofing felt after deck inspection, followed by shingles."
  },
  {
    title: "Gutter Coordination (RF7A)",
    description: "Coordinate timing with gutter installation."
  },
  {
    title: "Inspection & Payment (RF8 & RF9)",
    description: "Inspect roofing, finalize subcontractor payment with affidavit."
  }
];

// Predefined plumbing tasks
const plumbingTasks = [
  {
    title: "Fixture Selection (PL1 & PL4)",
    description: "Finalize fixture selections and order special items promptly."
  },
  {
    title: "Bidding & Materials (PL2)",
    description: "Manage bidding; confirm material and pipe choices."
  },
  {
    title: "Site Coordination (PL3, PL5 & PL8)",
    description: "Coordinate site walkthrough, plumbing layout, fixture placements, and utility connections."
  },
  {
    title: "Stub Installation (PL6 & PL7)",
    description: "Supervise installation of stub plumbing and ensure placement of large fixtures before framing."
  },
  {
    title: "Rough-in Installation (PL9-11 & PL13)",
    description: "Oversee rough-in plumbing installation, protective measures, and utility marking; verify air-pressure testing."
  },
  {
    title: "Rough-in Inspection (PL12, PL14-16)",
    description: "Schedule and attend rough-in inspection; oversee corrections; authorize rough-in payment."
  },
  {
    title: "Final Installations (PL17 & PL18)",
    description: "Monitor final fixture installations and water supply connection; ensure thorough system testing."
  },
  {
    title: "Final Inspection & Payment (PL19-22)",
    description: "Facilitate final plumbing inspection, manage necessary corrections, complete payments, and document plumber's compliance."
  }
];

// Predefined HVAC tasks
const hvacTasks = [
  {
    title: "Energy Audit & System Selection (HV1 & HV2)",
    description: "Conduct energy audit; determine HVAC requirements, dryer type/location, and select efficient, cost-effective systems."
  },
  {
    title: "Bidding & Design (HV3 & HV4)",
    description: "Manage bidding process for HVAC installation and ductwork; finalize design and confirm dryer exhaust location."
  },
  {
    title: "Rough-in Installation (HV5)",
    description: "Oversee rough-in installation of HVAC system, excluding external fixtures to prevent theft."
  },
  {
    title: "Inspection & Corrections (HV6 & HV7)",
    description: "Schedule and attend rough-in HVAC inspection; manage correction of identified issues."
  },
  {
    title: "Payment Processing (HV8)",
    description: "Complete rough-in phase payment to HVAC subcontractor; secure signed receipt."
  }
];

// Predefined electrical tasks
const electricalTasks = [
  {
    title: "Requirements & Bidding (EL1, EL2 & EL4)",
    description: "Determine electrical requirements, select fixtures and appliances, and manage bidding with licensed electrician."
  },
  {
    title: "Phone Wiring (EL3 & EL5)",
    description: "Arrange phone wiring and modular jack installations."
  },
  {
    title: "Temporary Electric (EL6 & EL7)",
    description: "Secure temporary electrical hookup and install temporary electric pole."
  },
  {
    title: "Rough-in Installation (EL8 & EL9)",
    description: "Oversee rough-in wiring installation, including electrical, phone, cable, and security systems."
  },
  {
    title: "Rough-in Inspection (EL10-EL13)",
    description: "Schedule and manage rough-in inspection, oversee corrections, and authorize payment."
  },
  {
    title: "Garage Door Systems (EL14 & EL15)",
    description: "Coordinate installation of garage doors and electric openers with appropriate electrical connections."
  },
  {
    title: "Finish Installation & Inspection (EL16-EL20)",
    description: "Supervise finish electrical installations, schedule final inspections, manage corrections, and activate electrical and phone services."
  },
  {
    title: "Final Payment & Documentation (EL21 & EL22)",
    description: "Complete final payment to electrical subcontractor; secure affidavit and release retainage upon successful service activation."
  }
];

export function CreateTaskDialog({
  open,
  onOpenChange,
  projectId,
  preselectedCategory,
}: CreateTaskDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentCategory, setCurrentCategory] = useState<string>("other");
  const [showPredefinedTasks, setShowPredefinedTasks] = useState<boolean>(false);
  const [contextOpen, setContextOpen] = useState(false);
  const [contextData, setContextData] = useState<ContextData | null>(null);

  // Query for projects to populate the project selector
  const { data: projects = [], isLoading: isLoadingProjects } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
    queryFn: async () => {
      const authToken = localStorage.getItem('authToken');
      const res = await fetch("/api/projects", {
        headers: authToken ? { "Authorization": `Bearer ${authToken}` } : {},
        credentials: "include",
      });
      if (!res.ok) throw new Error('Failed to fetch projects');
      return res.json();
    },
  });

  // Debug: log projects
  console.log('Projects loaded:', projects.length, 'isLoading:', isLoadingProjects, projects);

  // Set up the form with default values
  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: "",
      description: "",
      projectId: projectId || undefined,
      category: "other",
      tier1Category: "", // Will be set based on available categories
      tier2Category: "", // Will be set based on selected tier1
      templateId: null,
      materialsNeeded: "",
      startDate: new Date(),
      endDate: new Date(new Date().setDate(new Date().getDate() + 7)), // Default to one week from now
      startTime: "",
      endTime: "",
      status: "not_started",
      assignedTo: "",
      completed: false,
      contactIds: [],
      materialIds: [],
      estimatedCost: null,
      actualCost: null,
    },
  });

  // Watch the current project ID from the form
  const currentProjectId = form.watch('projectId');

  // Debug logging
  console.log('Current Project ID:', currentProjectId);

  // Use template-based categories based on the selected project in the form
  // Only fetch if we have a valid project ID (must be a positive number)
  const { data: tier1Categories = [], isLoading: isLoadingTier1 } = useTier1Categories(
    currentProjectId && currentProjectId > 0 ? currentProjectId : undefined
  );

  // Debug logging for categories
  console.log('Tier 1 Categories:', tier1Categories);
  console.log('Is Loading Tier 1:', isLoadingTier1);

  // Use tier2 categories hook with selected tier1
  const selectedTier1 = form.watch('tier1Category');
  const { data: tier2Categories = [], isLoading: isLoadingTier2 } = useTier2Categories(
    currentProjectId && currentProjectId > 0 ? currentProjectId : undefined,
    selectedTier1
  );

  // Debug logging for tier2
  console.log('Selected Tier 1:', selectedTier1);
  console.log('Tier 2 Categories:', tier2Categories);

  // Convert categories to string arrays for select options
  const availableTier1Categories = React.useMemo(() => {
    const categories = tier1Categories.map(cat => cat.name || cat.label);
    console.log('Available Tier 1 Categories (mapped):', categories);
    return categories;
  }, [tier1Categories]);

  const availableTier2Categories = React.useMemo(() => {
    const categories = tier2Categories.map(cat => cat.name || cat.label);
    console.log('Available Tier 2 Categories (mapped):', categories);
    return categories;
  }, [tier2Categories]);

  // Track if we've initialized the form
  const [hasInitialized, setHasInitialized] = useState(false);

  // Single effect to handle project initialization when dialog opens
  useEffect(() => {
    if (!open) {
      setHasInitialized(false);
      return;
    }

    // Wait for projects to load
    if (isLoadingProjects || projects.length === 0) {
      return;
    }

    // Only initialize once per dialog open
    if (hasInitialized) {
      return;
    }

    // Determine which project to select
    const targetProjectId = projectId || projects[0].id;
    console.log('Initializing project:', targetProjectId, projectId ? '(from prop)' : '(auto-selected)');
    
    form.setValue('projectId', targetProjectId, { shouldValidate: true });
    setHasInitialized(true);
  }, [open, projectId, projects, isLoadingProjects, hasInitialized, form]);

  // Reset categories when project changes (after initial load)
  useEffect(() => {
    if (hasInitialized && currentProjectId) {
      form.setValue('tier1Category', '');
      form.setValue('tier2Category', '');
    }
  }, [currentProjectId, hasInitialized, form]);
  
  // Handle preselected category
  useEffect(() => {
    if (!open || !preselectedCategory) return;

    if (typeof preselectedCategory === 'string') {
      form.setValue('category', preselectedCategory);
      setCurrentCategory(preselectedCategory);
      setShowPredefinedTasks(
        ['foundation', 'framing', 'roof', 'plumbing', 'hvac', 'electrical'].includes(preselectedCategory)
      );
    } else if (typeof preselectedCategory === 'object') {
      form.setValue('tier1Category', preselectedCategory.tier1Category);
      form.setValue('tier2Category', preselectedCategory.tier2Category);
      form.setValue('category', preselectedCategory.category);
      const categoryValue = preselectedCategory.category || preselectedCategory.tier2Category;
      setCurrentCategory(categoryValue);
      setShowPredefinedTasks(
        ['foundation', 'framing', 'roof', 'plumbing', 'hvac', 'electrical'].includes(categoryValue)
      );
    }
  }, [open, preselectedCategory, form]);

  // Additional effect to set preselected categories after they've loaded
  useEffect(() => {
    if (open && preselectedCategory && typeof preselectedCategory === 'object' && preselectedCategory !== null) {
      // Wait for categories to load before setting preselected values
      if (!isLoadingTier1 && availableTier1Categories.length > 0) {
        const tier1Match = availableTier1Categories.find(
          cat => cat.toLowerCase() === preselectedCategory.tier1Category.toLowerCase()
        );

        if (tier1Match && form.getValues('tier1Category') !== tier1Match) {
          form.setValue('tier1Category', tier1Match);
        }
      }

      // Set tier2 category after tier1 is set and tier2 categories have loaded
      const currentTier1 = form.getValues('tier1Category');
      if (currentTier1 && !isLoadingTier2 && availableTier2Categories.length > 0) {
        const tier2Match = availableTier2Categories.find(
          cat => cat.toLowerCase() === preselectedCategory.tier2Category.toLowerCase()
        );

        if (tier2Match && form.getValues('tier2Category') !== tier2Match) {
          form.setValue('tier2Category', tier2Match);
        }
      }
    }
  }, [open, preselectedCategory, isLoadingTier1, isLoadingTier2, availableTier1Categories, availableTier2Categories, form]);

  // Watch for tier2Category changes to show predefined tasks
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'tier2Category') {
        const tier2Category = value.tier2Category as string;
        setCurrentCategory(tier2Category);
        // Show predefined tasks for known categories (lowercase for matching)
        const lowerCategory = tier2Category?.toLowerCase() || '';
        setShowPredefinedTasks(
          lowerCategory === 'foundation' || 
          lowerCategory === 'framing' || 
          lowerCategory === 'roof' || 
          lowerCategory === 'roofing' ||
          lowerCategory === 'plumbing' ||
          lowerCategory === 'hvac' ||
          lowerCategory === 'electrical'
        );
      }
      // Also watch for legacy category field for backward compatibility
      if (name === 'category') {
        const category = value.category as string;
        if (!form.getValues('tier2Category')) {
          setCurrentCategory(category);
          setShowPredefinedTasks(
            category === 'foundation' || 
            category === 'framing' || 
            category === 'roof' ||
            category === 'plumbing' ||
            category === 'hvac' ||
            category === 'electrical'
          );
        }
      }
    });
    
    return () => subscription.unsubscribe();
  }, [form.watch]);

  const createTask = useMutation({
    mutationFn: async (data: TaskFormValues) => {
      // Convert Date objects to ISO strings for the API
      // Ensure contactIds and materialIds are stored as string arrays
      const apiData = {
        ...data,
        startDate: data.startDate.toISOString(),
        endDate: data.endDate.toISOString(),
        startTime: data.startTime || null,
        endTime: data.endTime || null,
        contactIds: data.contactIds.map(id => id.toString()),
        materialIds: data.materialIds.map(id => id.toString())
      };
      return apiRequest("/api/tasks", "POST", apiData);
    },
    onSuccess: (newTask) => {
      // Get the actual project ID from the form data
      const taskProjectId = form.getValues('projectId');
      
      console.log('Task created successfully:', newTask);
      console.log('Task project ID:', taskProjectId);
      console.log('Prop project ID:', projectId);
      
      toast({
        title: "Task created",
        description: "Your task has been created successfully.",
      });
      
      // Invalidate relevant task queries
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      if (taskProjectId) {
        queryClient.invalidateQueries({ queryKey: ["/api/projects", taskProjectId, "tasks"] });
      }
      if (projectId && projectId !== taskProjectId) {
        queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "tasks"] });
      }
      
      form.reset();
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create task. Please try again.",
        variant: "destructive",
      });
      console.error("Failed to create task:", error);
    },
  });

  async function onSubmit(data: TaskFormValues) {
    // Validate that tier2Category is not empty or just "other"
    if (!data.tier2Category || data.tier2Category === 'other') {
      toast({
        title: "Missing Subcategory",
        description: "Please select a proper subcategory before creating a task. Tasks cannot be added directly to main categories.",
        variant: "destructive",
      });
      return;
    }

    createTask.mutate(data);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]" aria-describedby="create-task-description">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle>Add New Task</DialogTitle>
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
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
            {/* 1) Project & Category */}
            <div>
              <SectionHeader number={1} title="Project & Category" />
              <FormField
                control={form.control}
                name="projectId"
                render={({ field }) => (
                  <FormItem className="mb-3">
                    <FormLabel>Project</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(parseInt(value))}
                    value={field.value ? field.value.toString() : ""}
                    key={`project-select-${field.value || 'empty'}`}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a project">
                          {field.value && projects?.length > 0
                            ? projects.find(p => p.id === field.value)?.name || "Select a project"
                            : "Select a project"}
                        </SelectValue>
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
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="tier1Category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Main Category</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value);
                        // Reset tier2Category when tier1 changes
                        form.setValue('tier2Category', "");
                      }}
                      value={field.value || ""}
                      disabled={isLoadingTier1}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={isLoadingTier1 ? "Loading..." : "Select main category"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableTier1Categories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                        {availableTier1Categories.length === 0 && !isLoadingTier1 && (
                          <SelectItem value="none" disabled>
                            No categories available for this project
                          </SelectItem>
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
                    <FormLabel>Subcategory</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value);
                      }}
                      value={field.value || ""}
                      disabled={isLoadingTier2 || !selectedTier1}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={
                            !selectedTier1 
                              ? "Select main category first" 
                              : isLoadingTier2 
                                ? "Loading..." 
                                : "Select subcategory"
                          } />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableTier2Categories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                        {availableTier2Categories.length === 0 && selectedTier1 && !isLoadingTier2 && (
                          <SelectItem value="none" disabled>
                            No subcategories available for this category
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            </div>

            {/* Hidden legacy category field */}
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem className="hidden">
                  <FormLabel>Legacy Category (for compatibility)</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                      setCurrentCategory(value);
                      setShowPredefinedTasks(
                        value === 'foundation' || 
                        value === 'framing' || 
                        value === 'roof' ||
                        value === 'plumbing' ||
                        value === 'hvac' ||
                        value === 'electrical'
                      );
                    }}
                    value={field.value || ''}
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
                      <SelectItem value="plumbing">Plumbing</SelectItem>
                      <SelectItem value="hvac">HVAC</SelectItem>
                      <SelectItem value="electrical">Electrical</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 2) Task Details */}
            <div>
              <SectionHeader number={2} title="Task Details" />

            {showPredefinedTasks ? (
              <div className="space-y-2 mb-3">
                <label className="text-sm font-medium">
                  {(() => {
                    const lowerCategory = currentCategory?.toLowerCase() || '';
                    if (lowerCategory === 'foundation') {
                      return 'Predefined Foundation Tasks';
                    } else if (lowerCategory === 'framing') {
                      return 'Predefined Framing Tasks';
                    } else if (lowerCategory === 'roof' || lowerCategory === 'roofing') {
                      return 'Predefined Roofing Tasks';
                    } else if (lowerCategory === 'plumbing') {
                      return 'Predefined Plumbing Tasks';
                    } else if (lowerCategory === 'hvac') {
                      return 'Predefined HVAC Tasks';
                    } else {
                      return 'Predefined Electrical Tasks';
                    }
                  })()}
                </label>
                <Select
                  onValueChange={(index) => {
                    let tasks;
                    const lowerCategory = currentCategory?.toLowerCase() || '';
                    if (lowerCategory === 'foundation') {
                      tasks = foundationTasks;
                    } else if (lowerCategory === 'framing') {
                      tasks = framingTasks;
                    } else if (lowerCategory === 'roof' || lowerCategory === 'roofing') {
                      tasks = roofingTasks;
                    } else if (lowerCategory === 'plumbing') {
                      tasks = plumbingTasks;
                    } else if (lowerCategory === 'hvac') {
                      tasks = hvacTasks;
                    } else {
                      tasks = electricalTasks;
                    }
                    const task = tasks[parseInt(index)];
                    form.setValue('title', task.title);
                    form.setValue('description', task.description);
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a predefined task" />
                  </SelectTrigger>
                  <SelectContent>
                    {(() => {
                      let tasksToShow;
                      const lowerCategory = currentCategory?.toLowerCase() || '';
                      if (lowerCategory === 'foundation') {
                        tasksToShow = foundationTasks;
                      } else if (lowerCategory === 'framing') {
                        tasksToShow = framingTasks;
                      } else if (lowerCategory === 'roof' || lowerCategory === 'roofing') {
                        tasksToShow = roofingTasks;
                      } else if (lowerCategory === 'plumbing') {
                        tasksToShow = plumbingTasks;
                      } else if (lowerCategory === 'hvac') {
                        tasksToShow = hvacTasks;
                      } else {
                        tasksToShow = electricalTasks;
                      }
                      return tasksToShow.map((task, index) => (
                        <SelectItem key={index} value={index.toString()}>
                          {task.title}
                        </SelectItem>
                      ));
                    })()}
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Select a predefined task or enter a custom one below
                </p>
              </div>
            ) : null}

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
                    entityId="new-task"
                    entityType="task"
                    initialContext={contextData}
                    onChange={setContextData}
                    compact
                  />
                </div>
              </CollapsibleContent>
            </Collapsible>
            </div>

            {/* 3) Schedule */}
            <div>
              <SectionHeader number={3} title="Schedule" />
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

              {/* Time Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <FormField
                  control={form.control}
                  name="startTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Time (optional)</FormLabel>
                      <FormControl>
                        <Input
                          type="time"
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
                  name="endTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Time (optional)</FormLabel>
                      <FormControl>
                        <Input
                          type="time"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end pt-4 border-t border-green-100">
              <Button
                type="submit"
                className="bg-green-600 hover:bg-green-700 text-white"
                disabled={createTask.isPending}
              >
                {createTask.isPending ? "Creating..." : "Create Task"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}