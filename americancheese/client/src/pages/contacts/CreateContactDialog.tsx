import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, Plus } from "lucide-react";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

// Form validation schema
const contactFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  role: z.string().min(2, "Role must be at least 2 characters"),
  type: z.string().min(2, "Type is required"),
  company: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  tier1Category: z.string().optional(),
  tier2Category: z.string().optional(),
});

type ContactFormValues = z.infer<typeof contactFormSchema>;

interface CreateContactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId?: number;
  onContactCreated?: (contactId: number) => void;
}

// Section header component
function SectionHeader({ number, title }: { number: number; title: string }) {
  return (
    <div className="flex items-center gap-3 py-2 border-b-2 border-slate-200 mb-4">
      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-600 text-white text-sm font-semibold">
        {number}
      </span>
      <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
        {title}
      </h3>
    </div>
  );
}

export function CreateContactDialog({
  open,
  onOpenChange,
  projectId,
  onContactCreated,
}: CreateContactDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Set up form
  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: "",
      role: "",
      type: "contractor",
      company: "",
      phone: "",
      email: "",
      tier1Category: "",
      tier2Category: "",
    },
  });

  // Tier filtering state
  const [tier1Category, setTier1Category] = useState<string | null>(null);

  // Custom category input states
  const [isCustomTier1, setIsCustomTier1] = useState(false);
  const [isCustomTier2, setIsCustomTier2] = useState(false);
  const [customTier1Value, setCustomTier1Value] = useState("");
  const [customTier2Value, setCustomTier2Value] = useState("");

  // Fetch project-specific categories from the database
  const { data: projectCategories = [] } = useQuery({
    queryKey: ["/api/projects", projectId, "template-categories"],
    enabled: !!projectId,
  });

  // If no projectId is provided, fall back to first project's categories or global categories
  const { data: projects = [] } = useQuery({
    queryKey: ["/api/projects"],
    enabled: !projectId,
  });

  const { data: fallbackCategories = [] } = useQuery({
    queryKey: ["/api/projects", projects[0]?.id, "template-categories"],
    enabled: !projectId && projects.length > 0,
  });

  // Use project categories if available, otherwise use fallback categories
  const availableCategories = projectId ? projectCategories : fallbackCategories;

  // Filter tier1 and tier2 categories
  const allTier1Categories = availableCategories.filter((cat: any) => cat.type === 'tier1');
  const allTier2Categories = availableCategories.filter((cat: any) => cat.type === 'tier2');

  // Get tier2 categories for the selected tier1 category
  const getAvailableTier2Categories = (tier1Name: string) => {
    const tier1Cat = allTier1Categories.find((cat: any) => cat.name.toLowerCase() === tier1Name.toLowerCase());
    if (!tier1Cat) return [];

    return allTier2Categories.filter((cat: any) => cat.parentId === tier1Cat.id);
  };

  // Handle form submission
  const createContact = useMutation({
    mutationFn: async (data: ContactFormValues) => {
      return apiRequest("/api/contacts", "POST", data);
    },
    onSuccess: (data: any) => {
      toast({
        title: "Contact created",
        description: "Contact has been added successfully",
      });
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      form.reset();
      // Reset custom category states
      setIsCustomTier1(false);
      setIsCustomTier2(false);
      setCustomTier1Value("");
      setCustomTier2Value("");
      setTier1Category(null);
      // Call the callback with the new contact ID if provided
      if (onContactCreated && data?.id) {
        onContactCreated(data.id);
      }
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create contact. Please try again.",
        variant: "destructive",
      });
      console.error("Failed to create contact:", error);
    },
  });

  async function onSubmit(data: ContactFormValues) {
    createContact.mutate(data);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95%] sm:max-w-[550px] max-h-[90vh] overflow-hidden flex flex-col mx-auto rounded-lg">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle className="text-base sm:text-lg">Add Contact</DialogTitle>
            <Button
              variant="ghost"
              className="h-8 w-8 p-0 rounded-full"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <DialogDescription className="text-xs sm:text-sm">Add a new contractor or supplier to your contacts</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 overflow-y-auto pr-2">

            {/* 1) Basic Information */}
            <div>
              <SectionHeader number={1} title="Basic Information" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs sm:text-sm">Name *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter name"
                          className="h-9 sm:h-10 text-sm"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs sm:text-sm">Role *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. General Contractor"
                          className="h-9 sm:h-10 text-sm"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* 2) Company & Type */}
            <div>
              <SectionHeader number={2} title="Company & Type" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="company"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs sm:text-sm">Company</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Company name"
                          className="h-9 sm:h-10 text-sm"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs sm:text-sm">Contact Type *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="h-9 sm:h-10 text-sm">
                            <SelectValue placeholder="Select contact type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="contractor">Contractor</SelectItem>
                          <SelectItem value="supplier">Supplier</SelectItem>
                          <SelectItem value="architect">Architect</SelectItem>
                          <SelectItem value="engineer">Engineer</SelectItem>
                          <SelectItem value="inspector">Inspector</SelectItem>
                          <SelectItem value="client">Client</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* 3) Specialty */}
            <div>
              <SectionHeader number={3} title="Specialty" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-2">
                <FormField
                  control={form.control}
                  name="tier1Category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs sm:text-sm">Category</FormLabel>
                      {isCustomTier1 ? (
                        <div className="flex gap-2">
                          <FormControl>
                            <Input
                              placeholder="Enter custom category"
                              className="h-9 sm:h-10 text-sm flex-1"
                              value={customTier1Value}
                              onChange={(e) => {
                                setCustomTier1Value(e.target.value);
                                field.onChange(e.target.value.toLowerCase());
                                setTier1Category(e.target.value.toLowerCase());
                                // Clear tier2 when tier1 changes
                                form.setValue("tier2Category", "");
                                setIsCustomTier2(false);
                                setCustomTier2Value("");
                              }}
                            />
                          </FormControl>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-9 sm:h-10 px-2"
                            onClick={() => {
                              setIsCustomTier1(false);
                              setCustomTier1Value("");
                              field.onChange("");
                              setTier1Category(null);
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <Select
                          onValueChange={(value) => {
                            if (value === "__custom__") {
                              setIsCustomTier1(true);
                              field.onChange("");
                            } else {
                              field.onChange(value);
                              setTier1Category(value);
                              // Clear the tier2 selection when tier1 changes
                              form.setValue("tier2Category", "");
                              setIsCustomTier2(false);
                              setCustomTier2Value("");
                            }
                          }}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="h-9 sm:h-10 text-sm">
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {allTier1Categories.map((category: any) => (
                              <SelectItem key={category.id} value={category.name.toLowerCase()}>
                                {category.name}
                              </SelectItem>
                            ))}
                            <SelectItem value="__custom__" className="text-slate-600">
                              <div className="flex items-center gap-2">
                                <Plus className="h-4 w-4" />
                                Add custom category...
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tier2Category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs sm:text-sm">Subcategory</FormLabel>
                      {isCustomTier2 ? (
                        <div className="flex gap-2">
                          <FormControl>
                            <Input
                              placeholder="Enter custom subcategory"
                              className="h-9 sm:h-10 text-sm flex-1"
                              value={customTier2Value}
                              onChange={(e) => {
                                setCustomTier2Value(e.target.value);
                                field.onChange(e.target.value.toLowerCase());
                              }}
                            />
                          </FormControl>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-9 sm:h-10 px-2"
                            onClick={() => {
                              setIsCustomTier2(false);
                              setCustomTier2Value("");
                              field.onChange("");
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <Select
                          onValueChange={(value) => {
                            if (value === "__custom__") {
                              setIsCustomTier2(true);
                              field.onChange("");
                            } else {
                              field.onChange(value);
                            }
                          }}
                          value={field.value}
                          disabled={!tier1Category && !isCustomTier1}
                        >
                          <FormControl>
                            <SelectTrigger className="h-9 sm:h-10 text-sm">
                              <SelectValue placeholder={!tier1Category && !isCustomTier1 ? "Select category first" : "Select subcategory"} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {tier1Category && !isCustomTier1 && getAvailableTier2Categories(tier1Category).map((category: any) => (
                              <SelectItem key={category.id} value={category.name.toLowerCase()}>
                                {category.name}
                              </SelectItem>
                            ))}
                            <SelectItem value="__custom__" className="text-slate-600">
                              <div className="flex items-center gap-2">
                                <Plus className="h-4 w-4" />
                                Add custom subcategory...
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Categorizing contacts helps assign them to relevant tasks
              </p>
            </div>

            {/* 4) Contact Info */}
            <div>
              <SectionHeader number={4} title="Contact Info" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs sm:text-sm">Phone</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Phone number"
                          className="h-9 sm:h-10 text-sm"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs sm:text-sm">Email</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Email address"
                          className="h-9 sm:h-10 text-sm"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end pt-4 border-t border-slate-100">
              <Button
                type="submit"
                disabled={createContact.isPending}
                className="bg-slate-600 hover:bg-slate-700 text-white w-full md:w-auto h-11 sm:h-10"
              >
                {createContact.isPending ? "Adding..." : "Add Contact"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
