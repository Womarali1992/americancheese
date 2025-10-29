import { useState, useEffect } from "react";
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

// Contact interface
interface Contact {
  id: number;
  name: string;
  role: string;
  company?: string | null;
  phone?: string | null;
  email?: string | null;
  type: string;
  initials?: string | null;
  tier1Category?: string | null;
  tier2Category?: string | null;
}

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

interface EditContactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contactId: number | null;
}

export function EditContactDialog({
  open,
  onOpenChange,
  contactId,
}: EditContactDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch contact data when contactId changes
  const { data: contact, isLoading } = useQuery({
    queryKey: ["/api/contacts", contactId],
    enabled: !!contactId && open, // Only fetch when contactId is provided and dialog is open
  }) as { data: Contact | undefined, isLoading: boolean };
  
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
  
  // Update form values when contact data is loaded
  useEffect(() => {
    if (contact) {
      form.reset({
        name: contact.name,
        role: contact.role,
        type: contact.type,
        company: contact.company || "",
        phone: contact.phone || "",
        email: contact.email || "",
        tier1Category: contact.tier1Category || "",
        tier2Category: contact.tier2Category || "",
      });
    }
  }, [contact, form]);

  // Handle form submission
  const updateContact = useMutation({
    mutationFn: async (data: ContactFormValues) => {
      if (!contactId) throw new Error("Contact ID is required");
      return apiRequest(`/api/contacts/${contactId}`, "PUT", data);
    },
    onSuccess: () => {
      toast({
        title: "Contact updated",
        description: "Contact has been updated successfully",
      });
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      form.reset();
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update contact. Please try again.",
        variant: "destructive",
      });
      console.error("Failed to update contact:", error);
    },
  });

  async function onSubmit(data: ContactFormValues) {
    updateContact.mutate(data);
  }

  // Generate initials from name
  function getInitials(name: string) {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  }

  if (isLoading) {
    return null; // Don't render anything until data is loaded
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle>Edit Contact</DialogTitle>
            <Button
              variant="ghost"
              className="h-8 w-8 p-0 rounded-full"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <DialogDescription>Update contact information</DialogDescription>
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
                      <Input placeholder="e.g. Electrician, Project Manager" {...field} />
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
                disabled={updateContact.isPending}
                className="bg-orange-500 hover:bg-orange-600 text-white"
              >
                {updateContact.isPending ? "Updating..." : "Update Contact"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}