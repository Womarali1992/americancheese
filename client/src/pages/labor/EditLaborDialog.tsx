import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { X, ChevronRight, ChevronLeft } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest } from "@/lib/queryClient";

// Labor form schema based on the insertLaborSchema in shared/schema.ts
const laborFormSchema = z.object({
  fullName: z.string().min(1, { message: "Name is required" }),
  tier1Category: z.string().min(1, { message: "Primary category is required" }),
  tier2Category: z.string().min(1, { message: "Secondary category is required" }),
  company: z.string().default(""),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  projectId: z.number(),
  taskId: z.number().optional().nullable(),
  contactId: z.number().optional().nullable(),
  workDate: z.string(),
  taskDescription: z.string().optional().nullable(),
  areaOfWork: z.string().optional().nullable(),
  startDate: z.string(),
  endDate: z.string(),
  startTime: z.string().optional().nullable(),
  endTime: z.string().optional().nullable(),
  totalHours: z.number().optional().nullable(),
  unitsCompleted: z.string().optional().nullable(),
  materialIds: z.array(z.number()).optional().default([]),
  status: z.string(),
});

// Form values type
type LaborFormValues = z.infer<typeof laborFormSchema>;

// Create mapping of tier2 categories by tier1 category
const tier2CategoriesByTier1: Record<string, string[]> = {
  "Structural": ["Foundation", "Framing", "Concrete", "Steel", "Roofing"],
  "Systems": ["Electrical", "Plumbing", "HVAC", "Communications"],
  "Sheathing": ["Walls", "Ceilings", "Windows", "Doors"],
  "Finishings": ["Drywall", "Flooring", "Painting", "Trim", "Cabinetry"]
};

interface EditLaborDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  laborId: number;
  onSuccess?: () => void;
}

