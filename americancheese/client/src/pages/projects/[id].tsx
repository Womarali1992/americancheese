import { useState, useMemo } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/ui/status-badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TaskGanttView } from "@/components/charts/TaskGanttView";
import { formatDate, formatCurrency } from "@/lib/utils";
import { AvatarGroup } from "@/components/ui/avatar-group";
import { TasksTabView } from "@/components/project/TasksTabView";
import { ResourcesTabNew } from "@/components/project/ResourcesTabNew";
import { ContextEditor } from "@/components/context";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ContextData } from "@shared/context-types";
import { useToast } from "@/hooks/use-toast";
import {
  Calendar,
  MapPin,
  Users,
  ArrowLeft,
  Clipboard,
  Package,
  Plus,
  Settings,
  Palette,
  FileStack,
  Check,
  FileCode2,
  ChevronDown,
  Download,
  Share2,
  DollarSign
} from "lucide-react";
import { BudgetVarianceChart } from "@/components/charts/BudgetVarianceChart";
import { CreateTaskDialog } from "@/pages/tasks/CreateTaskDialog";
import { EditProjectDialog } from "./EditProjectDialog";
import { ShareProjectDialog } from "@/components/project/ShareProjectDialog";
import { ProjectDescriptionEditor } from "@/components/project/ProjectDescriptionEditor";
import { useProjectTheme } from "@/hooks/useProjectTheme";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getPresetOptions } from "@shared/presets.ts";
import { PROJECT_THEMES } from "@/lib/project-themes";
import { COLOR_THEMES } from "@/lib/color-themes";

interface EnabledThemesResponse {
  enabledThemes: string[];
}

interface EnabledPresetsResponse {
  enabledPresets: string[];
}

// Mock users for avatar group
const mockUsers = [
  { name: "John Doe", image: undefined },
  { name: "Jane Smith", image: undefined },
  { name: "Robert Chen", image: undefined },
];

