import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { X, Calendar as CalendarIcon } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn, formatDate } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

// Extending the expense schema with validation
const expenseFormSchema = z.object({
  description: z.string().min(3, { message: "Description must be at least 3 characters" }),
  amount: z.coerce.number().positive({ message: "Amount must be greater than 0" }),
  date: z.date(),
  category: z.string(),
  projectId: z.coerce.number(),
  vendor: z.string().optional(),
});

type ExpenseFormValues = z.infer<typeof expenseFormSchema>;

interface CreateExpenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateExpenseDialog({
  open,
  onOpenChange,
}: CreateExpenseDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query for projects to populate the project selector
  const { data: projects } = useQuery({
    queryKey: ["/api/projects"],
  });

  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: {
      description: "",
      amount: undefined,
      date: new Date(),
      category: "materials",
      projectId: undefined,
      vendor: "",
    },
  });

  const createExpense = useMutation({
    mutationFn: async (data: ExpenseFormValues) => {
      // Convert Date object to ISO string for the API
      const apiData = {
        ...data,
        date: data.date.toISOString(),
      };
      return apiRequest("/api/expenses", {
        method: "POST",
        body: JSON.stringify(apiData),
      });
    },
    onSuccess: () => {
      toast({
        title: "Expense created",
        description: "Your expense has been recorded successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      form.reset();
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create expense. Please try again.",
        variant: "destructive",
      });
      console.error("Failed to create expense:", error);
    },
  });

  async function onSubmit(data: ExpenseFormValues) {
    createExpense.mutate(data);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle>Record New Expense</DialogTitle>
            <Button
              variant="ghost"
              className="h-8 w-8 p-0 rounded-full"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
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
                    onValueChange={field.onChange}
                    defaultValue={field.value?.toString()}
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

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter expense description"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount ($)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              formatDate(field.value)
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
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
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="materials">Materials</SelectItem>
                        <SelectItem value="labor">Labor</SelectItem>
                        <SelectItem value="equipment">Equipment</SelectItem>
                        <SelectItem value="permits">Permits & Fees</SelectItem>
                        <SelectItem value="transportation">Transportation</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="vendor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vendor/Supplier</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter vendor name"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button 
                type="submit" 
                className="bg-expense hover:bg-expense/90"
                disabled={createExpense.isPending}
              >
                {createExpense.isPending ? "Recording..." : "Record Expense"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}