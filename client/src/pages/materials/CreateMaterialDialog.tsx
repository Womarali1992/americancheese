import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Wordbank } from "@/components/ui/wordbank";
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
}

export function CreateMaterialDialog({
  open,
  onOpenChange,
  projectId,
}: CreateMaterialDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTasks, setSelectedTasks] = useState<number[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<number[]>([]);
  
  // State for hierarchical task selection
  const [selectedTier1, setSelectedTier1] = useState<string | null>(null);
  const [selectedTier2, setSelectedTier2] = useState<string | null>(null);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);

  // Query for projects to populate the project selector
  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });
  
  // Query for tasks related to the selected project
  const { data: tasks = [] } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
    select: (tasks) => {
      if (!form.getValues().projectId) return tasks;
      return tasks.filter(task => task.projectId === form.getValues().projectId);
    },
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
  
  // Predefined tier1 categories
  const predefinedTier1Categories = [
    'structural',
    'systems',
    'sheathing',
    'finishings'
  ];
  
  // Predefined tier2 categories for each tier1 category
  const predefinedTier2Categories: Record<string, string[]> = {
    'structural': ['foundation', 'framing', 'roofing'],
    'systems': ['electric', 'plumbing', 'hvac'],
    'sheathing': ['barriers', 'drywall', 'exteriors'],
    'finishings': ['windows', 'doors', 'cabinets', 'fixtures', 'flooring'],
    'Uncategorized': ['permits', 'other']
  };

  const form = useForm<MaterialFormValues>({
    resolver: zodResolver(materialFormSchema),
    defaultValues: {
      name: "",
      type: "",
      category: "other",
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
  
  // Update projectId when it changes from props
  useEffect(() => {
    if (projectId) {
      form.setValue("projectId", projectId);
    }
  }, [projectId, form]);
  
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
            
            {/* Task Category Hierarchy Selection */}
            <div className="space-y-4 border p-4 rounded-lg bg-slate-50">
              <h3 className="font-medium">Task Selection</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Tier 1 Category Selection */}
                <div>
                  <FormLabel>Tier 1 Category</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      setSelectedTier1(value);
                      setSelectedTier2(null);
                      setFilteredTasks([]);
                    }}
                    value={selectedTier1 || ""}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {predefinedTier1Categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category.charAt(0).toUpperCase() + category.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Tier 2 Category Selection */}
                <div>
                  <FormLabel>Tier 2 Category</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      setSelectedTier2(value);
                      // Get project ID from the form
                      const projectId = form.getValues().projectId;
                      
                      // Filter tasks based on selected tier1 and tier2, including template tasks
                      const filtered = getMergedTasks(
                        tasks,
                        templates,
                        selectedTier1,
                        value
                      );
                      setFilteredTasks(filtered);
                    }}
                    value={selectedTier2 || ""}
                    disabled={!selectedTier1}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={!selectedTier1 ? "Select Tier 1 first" : "Select subcategory"} />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedTier1 && predefinedTier2Categories[selectedTier1]?.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category.charAt(0).toUpperCase() + category.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Task Selection */}
                <div>
                  <FormLabel>Task</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      const taskId = parseInt(value);
                      if (!selectedTasks.includes(taskId)) {
                        setSelectedTasks([...selectedTasks, taskId]);
                      }
                    }}
                    value=""
                    disabled={!selectedTier2 || filteredTasks.length === 0}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={!selectedTier2 ? "Select Tier 2 first" : (filteredTasks.length === 0 ? "No tasks available" : "Select task")} />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredTasks.map((task) => (
                        <SelectItem key={task.id} value={task.id.toString()}>
                          {task.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

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
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Material Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
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
            </div>

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
                name="supplier"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Supplier (optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter supplier name"
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
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
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
                        <SelectItem value="wood">Wood</SelectItem>
                        <SelectItem value="concrete">Concrete</SelectItem>
                        <SelectItem value="electrical">Electrical</SelectItem>
                        <SelectItem value="plumbing">Plumbing</SelectItem>
                        <SelectItem value="glass">Glass</SelectItem>
                        <SelectItem value="metal">Metal</SelectItem>
                        <SelectItem value="finishing">Finishing</SelectItem>
                        <SelectItem value="tools">Tools</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
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

            <div className="space-y-2">
              <FormLabel>Associated Tasks</FormLabel>
              <Wordbank
                items={
                  // Include both active tasks and filtered template tasks for the wordbank
                  [...tasks, ...filteredTasks.filter(task => isTemplateTask(task) && !tasks.some(t => t.id === task.id))]
                  .map(task => ({
                    id: task.id,
                    label: task.title,
                    color: task.category,
                    subtext: isTemplateTask(task) ? "Template" : task.status
                  }))
                }
                selectedItems={selectedTasks}
                onItemSelect={(id) => setSelectedTasks([...selectedTasks, id])}
                onItemRemove={(id) => setSelectedTasks(selectedTasks.filter(taskId => taskId !== id))}
                emptyText="No tasks selected"
                className="min-h-[60px]"
              />
              <p className="text-xs text-muted-foreground">Select tasks that will use this material</p>
            </div>

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
                onItemSelect={(id) => setSelectedContacts([...selectedContacts, id])}
                onItemRemove={(id) => setSelectedContacts(selectedContacts.filter(contactId => contactId !== id))}
                emptyText="No contractors selected"
                className="min-h-[60px]"
              />
              <p className="text-xs text-muted-foreground">Select contractors responsible for this material</p>
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