export default function ProjectDetailPage() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const projectId = Number(params.id);
  const [showTaskDialog, setShowTaskDialog] = useState(false);
  const [showEditProjectDialog, setShowEditProjectDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showThemeDialog, setShowThemeDialog] = useState(false);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [preselectedCategory, setPreselectedCategory] = useState<{ tier1Category: string, tier2Category: string } | null>(null);
  const [contextOpen, setContextOpen] = useState(false);
  const { theme: projectTheme, themeName } = useProjectTheme(projectId);
  const { toast } = useToast();
  
  // Get project details
  const { data: project, isLoading: isLoadingProject } = useQuery({
    queryKey: ["/api/projects", projectId],
    queryFn: async () => {
      const response = await fetch(`/api/projects/${projectId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch project");
      }
      return await response.json();
    },
  });

  // Fetch enabled themes for the theme selector
  const { data: enabledThemesData } = useQuery<EnabledThemesResponse>({
    queryKey: ['/api/global-settings/enabled-themes'],
  });

  // Fetch enabled presets for the preset selector
  const { data: enabledPresetsData } = useQuery<EnabledPresetsResponse>({
    queryKey: ['/api/global-settings/enabled-presets'],
  });

  // Get the list of available presets (filtered by enabled presets)
  // Always include "none" option plus enabled presets
  // Also include the current project's preset even if disabled
  const availablePresets = useMemo(() => {
    const allPresets = getPresetOptions();
    
    // If no enabled presets data or empty array, show all presets
    if (!enabledPresetsData || enabledPresetsData.enabledPresets.length === 0) {
      return allPresets;
    }
    
    return allPresets.filter(preset => 
      preset.value === 'none' || 
      enabledPresetsData.enabledPresets.includes(preset.value) ||
      preset.value === project?.presetId
    );
  }, [enabledPresetsData, project?.presetId]);

  // Get the list of available themes (filtered by enabled themes)
  // Always include the current project's theme even if disabled
  const availableThemes = useMemo(() => {
    // If no enabled themes data or empty array, show all themes
    if (!enabledThemesData || enabledThemesData.enabledThemes.length === 0) {
      return PROJECT_THEMES;
    }
    
    // Convert enabled theme keys to theme names for matching
    const enabledThemeNames = new Set(
      enabledThemesData.enabledThemes.map(key => COLOR_THEMES[key]?.name).filter(Boolean)
    );
    
    // Filter to enabled themes, but always include current theme
    return PROJECT_THEMES.filter(theme => 
      enabledThemeNames.has(theme.name) || theme.name === themeName
    );
  }, [enabledThemesData, themeName]);
  
  // Get tasks for this project
  const { data: tasks, isLoading: isLoadingTasks } = useQuery({
    queryKey: ["/api/projects", projectId, "tasks"],
    queryFn: async () => {
      const response = await fetch(`/api/projects/${projectId}/tasks`);
      if (!response.ok) {
        throw new Error("Failed to fetch tasks");
      }
      return await response.json();
    },
  });

  // Get subtasks for this project's tasks
  const { data: subtasks = [], isLoading: isLoadingSubtasks } = useQuery({
    queryKey: ["/api/subtasks"],
    queryFn: async () => {
      const response = await fetch("/api/subtasks");
      if (!response.ok) {
        throw new Error("Failed to fetch subtasks");
      }
      return await response.json();
    },
  });
  
  // Get expenses for this project
  const { data: expenses, isLoading: isLoadingExpenses } = useQuery({
    queryKey: ["/api/projects", projectId, "expenses"],
    queryFn: async () => {
      const response = await fetch(`/api/projects/${projectId}/expenses`);
      if (!response.ok) {
        throw new Error("Failed to fetch expenses");
      }
      return await response.json();
    },
  });
  
  // Get materials for this project
  const { data: materials, isLoading: isLoadingMaterials } = useQuery({
    queryKey: ["/api/projects", projectId, "materials"],
    queryFn: async () => {
      const response = await fetch(`/api/projects/${projectId}/materials`);
      if (!response.ok) {
        throw new Error("Failed to fetch materials");
      }
      return await response.json();
    },
  });

  // Get budget summary for this project
  const { data: budgetSummary, isLoading: isLoadingBudget } = useQuery({
    queryKey: ["/api/projects", projectId, "budget-summary"],
    queryFn: async () => {
      const response = await fetch(`/api/projects/${projectId}/budget-summary`);
      if (!response.ok) {
        throw new Error("Failed to fetch budget summary");
      }
      return await response.json();
    },
  });

  const isLoading = isLoadingProject || isLoadingTasks || isLoadingSubtasks || isLoadingExpenses || isLoadingMaterials;

  // Create a map of taskId -> task for subtask parent lookup
  const taskMap = useMemo(() => {
    const map = new Map<number, any>();
    tasks?.forEach((task: any) => {
      map.set(task.id, task);
    });
    return map;
  }, [tasks]);

  // Get task IDs for this project to filter subtasks
  const projectTaskIds = useMemo(() => {
    return new Set(tasks?.map((t: any) => t.id) || []);
  }, [tasks]);

  // Filter subtasks to only those belonging to this project's tasks
  const projectSubtasks = useMemo(() => {
    return subtasks.filter((s: any) => projectTaskIds.has(s.parentTaskId));
  }, [subtasks, projectTaskIds]);
  
  // Filter tasks based on hidden categories
  const hiddenCategories = project?.hiddenCategories || [];
  const filteredTasks = tasks?.filter((task: any) => {
    // Skip tasks with hidden tier1 categories
    const tier1 = task.tier1Category?.toLowerCase();
    if (tier1 && hiddenCategories.includes(tier1)) {
      return false;
    }
    return true;
  }) || [];
  
  // Filter tasks for Gantt chart - only calendar-active tasks with dates
  const calendarActiveTasks = useMemo(() => {
    return filteredTasks.filter((task: any) =>
      task.calendarActive !== false && task.startDate && task.endDate
    );
  }, [filteredTasks]);

  // Filter subtasks for Gantt chart - only calendar-active subtasks with dates
  const calendarActiveSubtasks = useMemo(() => {
    return projectSubtasks.filter((subtask: any) =>
      subtask.calendarActive !== false && subtask.startDate && subtask.endDate
    );
  }, [projectSubtasks]);

  // Check if there are any items for the Gantt chart
  const hasGanttItems = calendarActiveTasks.length > 0 || calendarActiveSubtasks.length > 0;
  
  // Process budget data
  const totalExpenses = expenses?.reduce((acc, expense) => acc + expense.amount, 0) || 0;

  // Context mutation for saving AI context
  const saveContextMutation = useMutation({
    mutationFn: async (context: ContextData) => {
      const response = await apiRequest(`/api/projects/${projectId}/context`, "PUT", { context });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId] });
      toast({
        title: "Context saved",
        description: "AI context has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save AI context.",
        variant: "destructive",
      });
    },
  });

  // Parse existing context from project
  const existingContext: ContextData | null = useMemo(() => {
    if (!project?.structuredContext) return null;
    try {
      return JSON.parse(project.structuredContext);
    } catch {
      return null;
    }
  }, [project?.structuredContext]);

  // Handle back button
  const handleBack = () => {
    setLocation("/projects");
  };

  // Handle export project
  const handleExportProject = async () => {
    try {
      // Export as JSON (v2.0 format with categories)
      const response = await fetch(`/api/projects/${projectId}/export?format=json`);
      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${project.name.replace(/[^a-zA-Z0-9]/g, '_')}_export.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Success",
        description: "Project exported successfully (JSON format with categories)",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export project",
        variant: "destructive",
      });
    }
  };

  if (isLoading || !project) {
    return (
      <Layout>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-1/4"></div>
          <div className="h-40 bg-slate-200 rounded"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="h-60 bg-slate-200 rounded"></div>
            <div className="h-60 bg-slate-200 rounded"></div>
          </div>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout title={project.name}>
      <div className="space-y-6">
        {/* Clean Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={handleBack} className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">{project.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <StatusBadge status={project.status} />
                {project.memberRole && project.memberRole !== 'owner' && (
                  <Badge variant="outline" className="text-xs capitalize">
                    {project.memberRole === 'viewer' ? 'View Only' : `Shared (${project.memberRole})`}
                  </Badge>
                )}
                <span className="text-sm text-muted-foreground">{formatDate(project.startDate)} - {formatDate(project.endDate)}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setShowThemeDialog(true)}
            >
              <Palette className="h-4 w-4 mr-2" />
              Theme
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowTemplateDialog(true)}
            >
              <FileStack className="h-4 w-4 mr-2" />
              Templates
            </Button>
            <Button
              variant="outline"
              onClick={handleExportProject}
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowShareDialog(true)}
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowEditProjectDialog(true)}
            >
              <Settings className="h-4 w-4 mr-2" />
              Edit Project
            </Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => setShowTaskDialog(true)}
            >
              <Plus className="h-4 w-4 mr-2" /> Add Task
            </Button>
          </div>
        </div>
        
        {/* Project Overview Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Left Column: Project Info */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Project Overview</h3>
                
                <div className="mb-4">
                  <ProjectDescriptionEditor project={project} />
                </div>

                {/* AI Context Editor */}
                <div className="mb-4">
                  <Collapsible open={contextOpen} onOpenChange={setContextOpen}>
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="ghost"
                        className="w-full flex items-center justify-between px-3 py-2 border border-dashed border-slate-300 rounded-lg hover:bg-slate-50"
                      >
                        <div className="flex items-center gap-2">
                          <FileCode2 className="h-4 w-4 text-slate-500" />
                          <span className="text-sm font-medium text-slate-700">AI Context</span>
                          {existingContext && (
                            <Badge variant="secondary" className="text-xs">Configured</Badge>
                          )}
                        </div>
                        <ChevronDown className={`h-4 w-4 text-slate-500 transition-transform ${contextOpen ? 'rotate-180' : ''}`} />
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-2">
                      <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/50">
                        <p className="text-xs text-slate-500 mb-3">
                          Configure structured context for AI/LLM assistants. Changes are saved automatically.
                        </p>
                        <ContextEditor
                          entityId={`project-${projectId}`}
                          entityType="project"
                          initialContext={existingContext}
                          onChange={(context) => saveContextMutation.mutate(context)}
                          compact
                        />
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <MapPin className="text-muted-foreground h-4 w-4" />
                    <span className="text-muted-foreground">Location:</span>
                    <span className="font-medium">{project.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="text-muted-foreground h-4 w-4" />
                    <span className="text-muted-foreground">Team:</span>
                    <AvatarGroup users={mockUsers} max={3} size="sm" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Right Column: Budget Summary */}
          <div>
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Budget Summary</h3>
                <div className="space-y-4">
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-xs text-blue-600 font-medium uppercase tracking-wide">Total Budget</p>
                    <p className="text-2xl font-bold text-blue-800">{formatCurrency(project.budget || 0)}</p>
                  </div>
                  
                  <div className="bg-green-50 p-3 rounded-lg">
                    <p className="text-xs text-green-600 font-medium uppercase tracking-wide">Spent</p>
                    <p className="text-2xl font-bold text-green-800">{formatCurrency(totalExpenses)}</p>
                  </div>
                  
                  <div className="bg-purple-50 p-3 rounded-lg">
                    <p className="text-xs text-purple-600 font-medium uppercase tracking-wide">Remaining</p>
                    <p className="text-2xl font-bold text-purple-800">{formatCurrency((project.budget || 0) - totalExpenses)}</p>
                  </div>
                  
                  <div className="pt-2">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Budget Used</span>
                      <span>{project.budget ? Math.round((totalExpenses / project.budget) * 100) : 0}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          (project.budget && (totalExpenses / project.budget) > 0.9) ? 'bg-red-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${project.budget ? Math.min((totalExpenses / project.budget) * 100, 100) : 0}%` }}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        
        
        {/* Main Content Tabs */}
        <Tabs defaultValue="tasks" className="space-y-6">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="tasks" className="flex items-center gap-2">
              <Clipboard className="h-4 w-4" />
              Tasks & Settings
            </TabsTrigger>
            <TabsTrigger value="timeline" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Timeline
            </TabsTrigger>
            <TabsTrigger value="resources" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Resources
            </TabsTrigger>
            <TabsTrigger value="budget" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Budget
            </TabsTrigger>
          </TabsList>


          <TabsContent value="tasks" className="space-y-6">
            <TasksTabView
              tasks={tasks || []}
              projectId={projectId}
              project={project}
              onAddTask={() => setShowTaskDialog(true)}
            />
          </TabsContent>
          
          <TabsContent value="timeline" className="space-y-0">
            <Card>
              <CardHeader>
                <CardTitle>Project Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="min-h-[400px]">
                  {hasGanttItems ? (
                    <TaskGanttView
                      tasks={calendarActiveTasks}
                      subtasks={calendarActiveSubtasks}
                      taskMap={taskMap}
                      projectId={projectId}
                      title={`${project.name} Timeline`}
                      subtitle="tasks and subtasks schedule"
                      viewPeriod={7}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground">
                      <Calendar className="h-16 w-16 mb-4" />
                      <p className="text-lg mb-2">No tasks to display</p>
                      <Button onClick={() => setShowTaskDialog(true)}>
                        <Plus className="h-4 w-4 mr-2" /> Add Your First Task
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="resources" className="space-y-0">
            <ResourcesTabNew projectId={projectId} />
          </TabsContent>

          <TabsContent value="budget" className="space-y-0">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Budget Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingBudget ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
                  </div>
                ) : budgetSummary?.categories?.length > 0 ? (
                  <BudgetVarianceChart
                    data={budgetSummary.categories}
                    title="Project Budget Variance"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                    <DollarSign className="h-16 w-16 mb-4" />
                    <p className="text-lg mb-2">No budget data yet</p>
                    <p className="text-sm text-center max-w-md">
                      Add estimated and actual costs to your tasks to see budget variance analysis.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        
        {/* Task Creation Dialog */}
        <CreateTaskDialog
          open={showTaskDialog}
          onOpenChange={(open) => {
            setShowTaskDialog(open);
            if (!open) {
              setPreselectedCategory(null);
            }
          }}
          projectId={projectId}
          preselectedCategory={preselectedCategory}
        />

        {/* Edit Project Dialog */}
        <EditProjectDialog
          open={showEditProjectDialog}
          onOpenChange={setShowEditProjectDialog}
          project={project}
          onDelete={() => {
            // Redirect to projects page after deletion
            setLocation('/projects');
          }}
        />

        {/* Share Project Dialog */}
        <ShareProjectDialog
          open={showShareDialog}
          onOpenChange={setShowShareDialog}
          projectId={projectId}
          projectName={project?.name || ""}
          isOwner={project?.memberRole === "owner" || !project?.memberRole}
          userRole={project?.memberRole || null}
        />

        {/* Theme Dialog */}
        <Dialog open={showThemeDialog} onOpenChange={setShowThemeDialog}>
          <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Project Theme</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <div className="space-y-6">
                <div className="p-4 border rounded-lg bg-muted/20">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-medium flex items-center gap-2">Current: {themeName}</h4>
                      <p className="text-sm text-muted-foreground">
                        {PROJECT_THEMES.find(t => t.name === themeName)?.description}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3">Available Themes</h4>
                  <div className="grid grid-cols-1 gap-4">
                    {availableThemes.map((theme) => {
                      const isSelected = themeName === theme.name;

                      return (
                        <div
                          key={theme.name}
                          className={`cursor-pointer p-4 border rounded-lg transition-all hover:shadow-md hover:border-gray-300 ${
                            isSelected ? 'ring-2 ring-blue-500 border-blue-500 bg-blue-50/50' : ''
                          }`}
                          onClick={async () => {
                            try {
                              const response = await fetch(`/api/projects/${projectId}`, {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ colorTheme: theme.name })
                              });

                              if (response.ok) {
                                queryClient.invalidateQueries({ queryKey: ['/api/projects', projectId] });
                                queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
                                setShowThemeDialog(false);
                              } else {
                                alert('Failed to update theme');
                              }
                            } catch (error) {
                              alert('Failed to update theme');
                            }
                          }}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">{theme.name}</span>
                            {isSelected && (
                              <Check className="h-4 w-4 text-blue-600" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{theme.description}</p>
                          <div className="space-y-3">
                            {/* Category 1: Primary */}
                            <div>
                              <div className="h-6 rounded-sm border mb-1" style={{ backgroundColor: theme.primary }} />
                              <div className="grid grid-cols-5 gap-1">
                                {theme.subcategories?.slice(0, 5).map((color, index) => (
                                  <div key={index} className="h-3 rounded-sm border" style={{ backgroundColor: color }} />
                                ))}
                              </div>
                            </div>

                            {/* Category 2: Secondary */}
                            <div>
                              <div className="h-6 rounded-sm border mb-1" style={{ backgroundColor: theme.secondary }} />
                              <div className="grid grid-cols-5 gap-1">
                                {theme.subcategories?.slice(5, 10).map((color, index) => (
                                  <div key={index} className="h-3 rounded-sm border" style={{ backgroundColor: color }} />
                                ))}
                              </div>
                            </div>

                            {/* Category 3: Accent */}
                            <div>
                              <div className="h-6 rounded-sm border mb-1" style={{ backgroundColor: theme.accent }} />
                              <div className="grid grid-cols-5 gap-1">
                                {theme.subcategories?.slice(10, 15).map((color, index) => (
                                  <div key={index} className="h-3 rounded-sm border" style={{ backgroundColor: color }} />
                                ))}
                              </div>
                            </div>

                            {/* Category 4: Muted */}
                            <div>
                              <div className="h-6 rounded-sm border mb-1" style={{ backgroundColor: theme.muted }} />
                              <div className="grid grid-cols-5 gap-1">
                                {theme.subcategories?.slice(15, 20).map((color, index) => (
                                  <div key={index} className="h-3 rounded-sm border" style={{ backgroundColor: color }} />
                                ))}
                              </div>
                            </div>

                            {/* Category 5: Border (Permitting) */}
                            <div>
                              <div className="h-6 rounded-sm border mb-1" style={{ backgroundColor: theme.border }} />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Template Dialog */}
        <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Load Template Set</DialogTitle>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <p className="text-sm text-muted-foreground">
                Choose a preset to add the first 4 categories and their tasks to your project
              </p>
              <Select onValueChange={async (presetId) => {
                try {
                  // First load the preset categories (limited to first 4)
                  const categoriesResponse = await fetch(`/api/projects/${projectId}/load-preset-categories`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ presetId, replaceExisting: true })
                  });
                  if (!categoriesResponse.ok) throw new Error('Failed to load preset categories');
                  const categoriesResult = await categoriesResponse.json();

                  // Then load the tasks for the preset (limited to first 4 categories)
                  const tasksResponse = await fetch(`/api/projects/${projectId}/create-tasks-from-templates`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ presetId, replaceExisting: false })
                  });
                  if (!tasksResponse.ok) throw new Error('Failed to load preset tasks');
                  const tasksResult = await tasksResponse.json();

                  // Refresh the UI
                  queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "template-categories"] });
                  queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "tasks"] });
                  queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId] });

                  alert(`Loaded ${categoriesResult.categoriesCreated} categories and ${tasksResult.createdTasks || 0} tasks from preset (first 4 categories only)`);
                  setShowTemplateDialog(false);
                } catch (error) {
                  alert('Failed to load preset');
                }
              }}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose a template set..." />
                </SelectTrigger>
                <SelectContent>
                  {availablePresets.map(preset => (
                    <SelectItem key={preset.value} value={preset.value}>
                      <div className="flex flex-col text-left">
                        <span className="font-medium">{preset.label}</span>
                        <span className="text-xs text-muted-foreground">{preset.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}