/**
 * Preset Availability Component
 * 
 * Allows admins to toggle which presets are available for project selection.
 */

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Loader2, Eye, EyeOff, Package, Edit2, Plus, Trash2, ChevronDown, ChevronRight, Tags, GripVertical, MoreVertical, Save, X } from "lucide-react";
import { AVAILABLE_PRESETS, type CategoryPreset } from "@shared/presets";
import { taskTemplates, type TaskTemplate } from "@shared/taskTemplates";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { DragDropContext, Droppable, Draggable, type DropResult } from "react-beautiful-dnd";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { FALLBACK_COLORS } from "@/lib/unified-color-system";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { FileText, ListTodo } from "lucide-react";
import {
  categoryValidationSchema,
  taskTemplateValidationSchema,
  presetValidationSchema,
  sanitizeText
} from "@shared/validation";

interface EnabledPresetsResponse {
  enabledPresets: string[];
}

type Tier1Category = {
  name: string;
  description: string;
  sortOrder: number;
};

type Tier2Category = {
  name: string;
  description: string;
};

type PresetConfig = {
  name: string;
  description: string;
  recommendedTheme?: string;
  tier1Categories: Tier1Category[];
  tier2Categories: Record<string, Tier2Category[]>;
  tasks: Record<string, Record<string, TaskTemplate[]>>;
};

