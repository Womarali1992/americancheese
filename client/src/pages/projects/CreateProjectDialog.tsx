import React from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

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
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

// Schema for the form
const projectFormSchema = z.object({
  name: z.string().min(1, "Project name is required"),
  location: z.string().min(1, "Location is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  description: z.string().optional(),
  teamMembers: z.array(z.string()).optional(),
});

type ProjectFormValues = z.infer<typeof projectFormSchema>;

interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateProjectDialog({
  open,
  onOpenChange,
}: CreateProjectDialogProps) {
  const { toast } = useToast();
  const [teamMembers, setTeamMembers] = React.useState<string[]>([
    "John Doe",
    "Sarah Smith",
  ]);
  const [newMember, setNewMember] = React.useState("");

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      name: "",
      location: "",
      startDate: "",
      endDate: "",
      description: "",
      teamMembers: teamMembers,
    },
  });

  async function onSubmit(data: ProjectFormValues) {
    try {
      await apiRequest("POST", "/api/projects", {
        ...data,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        status: "active",
        progress: 0,
      });

      toast({
        title: "Project created",
        description: "Your project has been created successfully.",
      });

      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "There was an error creating the project.",
        variant: "destructive",
      });
    }
  }

  const removeMember = (member: string) => {
    setTeamMembers(teamMembers.filter((m) => m !== member));
  };

  const addMember = () => {
    if (newMember && !teamMembers.includes(newMember)) {
      setTeamMembers([...teamMembers, newMember]);
      setNewMember("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addMember();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-slate-800">Create New Project</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-slate-700">Project Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter project name"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-slate-700">Location</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter address"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem className="w-1/2">
                    <FormLabel className="text-sm font-medium text-slate-700">Start Date</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem className="w-1/2">
                    <FormLabel className="text-sm font-medium text-slate-700">Estimated Completion</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-slate-700">Project Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter project description"
                      rows={3}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <FormLabel className="block text-sm font-medium text-slate-700 mb-1">Assign Team Members</FormLabel>
              <div className="flex flex-wrap gap-2 mb-2">
                {teamMembers.map((member, index) => (
                  <Badge key={index} variant="secondary" className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-sm flex items-center">
                    {member}
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => removeMember(member)}
                      className="ml-1 text-slate-500 h-auto p-0 px-1"
                    >
                      <X size={14} />
                    </Button>
                  </Badge>
                ))}
              </div>
              <Input
                placeholder="Type a name to add..."
                value={newMember}
                onChange={(e) => setNewMember(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={addMember}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>

            <DialogFooter className="sm:justify-end border-t border-slate-200 pt-4 mt-4 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="px-4 py-2 bg-project hover:bg-blue-600 text-white rounded-lg"
              >
                Create Project
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
