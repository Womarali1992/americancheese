import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { X, UserPlus } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

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
  tier1Category?: string;
  tier2Category?: string;
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
import { CreateContactDialog } from "@/pages/contacts/CreateContactDialog";

// Simplified labor schema - only contact and start date required from user
const laborFormSchema = z.object({
  contactId: z.coerce.number().min(1, { message: "Please select a contact" }),
  startDate: z.string().min(2, { message: "Start date is required" }),
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
  const [showCreateContactDialog, setShowCreateContactDialog] = useState(false);
  const [pendingNewContactId, setPendingNewContactId] = useState<number | null>(null);
  const [selectedTaskObj, setSelectedTaskObj] = useState<Task | null>(null);

  // Initialize form with simplified values
  const form = useForm<LaborFormValues>({
    resolver: zodResolver(laborFormSchema),
    defaultValues: {
      contactId: preselectedContactId || undefined,
      startDate: new Date().toISOString().split('T')[0],
    },
  });

  // Query for tasks to get task details
  const { data: tasks = [] } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  // Query for contacts
  const { data: contacts = [] } = useQuery<Contact[]>({
    queryKey: ["/api/contacts"],
  });

  // Find the preselected task when tasks load
  useEffect(() => {
    if (preselectedTaskId && tasks.length > 0) {
      const task = tasks.find(t => t.id === preselectedTaskId);
      if (task) {
        setSelectedTaskObj(task);
      }
    }
  }, [preselectedTaskId, tasks]);

  // Update contact ID when it changes from props
  useEffect(() => {
    if (preselectedContactId) {
      form.setValue("contactId", preselectedContactId);
    }
  }, [preselectedContactId, form]);

  // Watch for newly created contacts and auto-select them
  useEffect(() => {
    if (pendingNewContactId && contacts.length > 0) {
      const newContact = contacts.find(c => c.id === pendingNewContactId);
      if (newContact) {
        form.setValue("contactId", newContact.id);
        setPendingNewContactId(null);
      }
    }
  }, [contacts, pendingNewContactId, form]);

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      form.reset({
        contactId: preselectedContactId || undefined,
        startDate: new Date().toISOString().split('T')[0],
      });
    }
  }, [open, preselectedContactId, form]);

  // Handle form submission
  const createLaborMutation = useMutation({
    mutationFn: async (formData: LaborFormValues) => {
      // Get contact details
      const contact = contacts.find(c => c.id === formData.contactId);

      // Build full labor data from task + contact + form
      const laborData = {
        contactId: formData.contactId,
        fullName: contact?.name || "",
        company: contact?.company || "",
        projectId: selectedTaskObj?.projectId || projectId,
        taskId: preselectedTaskId,
        tier1Category: selectedTaskObj?.tier1Category || "Other",
        tier2Category: selectedTaskObj?.tier2Category || "Other",
        startDate: formData.startDate,
        endDate: formData.startDate, // Same as start date by default
        workDate: formData.startDate,
        startTime: "08:00",
        endTime: "17:00",
        totalHours: 8,
        status: "pending",
      };

      return apiRequest('/api/labor', 'POST', laborData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/labor'] });
      if (selectedTaskObj?.projectId) {
        queryClient.invalidateQueries({ queryKey: [`/api/projects/${selectedTaskObj.projectId}/labor`] });
      }
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
    createLaborMutation.mutate(values);
  }

  // Get selected contact for display
  const selectedContact = contacts.find(c => c.id === form.watch("contactId"));

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[450px]">
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
            <DialogDescription>
              {selectedTaskObj ? (
                <span>Adding labor for: <strong>{selectedTaskObj.title}</strong></span>
              ) : (
                "Create a new labor record"
              )}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Task Info (read-only) */}
              {selectedTaskObj && (
                <div className="p-3 bg-muted/50 rounded-lg space-y-1">
                  <p className="text-sm text-muted-foreground">Task</p>
                  <p className="font-medium">{selectedTaskObj.title}</p>
                  {selectedTaskObj.tier1Category && (
                    <p className="text-sm text-muted-foreground">
                      {selectedTaskObj.tier1Category} &rarr; {selectedTaskObj.tier2Category}
                    </p>
                  )}
                </div>
              )}

              {/* Contact Selection */}
              <FormField
                control={form.control}
                name="contactId"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel>Worker</FormLabel>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs gap-1"
                        onClick={() => setShowCreateContactDialog(true)}
                      >
                        <UserPlus className="h-3 w-3" />
                        New Contact
                      </Button>
                    </div>
                    <Select
                      onValueChange={(value) => {
                        if (value && value !== "none") {
                          field.onChange(parseInt(value));
                        }
                      }}
                      value={field.value?.toString() || ""}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a worker" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {contacts.map((contact) => (
                          <SelectItem key={contact.id} value={contact.id.toString()}>
                            <div className="flex flex-col">
                              <span className="font-medium">{contact.name}</span>
                              {contact.company && (
                                <span className="text-sm text-muted-foreground">{contact.company}</span>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                    {selectedContact && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {selectedContact.company && `${selectedContact.company}`}
                        {selectedContact.role && ` - ${selectedContact.role}`}
                      </p>
                    )}
                  </FormItem>
                )}
              />

              {/* Start Date */}
              <FormField
                control={form.control}
                name="startDate"
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

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createLaborMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {createLaborMutation.isPending ? "Creating..." : "Create Record"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Create Contact Dialog */}
      <CreateContactDialog
        open={showCreateContactDialog}
        onOpenChange={setShowCreateContactDialog}
        projectId={selectedTaskObj?.projectId || projectId}
        onContactCreated={(contactId) => {
          setPendingNewContactId(contactId);
        }}
      />
    </>
  );
}