export function PresetAvailability() {
  const { toast } = useToast();
  const [enabledPresets, setEnabledPresets] = useState<string[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [presetsExpanded, setPresetsExpanded] = useState(false);
  const [editingPreset, setEditingPreset] = useState<string | null>(null);
  const [presetForm, setPresetForm] = useState<PresetConfig>({
    name: '',
    description: '',
    recommendedTheme: '',
    tier1Categories: [],
    tier2Categories: {},
    tasks: {}
  });
  const [expandedTier1, setExpandedTier1] = useState<Set<string>>(new Set());
  const [editingTier1Index, setEditingTier1Index] = useState<number | null>(null);
  const [editingTier2Key, setEditingTier2Key] = useState<string | null>(null);
  const [editingTier2Index, setEditingTier2Index] = useState<number | null>(null);
  const [addingSubcategoryFor, setAddingSubcategoryFor] = useState<string | null>(null);
  const [newSubcategoryName, setNewSubcategoryName] = useState("");
  const [newSubcategoryDescription, setNewSubcategoryDescription] = useState("");
  const [expandedDescriptions, setExpandedDescriptions] = useState<Set<string>>(new Set());
  const [expandedTaskLists, setExpandedTaskLists] = useState<Set<string>>(new Set());
  const [editingTaskKey, setEditingTaskKey] = useState<string | null>(null);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [taskForm, setTaskForm] = useState<{
    tier1: string;
    tier2: string;
    taskId?: string;
    title: string;
    description: string;
    estimatedDuration: number;
  }>({
    tier1: '',
    tier2: '',
    title: '',
    description: '',
    estimatedDuration: 1
  });

  const allPresetKeys = Object.keys(AVAILABLE_PRESETS);

  // Fetch enabled presets
  const { data: enabledPresetsData, isLoading } = useQuery<EnabledPresetsResponse>({
    queryKey: ['/api/global-settings/enabled-presets'],
  });

  // Fetch all presets with their custom configurations merged
  const { data: mergedPresets } = useQuery<CategoryPreset[]>({
    queryKey: ['/api/admin/presets'],
  });

  // Create a map of preset keys to merged presets for easy lookup
  const presetMap = (mergedPresets || []).reduce((acc, preset) => {
    acc[preset.id] = preset;
    return acc;
  }, {} as Record<string, CategoryPreset>);

  // Initialize state when data loads
  useEffect(() => {
    if (enabledPresetsData) {
      // Empty array means all presets are enabled
      if (enabledPresetsData.enabledPresets.length === 0) {
        setEnabledPresets(allPresetKeys);
      } else {
        setEnabledPresets(enabledPresetsData.enabledPresets);
      }
    }
  }, [enabledPresetsData]);

  // Update enabled presets mutation
  const updateMutation = useMutation({
    mutationFn: async (presets: string[]) => {
      return apiRequest('/api/global-settings/enabled-presets', 'PUT', { enabledPresets: presets });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/global-settings/enabled-presets'] });
      setHasChanges(false);
      toast({
        title: "Preset availability updated",
        description: "Project preset options have been saved.",
      });
    },
    onError: (error) => {
      console.error('Error updating enabled presets:', error);
      toast({
        title: "Error",
        description: "Failed to update preset availability.",
        variant: "destructive",
      });
    }
  });

  const handleToggle = (presetKey: string, enabled: boolean) => {
    setEnabledPresets(prev => {
      const currentPresets = prev.length === 0 ? allPresetKeys : prev;
      if (enabled) {
        return [...currentPresets, presetKey];
      } else {
        // Allow disabling all presets (users can still use "None" option)
        return currentPresets.filter(p => p !== presetKey);
      }
    });
    setHasChanges(true);
  };

  const handleSave = () => {
    const presetsToSave = enabledPresets.length === allPresetKeys.length ? [] : enabledPresets;
    updateMutation.mutate(presetsToSave);
  };

  const handleEnableAll = () => {
    setEnabledPresets(allPresetKeys);
    setHasChanges(true);
  };

  const handleDisableAll = () => {
    setEnabledPresets([]);
    setHasChanges(true);
  };

  const handleEditPreset = async (presetKey: string) => {
    try {
      // Fetch the merged preset from server (includes custom configurations)
      const response = await apiRequest(`/api/admin/presets/${presetKey}`, 'GET');
      const preset = await response.json();
      
      setEditingPreset(presetKey);

      // Get tier1 names and existing tier2 keys
      const tier1Names = new Set<string>(preset.categories.tier1.map((c: Tier1Category) => c.name));
      const existingTier2: Record<string, Tier2Category[]> = preset.categories.tier2 || {};
      
      // Fix any mismatched tier2 keys: ensure tier2 keys match tier1 names
      // This handles cases where tier1 was renamed but tier2 key wasn't updated
      const fixedTier2: Record<string, Tier2Category[]> = {};
      
      // First, copy over any tier2 entries that already match tier1 names
      for (const tier1Name of tier1Names) {
        if (existingTier2[tier1Name]) {
          fixedTier2[tier1Name] = existingTier2[tier1Name];
        }
      }
      
      // Then, check for orphaned tier2 keys (keys that don't match any tier1 name)
      // Try to match them to tier1 categories that don't have tier2 data yet
      const orphanedKeys = Object.keys(existingTier2).filter(key => !tier1Names.has(key));
      const tier1WithoutTier2: string[] = Array.from(tier1Names).filter(name => !fixedTier2[name]);
      
      // If we have orphaned keys and tier1 categories missing tier2 data,
      // try to match them by order (this handles the case where one category was renamed)
      if (orphanedKeys.length > 0 && tier1WithoutTier2.length > 0) {
        console.log('⚠️ Found mismatched tier1/tier2 keys, attempting to fix...');
        console.log('  Orphaned tier2 keys:', orphanedKeys);
        console.log('  Tier1 categories without tier2:', tier1WithoutTier2);
        
        // Match orphaned keys to tier1 categories without tier2 (by position)
        for (let i = 0; i < Math.min(orphanedKeys.length, tier1WithoutTier2.length); i++) {
          fixedTier2[tier1WithoutTier2[i]] = existingTier2[orphanedKeys[i]];
          console.log(`  Mapped "${orphanedKeys[i]}" -> "${tier1WithoutTier2[i]}"`);
        }
      }
      
      // Ensure all tier1 categories have at least an empty tier2 array
      for (const tier1Name of tier1Names) {
        if (!fixedTier2[tier1Name]) {
          fixedTier2[tier1Name] = [];
        }
      }

      // Initialize tasks from TASK_TEMPLATES for this preset's categories
      const initialTasks: Record<string, Record<string, TaskTemplate[]>> = {};
      preset.categories.tier1.forEach((tier1Cat: Tier1Category) => {
        initialTasks[tier1Cat.name] = {};
        const tier2Cats = fixedTier2[tier1Cat.name] || [];
        tier2Cats.forEach((tier2Cat: Tier2Category) => {
          const templates = getTasksForCategory(tier1Cat.name, tier2Cat.name);
          if (templates.length > 0) {
            initialTasks[tier1Cat.name][tier2Cat.name] = [...templates];
          }
        });
      });

      setPresetForm({
        name: preset.name,
        description: preset.description,
        recommendedTheme: preset.recommendedTheme || '',
        tier1Categories: [...preset.categories.tier1],
        tier2Categories: fixedTier2,
        tasks: initialTasks
      });
      // Expand all tier1 categories by default
      setExpandedTier1(new Set(preset.categories.tier1.map((c: Tier1Category) => c.name)));
    } catch (error) {
      console.error('Error loading preset:', error);
      toast({
        title: "Error",
        description: "Failed to load preset configuration.",
        variant: "destructive",
      });
    }
  };

  // Save preset mutation
  const savePresetMutation = useMutation({
    mutationFn: async (data: { presetId: string; config: PresetConfig }) => {
      return apiRequest(`/api/admin/presets/${data.presetId}`, 'PUT', data.config);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/global-settings/enabled-presets'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/presets'] });
      toast({
        title: "Preset saved",
        description: "Preset configuration has been updated successfully.",
      });
      setEditingPreset(null);
    },
    onError: (error) => {
      console.error('Error saving preset:', error);
      toast({
        title: "Error",
        description: "Failed to save preset configuration.",
        variant: "destructive",
      });
    }
  });

  const handleSavePreset = () => {
    if (!editingPreset) return;

    // Validate preset fields
    const presetValidation = presetValidationSchema.safeParse({
      name: presetForm.name,
      description: presetForm.description,
      recommendedTheme: presetForm.recommendedTheme,
    });

    if (!presetValidation.success) {
      const errors = presetValidation.error.errors.map(err => err.message).join(", ");
      toast({
        title: "Validation Error",
        description: errors,
        variant: "destructive",
      });
      return;
    }

    // Validate all tier1 categories
    for (const tier1 of presetForm.tier1Categories) {
      const categoryValidation = categoryValidationSchema.safeParse({
        name: tier1.name,
        description: tier1.description,
      });

      if (!categoryValidation.success) {
        toast({
          title: "Validation Error",
          description: `Category "${tier1.name}": ${categoryValidation.error.errors[0].message}`,
          variant: "destructive",
        });
        return;
      }
    }

    // Validate all tier2 categories
    for (const [tier1Name, tier2List] of Object.entries(presetForm.tier2Categories)) {
      for (const tier2 of tier2List) {
        const categoryValidation = categoryValidationSchema.safeParse({
          name: tier2.name,
          description: tier2.description,
        });

        if (!categoryValidation.success) {
          toast({
            title: "Validation Error",
            description: `Subcategory "${tier2.name}" in ${tier1Name}: ${categoryValidation.error.errors[0].message}`,
            variant: "destructive",
          });
          return;
        }
      }
    }

    const config: PresetConfig = {
      name: presetValidation.data.name,
      description: presetValidation.data.description,
      recommendedTheme: presetValidation.data.recommendedTheme,
      tier1Categories: presetForm.tier1Categories,
      tier2Categories: presetForm.tier2Categories,
      tasks: presetForm.tasks
    };

    savePresetMutation.mutate({ presetId: editingPreset, config });
  };

  const handleCancelEdit = () => {
    setEditingPreset(null);
    setPresetForm({
      name: '',
      description: '',
      recommendedTheme: '',
      tier1Categories: [],
      tier2Categories: {},
      tasks: {}
    });
    setExpandedTier1(new Set());
  };

  const handleAddTier1 = () => {
    const newCategory: Tier1Category = {
      name: 'New Category',
      description: '',
      sortOrder: presetForm.tier1Categories.length + 1
    };
    setPresetForm({
      ...presetForm,
      tier1Categories: [...presetForm.tier1Categories, newCategory],
      tier2Categories: {
        ...presetForm.tier2Categories,
        [newCategory.name]: []
      }
    });
  };

  const handleRemoveTier1 = (index: number) => {
    const categoryName = presetForm.tier1Categories[index].name;
    const newTier1 = presetForm.tier1Categories.filter((_, i) => i !== index);
    const newTier2 = { ...presetForm.tier2Categories };
    delete newTier2[categoryName];

    setPresetForm({
      ...presetForm,
      tier1Categories: newTier1,
      tier2Categories: newTier2
    });
  };

  const handleUpdateTier1 = (index: number, field: keyof Tier1Category, value: string | number) => {
    // Sanitize string values
    const sanitizedValue = typeof value === 'string'
      ? sanitizeText(value, field === 'name' ? 100 : 500)
      : value;

    // Use functional update to ensure we're working with the latest state
    setPresetForm((prev) => {
      const oldName = prev.tier1Categories[index].name;
      const newTier1 = [...prev.tier1Categories];
      newTier1[index] = { ...newTier1[index], [field]: sanitizedValue };

      // If name changed, update tier2 categories key AND tasks key
      let newTier2 = { ...prev.tier2Categories };
      let newTasks = { ...prev.tasks };

      if (field === 'name' && oldName !== sanitizedValue) {
        // Update tier2 key - copy subcategories to new key, delete old key
        newTier2[sanitizedValue as string] = newTier2[oldName] || [];
        delete newTier2[oldName];

        // Update tasks key - copy tasks to new key, delete old key
        newTasks[sanitizedValue as string] = newTasks[oldName] || {};
        delete newTasks[oldName];

        // Update expanded state
        const newExpanded = new Set(expandedTier1);
        if (newExpanded.has(oldName)) {
          newExpanded.delete(oldName);
          newExpanded.add(sanitizedValue as string);
        }
        setExpandedTier1(newExpanded);
      }

      return {
        ...prev,
        tier1Categories: newTier1,
        tier2Categories: newTier2,
        tasks: newTasks
      };
    });
  };

  const handleAddTier2 = (tier1Name: string) => {
    const newTier2Category: Tier2Category = {
      name: 'New Subcategory',
      description: ''
    };

    setPresetForm({
      ...presetForm,
      tier2Categories: {
        ...presetForm.tier2Categories,
        [tier1Name]: [...(presetForm.tier2Categories[tier1Name] || []), newTier2Category]
      }
    });
  };

  const handleRemoveTier2 = (tier1Name: string, index: number) => {
    const newTier2List = presetForm.tier2Categories[tier1Name].filter((_, i) => i !== index);

    setPresetForm({
      ...presetForm,
      tier2Categories: {
        ...presetForm.tier2Categories,
        [tier1Name]: newTier2List
      }
    });
  };

  const handleUpdateTier2 = (tier1Name: string, index: number, field: keyof Tier2Category, value: string) => {
    // Sanitize value
    const sanitizedValue = sanitizeText(value, field === 'name' ? 100 : 500);

    const newTier2List = [...presetForm.tier2Categories[tier1Name]];
    newTier2List[index] = { ...newTier2List[index], [field]: sanitizedValue };

    setPresetForm({
      ...presetForm,
      tier2Categories: {
        ...presetForm.tier2Categories,
        [tier1Name]: newTier2List
      }
    });
  };

  const toggleTier1Expanded = (tier1Name: string) => {
    const newExpanded = new Set(expandedTier1);
    if (newExpanded.has(tier1Name)) {
      newExpanded.delete(tier1Name);
    } else {
      newExpanded.add(tier1Name);
    }
    setExpandedTier1(newExpanded);
  };

  // Toggle description expansion
  const toggleDescription = (key: string) => {
    setExpandedDescriptions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  // Toggle task list expansion
  const toggleTaskList = (tier1Name: string, tier2Name: string) => {
    const key = `${tier1Name}-${tier2Name}`;
    setExpandedTaskLists(prev => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  // Truncate description for preview
  const getDescriptionPreview = (description: string, maxLength: number = 50) => {
    if (!description || description.length <= maxLength) return description;
    return description.substring(0, maxLength).trim() + "...";
  };

  // Get theme colors for categories
  const getMainCategoryColor = (index: number) => {
    const mainColors = [
      FALLBACK_COLORS.primary,
      FALLBACK_COLORS.tier1Default,
      FALLBACK_COLORS.blue,
      FALLBACK_COLORS.tier2Default
    ];
    return mainColors[index % 4];
  };

  // Get task templates for a specific tier1 and tier2 category
  const getTasksForCategory = (tier1Name: string, tier2Name: string): TaskTemplate[] => {
    // First check if we have custom tasks in the form
    if (presetForm.tasks[tier1Name]?.[tier2Name]) {
      return presetForm.tasks[tier1Name][tier2Name];
    }
    // Fall back to taskTemplates
    if (!taskTemplates[tier1Name]) return [];
    if (!taskTemplates[tier1Name][tier2Name]) return [];
    return taskTemplates[tier1Name][tier2Name] || [];
  };

  // Handle edit task
  const handleEditTask = (tier1Name: string, tier2Name: string, taskId: string) => {
    const tasks = getTasksForCategory(tier1Name, tier2Name);
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    setTaskForm({
      tier1: tier1Name,
      tier2: tier2Name,
      taskId: task.id,
      title: task.title,
      description: task.description,
      estimatedDuration: task.estimatedDuration
    });
    setTaskDialogOpen(true);
  };

  // Handle delete task
  const handleDeleteTask = (tier1Name: string, tier2Name: string, taskId: string) => {
    if (!confirm(`Are you sure you want to delete this task template?`)) {
      return;
    }

    const currentTasks = getTasksForCategory(tier1Name, tier2Name);
    const updatedTasks = currentTasks.filter(t => t.id !== taskId);

    setPresetForm({
      ...presetForm,
      tasks: {
        ...presetForm.tasks,
        [tier1Name]: {
          ...(presetForm.tasks[tier1Name] || {}),
          [tier2Name]: updatedTasks
        }
      }
    });

    toast({
      title: "Task deleted",
      description: "Task template removed from preset.",
    });
  };

  // Handle add task to category
  const handleAddTask = (tier1Name: string, tier2Name: string) => {
    setTaskForm({
      tier1: tier1Name,
      tier2: tier2Name,
      taskId: undefined,
      title: '',
      description: '',
      estimatedDuration: 1
    });
    setTaskDialogOpen(true);
  };

  // Save task (add or edit)
  const handleSaveTask = () => {
    // Validate task template
    const taskValidation = taskTemplateValidationSchema.safeParse({
      title: taskForm.title,
      description: taskForm.description,
      estimatedDuration: taskForm.estimatedDuration
    });

    if (!taskValidation.success) {
      const errors = taskValidation.error.errors.map(err => err.message).join(", ");
      toast({
        title: "Validation Error",
        description: errors,
        variant: "destructive",
      });
      return;
    }

    const currentTasks = getTasksForCategory(taskForm.tier1, taskForm.tier2);

    let updatedTasks: TaskTemplate[];
    if (taskForm.taskId) {
      // Edit existing task
      updatedTasks = currentTasks.map(t =>
        t.id === taskForm.taskId
          ? {
              ...t,
              title: taskValidation.data.title,
              description: taskValidation.data.description,
              estimatedDuration: taskValidation.data.estimatedDuration
            }
          : t
      );
    } else {
      // Add new task
      const newTaskId = `CUSTOM_${Date.now()}`;
      const newTask: TaskTemplate = {
        id: newTaskId,
        title: taskValidation.data.title,
        description: taskValidation.data.description,
        tier1Category: taskForm.tier1,
        tier2Category: taskForm.tier2,
        category: taskForm.tier2.toLowerCase(),
        estimatedDuration: taskValidation.data.estimatedDuration
      };
      updatedTasks = [...currentTasks, newTask];
    }

    setPresetForm({
      ...presetForm,
      tasks: {
        ...presetForm.tasks,
        [taskForm.tier1]: {
          ...(presetForm.tasks[taskForm.tier1] || {}),
          [taskForm.tier2]: updatedTasks
        }
      }
    });

    setTaskDialogOpen(false);
    toast({
      title: taskForm.taskId ? "Task updated" : "Task added",
      description: `Task template ${taskForm.taskId ? "updated" : "added"} successfully.`,
    });
  };

  // Handle add subcategory
  const handleAddSubcategory = (tier1Name: string) => {
    // Validate subcategory
    const categoryValidation = categoryValidationSchema.safeParse({
      name: newSubcategoryName,
      description: newSubcategoryDescription,
    });

    if (!categoryValidation.success) {
      const errors = categoryValidation.error.errors.map(err => err.message).join(", ");
      toast({
        title: "Validation Error",
        description: errors,
        variant: "destructive",
      });
      return;
    }

    const newTier2Category: Tier2Category = {
      name: categoryValidation.data.name,
      description: categoryValidation.data.description
    };

    setPresetForm({
      ...presetForm,
      tier2Categories: {
        ...presetForm.tier2Categories,
        [tier1Name]: [...(presetForm.tier2Categories[tier1Name] || []), newTier2Category]
      }
    });

    setNewSubcategoryName("");
    setNewSubcategoryDescription("");
    setAddingSubcategoryFor(null);
  };

  // Handle drag end
  const handleDragEnd = (result: DropResult) => {
    const { destination, source } = result;

    // Validate drag operation
    if (!destination || destination.index === source.index) {
      return;
    }

    // Validate indices are within bounds
    if (
      source.index < 0 ||
      source.index >= presetForm.tier1Categories.length ||
      destination.index < 0 ||
      destination.index >= presetForm.tier1Categories.length
    ) {
      toast({
        title: "Error",
        description: "Invalid drag operation",
        variant: "destructive",
      });
      return;
    }

    const reorderedCategories = Array.from(presetForm.tier1Categories);
    const [movedCategory] = reorderedCategories.splice(source.index, 1);
    reorderedCategories.splice(destination.index, 0, movedCategory);

    // Update sort orders
    const updatedCategories = reorderedCategories.map((cat, index) => ({
      ...cat,
      sortOrder: index + 1
    }));

    setPresetForm({
      ...presetForm,
      tier1Categories: updatedCategories
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  const enabledCount = enabledPresets.length === 0 ? allPresetKeys.length : enabledPresets.length;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Preset Availability</h2>
        <p className="text-muted-foreground">
          Control which category presets are available when creating new projects
        </p>
      </div>

      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Manage Available Presets</h3>
        <p className="text-sm text-muted-foreground">
          Toggle preset visibility and edit category structures. Disabled presets will be hidden from the preset selector.
        </p>
      </div>

      <Collapsible open={presetsExpanded} onOpenChange={setPresetsExpanded}>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {enabledCount} of {allPresetKeys.length} presets enabled
          </span>
          <div className="flex gap-2">
            <CollapsibleTrigger asChild>
              <Button variant="outline" size="sm">
                {presetsExpanded ? (
                  <>
                    <ChevronDown className="h-4 w-4 mr-2" />
                    Hide Presets
                  </>
                ) : (
                  <>
                    <ChevronRight className="h-4 w-4 mr-2" />
                    Show Presets
                  </>
                )}
              </Button>
            </CollapsibleTrigger>
            <Button variant="outline" size="sm" onClick={handleEnableAll}>
              Enable All
            </Button>
            <Button variant="outline" size="sm" onClick={handleDisableAll}>
              Disable All
            </Button>
          </div>
        </div>

        <CollapsibleContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {Object.keys(AVAILABLE_PRESETS).map((presetKey) => {
              // Use merged preset from server if available, fallback to base preset
              const preset = presetMap[presetKey] || AVAILABLE_PRESETS[presetKey];
              const isEnabled = enabledPresets.length === 0 || enabledPresets.includes(presetKey);

              return (
                <div
                  key={presetKey}
                  className={`flex items-center justify-between p-4 border rounded-lg transition-all ${
                    isEnabled ? 'bg-card' : 'bg-muted/50 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                      <Package className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-medium">{preset.name}</span>
                      <span className="text-sm text-muted-foreground truncate max-w-[250px]">
                        {preset.description}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {preset.categories.tier1.length} categories
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditPreset(presetKey)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    {isEnabled ? (
                      <Eye className="h-4 w-4 text-green-600" />
                    ) : (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    )}
                    <Switch
                      checked={isEnabled}
                      onCheckedChange={(checked) => handleToggle(presetKey, checked)}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {hasChanges && (
        <div className="flex items-center gap-3 pt-4 border-t">
          <Button
            onClick={handleSave}
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
          <span className="text-sm text-muted-foreground">
            You have unsaved changes.
          </span>
        </div>
      )}

      {/* Edit Preset Dialog */}
      <Dialog open={editingPreset !== null} onOpenChange={(open) => !open && handleCancelEdit()}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Preset Categories</DialogTitle>
            <DialogDescription>
              Organize tier1 categories and their tier2 subcategories in your preferred order
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Preset Details */}
            <div className="space-y-4 pb-4 border-b">
              <div className="space-y-2">
                <Label htmlFor="preset-name">Preset Name</Label>
                <Input
                  id="preset-name"
                  value={presetForm.name}
                  onChange={(e) => setPresetForm({ ...presetForm, name: e.target.value })}
                  placeholder="Enter preset name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="preset-description">Description</Label>
                <Textarea
                  id="preset-description"
                  value={presetForm.description}
                  onChange={(e) => setPresetForm({ ...presetForm, description: e.target.value })}
                  placeholder="Enter preset description"
                  rows={2}
                />
              </div>
            </div>

            {/* Categories Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Current Categories (Drag to reorder)
                </h4>
                <Button variant="outline" size="sm" onClick={handleAddTier1}>
                  <Plus className="h-4 w-4 mr-2" /> Add Category
                </Button>
              </div>

              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="preset-categories">
                  {(provided) => (
                    <div className="space-y-4" {...provided.droppableProps} ref={provided.innerRef}>
                      {presetForm.tier1Categories
                        .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
                        .map((tier1, tier1Index) => {
                          const mainColor = getMainCategoryColor(tier1Index);
                          const tier2Categories = presetForm.tier2Categories[tier1.name] || [];

                          return (
                            <Draggable
                              key={tier1Index}
                              draggableId={`tier1-${tier1Index}`}
                              index={tier1Index}
                            >
                              {(provided) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  className="border rounded-lg p-3 bg-slate-50"
                                >
                                  {/* Main Category */}
                                  <div className="rounded p-2 mb-2" style={{ backgroundColor: `${mainColor}15` }}>
                                    {editingTier1Index === tier1Index ? (
                                      <div className="space-y-2">
                                        <Input
                                          value={tier1.name}
                                          onChange={(e) => handleUpdateTier1(tier1Index, 'name', e.target.value)}
                                          className="text-sm"
                                          placeholder="Category name"
                                        />
                                        <Textarea
                                          value={tier1.description}
                                          onChange={(e) => handleUpdateTier1(tier1Index, 'description', e.target.value)}
                                          placeholder="Description (optional)"
                                          rows={1}
                                          className="text-sm"
                                        />
                                        <div className="flex gap-1">
                                          <Button size="sm" variant="outline" onClick={() => setEditingTier1Index(null)}>
                                            <Save className="h-3 w-3" />
                                          </Button>
                                          <Button size="sm" variant="outline" onClick={() => setEditingTier1Index(null)}>
                                            <X className="h-3 w-3" />
                                          </Button>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="flex items-start justify-between">
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-2">
                                            <div {...provided.dragHandleProps}>
                                              <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab active:cursor-grabbing" />
                                            </div>
                                            <Tags className="h-4 w-4 flex-shrink-0" style={{ color: mainColor }} />
                                            <span className="font-semibold text-base truncate">{tier1.name}</span>
                                          </div>
                                          {tier1.description && (
                                            <div className="mt-1 ml-10">
                                              <button
                                                onClick={() => toggleDescription(`tier1-${tier1Index}`)}
                                                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors group"
                                              >
                                                <ChevronDown
                                                  className={`h-3 w-3 transition-transform ${expandedDescriptions.has(`tier1-${tier1Index}`) ? 'rotate-180' : ''}`}
                                                />
                                                <span className="text-left">
                                                  {expandedDescriptions.has(`tier1-${tier1Index}`)
                                                    ? tier1.description
                                                    : getDescriptionPreview(tier1.description)}
                                                </span>
                                              </button>
                                            </div>
                                          )}
                                        </div>
                                        <DropdownMenu>
                                          <DropdownMenuTrigger asChild>
                                            <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                                              <MoreVertical className="h-3 w-3" />
                                            </Button>
                                          </DropdownMenuTrigger>
                                          <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => setEditingTier1Index(tier1Index)}>
                                              <Edit2 className="h-3 w-3 mr-2" />
                                              Edit
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                              onClick={() => handleRemoveTier1(tier1Index)}
                                              className="text-red-600 focus:text-red-600"
                                            >
                                              <Trash2 className="h-3 w-3 mr-2" />
                                              Delete
                                            </DropdownMenuItem>
                                          </DropdownMenuContent>
                                        </DropdownMenu>
                                      </div>
                                    )}
                                  </div>

                                  {/* Sub Categories */}
                                  {tier2Categories.length > 0 && (
                                    <div className="ml-4 space-y-1">
                                      <div className="flex items-center justify-between mb-2">
                                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Subcategories:</p>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={() => setAddingSubcategoryFor(tier1.name)}
                                          className="h-6 text-xs"
                                        >
                                          <Plus className="h-3 w-3 mr-1" /> Add Subcategory
                                        </Button>
                                      </div>
                                      {tier2Categories.map((tier2, tier2Index) => (
                                        <div key={tier2Index} className="rounded p-2" style={{ backgroundColor: `${mainColor}10` }}>
                                          {editingTier2Key === tier1.name && editingTier2Index === tier2Index ? (
                                            <div className="space-y-2">
                                              <Input
                                                value={tier2.name}
                                                onChange={(e) => handleUpdateTier2(tier1.name, tier2Index, 'name', e.target.value)}
                                                className="text-sm"
                                                placeholder="Subcategory name"
                                              />
                                              <Textarea
                                                value={tier2.description}
                                                onChange={(e) => handleUpdateTier2(tier1.name, tier2Index, 'description', e.target.value)}
                                                placeholder="Description (optional)"
                                                rows={1}
                                                className="text-sm"
                                              />
                                              <div className="flex gap-1">
                                                <Button size="sm" variant="outline" onClick={() => { setEditingTier2Key(null); setEditingTier2Index(null); }}>
                                                  <Save className="h-3 w-3" />
                                                </Button>
                                                <Button size="sm" variant="outline" onClick={() => { setEditingTier2Key(null); setEditingTier2Index(null); }}>
                                                  <X className="h-3 w-3" />
                                                </Button>
                                              </div>
                                            </div>
                                          ) : (
                                            <div className="flex items-start justify-between">
                                              <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                  <Tags className="h-3 w-3 ml-2 flex-shrink-0" style={{ color: mainColor }} />
                                                  <span className="font-medium text-sm truncate">{tier2.name}</span>
                                                </div>
                                                {tier2.description && (
                                                  <div className="mt-0.5 ml-7">
                                                    <button
                                                      onClick={() => toggleDescription(`tier2-${tier1Index}-${tier2Index}`)}
                                                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors group"
                                                    >
                                                      <ChevronDown
                                                        className={`h-2.5 w-2.5 transition-transform ${expandedDescriptions.has(`tier2-${tier1Index}-${tier2Index}`) ? 'rotate-180' : ''}`}
                                                      />
                                                      <span className="text-left">
                                                        {expandedDescriptions.has(`tier2-${tier1Index}-${tier2Index}`)
                                                          ? tier2.description
                                                          : getDescriptionPreview(tier2.description, 40)}
                                                      </span>
                                                    </button>
                                                  </div>
                                                )}
                                              </div>
                                              <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                  <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                                                    <MoreVertical className="h-3 w-3" />
                                                  </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                  <DropdownMenuItem onClick={() => handleAddTask(tier1.name, tier2.name)}>
                                                    <FileText className="h-3 w-3 mr-2" />
                                                    Add Task
                                                  </DropdownMenuItem>
                                                  <DropdownMenuItem onClick={() => { setEditingTier2Key(tier1.name); setEditingTier2Index(tier2Index); }}>
                                                    <Edit2 className="h-3 w-3 mr-2" />
                                                    Edit
                                                  </DropdownMenuItem>
                                                  <DropdownMenuItem
                                                    onClick={() => handleRemoveTier2(tier1.name, tier2Index)}
                                                    className="text-red-600 focus:text-red-600"
                                                  >
                                                    <Trash2 className="h-3 w-3 mr-2" />
                                                    Delete
                                                  </DropdownMenuItem>
                                                </DropdownMenuContent>
                                              </DropdownMenu>
                                            </div>
                                          )}

                                          {/* Show tasks for this subcategory */}
                                          {(() => {
                                            const categoryTasks = getTasksForCategory(tier1.name, tier2.name);
                                            const taskListKey = `${tier1.name}-${tier2.name}`;
                                            const isTaskListExpanded = expandedTaskLists.has(taskListKey);

                                            if (categoryTasks.length > 0) {
                                              return (
                                                <Collapsible
                                                  open={isTaskListExpanded}
                                                  onOpenChange={() => toggleTaskList(tier1.name, tier2.name)}
                                                  className="mt-2 ml-5"
                                                >
                                                  <CollapsibleTrigger asChild>
                                                    <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground font-medium transition-colors">
                                                      <ChevronRight className={`h-3 w-3 transition-transform ${isTaskListExpanded ? 'rotate-90' : ''}`} />
                                                      <span>Tasks ({categoryTasks.length})</span>
                                                    </button>
                                                  </CollapsibleTrigger>
                                                  <CollapsibleContent className="space-y-1 mt-1">
                                                    {categoryTasks.map((task: TaskTemplate) => (
                                                      <div key={task.id} className="text-xs bg-white rounded px-2 py-1.5 border hover:border-gray-300 transition-colors">
                                                        <div className="flex items-center gap-2">
                                                          <ListTodo className="h-3 w-3 text-gray-500 flex-shrink-0" />
                                                          <span className="flex-1 font-medium truncate">{task.title}</span>
                                                          <span className="text-xs text-muted-foreground flex-shrink-0">{task.estimatedDuration}d</span>
                                                          <div className="flex gap-1 ml-2 flex-shrink-0">
                                                            <Button
                                                              size="sm"
                                                              variant="ghost"
                                                              onClick={() => handleEditTask(tier1.name, tier2.name, task.id)}
                                                              className="h-5 w-5 p-0"
                                                              title="Edit task template"
                                                            >
                                                              <Edit2 className="h-3 w-3" />
                                                            </Button>
                                                            <Button
                                                              size="sm"
                                                              variant="ghost"
                                                              onClick={() => handleDeleteTask(tier1.name, tier2.name, task.id)}
                                                              className="h-5 w-5 p-0 text-red-600 hover:text-red-700"
                                                              title="Delete task template"
                                                            >
                                                              <Trash2 className="h-3 w-3" />
                                                            </Button>
                                                          </div>
                                                        </div>
                                                        {task.description && (
                                                          <div className="mt-1 ml-5">
                                                            <button
                                                              onClick={() => toggleDescription(`task-${tier1Index}-${tier2Index}-${task.id}`)}
                                                              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                                                            >
                                                              <ChevronDown
                                                                className={`h-2.5 w-2.5 transition-transform ${expandedDescriptions.has(`task-${tier1Index}-${tier2Index}-${task.id}`) ? 'rotate-180' : ''}`}
                                                              />
                                                              <span className="text-left">
                                                                {expandedDescriptions.has(`task-${tier1Index}-${tier2Index}-${task.id}`)
                                                                  ? task.description
                                                                  : getDescriptionPreview(task.description, 35)}
                                                              </span>
                                                            </button>
                                                          </div>
                                                        )}
                                                      </div>
                                                    ))}
                                                  </CollapsibleContent>
                                                </Collapsible>
                                              );
                                            }
                                            return null;
                                          })()}
                                        </div>
                                      ))}
                                    </div>
                                  )}

                                  {/* Add Subcategory Section */}
                                  {addingSubcategoryFor === tier1.name ? (
                                    <div className="ml-4 mt-2 bg-gray-50 p-3 rounded space-y-3">
                                      <div>
                                        <Label htmlFor={`subcat-name-${tier1Index}`}>Subcategory Name</Label>
                                        <Input
                                          id={`subcat-name-${tier1Index}`}
                                          value={newSubcategoryName}
                                          onChange={(e) => setNewSubcategoryName(e.target.value)}
                                          placeholder="e.g., Planning"
                                          className="text-sm"
                                        />
                                      </div>
                                      <div>
                                        <Label htmlFor={`subcat-desc-${tier1Index}`}>Description (Optional)</Label>
                                        <Textarea
                                          id={`subcat-desc-${tier1Index}`}
                                          value={newSubcategoryDescription}
                                          onChange={(e) => setNewSubcategoryDescription(e.target.value)}
                                          placeholder="Describe this subcategory..."
                                          rows={2}
                                          className="text-sm"
                                        />
                                      </div>
                                      <div className="flex gap-2">
                                        <Button
                                          size="sm"
                                          onClick={() => handleAddSubcategory(tier1.name)}
                                          className="text-xs"
                                        >
                                          <Plus className="h-3 w-3 mr-1" /> Add
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => {
                                            setAddingSubcategoryFor(null);
                                            setNewSubcategoryName("");
                                            setNewSubcategoryDescription("");
                                          }}
                                          className="text-xs"
                                        >
                                          Cancel
                                        </Button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="ml-4 mt-2">
                                      {tier2Categories.length === 0 ? (
                                        <div className="flex items-center gap-2">
                                          <span className="text-xs text-muted-foreground italic">No subcategories yet</span>
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => setAddingSubcategoryFor(tier1.name)}
                                            className="h-6 text-xs"
                                          >
                                            <Plus className="h-3 w-3 mr-1" /> Add Subcategory
                                          </Button>
                                        </div>
                                      ) : (
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={() => setAddingSubcategoryFor(tier1.name)}
                                          className="h-6 text-xs"
                                        >
                                          <Plus className="h-3 w-3 mr-1" /> Add Another Subcategory
                                        </Button>
                                      )}
                                    </div>
                                  )}
                                </div>
                              )}
                            </Draggable>
                          );
                        })}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={handleCancelEdit}>
              Cancel
            </Button>
            <Button onClick={handleSavePreset}>
              Save Preset
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Task Edit/Add Dialog */}
      <Dialog open={taskDialogOpen} onOpenChange={setTaskDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{taskForm.taskId ? 'Edit Task Template' : 'Add Task Template'}</DialogTitle>
            <DialogDescription>
              {taskForm.taskId ? 'Update the task template details' : 'Create a new task template for this category'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="task-title">Task Title *</Label>
              <Input
                id="task-title"
                value={taskForm.title}
                onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                placeholder="Enter task title"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="task-description">Description</Label>
              <Textarea
                id="task-description"
                value={taskForm.description}
                onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                placeholder="Enter task description"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="task-duration">Estimated Duration (days) *</Label>
              <Input
                id="task-duration"
                type="number"
                min="0.5"
                step="0.5"
                value={taskForm.estimatedDuration}
                onChange={(e) => setTaskForm({ ...taskForm, estimatedDuration: parseFloat(e.target.value) || 1 })}
              />
            </div>

            <div className="text-sm text-muted-foreground">
              <p><strong>Category:</strong> {taskForm.tier1} → {taskForm.tier2}</p>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setTaskDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveTask}>
              {taskForm.taskId ? 'Update Task' : 'Add Task'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default PresetAvailability;









