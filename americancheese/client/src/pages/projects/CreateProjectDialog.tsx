import React from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
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
  EnhancedSelectRichTrigger,
} from "@/components/ui/enhanced-select";
import { X, Home, Building2, Code, FileX, Check, Palette } from "lucide-react";
import { getPresetOptions } from "@shared/presets.ts";
import { COLOR_THEMES } from "@/lib/color-themes";

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

interface EnabledThemesResponse {
  enabledThemes: string[];
}

interface EnabledPresetsResponse {
  enabledPresets: string[];
}

// Helper function to get icon for preset
const getPresetIcon = (presetValue: string) => {
  switch (presetValue) {
    case 'none':
      return <FileX className="h-4 w-4" />;
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

  // Fetch enabled themes
  const { data: enabledThemesData } = useQuery<EnabledThemesResponse>({
    queryKey: ['/api/global-settings/enabled-themes'],
  });

  // Fetch enabled presets
  const { data: enabledPresetsData } = useQuery<EnabledPresetsResponse>({
    queryKey: ['/api/global-settings/enabled-presets'],
  });

  // Get the list of available presets (filtered by enabled presets)
  const availablePresets = React.useMemo(() => {
    const allPresets = getPresetOptions();
    
    // If no enabled presets data or empty array, show all presets
    if (!enabledPresetsData || enabledPresetsData.enabledPresets.length === 0) {
      return allPresets;
    }
    
    // Always include "none" option plus enabled presets
    return allPresets.filter(preset => 
      preset.value === 'none' || enabledPresetsData.enabledPresets.includes(preset.value)
    );
  }, [enabledPresetsData]);

  // Get the list of available themes (filtered by enabled themes)
  const availableThemes = React.useMemo(() => {
    const allThemeKeys = Object.keys(COLOR_THEMES);
    
    // If no enabled themes data or empty array, show all themes
    if (!enabledThemesData || enabledThemesData.enabledThemes.length === 0) {
      return allThemeKeys;
    }
    
    return allThemeKeys.filter(key => enabledThemesData.enabledThemes.includes(key));
  }, [enabledThemesData]);

  // Get the first available theme for default
  const defaultTheme = availableThemes[0] || "classic-construction";

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      name: "",
      location: "",
      startDate: "",
      endDate: "",
      description: "",
      presetId: "none",
      teamMembers: teamMembers,
      useGlobalTheme: false,
      colorTheme: defaultTheme,
    },
  });

  // Update the colorTheme when available themes change and current selection is not available
  React.useEffect(() => {
    const currentTheme = form.getValues("colorTheme");
    if (currentTheme && !availableThemes.includes(currentTheme)) {
      form.setValue("colorTheme", defaultTheme);
    }
  }, [availableThemes, defaultTheme, form]);

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
      console.log("🎨 Theme being sent:", {
        formColorTheme: data.colorTheme,
        useGlobalTheme: data.useGlobalTheme,
        finalColorTheme: requestData.colorTheme
      });

      const response = await apiRequest("/api/projects", "POST", requestData);
      const newProject = await response.json();

      // Apply preset categories and tasks if a preset was selected (not 'none')
      let categoriesCreated = 0;
      let tasksCreated = 0;
      
      if (data.presetId && data.presetId !== 'none' && newProject.id) {
        try {
          // First load the preset categories
          const categoriesResponse = await apiRequest(`/api/projects/${newProject.id}/load-preset-categories`, "POST", {
            presetId: data.presetId,
            replaceExisting: true,
            preserveTheme: true // Preserve the user's selected color theme
          });
          const categoriesResult = await categoriesResponse.json();
          categoriesCreated = categoriesResult.categoriesCreated || 0;
          console.log(`Successfully applied preset '${data.presetId}' with ${categoriesCreated} categories to project ${newProject.id}`);

          // Then load the tasks from templates that match the categories
          try {
            const tasksResponse = await apiRequest(`/api/projects/${newProject.id}/create-tasks-from-templates`, "POST", {
              presetId: data.presetId,
              replaceExisting: false
            });
            const tasksResult = await tasksResponse.json();
            // createdTasks is an array of task objects, so we need to get its length
            tasksCreated = Array.isArray(tasksResult.createdTasks) ? tasksResult.createdTasks.length : 0;
            console.log(`Successfully created ${tasksCreated} tasks for project ${newProject.id}`);
          } catch (taskError) {
            console.error("Error creating tasks from templates:", taskError);
            // Don't fail - categories were created, tasks are optional
          }
        } catch (presetError) {
          console.error("Error applying preset categories:", presetError);
          toast({
            title: "Warning",
            description: "Project created but preset categories failed to apply. You can apply them later from project settings.",
            variant: "destructive",
          });
        }
      }

      // Reset form and close dialog first for better UX
      form.reset();
      onOpenChange(false);

      // Force a complete refresh of all project-related queries
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["/api/projects"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/tasks"] }),
        // Also invalidate the new project's specific queries
        newProject.id && queryClient.invalidateQueries({ queryKey: [`/api/projects/${newProject.id}`] }),
        newProject.id && queryClient.invalidateQueries({ queryKey: [`/api/projects/${newProject.id}/categories`] }),
        newProject.id && queryClient.invalidateQueries({ queryKey: [`/api/projects/${newProject.id}/tasks`] }),
      ]);
      
      // Refetch to ensure immediate update
      await queryClient.refetchQueries({ queryKey: ["/api/projects"] });

      toast({
        title: "Project created",
        description: data.presetId && data.presetId !== 'none' 
          ? `"${data.name}" created with ${categoriesCreated} categories and ${tasksCreated} tasks.`
          : `"${data.name}" has been created successfully.`,
      });
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
                const selectedPreset = availablePresets.find(p => p.value === field.value);
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
                        {availablePresets.map((preset) => (
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

            {/* Theme Settings */}
            <FormField
              control={form.control}
              name="colorTheme"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center gap-2 mb-2">
                    <Palette className="h-4 w-4 text-slate-500" />
                    <FormLabel className="text-sm font-medium text-slate-700 mb-0">Color Theme</FormLabel>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1">
                    {availableThemes.map((themeKey) => {
                      const theme = COLOR_THEMES[themeKey];
                      if (!theme) return null;
                      
                      const isSelected = field.value === themeKey;
                      
                      return (
                        <div 
                          key={themeKey}
                          className={`cursor-pointer p-2 border rounded-lg transition-all hover:shadow-sm ${
                            isSelected 
                              ? 'ring-2 ring-blue-500 border-blue-500 bg-blue-50/50' 
                              : 'hover:border-slate-300 border-slate-200'
                          }`}
                          onClick={() => field.onChange(themeKey)}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-xs truncate">{theme.name}</span>
                            {isSelected && <Check className="h-3 w-3 text-blue-600 flex-shrink-0" />}
                          </div>
                          
                          {/* Mini Color Preview */}
                          <div className="flex gap-0.5">
                            {Object.entries(theme.tier1).slice(0, 5).map(([category, color]) => (
                              <div 
                                key={category}
                                className="w-3 h-3 rounded-sm border border-slate-200"
                                style={{ backgroundColor: color }}
                              />
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
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
                onClick={() => {
                  form.reset();
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
