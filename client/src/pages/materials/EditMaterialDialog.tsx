import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { X, Check } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Task, Project, Contact, Material } from "@/types";
import { getMergedTasks, fetchTemplates } from "@/components/task/TaskTemplateService";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";

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

// Helper function to check if a category is valid for a given material type
function isCategoryValidForType(category: string, type: string): boolean {
  if (!category || !type) return false;
  
  // Use our materialTypeCategories mapping for validation as well
  // All categories are valid for unspecified types
  if (!materialTypeCategories[type]) return true;
  
  return materialTypeCategories[type].includes(category);
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
  SelectItem,
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

interface EditMaterialDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  material: Material | null;
}

export function EditMaterialDialog({
  open,
  onOpenChange,
  material,
}: EditMaterialDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTasks, setSelectedTasks] = useState<number[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<number[]>([]);
  
  // Predefined tier1 categories
  const predefinedTier1Categories = [
    'structural',
    'systems',
    'sheathing',
    'finishings',
    'other'
  ];
  
  // Predefined tier2 categories for each tier1 category
  const predefinedTier2Categories: Record<string, string[]> = {
    'structural': ['foundation', 'framing', 'lumber', 'roofing', 'shingles'],
    'systems': ['electrical', 'plumbing', 'hvac'],
    'sheathing': ['insulation', 'drywall', 'siding', 'exteriors'],
    'finishings': ['windows', 'doors', 'cabinets', 'fixtures', 'flooring', 'paint'],
    'other': ['permits', 'other']
  };

  // Define form with default values
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
      projectId: 0,
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
  
  // Get current project ID for filtering tasks
  const currentProjectId = form.watch("projectId");
  
  // Query for tasks related to the selected project
  const { data: tasks = [] } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
    select: (tasks) => {
      if (!currentProjectId) return tasks;
      return tasks.filter(task => task.projectId === currentProjectId);
    },
  });
  
  // Query for contacts
  const { data: contacts = [] } = useQuery<Contact[]>({
    queryKey: ["/api/contacts"],
  });
  
  // Update form when material changes
  useEffect(() => {
    if (material && open) {
      form.reset({
        name: material.name,
        type: material.type,
        category: material.category || "other",
        tier: material.tier || "", 
        tier2Category: material.tier2Category || "",
        section: material.section || "",
        subsection: material.subsection || "",
        quantity: material.quantity,
        supplier: material.supplier || "",
        status: material.status,
        projectId: material.projectId,
        taskIds: material.taskIds || [],
        contactIds: material.contactIds || [],
        unit: material.unit || "pieces",
        cost: material.cost || 0,
      });
      
      setSelectedTasks(material.taskIds || []);
      setSelectedContacts(material.contactIds || []);
    }
  }, [material, open, form]);
  
  // Handle project changes through the field value change
  const handleProjectChange = (projectId: number) => {
    // Update the form value
    form.setValue("projectId", projectId);
  };

  // Fetch task templates when component mounts
  useEffect(() => {
    fetchTemplates();
  }, []);
  
  // Update the form when task selection changes
  useEffect(() => {
    if (selectedTasks) {
      form.setValue("taskIds", selectedTasks);
    }
  }, [selectedTasks, form]);
  
  // Update the form when contact selection changes
  useEffect(() => {
    if (selectedContacts) {
      form.setValue("contactIds", selectedContacts);
    }
  }, [selectedContacts, form]);

  // Update material mutation
  const updateMaterial = useMutation({
    mutationFn: async (data: MaterialFormValues) => {
      if (!material) return null;
      return apiRequest(`/api/materials/${material.id}`, "PUT", data);
    },
    onSuccess: () => {
      toast({
        title: "Inventory item updated",
        description: "Your inventory item has been updated successfully.",
      });
      
      // Invalidate general materials list
      queryClient.invalidateQueries({ queryKey: ["/api/materials"] });
      
      // Invalidate project-specific materials list if we have a projectId
      if (currentProjectId) {
        queryClient.invalidateQueries({ 
          queryKey: ["/api/projects", currentProjectId, "materials"] 
        });
      }
      
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update inventory item. Please try again.",
        variant: "destructive",
      });
      console.error("Failed to update material:", error);
    },
  });

  // Form submission handler
  async function onSubmit(data: MaterialFormValues) {
    updateMaterial.mutate(data);
  }

  // Return null if no material is provided
  if (!material) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]" aria-describedby="edit-material-description">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle>Edit Inventory Item</DialogTitle>
            <Button
              variant="ghost"
              className="h-8 w-8 p-0 rounded-full"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <DialogDescription>
            Update material details and connections
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
                      onValueChange={(value) => {
                        const projectId = parseInt(value);
                        field.onChange(projectId);
                        handleProjectChange(projectId);
                      }}
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
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select material sub type" />
                            </SelectTrigger>
                          </FormControl>
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
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="unit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unit of Measurement</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter unit (e.g., pieces, sq ft)" {...field} value={field.value || ""} />
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
                            min="0"
                            placeholder="Enter cost" 
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

            {/* Section 4: Task & Location Information */}
            <div className="rounded-lg border p-4 bg-slate-50">
              <h3 className="text-lg font-medium mb-4 text-slate-800">Task & Location Information</h3>
              <div className="space-y-4">
                {/* Primary & Secondary Task Type */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="tier"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Primary Task Type</FormLabel>
                        <Select
                          onValueChange={(value) => {
                            const oldValue = field.value;
                            // Only reset tier2Category when tier actually changes
                            if (oldValue !== value) {
                              field.onChange(value);
                              form.setValue("tier2Category", "");
                            }
                          }}
                          value={field.value || ""}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select primary task type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {predefinedTier1Categories.map((tier) => (
                              <SelectItem key={`tier1-${tier}`} value={tier}>
                                {tier.charAt(0).toUpperCase() + tier.slice(1)}
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
                            {(() => {
                              const tier = form.watch("tier");
                              if (tier && predefinedTier2Categories[tier as keyof typeof predefinedTier2Categories]) {
                                return predefinedTier2Categories[tier as keyof typeof predefinedTier2Categories].map((category: string) => (
                                  <SelectItem key={`tier2-${category}`} value={category}>
                                    {category.charAt(0).toUpperCase() + category.slice(1)}
                                  </SelectItem>
                                ));
                              }
                              return <SelectItem key="tier2-fallback-other" value="other">Other</SelectItem>;
                            })()}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                {/* Section and Subsection Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="section"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Section</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter section (e.g., Subfloor)" 
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
                            placeholder="Enter subsection (e.g., Subfloor Walls)" 
                            {...field} 
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Task Selection */}
                <div className="mt-4">
                  <FormItem>
                    <FormLabel>Associated Tasks</FormLabel>
                    <div className="border rounded-md p-3">
                      <div className="flex justify-between items-center mb-2">
                        <p className="text-sm text-muted-foreground">
                          Select tasks associated with this material
                        </p>
                      </div>
                      
                      {tasks.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-2">
                          No tasks available for the selected project.
                        </p>
                      ) : (
                        <ScrollArea className="h-[200px]">
                          <div className="space-y-2">
                            {tasks.map((task) => (
                              <div key={task.id} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`task-${task.id}`}
                                  checked={selectedTasks.includes(task.id)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setSelectedTasks([...selectedTasks, task.id]);
                                    } else {
                                      setSelectedTasks(selectedTasks.filter((id) => id !== task.id));
                                    }
                                  }}
                                />
                                <label
                                  htmlFor={`task-${task.id}`}
                                  className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex items-center"
                                >
                                  <span className="font-medium mr-1">{task.title}</span>
                                  {task.status === "completed" && (
                                    <Check className="h-3 w-3 text-green-500" />
                                  )}
                                </label>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      )}
                    </div>
                  </FormItem>
                </div>
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
