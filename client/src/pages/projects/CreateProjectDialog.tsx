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
import {
  EnhancedSelect,
  EnhancedSelectContent,
  EnhancedSelectItem,
  EnhancedSelectTrigger,
  EnhancedSelectValue,
  EnhancedSelectRichTrigger,
} from "@/components/ui/enhanced-select";
import { X, Home, Building2, Code } from "lucide-react";
import { getPresetOptions, DEFAULT_PRESET_ID } from "@shared/presets.ts";
import { Switch } from "@/components/ui/switch";

// Schema for the form
const projectFormSchema = z.object({
  name: z.string().min(1, "Project name is required"),
  location: z.string().min(1, "Location is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  description: z.string().optional(),
  presetId: z.string().min(1, "Preset selection is required"),
  teamMembers: z.array(z.string()).optional(),
  useGlobalTheme: z.boolean().default(true),
  colorTheme: z.string().optional(),
});

type ProjectFormValues = z.infer<typeof projectFormSchema>;

interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Helper function to get icon for preset
const getPresetIcon = (presetValue: string) => {
  switch (presetValue) {
    case 'home-builder':
      return <Home className="h-4 w-4" />;
    case 'standard-construction':
      return <Building2 className="h-4 w-4" />;
    case 'software-development':
      return <Code className="h-4 w-4" />;
    default:
      return <Home className="h-4 w-4" />;
  }
};

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
  const [useGlobalTheme, setUseGlobalTheme] = React.useState(true);

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      name: "",
      location: "",
      startDate: "",
      endDate: "",
      description: "",
      presetId: DEFAULT_PRESET_ID,
      teamMembers: teamMembers,
      useGlobalTheme: true,
      colorTheme: "earth-tone",
    },
  });

  async function onSubmit(data: ProjectFormValues) {
    try {
      const requestData = {
        ...data,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        status: "active",
        progress: 0,
        presetId: data.presetId,
        useGlobalTheme: data.useGlobalTheme,
        colorTheme: data.useGlobalTheme ? null : data.colorTheme,
      };
      console.log("Creating project with data:", requestData);
      console.log("PresetId being sent:", data.presetId);

      await apiRequest("/api/projects", "POST", requestData);

      toast({
        title: "Project created",
        description: "Your project has been created successfully.",
      });

      form.reset();
      setUseGlobalTheme(true); // Reset local state
      // Force a refresh of the projects query
      await queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      // Also refetch to ensure immediate update
      await queryClient.refetchQueries({ queryKey: ["/api/projects"] });
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
      <DialogContent className="sm:max-w-lg" aria-describedby="create-project-description">
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

            <FormField
              control={form.control}
              name="presetId"
              render={({ field }) => {
                const selectedPreset = getPresetOptions().find(p => p.value === field.value);
                return (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-slate-700">Category Preset</FormLabel>
                    <EnhancedSelect onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                      <FormControl>
                        <EnhancedSelectRichTrigger
                          title={selectedPreset?.label || "Select a preset"}
                          subtitle={selectedPreset?.description || "Choose a category preset for your project"}
                          icon={selectedPreset ? getPresetIcon(selectedPreset.value) : undefined}
                        />
                      </FormControl>
                      <EnhancedSelectContent>
                        {getPresetOptions().map((preset) => (
                          <EnhancedSelectItem key={preset.value} value={preset.value}>
                            <div className="flex items-start gap-3">
                              <div className="flex-shrink-0 mt-0.5 text-slate-500">
                                {getPresetIcon(preset.value)}
                              </div>
                              <div className="flex flex-col min-w-0">
                                <span className="font-medium text-sm text-slate-900">{preset.label}</span>
                                <span className="text-xs text-slate-500 leading-tight">{preset.description}</span>
                              </div>
                            </div>
                          </EnhancedSelectItem>
                        ))}
                      </EnhancedSelectContent>
                    </EnhancedSelect>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />

            {/* Theme settings removed - can be configured later in project details */}

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
                onClick={() => {
                  form.reset();
                  setUseGlobalTheme(true);
                  onOpenChange(false);
                }}
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
