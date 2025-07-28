import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Task, Project, Contact, Material } from "@/types";
import { fetchTemplates } from "@/components/task/TaskTemplateService";

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
    "Pipe Fittings",
    "Chain & Rope",
    "Metal Sheets & Rods",
    "Brackets",
    "Hooks",
    "Anchors",
    "Nails",
    "Bolts",
    "Screws",
    "Specialty Hardware",
    "Garage Door Hardware",
    "Gate Hardware",
    "Mailboxes",
    "Cabinet Hardware",
    "Picture Hangers",
    "Corner Braces"
  ],
  "Plumbing": [
    "Pipes & Fittings",
    "Valves",
    "Water Filters & Filtration",
    "Water Heaters",
    "Sump Pumps",
    "Plumbing Tools",
    "Drain Cleaners & Chemicals",
    "Water Softeners",
    "Water Pumps",
    "Plumbing Parts & Repair",
    "Pipe Supports",
    "Drain Openers",
    "Plumbing Fixtures"
  ],
  "HVAC & Fans": [
    "Air Conditioning",
    "Air Handlers",
    "Ductless Mini Splits",
    "Air Conditioners",
    "Furnaces",
    "Heaters",
    "Air Purifiers",
    "Ceiling Fans",
    "Portable Fans",
    "Duct Work",
    "Ventilation",
    "Air Filters",
    "Controls & Accessories",
    "Fireplaces & Stoves",
    "Humidifiers",
    "Dehumidifiers"
  ],
  "Kitchens & Dining": [
    "Kitchen Cabinets",
    "Kitchen Cabinet Organizers",
    "Kitchen Sinks",
    "Kitchen Faucets",
    "Kitchen Countertops",
    "Kitchen Backsplash",
    "Garbage Disposals",
    "Trash Compactors",
    "Trash Cans",
    "Kitchen Islands",
    "Pantry Cabinets",
    "Wine Racks",
    "Storage & Organization",
    "Dining Tables",
    "Dining Chairs"
  ],
  "Paint": [
    "Interior Paint",
    "Exterior Paint",
    "Paint Supplies",
    "Primers",
    "Wood Stains",
    "Concrete Stains",
    "Waterproofing",
    "Patching & Repair",
    "Caulk",
    "Paint Tools & Supplies",
    "Brushes",
    "Rollers",
    "Painting Kits",
    "Paint Strippers",
    "Wall Repair",
    "Paint Sprayers"
  ],
  "Lighting & Ceiling Fans": [
    "Ceiling Lights",
    "Pendant Lights",
    "Chandeliers",
    "Bathroom Lighting",
    "Kitchen Lighting",
    "Wall Lights",
    "Outdoor Lighting",
    "Lamps",
    "Ceiling Fans",
    "Fan Accessories",
    "Light Bulbs",
    "Track Lighting",
    "Recessed Lighting",
    "Landscape Lighting",
    "Under Cabinet Lighting"
  ],
  "Doors & Windows": [
    "Exterior Doors",
    "Interior Doors",
    "Windows",
    "Window Accessories",
    "Door Hardware",
    "Window Hardware",
    "Storm Doors",
    "Sliding Doors",
    "French Doors",
    "Patio Doors",
    "Garage Doors",
    "Skylights",
    "Window Coverings",
    "Blinds & Shades",
    "Curtains"
  ],
  "Other Materials": [
    "Tools",
    "Landscaping Supplies",
    "Safety & Work Gear",
    "Cleaning Supplies",
    "Office Supplies",
    "Seasonal Decor",
    "Home Decor",
    "Furniture",
    "Storage & Organization",
    "Home Automation",
    "Outdoor Equipment",
    "Pet Supplies",
    "Automotive"
  ]
};

// These will be replaced by project-specific categories fetched from the API

// Helper function to check if a category is valid for the selected type
function isCategoryValidForType(category: string, type: string): boolean {
  if (!type || !category) return false;
  return materialTypeCategories[type] && materialTypeCategories[type].includes(category);
}

