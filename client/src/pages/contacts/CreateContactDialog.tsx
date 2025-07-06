import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X } from "lucide-react";

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
}

export function CreateContactDialog({
  open,
  onOpenChange,
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
  
  // Fetch all tier1 categories from the database
  const { data: allTier1Categories = [] } = useQuery({
    queryKey: ["/api/admin/template-categories"],
    select: (data: any[]) => data.filter(cat => cat.type === 'tier1')
  });
  
  // Fetch all tier2 categories from the database
  const { data: allTier2Categories = [] } = useQuery({
    queryKey: ["/api/admin/template-categories"],
    select: (data: any[]) => data.filter(cat => cat.type === 'tier2')
  });
  
  // Get tier2 categories for the selected tier1 category
  const getAvailableTier2Categories = (tier1Name: string) => {
    const tier1Cat = allTier1Categories.find(cat => cat.name.toLowerCase() === tier1Name.toLowerCase());
    if (!tier1Cat) return [];
    
    return allTier2Categories.filter(cat => cat.parentId === tier1Cat.id);
  };

  // Handle form submission
  const createContact = useMutation({
    mutationFn: async (data: ContactFormValues) => {
      return apiRequest("/api/contacts", "POST", data);
    },
    onSuccess: () => {
      toast({
        title: "Contact created",
        description: "Contact has been added successfully",
      });
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      form.reset();
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

  // Generate initials from name
  function getInitials(name: string) {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  }

  // Update initials when name changes
  function updateInitials(name: string) {
    const initials = getInitials(name);
    return initials;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95%] sm:max-w-[550px] mx-auto rounded-lg">
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
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs sm:text-sm">Name</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter name" 
                        className="h-9 sm:h-10 text-sm"
                        {...field} 
                        onChange={(e) => {
                          field.onChange(e);
                          updateInitials(e.target.value);
                        }}
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
                    <FormLabel className="text-xs sm:text-sm">Role</FormLabel>
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              <FormField
                control={form.control}
                name="company"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs sm:text-sm">Company (Optional)</FormLabel>
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
                    <FormLabel className="text-xs sm:text-sm">Contact Type</FormLabel>
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

            {/* Specialty Category Section */}
            <div className="border p-3 sm:p-4 rounded-lg bg-slate-50 space-y-3 sm:space-y-4">
              <h3 className="font-medium text-xs sm:text-sm">Contact Specialty</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                <FormField
                  control={form.control}
                  name="tier1Category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs sm:text-sm">Category</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value);
                          setTier1Category(value);
                          // Clear the tier2 selection when tier1 changes
                          form.setValue("tier2Category", "");
                        }}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="h-9 sm:h-10 text-sm">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {allTier1Categories.map((category) => (
                            <SelectItem key={category.id} value={category.name.toLowerCase()}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={!tier1Category}
                      >
                        <FormControl>
                          <SelectTrigger className="h-9 sm:h-10 text-sm">
                            <SelectValue placeholder={!tier1Category ? "Select category first" : "Select subcategory"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {tier1Category && getAvailableTier2Categories(tier1Category).map((category) => (
                            <SelectItem key={category.id} value={category.name.toLowerCase()}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Categorizing contacts helps assign them to relevant tasks
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs sm:text-sm">Phone (Optional)</FormLabel>
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
                    <FormLabel className="text-xs sm:text-sm">Email (Optional)</FormLabel>
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

            <DialogFooter className="mt-6">
              <Button 
                type="submit" 
                disabled={createContact.isPending}
                className="bg-orange-500 hover:bg-orange-600 text-white w-full md:w-auto h-11 sm:h-10"
              >
                {createContact.isPending ? "Adding..." : "Add Contact"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}