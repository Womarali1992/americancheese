import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { X, FileCode2, ChevronDown } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ContextEditor } from "@/components/context";
import { ContextData } from "@shared/context-types";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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

// Define interfaces
interface Project {
  id: number;
  name: string;
}

interface Task {
  id: number;
  title: string;
  projectId: number;
  tier1Category?: string;
  tier2Category?: string;
}

// Material type categories mapping
const materialTypeCategories: Record<string, string[]> = {
  "Building Materials": ["Lumber & Composites", "Concrete & Masonry", "Decking", "Insulation", "Drywall", "Roofing", "Plywood", "Siding"],
  "Appliances": ["Refrigerators", "Ranges", "Dishwashers", "Microwaves", "Range Hoods", "Wall Ovens"],
  "Bath & Faucets": ["Vanities", "Faucets", "Showers & Doors", "Bathtubs", "Toilets", "Sinks"],
  "Electrical": ["Conduit & Fittings", "Boxes & Brackets", "Circuit Breakers", "Wire", "Switches & Outlets"],
  "Flooring": ["Vinyl", "Tile", "Laminate", "Hardwood", "Carpet"],
  "Hardware": ["Fasteners", "Door Hardware", "Cabinet Hardware", "Locks"],
  "Heating & Cooling": ["Air Conditioners", "Heaters", "Fans", "Thermostats", "HVAC Parts"],
  "Kitchen": ["Cabinets", "Countertops", "Sinks", "Faucets"],
  "Lighting": ["Ceiling Lights", "Chandeliers", "Pendants", "Recessed Lighting", "Ceiling Fans"],
  "Paint": ["Interior Paint", "Exterior Paint", "Primers", "Stains", "Caulk & Sealants"],
  "Plumbing": ["Pipe", "Fittings", "Valves", "Water Heaters", "Drains"],
  "Other": ["Miscellaneous"]
};

// Predefined tier categories
const tier1Categories = ["Structural", "Systems", "Sheathing", "Finishings", "Other"];
const tier2ByTier1: Record<string, string[]> = {
  "Structural": ["Foundation", "Framing", "Roofing"],
  "Systems": ["Electrical", "Plumbing", "HVAC"],
  "Sheathing": ["Insulation", "Drywall", "Siding", "Exteriors"],
  "Finishings": ["Windows", "Doors", "Cabinets", "Flooring", "Paint", "Fixtures"],
  "Other": ["Permits", "Other"]
};

// Material form schema
const materialFormSchema = z.object({
  name: z.string().min(2, { message: "Material name must be at least 2 characters" }),
  projectId: z.coerce.number(),
  section: z.string().optional(),
  subsection: z.string().optional(),
  tier1Category: z.string().optional(),
  tier2Category: z.string().optional(),
  type: z.string().optional(),
  category: z.string().optional(),
  details: z.string().optional(),
  supplier: z.string().optional(),
  quantity: z.coerce.number().min(0).default(1),
  unit: z.string().default("pieces"),
  status: z.string().default("pending"),
  cost: z.coerce.number().min(0).optional(),
  taskIds: z.array(z.coerce.number()).optional(),
});

type MaterialFormValues = z.infer<typeof materialFormSchema>;

interface CreateMaterialDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId?: number;
  preselectedTaskId?: number;
  initialTier1?: string;
  initialTier2?: string;
  initialMaterial?: any;
}