// Material form schema using zod for validation
const materialFormSchema = z.object({
  name: z.string().min(2, "Material name must be at least 2 characters"),
  materialSize: z.string().optional(), // New field for material dimensions/size
  type: z.string().min(1, "Please select a material type"),
  category: z.string().min(1, "Please select a material category"),
  tier: z.string().optional(),
  tier2Category: z.string().optional(),
  section: z.string().optional(),
  subsection: z.string().optional(),
  quantity: z.number().min(0, "Quantity must be a positive number").default(0),
  supplier: z.string().optional(),
  supplierId: z.number().nullable().optional(),
  status: z.string().default("pending"),
  isQuote: z.boolean().default(false),
  projectId: z.number(),
  taskIds: z.array(z.union([z.string(), z.number()])).optional().default([]),
  contactIds: z.array(z.union([z.string(), z.number()])).optional().default([]),
  unit: z.string().optional(),
  cost: z.number().min(0, "Cost must be a positive number").default(0),
  quoteDate: z.string().optional(),
  quoteNumber: z.string().optional(),
  orderDate: z.string().optional(),
  details: z.string().optional(),
});

// Material form values type
type MaterialFormValues = z.infer<typeof materialFormSchema>;

// EditMaterialDialog props
interface EditMaterialDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  material: Material | null;
}

// Import UI components
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { TaskMaterialsView } from "@/components/materials/TaskMaterialsView";

