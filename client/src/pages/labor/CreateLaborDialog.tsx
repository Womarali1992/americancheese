import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { X, Check } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";

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
  workDate: z.string().min(2, { message: "Work date is required" }),
  taskDescription: z.string().optional(),
  areaOfWork: z.string().optional(),
  startDate: z.string().min(2, { message: "Start date is required" }),
  endDate: z.string().min(2, { message: "End date is required" }),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  totalHours: z.union([z.string().optional(), z.coerce.number().min(0)]),
  unitsCompleted: z.string().optional(),
  materialIds: z.array(z.coerce.number()).optional(),
  status: z.string().default("pending"),
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
      workDate: new Date().toISOString().split('T')[0],
      taskDescription: "",
      areaOfWork: "",
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      startTime: "08:00",
      endTime: "17:00",
      totalHours: 8,
      unitsCompleted: "",
      materialIds: [],
      status: "pending",
    },
  });

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
  
  // Query for contacts
  const { data: contacts = [] } = useQuery<Contact[]>({
    queryKey: ["/api/contacts"],
  });
  
  // Query for materials related to the selected project
  const { data: materials = [] } = useQuery<Material[]>({
    queryKey: ["/api/materials"],
    select: (materials) => {
      if (!form.getValues().projectId) return materials;
      return materials.filter(material => material.projectId === form.getValues().projectId);
    },
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

  // Update tier2Category options when tier1Category changes
  useEffect(() => {
    const tier1 = form.getValues().tier1Category;
    if (tier1 && tier2CategoriesByTier1[tier1]) {
      // If current tier2 is not in the new list, set it to the first option
      const tier2 = form.getValues().tier2Category;
      if (tier2 && !tier2CategoriesByTier1[tier1].map(t => t.toLowerCase()).includes(tier2.toLowerCase())) {
        form.setValue("tier2Category", tier2CategoriesByTier1[tier1][0]);
      }
    }
  }, [form.watch("tier1Category")]);

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
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="taskId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Associated Task</FormLabel>
                              <Select
                                onValueChange={(value) => field.onChange(value ? parseInt(value) : null)}
                                defaultValue={field.value?.toString()}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select task (optional)" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="">None</SelectItem>
                                  {tasks.map((task) => (
                                    <SelectItem key={task.id} value={task.id.toString()}>
                                      {task.title}
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
                          name="contactId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Associated Contact</FormLabel>
                              <Select
                                onValueChange={(value) => field.onChange(value ? parseInt(value) : null)}
                                defaultValue={field.value?.toString()}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select contact (optional)" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="">None</SelectItem>
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
                      <FormField
                        control={form.control}
                        name="workDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Work Date</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
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
                            <FormLabel>Task Description</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Describe the work performed" 
                                className="min-h-[100px]" 
                                {...field} 
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