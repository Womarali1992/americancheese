
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { X, Calendar as CalendarIcon } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Contact, Material } from "@/../../shared/schema";
import { Wordbank, WordbankItem } from "@/components/ui/wordbank";
import { useEffect, useState } from "react";
import React from "react";
import { useToast } from "@/hooks/use-toast";

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

  // Query for project-specific categories if projectId is available
  const { data: projectCategories = [] } = useQuery({
    queryKey: ["/api/projects", projectId, "template-categories"],
    enabled: !!projectId,
  });

  // Query for admin template categories to get tier1 and tier2 relationships
  const { data: adminCategories = [] } = useQuery({
    queryKey: ["/api/admin/template-categories"],
  });

  // Properly type the category data
  const typedProjectCategories = projectCategories as Array<{
    id: number;
    name: string; 
    type: string; 
    parentId: number | null;
    projectId: number;
  }>;
  const typedAdminCategories = adminCategories as Array<{name: string; type: string; parentCategory?: string; id: number}>;

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
      status: "not_started",
      assignedTo: "",
      completed: false,
      contactIds: [],
      materialIds: [],
      estimatedCost: null,
      actualCost: null,
    },
  });

  // Generate dynamic tier1 and tier2 options based on project categories
  const availableTier1Categories = React.useMemo(() => {
    const tier1Set = new Set<string>();
    
    // Add from project categories - only tier1 categories
    typedProjectCategories.forEach((cat) => {
      if (cat.type === 'tier1' && cat.name) {
        tier1Set.add(cat.name);
      }
    });
    
    // Add fallback options if no project categories
    if (tier1Set.size === 0) {
      ['structural', 'systems', 'sheathing', 'finishings'].forEach(t => tier1Set.add(t));
    }
    
    return Array.from(tier1Set);
  }, [typedProjectCategories]);

  // Generate tier2 options based on selected tier1 category
  const selectedTier1 = form.watch('tier1Category');
  const availableTier2Categories = React.useMemo(() => {
    if (!selectedTier1) return [];
    
    const tier2Set = new Set<string>();
    
    // Find the selected tier1 category object to get its ID
    const selectedTier1Category = typedProjectCategories.find(
      cat => cat.type === 'tier1' && cat.name === selectedTier1
    );
    
    if (selectedTier1Category) {
      // Find tier2 categories that belong to this tier1 category
      typedProjectCategories.forEach((cat) => {
        if (cat.type === 'tier2' && cat.parentId === selectedTier1Category.id) {
          tier2Set.add(cat.name);
        }
      });
    }
    
    // Add fallback options if no tier2 categories found
    if (tier2Set.size === 0) {
      ['framing', 'foundation', 'roofing', 'siding', 'other'].forEach(t => tier2Set.add(t));
    }
    
    return Array.from(tier2Set);
  }, [selectedTier1, typedProjectCategories]);
  
  // If projectId or preselectedCategory is provided, pre-select them when the dialog opens
  useEffect(() => {
    if (open) {
      if (projectId) {
        form.setValue('projectId', projectId);
      }
      
      if (preselectedCategory) {
        // Handle both string and object preselectedCategory
        if (typeof preselectedCategory === 'string') {
          // Legacy string type - just set the category field
          form.setValue('category', preselectedCategory);
          
          // If it's a category with predefined tasks, show them
          const categoryStr = preselectedCategory as string;
          setShowPredefinedTasks(
            categoryStr === 'foundation' || 
            categoryStr === 'framing' || 
            categoryStr === 'roof' ||
            categoryStr === 'plumbing' ||
            categoryStr === 'hvac' ||
            categoryStr === 'electrical'
          );
          setCurrentCategory(categoryStr);
        } else if (typeof preselectedCategory === 'object' && preselectedCategory !== null) {
          // New object type with tier1Category and tier2Category
          // Set all three fields
          form.setValue('tier1Category', preselectedCategory.tier1Category);
          form.setValue('tier2Category', preselectedCategory.tier2Category);
          form.setValue('category', preselectedCategory.category);
          
          // Set the current category for UI purposes
          const categoryValue = preselectedCategory.category || preselectedCategory.tier2Category;
          setCurrentCategory(categoryValue);
          
          // Show predefined tasks if applicable
          const category = categoryValue;
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
    }
  }, [projectId, preselectedCategory, open, form]);

  // Watch for category changes to show predefined tasks
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'category') {
        const category = value.category as string;
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
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="tier1Category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tier 1 Category</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value);
                      }}
                      value={field.value || ''}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select main category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableTier1Categories.map((category) => (
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

              <FormField
                control={form.control}
                name="tier2Category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tier 2 Category</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value);
                      }}
                      value={field.value || ''}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select sub-category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableTier2Categories.filter(cat => cat !== 'other').map((category) => (
                          <SelectItem key={category} value={category}>
                            {category.charAt(0).toUpperCase() + category.slice(1)}
                          </SelectItem>
                        ))}
                        {availableTier2Categories.length === 1 && availableTier2Categories[0] === 'other' && (
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
            
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
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

            {showPredefinedTasks ? (
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {currentCategory === 'foundation' 
                    ? 'Predefined Foundation Tasks' 
                    : currentCategory === 'framing'
                      ? 'Predefined Framing Tasks'
                      : currentCategory === 'roof'
                        ? 'Predefined Roofing Tasks'
                        : currentCategory === 'plumbing'
                          ? 'Predefined Plumbing Tasks'
                          : currentCategory === 'hvac'
                            ? 'Predefined HVAC Tasks'
                            : 'Predefined Electrical Tasks'
                  }
                </label>
                <Select
                  onValueChange={(index) => {
                    let tasks;
                    if (currentCategory === 'foundation') {
                      tasks = foundationTasks;
                    } else if (currentCategory === 'framing') {
                      tasks = framingTasks;
                    } else if (currentCategory === 'roof') {
                      tasks = roofingTasks;
                    } else if (currentCategory === 'plumbing') {
                      tasks = plumbingTasks;
                    } else if (currentCategory === 'hvac') {
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
                      if (currentCategory === 'foundation') {
                        tasksToShow = foundationTasks;
                      } else if (currentCategory === 'framing') {
                        tasksToShow = framingTasks;
                      } else if (currentCategory === 'roof') {
                        tasksToShow = roofingTasks;
                      } else if (currentCategory === 'plumbing') {
                        tasksToShow = plumbingTasks;
                      } else if (currentCategory === 'hvac') {
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
                        placeholder="Enter estimated cost"
                        {...field}
                        value={field.value || ""}
                        onChange={(e) => field.onChange(e.target.value === "" ? null : parseFloat(e.target.value))}
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
                        placeholder="Enter actual cost if known"
                        {...field}
                        value={field.value || ""}
                        onChange={(e) => field.onChange(e.target.value === "" ? null : parseFloat(e.target.value))}
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
                        
                        // Automatically update the status dropdown when completed changes
                        if (checked) {
                          form.setValue("status", "completed");
                        } else if (form.getValues("status") === "completed") {
                          // Default to "in_progress" when unchecking the completed box
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

            <DialogFooter>
              <Button 
                type="submit" 
                className="bg-green-600 hover:bg-green-700 text-white"
                disabled={createTask.isPending}
              >
                {createTask.isPending ? "Creating..." : "Create Task"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}