// EditMaterialDialog component
export function EditMaterialDialog({
  open,
  onOpenChange,
  material,
}: EditMaterialDialogProps) {
  // State variables
  const [selectedTask, setSelectedTask] = useState<number | null>(null);
  const [selectedTaskObj, setSelectedTaskObj] = useState<Task | null>(null);
  const [selectedTasks, setSelectedTasks] = useState<number[]>([]);
  const queryClient = useQueryClient();
  
  // Fetch projects query
  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
    enabled: open,
  });

  // Form setup with default values from the material prop
  const form = useForm<MaterialFormValues>({
    resolver: zodResolver(materialFormSchema),
    defaultValues: {
      name: material?.name || "",
      type: material?.type || "",
      category: material?.category || "",
      tier: material?.tier || "",
      tier2Category: material?.tier2Category || "",
      section: material?.section || "",
      subsection: material?.subsection || "",
      quantity: material?.quantity || 0,
      supplier: material?.supplier || "",
      supplierId: material?.supplierId || null,
      status: material?.status || "pending",
      isQuote: material?.isQuote || false,
      projectId: material?.projectId || 0,
      taskIds: material?.taskIds || [],
      contactIds: material?.contactIds || [],
      unit: material?.unit || "",
      cost: material?.cost || 0,
      quoteDate: material?.quoteDate || "",
      orderDate: material?.orderDate || "",
      details: material?.details || "",
    },
  });
  
  // Get the current values of projectId and type/category fields
  const currentProjectId = form.watch("projectId");
  const selectedType = form.watch("type");
  const selectedCategory = form.watch("category");

  // Fetch project-specific tier categories
  const { data: projectCategories = [] } = useQuery({
    queryKey: ['/api/projects', currentProjectId, 'template-categories'],
    enabled: open && !!currentProjectId && currentProjectId > 0,
  });

  // Debug logging for project categories
  useEffect(() => {
    if (open && currentProjectId) {
      console.log("EditMaterialDialog - ProjectId:", currentProjectId);
      console.log("EditMaterialDialog - Project Categories:", projectCategories.length);
      console.log("EditMaterialDialog - Tier1 Categories:", tier1Categories);
    }
  }, [open, currentProjectId, projectCategories, tier1Categories]);

  // Extract tier1 and tier2 categories from project categories
  const tier1Categories = projectCategories
    .filter((cat: any) => cat.type === 'tier1')
    .map((cat: any) => cat.name)
    .sort();

  const getTier2Categories = (tier1Name: string) => {
    // Find the tier1 category to get its ID
    const tier1Category = projectCategories.find(
      (cat: any) => cat.type === 'tier1' && cat.name === tier1Name
    );
    
    if (!tier1Category) return [];
    
    // Return tier2 categories that belong to this tier1 category
    return projectCategories
      .filter((cat: any) => cat.type === 'tier2' && cat.parentId === tier1Category.id)
      .map((cat: any) => cat.name)
      .sort();
  };
  
  // Fetch all tasks first
  const { data: allTasks = [] } = useQuery<Task[]>({
    queryKey: ['/api/tasks'],
    enabled: true
  });
  
  // Filter tasks to only show the ones for this project
  const tasks = allTasks.filter(task => task.projectId === currentProjectId);
  
  // Log task data when it changes for debugging
  useEffect(() => {
    if (tasks.length > 0) {
      console.log("Fetched tasks:", tasks.length, "items");
      console.log("First 5 tasks:", tasks.slice(0, 5).map(t => ({
        id: t.id, 
        title: t.title, 
        category: t.category, 
        tier1: t.tier1Category,
        tier2: t.tier2Category,
        projectId: t.projectId
      })));
    }
  }, [tasks]);
  
  // Fetch contacts
  const { data: contacts = [] } = useQuery<Contact[]>({
    queryKey: ['/api/contacts'],
    enabled: open,
  });
  
  // Handle project change
  const handleProjectChange = (projectId: number) => {
    // Reset selected tasks when project changes
    setSelectedTasks([]);
    setSelectedTask(null);
    setSelectedTaskObj(null);
  };
  
  // Update material mutation
  const updateMaterial = useMutation({
    mutationFn: async (data: MaterialFormValues) => {
      // Use the selectedTasks state directly for consistent processing
      data.taskIds = selectedTasks.map(id => String(id));
      
      console.log("Mutation sending taskIds:", data.taskIds);
      
      return apiRequest(`/api/materials/${material?.id}`, "PUT", data);
    },
    onSuccess: () => {
      // Invalidate relevant queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ['/api/materials'] });
      queryClient.invalidateQueries({ queryKey: ['/api/projects', currentProjectId, 'materials'] });
      
      // For each selected task, invalidate its query
      selectedTasks.forEach(taskId => {
        queryClient.invalidateQueries({ queryKey: ['/api/tasks', String(taskId)] });
      });
      
      // Also invalidate any tasks that were previously associated but now aren't
      if (material && material.taskIds) {
        material.taskIds.forEach(taskId => {
          queryClient.invalidateQueries({ queryKey: ['/api/tasks', String(taskId)] });
        });
      }
      
      // Close the dialog
      onOpenChange(false);
    },
  });
  
  // Submit handler for the form
  async function onSubmit(data: MaterialFormValues) {
    // Make sure selected tasks are included in the form data
    if (selectedTasks.length > 0) {
      data.taskIds = selectedTasks.map(id => String(id));
      console.log("Saving material with task IDs:", data.taskIds);
    } else {
      // If there are no selected tasks, make sure we save an empty array
      data.taskIds = [];
      console.log("Saving material with empty task IDs");
    }
    
    // Ensure that empty date strings are undefined to prevent database errors
    if (data.quoteDate === "") {
      data.quoteDate = undefined;
    }
    
    if (data.orderDate === "") {
      data.orderDate = undefined;
    }
    
    // Submit the update mutation
    updateMaterial.mutate(data);
  }
  
  // Update form values when material changes
  useEffect(() => {
    if (material) {
      // Reset form with values from material
      form.reset({
        name: material.name || "",
        materialSize: material.materialSize || "",
        type: material.type || "",
        category: material.category || "",
        tier: material.tier || "",
        tier2Category: material.tier2Category || "",
        section: material.section || "",
        subsection: material.subsection || "",
        quantity: material.quantity || 0,
        supplier: material.supplier || "",
        supplierId: material.supplierId || null,
        status: material.status || "pending",
        isQuote: material.isQuote || false,
        projectId: material.projectId || 0,
        taskIds: material.taskIds || [],
        contactIds: material.contactIds || [],
        unit: material.unit || "",
        cost: material.cost || 0,
        quoteDate: material.quoteDate || "",
        quoteNumber: material.quoteNumber || "",
        orderDate: material.orderDate || "",
        details: material.details || "",
      });
    }
  }, [material, form]);
  
  // Update selected tasks when material changes - but only on initial load
  useEffect(() => {
    if (!material) return;
    
    // Use a ref to track if this effect has run for this material
    if (material.taskIds && material.taskIds.length > 0) {
      // Convert all IDs to numbers for consistent comparison
      const taskIds = material.taskIds.map(id => typeof id === 'string' ? parseInt(id) : id);
      
      // Only set these states once to avoid infinite loops
      if (tasks.length > 0 && selectedTasks.length === 0) {
        // Ensure task IDs are properly normalized by checking string equality with tasks
        const validTaskIds = taskIds.filter(id => 
          tasks.some(task => String(task.id) === String(id))
        );
        setSelectedTasks(validTaskIds);
        
        // If there's a single task selected, update the selected task state too
        if (validTaskIds.length === 1) {
          setSelectedTask(validTaskIds[0]);
          
          // Find the corresponding task object - use string conversion for comparison
          const taskObj = tasks.find(t => String(t.id) === String(validTaskIds[0]));
          if (taskObj) {
            setSelectedTaskObj(taskObj);
          }
        }
        
        // Log the loaded task IDs
        console.log("Loaded material with task IDs:", taskIds);
      }
    } else if (selectedTasks.length === 0) {
      // Clear any selected tasks if material has no tasks
      setSelectedTasks([]);
      setSelectedTask(null);
      setSelectedTaskObj(null);
    }
  }, [material, tasks, selectedTasks.length]);
  
  // If there's no material, don't render the dialog
  if (!material) return null;
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Edit Material: {material.name}</span>
            <span className="text-sm text-muted-foreground">ID: {material.id}</span>
          </DialogTitle>
          <DialogDescription>
            Update material details and associated tasks.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Section 1: Project Information */}
            <div className="rounded-lg border p-4 bg-slate-50">
              <h3 className="text-lg font-medium mb-4 text-slate-800">Project Information</h3>
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="projectId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project</FormLabel>
                      <Select
                        value={field.value.toString()}
                        onValueChange={(value) => {
                          field.onChange(parseInt(value));
                          handleProjectChange(parseInt(value));
                        }}
                        disabled={true} // Can't change project
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a project" />
                        </SelectTrigger>
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
                  name="materialSize"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Material Size</FormLabel>
                      <FormControl>
                        <Input placeholder="E.g., 2x4, 4x8, 1/2 inch" {...field} />
                      </FormControl>
                      <FormDescription>
                        Dimensions or size specification of the material
                      </FormDescription>
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

                <FormField
                  control={form.control}
                  name="details"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
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
            </div>
            
            {/* Section 2: Material Classification */}
            <div className="rounded-lg border p-4 bg-slate-50">
              <h3 className="text-lg font-medium mb-4 text-slate-800">Material Classification</h3>
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Material Type</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value);
                          
                          // Check if the current category is valid for the new type
                          const currentCategory = form.getValues("category");
                          if (currentCategory && !isCategoryValidForType(currentCategory, value)) {
                            form.setValue("category", "");
                          }
                        }}
                        value={field.value || ""}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select material type" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.keys(materialTypeCategories).map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
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
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Material Category</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || ""}
                        disabled={!form.watch("type")}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select material subtype" />
                        </SelectTrigger>
                        <SelectContent>
                          {(() => {
                            const type = form.watch("type");
                            if (type && materialTypeCategories[type as keyof typeof materialTypeCategories]) {
                              return materialTypeCategories[type as keyof typeof materialTypeCategories].map((category: string) => (
                                <SelectItem key={category} value={category}>
                                  {category}
                                </SelectItem>
                              ));
                            }
                            return <SelectItem value="other">Other</SelectItem>;
                          })()}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            
            {/* Section 3: Inventory & Cost Information */}
            <div className="rounded-lg border p-4 bg-slate-50">
              <h3 className="text-lg font-medium mb-4 text-slate-800">Inventory & Cost Information</h3>
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantity</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Enter quantity"
                          {...field}
                          onChange={(e) => {
                            // Handle empty input gracefully
                            if (e.target.value === "") {
                              field.onChange(0);
                              return;
                            }
                            
                            // Otherwise convert to number and update
                            const value = parseFloat(e.target.value);
                            field.onChange(isNaN(value) ? 0 : value);
                          }}
                          value={field.value === 0 || field.value ? field.value : ""}
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
                          <SelectItem value="received">Received</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="installed">Installed</SelectItem>
                          <SelectItem value="returned">Returned</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="unit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unit of Measurement</FormLabel>
                      <FormControl>
                        <Input placeholder="E.g., pieces, sq ft, gallons" {...field} value={field.value || ""} />
                      </FormControl>
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
                          step="0.01"
                          placeholder="Enter cost per unit"
                          {...field}
                          onChange={(e) => {
                            // Handle empty input gracefully
                            if (e.target.value === "") {
                              field.onChange(0);
                              return;
                            }
                            
                            // Otherwise convert to number and update
                            const value = parseFloat(e.target.value);
                            field.onChange(isNaN(value) ? 0 : value);
                          }}
                          value={field.value === 0 || field.value ? field.value : ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Quote Information */}
                <div className="border-t pt-4 mt-4">
                  <h4 className="text-md font-medium mb-4">Quote Information</h4>
                  {/* Quote info is always shown now - no toggle needed */}
                  {(
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <FormField
                        control={form.control}
                        name="quoteNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Quote Number</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Enter quote number (e.g., Q-12345)" 
                                {...field} 
                                value={field.value || ""}
                                onChange={(e) => {
                                  field.onChange(e.target.value);
                                  // Auto-update isQuote based on whether there's a quote number
                                  if (e.target.value) {
                                    form.setValue("isQuote", true);
                                    // Only change status if not already received or installed
                                    const currentStatus = form.getValues("status");
                                    if (currentStatus !== "received" && currentStatus !== "installed") {
                                      form.setValue("status", "quoted");
                                    }
                                  } else {
                                    // Only reset isQuote if removing the quote number
                                    form.setValue("isQuote", false);
                                  }
                                }}
                              />
                            </FormControl>
                            <FormDescription>
                              Materials with a quote number are automatically marked as quotes
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="quoteDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Quote Date</FormLabel>
                            <FormControl>
                              <Input 
                                type="date" 
                                {...field} 
                                value={field.value || ""}
                                onChange={(e) => {
                                  field.onChange(e.target.value);
                                  
                                  // If adding a quote date and there's no quote number yet,
                                  // auto-generate a quote number
                                  if (e.target.value && !form.getValues("quoteNumber")) {
                                    // Format: Q-YYYYMMDD-XXX (where XXX is random 3-digit number)
                                    const dateStr = e.target.value.replace(/-/g, '');
                                    const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
                                    const newQuoteNumber = `Q-${dateStr}-${randomNum}`;
                                    
                                    form.setValue("quoteNumber", newQuoteNumber);
                                    form.setValue("isQuote", true);
                                    
                                    // Only change status if not already received or installed
                                    const currentStatus = form.getValues("status");
                                    if (currentStatus !== "received" && currentStatus !== "installed") {
                                      form.setValue("status", "quoted");
                                    }
                                  }
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Section 4: Task Information */}
            <div className="rounded-lg border p-4 bg-slate-50">
              <h3 className="text-lg font-medium mb-4 text-slate-800">Task & Location Information</h3>
              <div className="space-y-4">
                {/* Location Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="section"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Section</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter section (e.g., First Floor)" 
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
                    name="subsection"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subsection</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter subsection (e.g., First Floor - Walls)" 
                            {...field}
                            value={field.value || ""} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Primary & Secondary Task Type */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="tier"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Primary Task Type</FormLabel>
                        <Select
                          value={field.value || ""}
                          onValueChange={(value) => {
                            field.onChange(value);
                            // Reset tier2Category if the tier1 changes
                            if (value !== field.value) {
                              form.setValue("tier2Category", "");
                              setSelectedTask(null);
                              setSelectedTaskObj(null);
                              setSelectedTasks([]);
                            }
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select primary type" />
                          </SelectTrigger>
                          <SelectContent>
                            {tier1Categories.length > 0 ? (
                              tier1Categories.map((category) => (
                                <SelectItem key={category} value={category}>
                                  {category.charAt(0).toUpperCase() + category.slice(1)}
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="" disabled>
                                No tier1 categories available for this project
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
                        <FormLabel>Secondary Task Type</FormLabel>
                        <Select
                          value={field.value || ""}
                          onValueChange={(value) => {
                            field.onChange(value);
                            // Reset selected task when tier2 changes
                            if (value !== field.value) {
                              setSelectedTask(null);
                              setSelectedTaskObj(null);
                              setSelectedTasks([]);
                            }
                          }}
                          disabled={!form.watch("tier")}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select secondary type" />
                          </SelectTrigger>
                          <SelectContent>
                            {(() => {
                              const tier = form.watch("tier");
                              if (tier) {
                                const tier2Categories = getTier2Categories(tier);
                                if (tier2Categories.length > 0) {
                                  return tier2Categories.map((category: string) => (
                                    <SelectItem key={category} value={category}>
                                      {category.charAt(0).toUpperCase() + category.slice(1)}
                                    </SelectItem>
                                  ));
                                }
                              }
                              return (
                                <SelectItem value="" disabled>
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
                
                {/* Task Selection */}
                {form.watch("tier") && (
                  <div className="mt-4">
                    <FormField
                      control={form.control}
                      name="taskIds"
                      render={() => (
                        <FormItem>
                          <FormLabel>Associated Task</FormLabel>
                          <div className="border rounded-md p-3">
                            <div className="flex justify-between items-center mb-2">
                              <p className="text-sm text-muted-foreground">
                                Select a task to associate with this material.
                                Each material can only be assigned to one matching task.
                              </p>
                              <div className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                                Showing tasks for {form.watch("tier")} {form.watch("tier2Category") ? `/ ${form.watch("tier2Category")}` : "(any category)"}
                              </div>
                            </div>
                            
                            {/* Select Task dropdown */}
                            <div className="mb-4">
                              <FormLabel>Select Task</FormLabel>
                              <Select
                                value={selectedTask ? selectedTask.toString() : undefined}
                                onValueChange={(value) => {
                                  const taskId = parseInt(value);
                                  // Find the task and set it as the selected task object - use string conversion for comparison
                                  const task = tasks.find(t => String(t.id) === String(taskId));
                                  if (task) {
                                    setSelectedTask(taskId);
                                    setSelectedTaskObj(task);
                                    // Just set this task as the only selected task
                                    setSelectedTasks([taskId]);
                                  }
                                  console.log("Task selected:", taskId);
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a task" />
                                </SelectTrigger>
                                <SelectContent>
                                  {(() => {
                                    // Filter tasks based on tier1 and tier2Category
                                    const tier1 = form.watch("tier");
                                    const tier2 = form.watch("tier2Category");
                                    
                                    // Filter by tier1/tier2
                                    const filteredTasks = tasks.filter(task => {
                                      // Match tier1 category (required)
                                      const matchesTier1 = task.tier1Category?.toLowerCase() === tier1?.toLowerCase();
                                      
                                      // Match tier2 category if specified
                                      const matchesTier2 = !tier2 || 
                                        task.tier2Category?.toLowerCase() === tier2?.toLowerCase();
                                      
                                      return matchesTier1 && matchesTier2;
                                    });
                                    
                                    // Show count of matching tasks
                                    if (filteredTasks.length === 0) {
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
                                            {task.title} {task.templateId && `(${task.templateId})`}
                                          </SelectItem>
                                        ))}
                                      </>
                                    );
                                  })()}
                                </SelectContent>
                              </Select>
                            </div>
                            
                            {tasks.length === 0 && (
                              <p className="text-sm text-muted-foreground py-2">
                                No tasks available for the selected project.
                              </p>
                            )}
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </div>
            </div>
            
            {/* Form Actions */}
            <DialogFooter>
              <Button 
                type="submit" 
                className="bg-orange-500 hover:bg-orange-600"
                disabled={updateMaterial.isPending}
              >
                {updateMaterial.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}