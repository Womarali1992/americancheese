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
  
  // Predefined tier1 categories
  const predefinedTier1Categories = [
    {value: 'structural', label: 'Structural'},
    {value: 'systems', label: 'Systems'},
    {value: 'sheathing', label: 'Sheathing'},
    {value: 'finishings', label: 'Finishings'},
    {value: 'other', label: 'Other'}
  ];
  
  // Predefined tier2 categories for each tier1 category
  const predefinedTier2Categories: Record<string, {value: string, label: string}[]> = {
    'structural': [
      {value: 'foundation', label: 'Foundation'},
      {value: 'framing', label: 'Framing'},
      {value: 'roofing', label: 'Roofing'},
      {value: 'other', label: 'Other Structural'}
    ],
    'systems': [
      {value: 'electric', label: 'Electrical'},
      {value: 'plumbing', label: 'Plumbing'},
      {value: 'hvac', label: 'HVAC'},
      {value: 'other', label: 'Other Systems'}
    ],
    'sheathing': [
      {value: 'barriers', label: 'Barriers'},
      {value: 'drywall', label: 'Drywall'},
      {value: 'exteriors', label: 'Exteriors'},
      {value: 'other', label: 'Other Sheathing'}
    ],
    'finishings': [
      {value: 'windows', label: 'Windows'},
      {value: 'doors', label: 'Doors'},
      {value: 'cabinets', label: 'Cabinets'},
      {value: 'fixtures', label: 'Fixtures'},
      {value: 'flooring', label: 'Flooring'},
      {value: 'other', label: 'Other Finishings'}
    ],
    'other': [
      {value: 'permits', label: 'Permits'},
      {value: 'other', label: 'Other'}
    ]
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
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle>Add New Contact</DialogTitle>
            <Button
              variant="ghost"
              className="h-8 w-8 p-0 rounded-full"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <DialogDescription>Add a new contractor or supplier to your contacts</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter name" 
                        {...field} 
                        onChange={(e) => {
                          field.onChange(e);
                          updateInitials(e.target.value);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. General Contractor" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="company"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Company name" {...field} />
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
                    <FormLabel>Contact Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
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
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Specialty Category Section */}
            <div className="border p-4 rounded-lg bg-slate-50 space-y-4">
              <h3 className="font-medium text-sm">Contact Specialty</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="tier1Category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
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
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {predefinedTier1Categories.map((category) => (
                            <SelectItem key={category.value} value={category.value}>
                              {category.label}
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
                      <FormLabel>Subcategory</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={!tier1Category}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={!tier1Category ? "Select category first" : "Select subcategory"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {tier1Category && predefinedTier2Categories[tier1Category]?.map((category) => (
                            <SelectItem key={category.value} value={category.value}>
                              {category.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Categorizing contacts helps assign them to relevant tasks
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Phone number" {...field} />
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
                    <FormLabel>Email (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Email address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button 
                type="submit" 
                disabled={createContact.isPending}
                className="bg-orange-500 hover:bg-orange-600 text-white"
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