// Section header component
function SectionHeader({ number, title }: { number: number; title: string }) {
  return (
    <div className="flex items-center gap-3 py-2 border-b-2 border-[#d2b48c] mb-4">
      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#8b4513] text-white text-sm font-semibold">
        {number}
      </span>
      <h3 className="text-sm font-semibold text-[#8b4513] uppercase tracking-wide">
        {title}
      </h3>
    </div>
  );
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
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(
    preselectedTaskId || null
  );
  const [contextOpen, setContextOpen] = useState(false);
  const [contextData, setContextData] = useState<ContextData | null>(null);

  // Query for projects
  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  // Initialize form
  const form = useForm<MaterialFormValues>({
    resolver: zodResolver(materialFormSchema),
    defaultValues: {
      name: "",
      projectId: projectId || undefined,
      section: "",
      subsection: "",
      tier1Category: initialTier1 || "",
      tier2Category: initialTier2 || "",
      type: "",
      category: "",
      details: "",
      supplier: "",
      quantity: 1,
      unit: "pieces",
      status: "pending",
      cost: 0,
      taskIds: [],
    },
  });

  const currentProjectId = form.watch("projectId") || projectId;
  const selectedTier1 = form.watch("tier1Category");
  const selectedMaterialType = form.watch("type");

  // Query for tasks related to the selected project
  const { data: tasks = [] } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
    select: (allTasks) => {
      if (!currentProjectId) return allTasks;
      return allTasks.filter((task) => task.projectId === currentProjectId);
    },
  });

  // Update projectId when it changes from props
  useEffect(() => {
    if (projectId) {
      form.setValue("projectId", projectId);
    }
  }, [projectId, form]);

  // Handle initial tier values
  useEffect(() => {
    if (open && initialTier1) {
      form.setValue("tier1Category", initialTier1);
    }
    if (open && initialTier2) {
      form.setValue("tier2Category", initialTier2);
    }
  }, [open, initialTier1, initialTier2, form]);

  // Handle preselected task
  useEffect(() => {
    if (open && preselectedTaskId) {
      setSelectedTaskId(preselectedTaskId);
      form.setValue("taskIds", [preselectedTaskId]);
    }
  }, [open, preselectedTaskId, form]);

  // Handle initial material for duplication
  useEffect(() => {
    if (open && initialMaterial) {
      form.reset({
        name: initialMaterial.name || "",
        projectId: initialMaterial.projectId || projectId || undefined,
        section: initialMaterial.section || "",
        subsection: initialMaterial.subsection || "",
        tier1Category: initialMaterial.tier1Category || initialMaterial.tier || "",
        tier2Category: initialMaterial.tier2Category || "",
        type: initialMaterial.type || "",
        category: initialMaterial.category || "",
        details: initialMaterial.details || "",
        supplier: initialMaterial.supplier || "",
        quantity: initialMaterial.quantity || 1,
        unit: initialMaterial.unit || "pieces",
        status: initialMaterial.status || "pending",
        cost: initialMaterial.cost || 0,
        taskIds: initialMaterial.taskIds || [],
      });

      if (initialMaterial.taskIds?.length > 0) {
        setSelectedTaskId(initialMaterial.taskIds[0]);
      }
    } else if (open && !initialMaterial) {
      form.reset({
        name: "",
        projectId: projectId || undefined,
        section: "",
        subsection: "",
        tier1Category: initialTier1 || "",
        tier2Category: initialTier2 || "",
        type: "",
        category: "",
        details: "",
        supplier: "",
        quantity: 1,
        unit: "pieces",
        status: "pending",
        cost: 0,
        taskIds: [],
      });
      setSelectedTaskId(preselectedTaskId || null);
    }
  }, [open, initialMaterial, form, projectId, preselectedTaskId, initialTier1, initialTier2]);

  const createMaterial = useMutation({
    mutationFn: async (data: MaterialFormValues) => {
      return apiRequest("/api/materials", "POST", data);
    },
    onSuccess: () => {
      toast({
        title: "Material added",
        description: "Your material has been added successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/materials"] });
      if (currentProjectId) {
        queryClient.invalidateQueries({
          queryKey: ["/api/projects", currentProjectId, "materials"],
        });
      }
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      form.reset();
      setSelectedTaskId(null);
      onOpenChange(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add material. Please try again.",
        variant: "destructive",
      });
    },
  });

  function onSubmit(data: MaterialFormValues) {
    const submissionData = {
      ...data,
      taskIds: selectedTaskId ? [selectedTaskId] : [],
      tier: data.tier1Category, // For backwards compatibility
    };
    createMaterial.mutate(submissionData);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle>Add Material</DialogTitle>
            <Button
              variant="ghost"
              className="h-8 w-8 p-0 rounded-full"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <DialogDescription>
            Add a new material to your inventory
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 overflow-y-auto pr-2">

            {/* 1) Context */}
            <div>
              <SectionHeader number={1} title="Context" />

              <FormField
                control={form.control}
                name="projectId"
                render={({ field }) => (
                  <FormItem className="mb-3">
                    <FormLabel>Project</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      value={field.value?.toString()}
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

              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="section"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Section</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Subfloor" {...field} value={field.value || ""} />
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
                        <Input placeholder="e.g., Subfloor Walls" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* 2) Task / Work Classification */}
            <div>
              <SectionHeader number={2} title="Task / Work Classification" />

              <div className="grid grid-cols-2 gap-3 mb-3">
                <FormField
                  control={form.control}
                  name="tier1Category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Primary Task Type</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value);
                          form.setValue("tier2Category", ""); // Reset tier2 when tier1 changes
                        }}
                        value={field.value || ""}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          {tier1Categories.map((tier) => (
                            <SelectItem key={tier} value={tier}>{tier}</SelectItem>
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
                        disabled={!selectedTier1}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select subtype" />
                        </SelectTrigger>
                        <SelectContent>
                          {(tier2ByTier1[selectedTier1 || ""] || []).map((tier) => (
                            <SelectItem key={tier} value={tier}>{tier}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Task Selection */}
              {tasks.length > 0 && (
                <FormItem>
                  <FormLabel>Link to Task</FormLabel>
                  <Select
                    value={selectedTaskId?.toString() || "none"}
                    onValueChange={(value) => {
                      const taskId = value === "none" ? null : parseInt(value);
                      setSelectedTaskId(taskId);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a task (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No task</SelectItem>
                      {tasks.map((task) => (
                        <SelectItem key={task.id} value={task.id.toString()}>
                          {task.title}
                          {task.tier1Category && ` (${task.tier1Category})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            </div>

            {/* 3) Material Details */}
            <div>
              <SectionHeader number={3} title="Material Details" />

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="mb-3">
                    <FormLabel>Material Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter material name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-3 mb-3">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Material Type</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value);
                          form.setValue("category", ""); // Reset category when type changes
                        }}
                        value={field.value || ""}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.keys(materialTypeCategories).map((type) => (
                            <SelectItem key={type} value={type}>{type}</SelectItem>
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
                      <FormLabel>Material Sub Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || ""}
                        disabled={!selectedMaterialType}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select subtype" />
                        </SelectTrigger>
                        <SelectContent>
                          {(materialTypeCategories[selectedMaterialType || ""] || []).map((cat) => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
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
                name="details"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Additional Details</FormLabel>
                    <FormControl>
                      <textarea
                        className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder="Notes about this material..."
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
                      entityId="new-material"
                      entityType="material"
                      initialContext={contextData}
                      onChange={setContextData}
                      compact
                    />
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>

            {/* 4) Supplier / Sourcing */}
            <div>
              <SectionHeader number={4} title="Supplier / Sourcing" />

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

            {/* 5) Inventory & Status */}
            <div>
              <SectionHeader number={5} title="Inventory & Status" />

              <div className="grid grid-cols-3 gap-3">
                <FormField
                  control={form.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantity</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          placeholder="1"
                          {...field}
                          onChange={(e) => {
                            const value = parseInt(e.target.value);
                            field.onChange(isNaN(value) ? 0 : value);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="unit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unit</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Unit" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pieces">Pieces</SelectItem>
                          <SelectItem value="sq ft">Sq Feet</SelectItem>
                          <SelectItem value="feet">Feet</SelectItem>
                          <SelectItem value="yards">Yards</SelectItem>
                          <SelectItem value="gallons">Gallons</SelectItem>
                          <SelectItem value="pounds">Pounds</SelectItem>
                          <SelectItem value="bags">Bags</SelectItem>
                          <SelectItem value="boxes">Boxes</SelectItem>
                          <SelectItem value="rolls">Rolls</SelectItem>
                          <SelectItem value="sheets">Sheets</SelectItem>
                        </SelectContent>
                      </Select>
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
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="ordered">Ordered</SelectItem>
                          <SelectItem value="delivered">Delivered</SelectItem>
                          <SelectItem value="installed">Installed</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* 6) Costing */}
            <div>
              <SectionHeader number={6} title="Costing" />

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
                        placeholder="0.00"
                        {...field}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value);
                          field.onChange(isNaN(value) ? 0 : value);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Submit Button */}
            <div className="flex justify-end pt-4 border-t border-[#d2b48c]/30">
              <Button
                type="submit"
                className="bg-[#8b4513] hover:bg-[#6b3410] text-white"
                disabled={createMaterial.isPending}
              >
                {createMaterial.isPending ? "Adding..." : "Add Material"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