export function EditLaborDialog({
  open,
  onOpenChange,
  laborId,
  onSuccess,
}: EditLaborDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("worker-info");
  const [isLoading, setIsLoading] = useState(false);
  const [laborData, setLaborData] = useState<any>(null);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  
  // Initialize form
  const form = useForm<LaborFormValues>({
    resolver: zodResolver(laborFormSchema),
    defaultValues: {
      fullName: "",
      tier1Category: "Structural",
      tier2Category: "Framing",
      company: "",
      phone: "",
      email: "",
      projectId: 0,
      taskId: null,
      contactId: null,
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

  // Fetch labor data when dialog opens
  useEffect(() => {
    if (open && laborId) {
      setIsLoading(true);
      setLoadingError(null);
      
      apiRequest(`/api/labor/${laborId}`)
        .then((response) => {
          // Convert response to json
          return response.json();
        })
        .then((data) => {
          setLaborData(data);
          
          // Format dates properly for form input
          const formattedData = {
            ...data,
            workDate: data.workDate?.split('T')[0] || new Date().toISOString().split('T')[0],
            startDate: data.startDate?.split('T')[0] || new Date().toISOString().split('T')[0],
            endDate: data.endDate?.split('T')[0] || new Date().toISOString().split('T')[0],
            materialIds: data.materialIds || [],
          };
          
          // Reset form with the labor data
          form.reset(formattedData);
        })
        .catch(error => {
          console.error("Error fetching labor data:", error);
          setLoadingError("Failed to load labor record. Please try again.");
          toast({
            title: "Error",
            description: "Failed to load labor data. Please try again.",
            variant: "destructive",
          });
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [open, laborId, form]);

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

  // Handle form submission
  const onSubmit = async (data: LaborFormValues) => {
    try {
      // Update the labor record
      const response = await fetch(`/api/labor/${laborId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(data),
      });

      // Show success message
      toast({
        title: "Labor record updated",
        description: "Labor record has been successfully updated.",
      });

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/labor"] });
      queryClient.invalidateQueries({ queryKey: [`/api/labor/${laborId}`] });
      
      if (data.contactId) {
        queryClient.invalidateQueries({ queryKey: [`/api/contacts/${data.contactId}/labor`] });
      }
      
      if (data.projectId) {
        queryClient.invalidateQueries({ queryKey: [`/api/projects/${data.projectId}/labor`] });
      }

      // Close the dialog
      onOpenChange(false);
      
      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error updating labor record:", error);
      toast({
        title: "Error",
        description: "Failed to update labor record. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Calculate total hours when start/end time changes
  const calculateTotalHours = () => {
    const startTime = form.getValues().startTime;
    const endTime = form.getValues().endTime;
    
    if (startTime && endTime) {
      const [startHour, startMinute] = startTime.split(":").map(Number);
      const [endHour, endMinute] = endTime.split(":").map(Number);
      
      let totalHours = endHour - startHour;
      let totalMinutes = endMinute - startMinute;
      
      if (totalMinutes < 0) {
        totalHours -= 1;
        totalMinutes += 60;
      }
      
      const decimalHours = totalHours + (totalMinutes / 60);
      form.setValue("totalHours", parseFloat(decimalHours.toFixed(2)));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle>Edit Labor Record</DialogTitle>
            <Button
              variant="ghost"
              className="h-8 w-8 p-0 rounded-full"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <DialogDescription id="edit-labor-description">
            Update information for this labor record.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
          </div>
        ) : loadingError ? (
          <div className="text-center py-6">
            <p className="text-red-500 mb-4">{loadingError}</p>
            <Button onClick={() => onOpenChange(false)}>Close</Button>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 overflow-auto flex-1 pr-2">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="worker-info">Worker Info</TabsTrigger>
                  <TabsTrigger value="work-details">Work Details</TabsTrigger>
                  <TabsTrigger value="time-tracking">Time Tracking</TabsTrigger>
                </TabsList>
                
                {/* Worker Info Tab */}
                <TabsContent value="worker-info" className="space-y-4 mt-4">
                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Worker Name</FormLabel>
                        <FormControl>
                          <Input placeholder="John Smith" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="tier1Category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Primary Category</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {Object.keys(tier2CategoriesByTier1).map((tier1) => (
                                <SelectItem key={tier1} value={tier1}>{tier1}</SelectItem>
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
                          <FormLabel>Specialty/Trade</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select specialty" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {tier2CategoriesByTier1[form.watch("tier1Category")]?.map((tier2) => (
                                <SelectItem key={tier2} value={tier2}>{tier2}</SelectItem>
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
                    name="company"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company</FormLabel>
                        <FormControl>
                          <Input placeholder="ABC Construction" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone</FormLabel>
                          <FormControl>
                            <Input placeholder="555-123-4567" {...field} value={field.value || ""} />
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
                            <Input placeholder="worker@example.com" {...field} value={field.value || ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          value={field.value}
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
                            <SelectItem value="billed">Billed</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex justify-end space-x-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => onOpenChange(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      onClick={() => setActiveTab("work-details")}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Next <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </div>
                </TabsContent>
                
                {/* Work Details Tab */}
                <TabsContent value="work-details" className="space-y-4 mt-4">
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
                          <Input placeholder="Main floor, East wall" {...field} value={field.value || ""} />
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
                            placeholder="Description of work performed"
                            className="resize-none min-h-[100px]"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex justify-between space-x-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setActiveTab("worker-info")}
                    >
                      <ChevronLeft className="mr-1 h-4 w-4" /> Previous
                    </Button>
                    <Button
                      type="button"
                      onClick={() => setActiveTab("time-tracking")}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Next <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </div>
                </TabsContent>
                
                {/* Time Tracking Tab */}
                <TabsContent value="time-tracking" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
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
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="startTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Start Time</FormLabel>
                          <FormControl>
                            <Input 
                              type="time" 
                              {...field} 
                              value={field.value || ""}
                              onChange={(e) => {
                                field.onChange(e);
                                calculateTotalHours();
                              }}
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
                          <FormLabel>End Time</FormLabel>
                          <FormControl>
                            <Input 
                              type="time" 
                              {...field} 
                              value={field.value || ""}
                              onChange={(e) => {
                                field.onChange(e);
                                calculateTotalHours();
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="totalHours"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Total Hours</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.25" 
                              {...field} 
                              value={field.value?.toString() || ""}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || null)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="unitsCompleted"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Units Completed</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="e.g., 150 linear ft" 
                              {...field} 
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="flex justify-between space-x-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setActiveTab("work-details")}
                    >
                      <ChevronLeft className="mr-1 h-4 w-4" /> Previous
                    </Button>
                    <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                      Update Labor Record
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}