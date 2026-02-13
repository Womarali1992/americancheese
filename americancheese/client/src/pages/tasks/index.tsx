import React, { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { Layout } from "@/components/layout/Layout";
import { TaskAttachments } from "@/components/task/TaskAttachments";
import { TaskLabor } from "@/components/task/TaskLabor";
import { TaskMaterials } from "@/components/task/TaskMaterials";
import { TaskMaterialsView } from "@/components/materials/TaskMaterialsView";
import { ProjectSelector } from "@/components/project/ProjectSelector";
import { getMergedTasks } from "@/components/task/TaskTemplateService";
import { CategoryDescriptionEditor } from "@/components/task/CategoryDescriptionEditor";
import { AllProjectsCategoryDescriptions } from "@/components/task/AllProjectsCategoryDescriptions";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { hexToRgba, getTier1Color as getUnifiedTier1Color, getTier2Color as getUnifiedTier2Color, getStatusBgColor, formatTaskStatus } from "@/lib/unified-color-system";
import { useUnifiedColors } from "@/hooks/useUnifiedColors";
import { getProjectTheme } from "@/lib/project-themes";
import { Task, Project } from "@/types";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { StatusBadge } from "@/components/ui/status-badge";
import { CategoryBadge } from "@/components/ui/category-badge";
import { GanttChart } from "@/components/charts/GanttChartNew";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDate } from "@/lib/utils";
import { TaskCard } from "@/components/task/TaskCard";
import { useTier2CategoriesByTier1Name } from "@/hooks/useTemplateCategories";
import { useCategoryNameMapping } from "@/hooks/useCategoryNameMapping";
// Simple formatCategoryName
const centralizedFormatCategoryName = (name: string) => name.replace(/_/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
import {
  Search,
  Plus,
  Calendar,
  MoreHorizontal,
  Edit,
  Building,
  Zap,
  Droplet,
  HardHat,
  RefreshCw,
  Mailbox,
  X,
  FileCheck,
  Landmark,
  LayoutGrid,
  Construction,
  ChevronLeft,
  ChevronRight,
  User,
  Fan,
  Layers,
  Columns,
  Paintbrush,
  Trees,
  Grid,
  Package,
  Hammer,
  Cog,
  Home,
  PanelTop,
  Sofa,
  ArrowLeft,
  Trash2,
  CheckSquare,
  Square,
  Clock,
  Play,
  CheckCircle2,
  Circle,
  Filter,
  Upload
} from "lucide-react";
import { useNavPills } from "@/hooks/useNavPills";
import { useNav } from "@/contexts/NavContext";
import { CreateTaskDialog } from "./CreateTaskDialog";
import { EditTaskDialog } from "./EditTaskDialog";
import { ImportTaskDialog } from "./ImportTaskDialog";
import { ProjectDescriptionEditor } from "@/components/project/ProjectDescriptionEditor";

// Wrapper component to ensure each project gets its own isolated rendering context
function ProjectCategoriesSection({
  project,
  projectTasks,
  projectTier1Categories,
  projectTasksByTier1,
  setSelectedTier1,
  getTier1Icon,
  formatCategoryNameWithProject,
  getTier1Description,
  refreshKey,
  getProjectSpecificTier1Color
}: {
  project: Project;
  projectTasks: Task[];
  projectTier1Categories: string[];
  projectTasksByTier1: Record<string, Task[]>;
  setSelectedTier1: (tier1: string) => void;
  getTier1Icon: (tier1: string, className: string) => React.ReactElement;
  formatCategoryNameWithProject: (category: string) => string;
  getTier1Description: (tier1: string) => string;
  refreshKey: number;
  getProjectSpecificTier1Color: (projectId: number, categoryName: string) => string;
}) {
  return (
    <div key={project.id} className="space-y-3">
      {/* Project Header */}
      <div className="flex items-center gap-3 pb-2 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Building className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900">{project.name}</h2>
        </div>
        <span className="text-sm text-gray-500">
          {projectTasks.length} {projectTasks.length === 1 ? 'task' : 'tasks'}
        </span>
      </div>

      {/* Project Categories Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {projectTier1Categories.map((tier1: string) => {
          // Get tasks for this tier1 category (case-insensitive)
          const tasks = projectTasksByTier1[tier1] ||
            projectTasksByTier1[tier1.toLowerCase()] ||
            Object.entries(projectTasksByTier1).find(([key]) =>
              key.toLowerCase() === tier1.toLowerCase()
            )?.[1] || [];
          const completionPercentage = tasks.length > 0 ? Math.round((tasks.filter(t => t.completed === true || t.status === 'completed').length / tasks.length) * 100) : 0;

          return (
            <ProjectCategoryCard
              key={`${project.id}-${tier1}-${refreshKey}`}
              project={project}
              tier1={tier1}
              tasks={tasks}
              completionPercentage={completionPercentage}
              setLocation={setLocation}
              getTier1Icon={getTier1Icon}
              formatCategoryNameWithProject={formatCategoryNameWithProject}
              getTier1Description={getTier1Description}
              refreshKey={refreshKey}
              getProjectTier1Color={(categoryName: string) => getProjectSpecificTier1Color(project.id, categoryName)}
            />
          );
        })}
      </div>
    </div>
  );
}

// Component for project-specific category card with project-specific theme
// Component for project-specific category card with project-specific theme
function ProjectCategoryCard({
  project,
  tier1,
  tasks,
  completionPercentage,
  setLocation,
  getTier1Icon,
  formatCategoryNameWithProject,
  getTier1Description,
  refreshKey,
  getProjectTier1Color
}: {
  project: Project;
  tier1: string;
  tasks: Task[];
  completionPercentage: number;
  setLocation: (path: string) => void;
  getTier1Icon: (tier1: string, className: string) => React.ReactElement;
  formatCategoryNameWithProject: (category: string) => string;
  getTier1Description: (tier1: string) => string;
  refreshKey: number;
  getProjectTier1Color: (categoryName: string) => string;
}) {

  // Use the passed-in color function which handles project themes dynamically
  const tier1Color = getProjectTier1Color(tier1);
  const iconBgColor = hexToRgba(tier1Color, 0.1);

  const inProgress = tasks.filter(t => t.status === 'in_progress').length;
  const completed = tasks.filter(t => t.completed === true || t.status === 'completed').length;
  const totalTasks = tasks.length;

  return (
    <Card
      className="rounded-xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden w-full min-w-0 group h-full flex flex-col"
      onClick={() => {
        const params = new URLSearchParams();
        params.set('projectId', project.id.toString());
        params.set('tier1', tier1);
        setLocation(`/tasks?${params.toString()}`);
      }}
    >
      <div className="h-1.5 w-full shrink-0" style={{ backgroundColor: tier1Color }} />

      <div className="p-5 flex flex-col h-full">
        <div className="flex justify-between items-start mb-4">
          <div className="p-3 rounded-xl" style={{ backgroundColor: iconBgColor }}>
            {getTier1Icon(tier1, "h-6 w-6")}
          </div>
          <div className="text-right">
            <span className="text-2xl font-bold text-slate-900">{completionPercentage}%</span>
          </div>
        </div>

        <h3 className="text-lg font-semibold text-slate-900 capitalize mb-1 truncate" title={formatCategoryNameWithProject(tier1)}>
          {formatCategoryNameWithProject(tier1)}
        </h3>
        <p className="text-sm text-slate-500 line-clamp-2 h-10 mb-4">
          {getTier1Description(tier1)}
        </p>

        <div className="mt-auto">
          <div className="w-full bg-slate-100 rounded-full h-2 mb-3 overflow-hidden">
            <div
              className="rounded-full h-full transition-all duration-500 ease-out"
              style={{
                width: `${completionPercentage}%`,
                backgroundColor: tier1Color
              }}
            ></div>
          </div>
          <div className="flex justify-between items-center text-xs text-slate-500 border-t pt-3 border-slate-100">
            <div className="flex gap-3">
              <span>{completed} done</span>
              <span>{inProgress} active</span>
            </div>
            <span className="font-medium bg-slate-50 px-2 py-0.5 rounded-full text-slate-600">
              {totalTasks} total
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}

// New component for displaying tasks in a category
function CategoryTasksDisplay({
  selectedTier1,
  selectedTier2,
  tasksByTier2,
  projectFilter,
  getProjectName,
  setSelectedTask,
  setEditDialogOpen,
  activateTaskFromTemplate,
  expandedDescriptionTaskId,
  setExpandedDescriptionTaskId,
  isSelectionMode,
  selectedTasks,
  toggleTaskSelection,
  projects,
  allCategories
}: {
  selectedTier1: string | null;
  selectedTier2: string | null;
  tasksByTier2: Record<string, Record<string, Task[]>>;
  projectFilter: string;
  getProjectName: (id: number) => string;
  setSelectedTask: (task: Task) => void;
  setEditDialogOpen: (open: boolean) => void;
  activateTaskFromTemplate: (task: Task) => void;
  expandedDescriptionTaskId: number | null;
  setExpandedDescriptionTaskId: (id: number | null) => void;
  isSelectionMode: boolean;
  selectedTasks: Set<number>;
  toggleTaskSelection: (taskId: number) => void;
  projects: any[];
  allCategories: any[];
}) {
  // Get actual tasks for this category (normalize to lowercase for lookup)
  const actualTasks = tasksByTier2[(selectedTier1 || '').toLowerCase()]?.[(selectedTier2 || '').toLowerCase()] || [];
  const projectId = projectFilter !== "all" ? parseInt(projectFilter) : 0;

  // Get merged tasks including templates
  const mergedTasks = getMergedTasks(
    actualTasks,
    projectId,
    {
      tier1: selectedTier1 || undefined,
      tier2: selectedTier2 || undefined
    }
  );

  // Sort tasks by template ID (DR1, DR2, FR1, FR2, etc.)
  mergedTasks.sort((a, b) => {
    // Extract task codes and numbers from titles (e.g., "DR1", "FR2", "PL3", etc.)
    // This matches any 2-letter code followed by numbers
    const aMatch = a.title.match(/([A-Z]{2})(\d+)/i);
    const bMatch = b.title.match(/([A-Z]{2})(\d+)/i);

    // If both have code/number patterns
    if (aMatch && bMatch) {
      // First compare the code (DR, FR, PL, etc.)
      const aCode = aMatch[1].toUpperCase();
      const bCode = bMatch[1].toUpperCase();

      if (aCode === bCode) {
        // Same code, compare by number
        return parseInt(aMatch[2]) - parseInt(bMatch[2]);
      }

      // Different codes, sort alphabetically by code
      return aCode.localeCompare(bCode);
    }

    // If only one has a code pattern, prioritize it
    if (aMatch) return -1;
    if (bMatch) return 1;

    // Otherwise, sort alphabetically by title
    return a.title.localeCompare(b.title);
  });

  // Return an empty div if no tasks
  if (!mergedTasks || mergedTasks.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 border border-dashed rounded-md border-muted-foreground/50">
        <p className="text-muted-foreground">No tasks found for this category</p>
      </div>
    );
  }

  // Calculate progress color based on task category
  const getCategoryProgressColor = (category: string): string => {
    const lowerCategory = category.toLowerCase();

    if (lowerCategory.includes('foundation')) return 'bg-stone-500';
    if (lowerCategory.includes('framing')) return 'bg-amber-500';
    if (lowerCategory.includes('electric')) return 'bg-yellow-500';
    if (lowerCategory.includes('plumb')) return 'bg-blue-500';
    if (lowerCategory.includes('hvac')) return 'bg-sky-500';
    if (lowerCategory.includes('window')) return 'bg-orange-500';
    if (lowerCategory.includes('drywall')) return 'bg-neutral-500';
    if (lowerCategory.includes('floor')) return 'bg-amber-500';
    if (lowerCategory.includes('paint')) return 'bg-indigo-500';
    if (lowerCategory.includes('landscape')) return 'bg-emerald-500';

    return 'bg-orange-500';
  };

  return (
    <div className="space-y-4">
      {mergedTasks.map((task: Task) => {
        // Calculate progress
        const now = new Date();
        const start = new Date(task.startDate);
        const end = new Date(task.endDate);

        let progress = 0;
        if (task.status === "completed") progress = 100;
        else if (task.status === "not_started") progress = 0;
        else {
          // If task hasn't started yet
          if (now < start) progress = 0;
          // If task has ended
          else if (now > end) progress = task.status === "in_progress" ? 90 : 100;
          else {
            // Calculate progress based on dates
            const totalDuration = end.getTime() - start.getTime();
            const elapsedDuration = now.getTime() - start.getTime();
            progress = Math.round((elapsedDuration / totalDuration) * 100);
            progress = Math.min(progress, 100);
          }
        }

        return (
          <TaskCard
            key={task.id}
            task={task}
            compact={false}
            showActions={!isSelectionMode}
            showManageTasksButton={!isSelectionMode}
            getProjectName={getProjectName}
            isSelectionMode={isSelectionMode}
            isSelected={selectedTasks.has(task.id)}
            onToggleSelection={() => toggleTaskSelection(task.id)}
            projects={projects}
            adminCategories={allCategories}
          />
        );
      })}
    </div>
  );
}
// Using Task from @/types to ensure compatibility with frontend components

export default function TasksPage() {
  const [location, setLocation] = useLocation();
  const params = useParams();

  // Get project ID and category parameters from URL query parameter
  // Re-read on every render to catch URL changes
  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const projectIdFromUrl = searchParams.get('projectId') ? Number(searchParams.get('projectId')) : undefined;
  const tier1FromUrl = searchParams.get('tier1') || null;
  const tier2FromUrl = searchParams.get('tier2') || null;
  const { toast } = useToast();

  // Inject nav pills for TopNav
  useNavPills("tasks");
  const { setActions } = useNav();

  const [projectFilter, setProjectFilter] = useState(projectIdFromUrl ? projectIdFromUrl.toString() : "all");

  // Use project-specific theme when a project is selected, otherwise use global theme
  const projectIdForTheme = projectFilter !== "all" ? parseInt(projectFilter) : undefined;
  const { getTier1Color: hookGetTier1Color, getTier2Color: hookGetTier2Color, isLoading: colorsLoading } = useUnifiedColors(projectIdForTheme);
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Hierarchical category navigation state - initialize from URL parameters
  const [selectedTier1, setSelectedTier1] = useState<string | null>(tier1FromUrl);
  const [selectedTier2, setSelectedTier2] = useState<string | null>(tier2FromUrl);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Helper function to navigate with URL parameters
  const navigateWithParams = (tier1: string | null, tier2: string | null = null) => {
    const params = new URLSearchParams();
    if (projectFilter !== "all") {
      params.set('projectId', projectFilter);
    }
    if (tier1) {
      params.set('tier1', tier1);
    }
    if (tier2) {
      params.set('tier2', tier2);
    }
    const queryString = params.toString();
    const newUrl = `/tasks${queryString ? '?' + queryString : ''}`;

    // Update URL using history API
    window.history.pushState({}, '', newUrl);

    // Manually update state to trigger re-render
    setSelectedTier1(tier1);
    setSelectedTier2(tier2);
  };

  const [activeTab, setActiveTab] = useState<string>("list");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [expandedDescriptionTaskId, setExpandedDescriptionTaskId] = useState<number | null>(null);

  // Selection mode state
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedTasks, setSelectedTasks] = useState<Set<number>>(new Set());
  const [viewPeriod, setViewPeriod] = useState<1 | 3 | 10>(3);

  // Category management state
  const [hiddenCategories, setHiddenCategories] = useState<string[]>([]);
  // Derived completion map per Tier 1; computed via useMemo to avoid update loops
  // Deprecated state replaced by derived value below; keep no-op to retain structure if needed
  // const tier1Completion = useMemo(() => ({} as Record<string, number>), []);

  // Inject nav actions for TopNav
  useEffect(() => {
    setActions(
      <>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search tasks..."
            className="pl-9 h-9 w-48 bg-white border-slate-200 shadow-sm rounded-lg text-sm"
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[130px] h-9 border-slate-200 shadow-sm rounded-lg bg-white text-sm">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="not_started">Not Started</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
        <Button
          onClick={() => setCreateDialogOpen(true)}
          className="h-9 bg-green-600 hover:bg-green-700 text-white shadow-sm rounded-lg px-3 text-sm"
        >
          <Plus className="mr-1.5 h-4 w-4" />
          Add Task
        </Button>
      </>
    );
    return () => { setActions(null); };
  }, [searchQuery, statusFilter, setActions]);

  // Function to handle bulk task deletion
  const handleDeleteSelectedTasks = async () => {
    if (selectedTasks.size === 0) {
      toast({
        title: "No tasks selected",
        description: "Please select tasks to delete",
        variant: "destructive"
      });
      return;
    }

    try {
      // Delete each selected task
      const deletePromises = Array.from(selectedTasks).map(taskId =>
        apiRequest("DELETE", `/api/tasks/${taskId}`)
      );

      await Promise.all(deletePromises);

      // Clear selection and exit selection mode
      setSelectedTasks(new Set());
      setIsSelectionMode(false);

      // Refresh tasks
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });

      toast({
        title: "Success",
        description: `${selectedTasks.size} task(s) deleted successfully`,
        variant: "default"
      });
    } catch (error) {
      console.error("Failed to delete tasks:", error);
      toast({
        title: "Error",
        description: "Failed to delete selected tasks",
        variant: "destructive"
      });
    }
  };

  // Function to toggle task selection
  const toggleTaskSelection = (taskId: number) => {
    setSelectedTasks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  };

  // Function to toggle all tasks selection
  const toggleAllTasksSelection = () => {
    const visibleTasks = getMergedTasks(
      tasksByTier2[selectedTier1 || '']?.[selectedTier2 || ''] || [],
      projectFilter !== "all" ? parseInt(projectFilter) : 0,
      { tier1: selectedTier1 || undefined, tier2: selectedTier2 || undefined }
    );

    if (selectedTasks.size === visibleTasks.length) {
      // Deselect all
      setSelectedTasks(new Set());
    } else {
      // Select all visible tasks
      setSelectedTasks(new Set(visibleTasks.map(task => task.id)));
    }
  };

  // State for pre-selected category when adding task from category card
  // Can be a simple string (legacy) or an object with tier1 and tier2 categories
  type CategoryPreselection = string | { tier1Category: string, tier2Category: string, category: string } | null;
  const [preselectedCategory, setPreselectedCategory] = useState<CategoryPreselection>(null);

  const { data: projects = [], isLoading: projectsLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  // Determine whether to fetch all tasks or just tasks for a selected project
  const tasksQueryKey = projectFilter !== "all"
    ? ["/api/projects", Number(projectFilter), "tasks"]
    : ["/api/tasks"];

  const { data: tasks = [], isLoading: tasksLoading } = useQuery<Task[]>({
    queryKey: tasksQueryKey,
    queryFn: async () => {
      const url = projectFilter !== "all"
        ? `/api/projects/${projectFilter}/tasks`
        : "/api/tasks";
      const response = await fetch(url, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) {
        throw new Error("Failed to fetch tasks");
      }
      return response.json();
    },
  });

  // Initialize project theme system
  const currentProjectId = projectFilter !== "all" ? parseInt(projectFilter) : null;

  // Fetch all categories for unified color system
  const { data: allCategories = [] } = useQuery<any[]>({
    queryKey: ["/api/all-categories-unified", projects.map(p => p.id).join(',')],
    queryFn: async () => {
      const categoriesByProject = await Promise.all(
        projects.map(async (project) => {
          const response = await fetch(`/api/projects/${project.id}/categories/flat`);
          if (!response.ok) return [];
          const categories = await response.json();
          // Categories from /flat endpoint already have projectId, but ensure it's set
          return categories.map((cat: any) => ({ ...cat, projectId: cat.projectId || project.id }));
        })
      );
      return categoriesByProject.flat();
    },
    enabled: projects.length > 0
  });

  // Get category data for the current project or all projects
  const {
    tier1Categories,
    tier2Categories,
    isLoading: categoriesLoading,
    error: colorsError
  } = useTier2CategoriesByTier1Name(currentProjectId);

  // Create dynamic project-specific color function using new unified color system
  const getProjectSpecificTier1Color = (projectId: number, categoryName: string): string => {
    const project = projects.find((p: any) => p.id === projectId);
    return getUnifiedTier1Color(categoryName, allCategories, projectId, projects);
  };

  // Utility functions from the compatibility layer
  const formatCategoryName = centralizedFormatCategoryName;
  const formatTaskStatus = (status?: string | null): string => {
    if (!status) return 'Not Started';
    return status
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  // Color functions using new simplified color system
  const getTier1Color = (categoryName: string): string => {
    return hookGetTier1Color(categoryName);
  };

  const getTier2Color = (categoryName: string, parentTier1?: string): string => {
    return hookGetTier2Color(categoryName, parentTier1);
  };

  // Create tier2 by tier1 mapping for backwards compatibility
  const tier2ByTier1Name = useMemo(() => {
    const tier1s = tier1Categories || [];
    const tier2s = tier2Categories || [];

    return tier1s.reduce((acc, tier1) => {
      if (!tier1.name || typeof tier1.name !== 'string') return acc;
      const relatedTier2 = tier2s.filter(tier2 => tier2.parentId === tier1.id);
      acc[tier1.name.toLowerCase()] = relatedTier2.map(tier2 =>
        tier2.name && typeof tier2.name === 'string' ? tier2.name.toLowerCase() : ''
      ).filter(Boolean);
      return acc;
    }, {} as Record<string, string[]>);
  }, [tier1Categories, tier2Categories]);

  // Combined categories for color functions
  const combinedCategories = useMemo(() => {
    return [...(tier1Categories || []), ...(tier2Categories || [])];
  }, [tier1Categories, tier2Categories]);

  // Force refresh when admin panel colors are updated
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const handleAdminColorsUpdated = async () => {
      console.log('Theme changed event received - refreshing colors');

      // Invalidate template categories queries
      const templateCategoriesQueryKey = projectFilter !== "all"
        ? [`/api/projects/${projectFilter}/template-categories`]
        : ['/api/admin/template-categories'];

      queryClient.invalidateQueries({ queryKey: templateCategoriesQueryKey });
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });

      // Force immediate refetch
      await queryClient.refetchQueries({ queryKey: templateCategoriesQueryKey });

      setRefreshKey(prev => prev + 1);
      console.log('Color refresh completed');
    };

    window.addEventListener('themeChanged', handleAdminColorsUpdated);
    return () => window.removeEventListener('themeChanged', handleAdminColorsUpdated);
  }, [projectFilter]);

  // Function to handle adding a task for a specific category
  const handleAddTaskForCategory = (category: string) => {
    // Set the current category for pre-filling in the dialog
    setCreateDialogOpen(true);
    // We'll modify the CreateTaskDialog to accept a category prop
    setPreselectedCategory(category);
  };

  // Function to handle adding a task with both tier1 and tier2 categories pre-populated
  const handleAddTaskWithCategories = (tier1: string, tier2: string) => {
    // Store both tiers in the preselected data
    setPreselectedCategory({
      tier1Category: tier1,
      tier2Category: tier2,
      category: tier2 // For backward compatibility
    });
    setCreateDialogOpen(true);
  };

  // Set projects cache for color utilities
  React.useEffect(() => {
    if (projects && projects.length > 0) {
      (window as any).__projectsCache = projects;
    }
  }, [projects]);

  // Debug logging
  React.useEffect(() => {
    console.log("🔍 Tasks Page Debug:", {
      projectFilter,
      tasksCount: tasks?.length || 0,
      projectsCount: projects?.length || 0,
      tasksLoading,
      projectsLoading
    });
  }, [projectFilter, tasks, projects, tasksLoading, projectsLoading]);

  // Update projectFilter when projectIdFromUrl changes
  useEffect(() => {
    if (projectIdFromUrl) {
      setProjectFilter(projectIdFromUrl.toString());
    }
  }, [projectIdFromUrl]);

  // Listen for URL changes (including manual navigation via setLocation)
  useEffect(() => {
    const handleLocationChange = () => {
      const params = new URLSearchParams(window.location.search);
      const newTier1 = params.get('tier1') || null;
      const newTier2 = params.get('tier2') || null;
      const newProjectId = params.get('projectId');

      setSelectedTier1(newTier1);
      setSelectedTier2(newTier2);
      if (newProjectId) {
        setProjectFilter(newProjectId);
      }
    };

    // Call immediately to sync with current URL
    handleLocationChange();

    // Listen for popstate events (browser back/forward)
    window.addEventListener('popstate', handleLocationChange);

    return () => {
      window.removeEventListener('popstate', handleLocationChange);
    };
  }, [location]);

  // Update selected categories when URL parameters change
  useEffect(() => {
    setSelectedTier1(tier1FromUrl);
    setSelectedTier2(tier2FromUrl);
  }, [tier1FromUrl, tier2FromUrl]);

  // Function to activate a task from a template
  const activateTaskFromTemplate = async (task: Task) => {
    try {
      if (!task.projectId || !task.templateId) {
        toast({
          title: "Error",
          description: "Cannot activate task: missing project ID or template ID",
          variant: "destructive",
        });
        return;
      }

      const response = await fetch(`/api/projects/${task.projectId}/create-tasks-from-templates`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          templateIds: [task.templateId]
        })
      });

      if (response.ok) {
        // Refresh the tasks data
        queryClient.invalidateQueries({ queryKey: tasksQueryKey });
        toast({
          title: "Task Activated",
          description: `Task "${task.title}" has been activated.`,
          variant: "default"
        });
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: errorData.message || "Failed to activate task",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error activating task:", error);
      toast({
        title: "Error",
        description: "Failed to activate task. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Handle project selection change
  const handleProjectChange = (projectId: string) => {
    setProjectFilter(projectId);
    setSelectedTier1(null);
    setSelectedTier2(null);

    // Update URL if not "all"
    if (projectId !== "all") {
      setLocation(`/tasks?projectId=${projectId}`);
    } else {
      setLocation('/tasks');
    }
  };

  // Function to reset task templates
  const resetTaskTemplates = async () => {
    try {
      const projectId = projectFilter !== "all" ? parseInt(projectFilter) : null;
      const endpoint = "/api/reset-task-templates";
      const body = projectId ? { projectId } : {};

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        const data = await response.json();
        queryClient.invalidateQueries({ queryKey: tasksQueryKey });
        toast({
          title: "Success",
          description: data.message || "Task templates have been reset successfully",
          variant: "default"
        });
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: errorData.message || "Failed to reset task templates",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error resetting task templates:", error);
      toast({
        title: "Error",
        description: "Failed to reset task templates. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Function to load templates for a specific subcategory
  const loadSubcategoryTemplates = async (tier1: string, tier2: string) => {
    try {
      const projectId = projectFilter !== "all" ? parseInt(projectFilter) : null;

      if (!projectId) {
        toast({
          title: "Project Required",
          description: "Please select a project first to load templates",
          variant: "destructive"
        });
        return;
      }

      const endpoint = "/api/reset-task-templates";
      const body = {
        projectId,
        tier1Category: tier1,
        tier2Category: tier2
      };

      toast({
        title: "Loading",
        description: `Loading templates for ${formatCategoryNameWithProject(tier2)}...`,
        variant: "default"
      });

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        const data = await response.json();
        queryClient.invalidateQueries({ queryKey: tasksQueryKey });
        toast({
          title: "Success",
          description: `Templates for ${formatCategoryNameWithProject(tier2)} loaded successfully`,
          variant: "default"
        });
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: errorData.message || `Failed to load templates for ${formatCategoryNameWithProject(tier2)}`,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error(`Error loading templates for ${tier2}:`, error);
      toast({
        title: "Error",
        description: `Failed to load templates for ${formatCategoryNameWithProject(tier2)}. Please try again.`,
        variant: "destructive"
      });
    }
  };



  const toggleTaskCompletion = async (taskId: number, completed: boolean) => {
    try {
      await apiRequest("PUT", `/api/tasks/${taskId}`, { completed });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });

      // Set success message
      setSuccessMessage(completed ? "Task marked as completed" : "Task marked as not completed");

      // Clear message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (error) {
      console.error("Failed to update task status:", error);
    }
  };

  // Note: Function to activate a task from a template is already defined above

  // Prepare the data for the Gantt chart
  // Uses effective dates: calendarStartDate/calendarEndDate when available (actual schedule),
  // falls back to startDate/endDate (planned schedule) - synced with calendar views
  const ganttTasks = (tasks || []).map(task => {
    // Use calendar dates if available (actual schedule), otherwise use task dates (planned schedule)
    const effectiveStartDate = task.calendarStartDate || task.startDate;
    const effectiveEndDate = task.calendarEndDate || task.endDate;
    return {
      id: task.id,
      title: task.title && task.title.length > 20 ? task.title.substring(0, 20) + '...' : (task.title || 'Untitled Task'),
      description: task.description || null,
      startDate: new Date(effectiveStartDate),
      endDate: new Date(effectiveEndDate),
      status: task.status,
      assignedTo: task.assignedTo || null,
      category: task.category || 'general',
      contactIds: task.contactIds || null,
      materialIds: task.materialIds || null,
      projectId: task.projectId,
      completed: task.completed || null,
      materialsNeeded: task.materialsNeeded || null,
      durationDays: Math.ceil((new Date(effectiveEndDate).getTime() - new Date(effectiveStartDate).getTime()) / (1000 * 60 * 60 * 24)),
    };
  });

  // hiddenCategories is now managed as state variable above

  // Filter tasks based on search query, project, status, category, tier filters, and hidden categories
  let debugLoggedTier1 = false;
  let debugLoggedTier2 = false;
  const filteredTasks = (tasks || []).filter(task => {
    const matchesSearch = (task.title || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesProject = projectFilter === "all" || task.projectId?.toString() === projectFilter;
    const matchesStatus = statusFilter === "all" || task.status === statusFilter;
    const matchesCategory = categoryFilter === "all" || task.category === categoryFilter;
    const matchesSelectedCategory = !selectedCategory || task.category === selectedCategory;
    const isNotHidden = !hiddenCategories.includes(task.tier1Category?.toLowerCase() || '');

    // Filter by selectedTier1 (URL parameter: tier1)
    const matchesTier1 = !selectedTier1 || (() => {
      const matches = task.tier1Category?.toLowerCase() === selectedTier1.toLowerCase();
      if (selectedTier1 && !debugLoggedTier1) {
        console.log('🔍 Filtering tier1:', {
          taskTier1: task.tier1Category,
          taskTier1Lower: task.tier1Category?.toLowerCase(),
          selectedTier1,
          selectedTier1Lower: selectedTier1.toLowerCase(),
          matches
        });
        debugLoggedTier1 = true;
      }
      return matches;
    })();

    // Filter by selectedTier2 (URL parameter: tier2)
    const matchesTier2 = !selectedTier2 || (() => {
      const matches = task.tier2Category?.toLowerCase() === selectedTier2.toLowerCase();
      if (selectedTier2 && !debugLoggedTier2) {
        console.log('🔍 Filtering tier2:', {
          taskTier2: task.tier2Category,
          taskTier2Lower: task.tier2Category?.toLowerCase(),
          selectedTier2,
          selectedTier2Lower: selectedTier2.toLowerCase(),
          matches
        });
        debugLoggedTier2 = true;
      }
      return matches;
    })();

    return matchesSearch && matchesProject && matchesStatus && matchesCategory && matchesSelectedCategory && isNotHidden && matchesTier1 && matchesTier2;
  });

  // Debug logging for URL filtering
  console.log('🔍 Standalone Tasks Page Debug:', {
    selectedTier1,
    selectedTier2,
    totalTasks: tasks?.length,
    filteredTasksCount: filteredTasks?.length,
    sampleFilteredTasks: filteredTasks?.slice(0, 3).map(t => ({
      title: t.title,
      tier1: t.tier1Category,
      tier2: t.tier2Category,
      projectId: t.projectId
    }))
  });

  // Group tasks by tier1Category (Structural, Systems, Sheathing, Finishings) - use filtered tasks
  const tasksByTier1 = (filteredTasks || []).reduce((acc, task) => {
    const tier1 = task.tier1Category || 'Uncategorized';
    if (!acc[tier1]) {
      acc[tier1] = [];
    }
    acc[tier1].push(task);
    return acc;
  }, {} as Record<string, Task[]>);

  // Group tasks by tier2Category within each tier1Category - use filtered tasks
  // Normalize keys to lowercase for consistent lookup
  const tasksByTier2 = (filteredTasks || []).reduce((acc, task) => {
    const tier1 = (task.tier1Category || 'Uncategorized').toLowerCase();
    const tier2 = (task.tier2Category || 'Other').toLowerCase();

    if (!acc[tier1]) {
      acc[tier1] = {};
    }

    if (!acc[tier1][tier2]) {
      acc[tier1][tier2] = [];
    }

    acc[tier1][tier2].push(task);
    return acc;
  }, {} as Record<string, Record<string, Task[]>>);

  // Traditional category grouping for backward compatibility
  const tasksByCategory = (tasks || []).reduce((acc, task) => {
    const category = task.category || 'other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(task);
    return acc;
  }, {} as Record<string, Task[]>);

  // Calculate completion percentage for tier1 categories using filtered tasks (derived)
  const tier1CompletionDerived = useMemo(() => {
    return Object.entries(tasksByTier1 || {}).reduce((acc, [tier1, tasks]) => {
      const totalTasks = tasks.length;
      const completedTasks = tasks.filter(task =>
        task.completed === true || task.status === 'completed'
      ).length;
      acc[tier1] = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
      return acc;
    }, {} as Record<string, number>);
  }, [tasksByTier1]);

  // Note: Removed auto-selection logic to allow users to see tier 1 cards first
  // Users should manually select categories to drill down into specific tasks

  // Calculate completion percentage for tier2 categories using filtered tasks
  const tier2Completion: Record<string, Record<string, number>> = {};
  Object.entries(tasksByTier2 || {}).forEach(([tier1, tier2Map]) => {
    tier2Completion[tier1] = {};

    Object.entries(tier2Map).forEach(([tier2, tasks]) => {
      const totalTasks = tasks.length;

      // Check both the completed flag and status field
      const completedTasks = tasks.filter(task =>
        task.completed === true || task.status === 'completed'
      ).length;

      tier2Completion[tier1][tier2] = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    });
  });

  // Calculate completion percentage for traditional categories
  const categoryCompletion = Object.entries(tasksByCategory || {}).reduce((acc, [category, tasks]) => {
    const totalTasks = tasks.length;

    // Check both the completed flag and status field for consistent task completion tracking
    const completedTasks = tasks.filter(task =>
      task.completed === true || task.status === 'completed'
    ).length;

    acc[category] = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    return acc;
  }, {} as Record<string, number>);

  // Get tier1 category icon (broad categories)
  const getTier1Icon = (tier1: string, className: string = "h-5 w-5") => {
    const lowerCaseTier1 = (tier1 || '').toLowerCase();

    // Construction categories
    if (lowerCaseTier1 === 'structural') {
      return <Construction className={`${className} text-orange-600`} />;
    }

    if (lowerCaseTier1 === 'systems') {
      return <Zap className={`${className} text-blue-600`} />;
    }

    if (lowerCaseTier1 === 'sheathing') {
      return <Layers className={`${className} text-green-600`} />;
    }

    if (lowerCaseTier1 === 'finishings') {
      return <Paintbrush className={`${className} text-violet-600`} />;
    }

    if (lowerCaseTier1 === 'permitting') {
      return <FileCheck className={`${className} text-blue-500`} />;
    }

    // Workout categories
    if (lowerCaseTier1 === 'push') {
      return <Hammer className={`${className} text-red-500`} />;
    }

    if (lowerCaseTier1 === 'pull') {
      return <User className={`${className} text-blue-500`} />;
    }

    if (lowerCaseTier1 === 'legs') {
      return <Play className={`${className} text-green-500`} />;
    }

    if (lowerCaseTier1 === 'cardio') {
      return <Circle className={`${className} text-purple-500`} />;
    }

    // Software categories
    if (lowerCaseTier1 === 'software engineering') {
      return <Cog className={`${className} text-cyan-500`} />;
    }

    if (lowerCaseTier1 === 'product management') {
      return <Package className={`${className} text-indigo-500`} />;
    }

    if (lowerCaseTier1 === 'design / ux') {
      return <Paintbrush className={`${className} text-pink-500`} />;
    }

    if (lowerCaseTier1 === 'marketing / go-to-market (gtm)') {
      return <Grid className={`${className} text-orange-500`} />;
    }

    // Default
    return <Home className={`${className} text-slate-700`} />;
  };

  // Get tier2 category icon (specific categories)
  const getTier2Icon = (tier2: string, className: string = "h-5 w-5") => {
    const lowerCaseTier2 = (tier2 || '').toLowerCase();

    // Match foundation with concrete
    if (lowerCaseTier2 === 'foundation') {
      return <Landmark className={`${className} text-stone-700`} />;
    }

    // Match framing with wood
    if (lowerCaseTier2 === 'framing') {
      return <Construction className={`${className} text-amber-700`} />;
    }

    // Roofing
    if (lowerCaseTier2 === 'roofing') {
      return <HardHat className={`${className} text-red-600`} />;
    }

    // Match electrical with electrical (handle both 'electric' and 'electrical')
    if (lowerCaseTier2 === 'electric' || lowerCaseTier2 === 'electrical') {
      return <Zap className={`${className} text-yellow-600`} />;
    }

    // Match plumbing with plumbing
    if (lowerCaseTier2 === 'plumbing') {
      return <Droplet className={`${className} text-blue-600`} />;
    }

    // HVAC - changed to silver color
    if (lowerCaseTier2 === 'hvac') {
      return <Fan className={`${className} text-gray-500`} />;
    }

    // Exteriors
    if (lowerCaseTier2 === 'exteriors') {
      return <Landmark className={`${className} text-sky-600`} />;
    }

    // Windows/doors with glass/interior
    if (lowerCaseTier2 === 'windows') {
      return <LayoutGrid className={`${className} text-orange-600`} />;
    }

    // Doors
    if (lowerCaseTier2 === 'doors') {
      return <Mailbox className={`${className} text-amber-700`} />;
    }

    // Barriers
    if (lowerCaseTier2 === 'barriers') {
      return <LayoutGrid className={`${className} text-teal-600`} />;
    }

    // Drywall with interior finish
    if (lowerCaseTier2 === 'drywall') {
      return <Layers className={`${className} text-neutral-700`} />;
    }

    // Cabinets
    if (lowerCaseTier2 === 'cabinets') {
      return <Columns className={`${className} text-purple-600`} />;
    }

    // Fixtures
    if (lowerCaseTier2 === 'fixtures') {
      return <Cog className={`${className} text-indigo-600`} />;
    }

    // Flooring with finish
    if (lowerCaseTier2 === 'flooring') {
      return <Grid className={`${className} text-amber-600`} />;
    }

    // Permits
    if (lowerCaseTier2 === 'permits') {
      return <FileCheck className={`${className} text-indigo-600`} />;
    }

    // Default
    return <Package className={`${className} text-slate-700`} />;
  };

  // Get category icon (for backward compatibility)
  const getCategoryIcon = (category: string, className: string = "h-5 w-5") => {
    const lowerCaseCategory = (category || '').toLowerCase();

    // Match foundation with concrete
    if (lowerCaseCategory === 'foundation') {
      return <Landmark className={`${className} text-stone-700`} />;
    }

    // Match framing with wood
    if (lowerCaseCategory === 'framing') {
      return <Construction className={`${className} text-amber-700`} />;
    }

    // Match electrical with electrical
    if (lowerCaseCategory === 'electrical') {
      return <Zap className={`${className} text-yellow-600`} />;
    }

    // Match plumbing with plumbing
    if (lowerCaseCategory === 'plumbing') {
      return <Droplet className={`${className} text-blue-600`} />;
    }

    // HVAC
    if (lowerCaseCategory === 'hvac') {
      return <Fan className={`${className} text-sky-700`} />;
    }

    // Windows/doors with glass/interior
    if (lowerCaseCategory === 'windows_doors') {
      return <LayoutGrid className={`${className} text-orange-600`} />;
    }

    // Drywall with interior finish
    if (lowerCaseCategory === 'drywall') {
      return <Layers className={`${className} text-neutral-700`} />;
    }

    // Flooring with finish
    if (lowerCaseCategory === 'flooring') {
      return <Grid className={`${className} text-amber-600`} />;
    }

    // Painting with finish
    if (lowerCaseCategory === 'painting') {
      return <Paintbrush className={`${className} text-indigo-600`} />;
    }

    // Landscaping
    if (lowerCaseCategory === 'landscaping') {
      return <Trees className={`${className} text-emerald-600`} />;
    }

    // Default
    return <Package className={`${className} text-slate-700`} />;
  };

  // Helper functions for backward compatibility (simplified versions)
  const getTier1Background = (tier1: string) => getTier1Color(tier1);
  const getTier2Background = (tier2: string, parentTier1?: string) => getTier2Color(tier2, parentTier1);

  // Get tier1 description
  const getTier1Description = (tier1: string) => {
    switch (tier1.toLowerCase()) {
      // Construction categories
      case 'permitting':
        return 'Permits, approvals, and regulatory compliance';
      case 'structural':
        return 'Main building structure components and foundation';
      case 'systems':
        return 'Electrical, plumbing, and mechanical systems';
      case 'sheathing':
        return 'Exterior and interior enclosures and barriers';
      case 'finishings':
        return 'Interior fixtures, surfaces, and aesthetic elements';

      // Workout categories
      case 'push':
        return 'Push movements - chest, shoulders, triceps';
      case 'pull':
        return 'Pull movements - back, biceps, rear delts';
      case 'legs':
        return 'Lower body - quads, glutes, hamstrings, calves';
      case 'cardio':
        return 'Cardiovascular training and conditioning';

      // Software categories
      case 'software engineering':
        return 'Development, architecture, and technical implementation';
      case 'product management':
        return 'Strategy, planning, and product lifecycle management';
      case 'design / ux':
        return 'User experience, interface design, and usability';
      case 'marketing / go-to-market (gtm)':
        return 'Marketing strategy, positioning, and market launch';

      default:
        return 'Project tasks and activities';
    }
  };

  // Get tier2 description
  const getTier2Description = (tier2: string) => {
    switch (tier2.toLowerCase()) {
      case 'foundation':
        return 'Base structure and concrete work';
      case 'framing':
        return 'Structural framework and support';
      case 'roofing':
        return 'Roof structures and coverings';
      case 'electric':
        return 'Wiring, panels, and lighting';
      case 'plumbing':
        return 'Water and drainage systems';
      case 'hvac':
        return 'Heating, ventilation, and cooling';
      case 'barriers':
        return 'Insulation and weatherproofing';
      case 'drywall':
        return 'Interior wall construction';
      case 'exteriors':
        return 'Exterior siding and finishes';
      case 'windows':
        return 'Glass fixtures and installation';
      case 'doors':
        return 'Entry points and door installation';
      case 'cabinets':
        return 'Cabinet installation and fixtures';
      case 'fixtures':
        return 'Lighting and plumbing fixtures';
      case 'flooring':
        return 'Floor surfaces and materials';
      case 'permits':
        return 'Permits and legal documentation';
      default:
        return 'General construction tasks';
    }
  };

  // Get category description (for backward compatibility)
  const getCategoryDescription = (category: string) => {
    switch (category) {
      case 'foundation':
        return 'Base structure and concrete work';
      case 'framing':
        return 'Structural framework and support';
      case 'electrical':
        return 'Wiring, panels, and lighting';
      case 'plumbing':
        return 'Water and drainage systems';
      case 'hvac':
        return 'Heating, ventilation, and cooling';
      case 'windows_doors':
        return 'Entry points and glass fixtures';
      case 'drywall':
        return 'Interior wall construction';
      case 'flooring':
        return 'Floor surfaces and materials';
      case 'painting':
        return 'Surface finishes and coatings';
      case 'landscaping':
        return 'Exterior grounds and vegetation';
      default:
        return 'General construction tasks';
    }
  };

  // Get admin template categories for name resolution
  const { data: adminCategories = [] } = useQuery({
    queryKey: ['/api/admin/template-categories'],
    queryFn: async () => {
      const response = await fetch('/api/admin/template-categories');
      if (!response.ok) {
        throw new Error('Failed to fetch admin template categories');
      }
      return response.json();
    }
  });

  // Get project-specific template categories when viewing a specific project
  const { data: projectCategories = [] } = useQuery({
    queryKey: [`/api/projects/${projectFilter}/template-categories`],
    queryFn: async () => {
      if (projectFilter === "all") return [];
      const response = await fetch(`/api/projects/${projectFilter}/template-categories`);
      if (!response.ok) {
        throw new Error('Failed to fetch project template categories');
      }
      return response.json();
    },
    enabled: projectFilter !== "all"
  });

  // Use project-specific category names for formatting
  const formatCategoryNameWithProject = (category: string): string => {
    if (!category) return '';

    // When viewing a specific project, try to get the actual category name from project categories
    if (projectFilter !== "all" && projectCategories?.length > 0) {
      const projectCategory = projectCategories.find((cat: any) =>
        cat.name && cat.name.toLowerCase() === category.toLowerCase()
      );
      if (projectCategory) {
        // Use the actual category name from the database
        return projectCategory.name
          .split(/[-_\s]+/)
          .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ');
      }
    }

    // Get the current project ID for project-specific category name formatting
    const projectId = projectFilter !== "all" ? parseInt(projectFilter) : null;

    // Use the project-specific category name formatting as fallback
    return centralizedFormatCategoryName(category, projectId);
  };

  // Get project name by ID
  const getProjectName = (projectId: number) => {
    const project = projects?.find(p => p.id === projectId);
    return project ? project.name : "Unknown Project";
  };

  // Get project description by ID
  const getProjectDescription = (projectId: number) => {
    const project = projects?.find(p => p.id === projectId);
    return project?.description || null;
  };

  // Get tier1 categories based on project selection
  const activeTasks = filteredTasks || [];
  const activeTasksTier1 = activeTasks.reduce((acc, task) => {
    const tier1 = task.tier1Category || 'Uncategorized';
    if (!acc[tier1]) {
      acc[tier1] = [];
    }
    acc[tier1].push(task);
    return acc;
  }, {} as Record<string, Task[]>);

  const tasksWithTier1 = Object.keys(activeTasksTier1);

  // Get categories - use project-specific if available, otherwise admin
  const adminTier1Categories = adminCategories?.map((cat: any) =>
    cat.name && typeof cat.name === 'string' ? cat.name.toLowerCase() : ''
  ).filter(Boolean) || [];

  const projectTier1Categories = projectCategories?.filter((cat: any) => cat.type === "tier1")
    .map((cat: any) => cat.name && typeof cat.name === 'string' ? cat.name.toLowerCase() : '')
    .filter(Boolean) || [];


  // When viewing a specific project, show ALL project categories, not just those with tasks
  // When viewing all projects, only show categories that have tasks
  let predefinedTier1Categories: string[];

  if (projectFilter !== "all") {
    // Use project-specific categories first, then fall back to admin, then tasks
    predefinedTier1Categories = projectTier1Categories.length > 0
      ? projectTier1Categories
      : (adminTier1Categories.length > 0
        ? adminTier1Categories
        : tasksWithTier1.map(c => c.toLowerCase()));
  } else {
    // For "all projects" view, we don't need predefined categories anymore
    // The new logic just groups tasks directly by their tier1Category
    predefinedTier1Categories = [];
  }

  // Debug the filtering logic
  React.useEffect(() => {
    if (projectFilter === "all") {
      // Show actual task categories from a sample of tasks
      const sampleTaskCategories = activeTasks.slice(0, 10).map(task => ({
        title: task.title,
        tier1Category: task.tier1Category,
        projectId: task.projectId
      }));

      const allTaskCategories = [...new Set(activeTasks.map(t => t.tier1Category).filter(Boolean))];
      console.log("🔍 Filtering Debug (all projects):", {
        activeTasksCount: activeTasks.length,
        allTaskCategories: allTaskCategories,
        validFilteredCategories: predefinedTier1Categories,
        filteredCount: predefinedTier1Categories.length,
        sampleTaskCategories: sampleTaskCategories
      });
    }
  }, [projectFilter, activeTasks.length, tasksWithTier1, adminTier1Categories, predefinedTier1Categories]);

  // Build tier2 categories dynamically from tasks when viewing all projects
  const dynamicTier2Categories: Record<string, string[]> = {};

  if (projectFilter === "all" && filteredTasks) {
    // Build tier2 categories from actual tasks when viewing all projects
    filteredTasks.forEach(task => {
      const tier1 = task.tier1Category || 'Uncategorized';
      const tier2 = task.tier2Category || 'Other';

      if (!dynamicTier2Categories[tier1]) {
        dynamicTier2Categories[tier1] = [];
      }

      if (!dynamicTier2Categories[tier1].includes(tier2)) {
        dynamicTier2Categories[tier1].push(tier2);
      }
    });

    // Sort tier2 categories for consistent display
    Object.keys(dynamicTier2Categories).forEach(tier1 => {
      dynamicTier2Categories[tier1].sort();
    });
  }

  // Use dynamic tier2 categories from admin panel when specific project selected, or dynamic when all projects
  const predefinedTier2Categories: Record<string, string[]> = projectFilter === "all"
    ? dynamicTier2Categories
    : tier2ByTier1Name || {
      'structural': ['foundation', 'framing', 'roofing'],
      'systems': ['electrical', 'plumbing', 'hvac'],
      'sheathing': ['barriers', 'drywall', 'exteriors', 'siding', 'insulation'],
      'finishings': ['windows', 'doors', 'cabinets', 'fixtures', 'flooring'],
      'Uncategorized': ['permits', 'other']
    };

  if (tasksLoading || projectsLoading) {
    return (
      <Layout>
        <div className="space-y-6 p-4">
          <div className="flex justify-between items-start">
            <div className="h-8 bg-slate-200 rounded w-32 animate-pulse"></div>
            <div className="flex flex-col items-end gap-2">
              <div className="h-10 bg-slate-200 rounded w-32 animate-pulse"></div>
              <div className="h-10 bg-slate-200 rounded w-40 animate-pulse"></div>
            </div>
          </div>

          <div className="h-10 bg-slate-200 rounded w-full animate-pulse"></div>

          <div className="flex gap-2">
            <div className="h-10 bg-slate-200 rounded w-32 animate-pulse"></div>
            <div className="h-10 bg-slate-200 rounded w-32 animate-pulse"></div>
          </div>

          <div className="h-12 bg-slate-200 rounded w-full animate-pulse"></div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-hidden px-1 sm:px-0">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="animate-pulse border border-slate-200">
                <CardHeader className="p-4">
                  <div className="flex justify-between">
                    <div className="h-6 bg-slate-200 rounded w-1/2"></div>
                    <div className="h-6 bg-slate-200 rounded w-16"></div>
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <div className="h-4 bg-slate-200 rounded w-1/3"></div>
                      <div className="h-4 bg-slate-200 rounded w-8"></div>
                    </div>
                    <div className="h-2 bg-slate-200 rounded w-full"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-2 sm:p-4 w-full min-w-0 overflow-x-hidden">
        {/* Success Message Alert */}
        {successMessage && (
          <div className="bg-green-100 border border-green-300 text-green-700 px-4 py-3 rounded relative mb-2">
            <span className="block sm:inline">{successMessage}</span>
          </div>
        )}

        {/* URL Filter Indicator */}
        {(selectedTier1 || selectedTier2) && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <div className="flex items-center gap-2 text-blue-800 text-sm">
              <Filter className="h-4 w-4" />
              <span>Filtered by:</span>
              <div className="flex items-center gap-2">
                {selectedTier1 && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                    {selectedTier1}
                  </span>
                )}
                {selectedTier1 && selectedTier2 && (
                  <span className="text-blue-600">→</span>
                )}
                {selectedTier2 && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                    {selectedTier2}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="bg-white border-2 border-[#4a7c59] rounded-lg shadow-sm w-full min-w-0 overflow-x-hidden">
          {/* First row with title and main actions */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-3 sm:p-4 bg-[#e6f2ea] rounded-t-lg gap-3">
            {/* Desktop layout */}
            <div className="hidden sm:flex items-center gap-4 flex-1">
              <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-[#4a7c59] to-[#3a6346] bg-clip-text text-transparent">Tasks</h1>
              {/* Expandable search */}
              <div className="flex items-center justify-end flex-1">
                {!searchExpanded ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 w-9 rounded-md hover:bg-[#d1e7dd] text-[#4a7c59]"
                    onClick={() => setSearchExpanded(true)}
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                ) : (
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#8b4513]" />
                    <Input
                      placeholder="Search tasks..."
                      className="w-full pl-9 pr-9 border-[#d2b48c] focus:border-[#8b4513] focus:ring-[#8b4513] rounded-lg h-9"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onBlur={() => {
                        if (!searchQuery) {
                          setSearchExpanded(false);
                        }
                      }}
                      autoFocus
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1 h-7 w-7 rounded-md hover:bg-[#d1e7dd]"
                      onClick={() => {
                        setSearchQuery("");
                        setSearchExpanded(false);
                      }}
                    >
                      <X className="h-4 w-4 text-[#4a7c59]" />
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile layout - title, search, and buttons in one row */}
            <div className="sm:hidden flex items-center gap-2 w-full">
              <h1 className="text-xl font-bold bg-gradient-to-r from-[#4a7c59] to-[#3a6346] bg-clip-text text-transparent flex-shrink-0">Tasks</h1>

              {/* Search functionality */}
              <div className="flex items-center flex-1">
                {!searchExpanded ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 w-9 rounded-md hover:bg-[#d1e7dd] text-[#4a7c59]"
                    onClick={() => setSearchExpanded(true)}
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                ) : (
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-green-600" />
                    <Input
                      placeholder="Search tasks..."
                      className="w-full pl-9 pr-9 border-green-300 focus:border-green-500 focus:ring-green-500 rounded-lg h-9"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onBlur={() => {
                        if (!searchQuery) {
                          setSearchExpanded(false);
                        }
                      }}
                      autoFocus
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1 h-7 w-7 rounded-md hover:bg-[#d1e7dd]"
                      onClick={() => {
                        setSearchQuery("");
                        setSearchExpanded(false);
                      }}
                    >
                      <X className="h-4 w-4 text-[#4a7c59]" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Mobile buttons */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className="w-full min-w-0 max-w-[120px]">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full !bg-transparent border-0 rounded-none focus:ring-0 min-w-0 h-9 hover:bg-[#d1e7dd] text-[#4a7c59]">
                      <SelectValue placeholder="Status">
                        {statusFilter === "all" ? (
                          <div className="flex items-center gap-2">
                            <Circle className="h-4 w-4 text-[#4a7c59]" />
                            <span className="text-xs">All</span>
                          </div>
                        ) : statusFilter === "not_started" ? (
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-slate-500" />
                            <span className="text-xs">Not Started</span>
                          </div>
                        ) : statusFilter === "in_progress" ? (
                          <div className="flex items-center gap-2">
                            <Play className="h-4 w-4 text-yellow-500" />
                            <span className="text-xs">In Progress</span>
                          </div>
                        ) : statusFilter === "completed" ? (
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                            <span className="text-xs">Completed</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Circle className="h-4 w-4 text-[#4a7c59]" />
                            <span className="text-xs">Status</span>
                          </div>
                        )}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">
                        <div className="flex items-center gap-2">
                          <Circle className="h-4 w-4 text-slate-500" />
                          <span>All Status</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="not_started">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-slate-500" />
                          <span>Not Started</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="in_progress">
                        <div className="flex items-center gap-2">
                          <Play className="h-4 w-4 text-yellow-500" />
                          <span>In Progress</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="completed">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                          <span>Completed</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  variant="ghost"
                  className="bg-transparent border border-green-600 text-green-600 hover:bg-green-50 font-medium h-9 px-3"
                  onClick={() => setCreateDialogOpen(true)}
                  size="sm"
                >
                  <Plus className="h-4 w-4 text-green-600" />
                </Button>

              </div>
            </div>

            {/* Desktop controls */}
            <div className="hidden sm:flex items-center gap-2">
              <div className="flex items-center gap-2">
                <div className="w-full min-w-0 max-w-[140px]">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full !bg-transparent border-0 rounded-none focus:ring-0 min-w-0 h-9 hover:bg-[#d1e7dd] text-[#4a7c59]">
                      <SelectValue placeholder="Status">
                        {statusFilter === "all" ? (
                          <div className="flex items-center gap-2">
                            <Circle className="h-4 w-4 text-[#4a7c59]" />
                            <span className="text-xs">All</span>
                          </div>
                        ) : statusFilter === "not_started" ? (
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-slate-500" />
                            <span className="text-xs">Not Started</span>
                          </div>
                        ) : statusFilter === "in_progress" ? (
                          <div className="flex items-center gap-2">
                            <Play className="h-4 w-4 text-yellow-500" />
                            <span className="text-xs">In Progress</span>
                          </div>
                        ) : statusFilter === "completed" ? (
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                            <span className="text-xs">Completed</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Circle className="h-4 w-4 text-[#4a7c59]" />
                            <span className="text-xs">Status</span>
                          </div>
                        )}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">
                        <div className="flex items-center gap-2">
                          <Circle className="h-4 w-4 text-slate-500" />
                          <span>All Status</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="not_started">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-slate-500" />
                          <span>Not Started</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="in_progress">
                        <div className="flex items-center gap-2">
                          <Play className="h-4 w-4 text-yellow-500" />
                          <span>In Progress</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="completed">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                          <span>Completed</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  variant="ghost"
                  className="bg-[#8b4513] hover:bg-[#6b3410] text-white font-medium h-9 px-4 rounded-md shadow-sm"
                  onClick={() => setCreateDialogOpen(true)}
                  size="sm"
                >
                  <Plus className="mr-2 h-4 w-4 text-white" />
                  Add Task
                </Button>


                {projectFilter !== "all" && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-[#e6f2ea] text-[#4a7c59] hover:text-[#3a6346] hover:bg-[#d1e7dd] border-[#b3d1c1] shadow-sm h-9 px-2"
                    onClick={() => handleProjectChange("all")}
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Second row with filters and search */}
          <div className="px-3 sm:px-4 pb-3 bg-[#e6f2ea] rounded-b-lg">
            {/* Desktop filters - Project selector gets full width */}
            <div className="hidden sm:block">
              <div className="mb-3">
                <ProjectSelector
                  selectedProjectId={projectFilter !== "all" ? Number(projectFilter) : undefined}
                  onChange={handleProjectChange}
                  className="border-0 rounded-none focus:ring-0 w-full"
                />
              </div>
            </div>

            {/* Mobile filters - Project selector gets full width */}
            <div className="sm:hidden flex flex-col gap-2">
              <ProjectSelector
                selectedProjectId={projectFilter !== "all" ? Number(projectFilter) : undefined}
                onChange={handleProjectChange}
                className="w-full border-0 rounded-none focus:ring-0"
              />
            </div>
            <div className="sm:hidden flex flex-col gap-2">

              {projectFilter !== "all" && (
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-[#e6f2ea] text-[#4a7c59] hover:text-[#3a6346] hover:bg-[#d1e7dd] border-[#b3d1c1] shadow-sm w-full"
                  onClick={() => handleProjectChange("all")}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  All Projects
                </Button>
              )}
            </div>
          </div>

          {/* Show selected project name if a project is selected - themed card design */}
          {projectFilter !== "all" && (() => {
            const selectedProject = projects?.find(p => p.id === Number(projectFilter));
            const accentColor = selectedTier1
              ? getTier1Color(selectedTier1)
              : selectedProject?.colorTheme
                ? getProjectTheme(selectedProject.colorTheme).primary
                : '#6366f1';

            return (
              <div
                className="mb-4 border rounded-lg shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
                style={{
                  backgroundColor: hexToRgba(accentColor, 0.08),
                  borderColor: hexToRgba(accentColor, 0.125),
                }}
              >
                {/* Header */}
                <div
                  className="px-4 py-3 border-b flex items-start gap-3"
                  style={{
                    backgroundColor: hexToRgba(accentColor, 0.12),
                    borderColor: hexToRgba(accentColor, 0.25),
                  }}
                >
                  <div
                    className="mt-1 shrink-0 rounded-sm w-3 h-3"
                    style={{ backgroundColor: accentColor }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-semibold text-slate-900 leading-tight">
                        {getProjectName(Number(projectFilter))}
                      </h3>
                      {selectedTier1 && (
                        <span className="text-sm font-normal text-slate-600">
                          → {formatCategoryNameWithProject(selectedTier1)}
                          {selectedTier2 && (
                            <span className="ml-1">
                              → {formatCategoryNameWithProject(selectedTier2)}
                            </span>
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {/* Body - description editors */}
                <div className="p-4">
                  {/* Show project description when not viewing any categories */}
                  {!selectedTier1 && (
                    <ProjectDescriptionEditor
                      project={selectedProject as any}
                      onDescriptionUpdate={() => {
                        queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
                      }}
                    />
                  )}
                  {/* Show tier2 description when viewing a specific tier2 category */}
                  {selectedTier1 && selectedTier2 && (
                    <CategoryDescriptionEditor
                      categoryName={selectedTier2}
                      categoryType="tier2"
                      projectId={parseInt(projectFilter)}
                      showType="category"
                      onDescriptionUpdate={() => {}}
                    />
                  )}
                  {/* Show tier1 description when viewing tier1 but no tier2 selected */}
                  {selectedTier1 && !selectedTier2 && (
                    <CategoryDescriptionEditor
                      categoryName={selectedTier1}
                      categoryType="tier1"
                      projectId={parseInt(projectFilter)}
                      showType="category"
                      onDescriptionUpdate={() => {}}
                    />
                  )}
                </div>
              </div>
            );
          })()}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full min-w-0">
          <TabsList className="grid w-full grid-cols-2 min-w-0">
            <TabsTrigger
              value="list"
              className="data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900"
            >
              List View
            </TabsTrigger>
            <TabsTrigger
              value="timeline"
              className="data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900"
            >
              Timeline View
            </TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="space-y-4 mt-2 w-full min-w-0 overflow-x-hidden">
            {/* 3-Tier Navigation Structure */}
            {!selectedTier1 ? (
              /* TIER 1: Display broad categories (Structural, Systems, Sheathing, Finishings) */
              projectFilter === "all" ? (
                /* ALL PROJECTS VIEW: Show each project with its categories, like project-specific tabs */
                <div className="space-y-8">
                  {projects?.filter(project => {
                    const projectTasks = filteredTasks?.filter(task => Number(task.projectId) === Number(project.id)) || [];
                    return projectTasks.length > 0;
                  }).map(project => {
                    const projectTasks = filteredTasks?.filter(task => Number(task.projectId) === Number(project.id)) || [];

                    // Debug: Check what's happening with project task filtering
                    console.log(`🔍 Project ${project.id} (${project.name}):`, {
                      expectedProjectId: project.id,
                      projectTasks: projectTasks.length,
                      sampleTaskProjectIds: projectTasks.slice(0, 5).map(t => t.projectId),
                      allTaskProjectIds: [...new Set(filteredTasks?.map(t => t.projectId) || [])],
                      filteredTasksTotal: filteredTasks?.length
                    });

                    // Get unique categories for this project only
                    const projectCategories = [...new Set(
                      projectTasks
                        .map(task => task.tier1Category?.toLowerCase())
                        .filter(Boolean)
                    )];

                    return (
                      <div key={project.id} className="space-y-4">
                        <div className="border-b pb-2">
                          <h2 className="text-2xl font-bold text-gray-800">{project.name}</h2>
                          <p className="text-sm text-gray-600">{projectTasks.length} tasks across {projectCategories.length} categories</p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                          {projectCategories.map(tier1 => {
                            const categoryTasks = projectTasks.filter(task =>
                              task.tier1Category?.toLowerCase() === tier1
                            );

                            const inProgress = categoryTasks.filter(t => t.status === 'in_progress').length;
                            const completed = categoryTasks.filter(t => t.completed === true || t.status === 'completed').length;
                            const totalTasks = categoryTasks.length;
                            const completionPercentage = totalTasks > 0 ? Math.round((completed / totalTasks) * 100) : 0;

                            return (
                              <Card
                                key={`${project.id}-${tier1}`}
                                className="rounded-lg bg-card text-card-foreground shadow-sm h-full transition-all hover:shadow-md cursor-pointer overflow-hidden"
                                onClick={() => {
                                  // Update project filter first
                                  setProjectFilter(project.id.toString());
                                  // Navigate with URL params
                                  const params = new URLSearchParams();
                                  params.set('projectId', project.id.toString());
                                  params.set('tier1', tier1);
                                  setLocation(`/tasks?${params.toString()}`);
                                }}
                              >
                                <div
                                  className="flex flex-col space-y-1.5 p-6 rounded-t-lg"
                                  style={{ backgroundColor: getProjectSpecificTier1Color(project.id, tier1) }}
                                >
                                  <div className="flex justify-center py-4">
                                    <div className="p-3 rounded-full bg-white/20">
                                      {getTier1Icon(tier1, "h-10 w-10 text-white")}
                                    </div>
                                  </div>
                                </div>
                                <div className="p-6 pt-6">
                                  <h3 className="text-xl font-medium leading-none tracking-tight capitalize text-slate-900">
                                    {formatCategoryNameWithProject(tier1)}
                                  </h3>
                                  <p className="text-sm text-muted-foreground mt-2">
                                    {getTier1Description(tier1)}
                                  </p>
                                  <div className="mt-4 space-y-2">
                                    <div className="flex justify-between text-sm">
                                      <span className="text-muted-foreground">Progress</span>
                                      <span className="font-medium">{completionPercentage}%</span>
                                    </div>
                                    <div className="w-full bg-slate-200 rounded-full h-2">
                                      <div
                                        className="h-2 rounded-full transition-all duration-300"
                                        style={{
                                          backgroundColor: getProjectSpecificTier1Color(project.id, tier1),
                                          width: `${completionPercentage}%`
                                        }}
                                      />
                                    </div>
                                    <div className="flex justify-between text-xs text-muted-foreground">
                                      <span>{completed} completed</span>
                                      <span>{totalTasks} total</span>
                                    </div>
                                  </div>
                                </div>
                              </Card>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* SINGLE PROJECT VIEW: Display categories normally */
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 px-0 w-full min-w-0">
                  {/* Show only tier1 categories that have tasks for this project */}
                  {predefinedTier1Categories
                    .filter((tier1: string) => !hiddenCategories.includes(tier1.toLowerCase()))
                    .filter((tier1: string) => {
                      // Only show tier1 categories that have tasks for this project (case-insensitive)
                      const tasks = tasksByTier1?.[tier1] || tasksByTier1?.[tier1.toLowerCase()] ||
                        Object.entries(tasksByTier1 || {}).find(([key]) =>
                          key.toLowerCase() === tier1.toLowerCase()
                        )?.[1] || [];
                      return tasks.length > 0;
                    })
                    .map((tier1: string) => {
                      // Use existing tasks data if available, otherwise show empty stats (case-insensitive)
                      const tasks = tasksByTier1?.[tier1] || tasksByTier1?.[tier1.toLowerCase()] ||
                        Object.entries(tasksByTier1 || {}).find(([key]) =>
                          key.toLowerCase() === tier1.toLowerCase()
                        )?.[1] || [];
                      const inProgress = tasks.filter(t => t.status === 'in_progress').length;
                      const completed = tasks.filter(t => t.completed === true || t.status === 'completed').length;
                      const totalTasks = tasks.length;
                      const completionPercentage = (tier1CompletionDerived[tier1] || 0);

                      return (
                        <Card
                          key={`${tier1}-${refreshKey}`}
                          className="rounded-lg bg-card text-card-foreground shadow-sm h-full transition-all hover:shadow-md cursor-pointer overflow-hidden w-full min-w-0"
                          onClick={() => navigateWithParams(tier1)}
                          style={{ border: `1px solid ${getProjectSpecificTier1Color(Number(projectFilter), tier1)}` }}
                        >

                          <div
                            className="flex flex-col space-y-1.5 p-6 rounded-t-lg"
                            style={{ backgroundColor: getProjectSpecificTier1Color(Number(projectFilter), tier1) }}
                          >
                            <div className="flex justify-center py-4">
                              <div className="p-3 rounded-full bg-white/20">
                                {getTier1Icon(tier1, "h-10 w-10 text-white")}
                              </div>
                            </div>
                          </div>
                          <div className="p-6 pt-6">
                            <h3 className="text-xl font-medium leading-none tracking-tight capitalize text-slate-900">
                              {formatCategoryNameWithProject(tier1)}
                            </h3>
                            <p className="text-sm text-muted-foreground mt-2">
                              {getTier1Description(tier1)}
                            </p>
                            <div className="mt-4 space-y-2">
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">
                                  {completed} of {totalTasks} completed
                                </span>
                                <span className="font-medium">{completionPercentage}%</span>
                              </div>
                              <div className="w-full bg-slate-100 rounded-full h-2">
                                <div
                                  className="rounded-full h-2"
                                  style={{
                                    width: `${completionPercentage}%`,
                                    backgroundColor: getProjectSpecificTier1Color(Number(projectFilter), tier1)
                                  }}
                                ></div>
                              </div>
                              <div className="flex justify-between items-center mt-3 pt-2 border-t">
                                <div className="flex items-center gap-2">
                                  {inProgress > 0 && (
                                    <span className="text-sm text-muted-foreground">
                                      {inProgress} in progress
                                    </span>
                                  )}
                                </div>
                                <span className="text-sm bg-slate-100 rounded-full px-2 py-1 font-medium">
                                  {totalTasks} {totalTasks === 1 ? 'task' : 'tasks'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                </div>
              )
            ) : selectedTier1 && !selectedTier2 ? (
              /* TIER 2: Display specific categories within the selected Tier 1 */
              <>
                <div className="mb-4">
                  {/* Back button and category tag on the same row */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigateWithParams(null, null)}
                        className="flex items-center gap-1 text-black border-black hover:bg-gray-50 w-fit"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        <span className="hidden sm:inline">Back to main categories</span>
                        <span className="sm:hidden">Back</span>
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigateWithParams(selectedTier1, null)}
                        className="px-2 py-1 bg-gray-100 text-gray-800 border border-gray-300 rounded-full text-sm font-medium flex items-center gap-1 hover:bg-gray-200 w-fit"
                      >
                        {getTier1Icon(selectedTier1, "h-4 w-4 text-gray-800")}
                        <span className="truncate max-w-[120px] sm:max-w-none">
                          {formatCategoryNameWithProject(selectedTier1)}
                        </span>
                      </Button>
                    </div>

                    {/* Manage Categories and All Projects buttons */}
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-white text-slate-600 hover:text-slate-800 border-slate-200 shadow-sm h-9"
                        onClick={() => handleProjectChange("all")}
                      >
                        <ArrowLeft className="h-4 w-4 sm:mr-1" />
                        <span className="hidden sm:inline">All Projects</span>
                      </Button>
                    </div>
                  </div>
                </div>



                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 px-0 w-full min-w-0">
                  {/* Show all tier2 categories */}
                  {(() => {
                    // Find tier2 categories with case-insensitive matching
                    // Use lowercase key since tier2ByTier1Name keys are lowercase
                    const lookupKey = (selectedTier1 || '').toLowerCase();
                    const tier2Categories = predefinedTier2Categories[lookupKey] ||
                      Object.entries(predefinedTier2Categories).find(([key]) =>
                        key.toLowerCase() === lookupKey
                      )?.[1] || [];
                    return tier2Categories;
                  })()?.map((tier2) => {
                    // Use existing tasks data if available, otherwise show empty stats
                    const tasks = tasksByTier2[selectedTier1 || '']?.[tier2] || [];
                    const inProgress = tasks.filter(t => t.status === 'in_progress').length;
                    const completed = tasks.filter(t => t.completed === true || t.status === 'completed').length;
                    const totalTasks = tasks.length;
                    const completionPercentage = tier2Completion[selectedTier1 || '']?.[tier2] || 0;

                    return (
                      <Card
                        key={tier2}
                        className="rounded-lg bg-card text-card-foreground shadow-sm h-full transition-all hover:shadow-md cursor-pointer overflow-hidden w-full min-w-0"
                        onClick={() => navigateWithParams(selectedTier1, tier2)}
                        style={{ border: `1px solid ${getTier2Color(tier2, selectedTier1 || undefined)}` }}
                      >

                        <div
                          className="flex flex-col space-y-1.5 p-6 rounded-t-lg"
                          style={{ backgroundColor: getTier2Color(tier2, selectedTier1 || undefined) }}
                        >
                          <div className="flex justify-center py-4">
                            <div className="p-3 rounded-full bg-white/20">
                              {getTier2Icon(tier2, "h-10 w-10 text-white")}
                            </div>
                          </div>
                        </div>
                        <div className="p-6 pt-6">
                          <h3 className="text-xl font-medium leading-none tracking-tight capitalize text-slate-900">
                            {(() => {
                              console.log(`Tier2 card displaying category: "${tier2}"`);
                              const formatted = formatCategoryNameWithProject(tier2);
                              console.log(`Formatted result: "${formatted}"`);
                              return formatted;
                            })()}
                          </h3>
                          <p className="text-sm text-muted-foreground mt-2">
                            {getTier2Description(tier2)}
                          </p>
                          <div className="mt-4 space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">
                                {completed} of {totalTasks} completed
                              </span>
                              <span className="font-medium">{completionPercentage}%</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-2">
                              <div
                                className="rounded-full h-2"
                                style={{
                                  width: `${completionPercentage}%`,
                                  backgroundColor: getTier2Color(tier2, selectedTier1 || undefined)
                                }}
                              ></div>
                            </div>
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mt-3 pt-2 border-t">
                              <div className="flex items-center gap-2 flex-wrap min-w-0">
                                {(() => {
                                  // Get unique project names for tasks in this tier2 category
                                  const projectNames = tasks ? Array.from(new Set(
                                    tasks.filter(task => task.tier1Category === selectedTier1 && task.tier2Category === tier2)
                                      .map(task => getProjectName(task.projectId))
                                  )) : [];

                                  return projectNames.length > 0 && (
                                    <div
                                      className="bg-white rounded-full px-2 py-1 text-xs font-medium shadow-sm border flex-shrink-0"
                                      style={{
                                        color: getTier2Color(tier2, selectedTier1 || undefined),
                                        maxWidth: '100px'
                                      }}
                                    >
                                      <div className="truncate" title={projectNames.join(', ')}>
                                        {projectNames.length === 1
                                          ? projectNames[0]
                                          : `${projectNames.length} projects`
                                        }
                                      </div>
                                    </div>
                                  );
                                })()}
                                <span className="text-sm text-muted-foreground flex-shrink-0">
                                  {inProgress > 0 && `${inProgress} in progress`}
                                </span>
                              </div>
                              <span className="text-sm bg-slate-100 rounded-full px-2 py-1 font-medium flex-shrink-0 self-start sm:self-center">
                                {totalTasks} {totalTasks === 1 ? 'task' : 'tasks'}
                              </span>
                            </div>

                            {/* Add Load Templates button for this tier2 category */}
                            <div className="mt-3 pt-2 border-t">
                              <Button
                                className="w-full text-xs mt-2 bg-slate-700 hover:bg-slate-800 text-white"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation(); // Prevent card click event
                                  loadSubcategoryTemplates(selectedTier1 || '', tier2);
                                }}
                                title={`Load templates for ${formatCategoryNameWithProject(tier2)} category`}
                              >
                                <RefreshCw className="mr-1 h-3 w-3" />
                                Load Templates
                              </Button>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full mt-2 border-dashed border-slate-300 hover:border-slate-400 text-slate-600"
                              onClick={(e) => {
                                e.stopPropagation(); // Prevent card click event
                                handleAddTaskForCategory(tier2);
                              }}
                            >
                              <Plus className="h-3.5 w-3.5 mr-1" /> Add Task in {formatCategoryNameWithProject(tier2)}
                            </Button>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </>
            ) : (
              /* TIER 3: Display specific tasks for the selected Tier 2 */
              <>
                <div className="mb-4 bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigateWithParams(selectedTier1, null)}
                        className="flex items-center gap-1 text-[#080800] hover:text-orange-600 hover:bg-orange-50 w-fit"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Back to {formatCategoryNameWithProject(selectedTier1)} categories
                      </Button>

                      <div className="flex flex-row items-center gap-2 sm:gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigateWithParams(selectedTier1, null)}
                          className="px-2 py-1 bg-gray-100 text-gray-800 border border-gray-300 rounded-full text-sm font-medium flex items-center gap-1 hover:bg-gray-200 w-fit"
                        >
                          {getTier1Icon(selectedTier1, "h-4 w-4 text-gray-800")}
                          {formatCategoryNameWithProject(selectedTier1)}
                        </Button>
                        <span className="text-gray-400 mx-1 hidden sm:inline">→</span>
                        <span className="text-gray-400 text-xs sm:hidden">then</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigateWithParams(selectedTier1, null)}
                          className="px-2 py-1 bg-gray-100 text-gray-800 border border-gray-300 rounded-full text-sm font-medium flex items-center gap-1 hover:bg-gray-200 w-fit"
                        >
                          {getTier2Icon(selectedTier2, "h-4 w-4 text-gray-800")}
                          {formatCategoryNameWithProject(selectedTier2)}
                        </Button>
                      </div>
                    </div>

                    {/* Add Task and Select Categories buttons */}
                    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                      <Button
                        onClick={() => {
                          console.log('Add Task button clicked', { selectedTier1, selectedTier2 });
                          // Pre-populate with both tier1 and tier2 categories
                          handleAddTaskWithCategories(
                            selectedTier1 || 'structural',
                            selectedTier2 || 'foundation'
                          );
                        }}
                        className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white whitespace-nowrap"
                        size="sm"
                      >
                        <Plus className="h-4 w-4 flex-shrink-0" />
                        <span className="hidden lg:inline">
                          Add {selectedTier1 && selectedTier2
                            ? `${formatCategoryNameWithProject(selectedTier1)} / ${formatCategoryNameWithProject(selectedTier2)} Task`
                            : 'New Task'
                          }
                        </span>
                        <span className="lg:hidden">Add Task</span>
                      </Button>

                      <Button
                        onClick={() => setImportDialogOpen(true)}
                        className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white whitespace-nowrap"
                        size="sm"
                      >
                        <Upload className="h-4 w-4 flex-shrink-0" />
                        <span className="hidden lg:inline">Import Task</span>
                        <span className="lg:hidden">Import</span>
                      </Button>

                      {!isSelectionMode ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIsSelectionMode(true)}
                          className="border-red-500 text-red-600 hover:bg-red-50 whitespace-nowrap"
                        >
                          <CheckSquare className="mr-2 h-4 w-4 flex-shrink-0" />
                          <span className="hidden sm:inline">Select Tasks</span>
                          <span className="sm:hidden">Select</span>
                        </Button>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setIsSelectionMode(false);
                              setSelectedTasks(new Set());
                            }}
                            className="border-gray-400 text-gray-600 hover:bg-gray-50 whitespace-nowrap"
                          >
                            <X className="mr-2 h-4 w-4 flex-shrink-0" />
                            Cancel
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={toggleAllTasksSelection}
                            className="border-blue-500 text-blue-600 hover:bg-blue-50 whitespace-nowrap"
                          >
                            <Square className="mr-2 h-4 w-4 flex-shrink-0" />
                            <span className="hidden sm:inline">Select All</span>
                            <span className="sm:hidden">All</span>
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={handleDeleteSelectedTasks}
                            disabled={selectedTasks.size === 0}
                            className="bg-red-600 hover:bg-red-700 whitespace-nowrap"
                          >
                            <Trash2 className="mr-2 h-4 w-4 flex-shrink-0" />
                            Delete ({selectedTasks.size})
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Tier 2 Category Description Editor - only show if a specific project is selected */}
                {projectFilter !== "all" ? (
                  <CategoryDescriptionEditor
                    categoryName={selectedTier2 || ''}
                    categoryType="tier2"
                    projectId={parseInt(projectFilter)}
                    onDescriptionUpdate={() => {
                      // Refresh categories data or update local state if needed
                    }}
                  />
                ) : (
                  <AllProjectsCategoryDescriptions
                    categoryName={selectedTier2 || ''}
                    categoryType="tier2"
                    projects={projects}
                  />
                )}

                {/* Task Category View */}
                <CategoryTasksDisplay
                  selectedTier1={selectedTier1}
                  selectedTier2={selectedTier2}
                  tasksByTier2={tasksByTier2}
                  projectFilter={projectFilter}
                  getProjectName={getProjectName}
                  setSelectedTask={setSelectedTask}
                  setEditDialogOpen={setEditDialogOpen}
                  activateTaskFromTemplate={activateTaskFromTemplate}
                  expandedDescriptionTaskId={expandedDescriptionTaskId}
                  setExpandedDescriptionTaskId={setExpandedDescriptionTaskId}
                  isSelectionMode={isSelectionMode}
                  selectedTasks={selectedTasks}
                  toggleTaskSelection={toggleTaskSelection}
                  projects={projects}
                  allCategories={allCategories}
                />
              </>
            )}
          </TabsContent>

          <TabsContent value="timeline" className="mt-4 w-full min-w-0 overflow-x-hidden">
            <Card className="w-full min-w-0">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-base">Gantt Chart View</CardTitle>
                  <div id="gantt-controls-container" className="flex items-center space-x-2">
                    {/* View Period Buttons */}
                    <div className="flex items-center space-x-1">
                      <Button
                        variant={viewPeriod === 1 ? "default" : "outline"}
                        size="sm"
                        className="h-8 px-2 text-xs"
                        onClick={() => setViewPeriod(1)}
                      >
                        1D
                      </Button>
                      <Button
                        variant={viewPeriod === 3 ? "default" : "outline"}
                        size="sm"
                        className="h-8 px-2 text-xs"
                        onClick={() => setViewPeriod(3)}
                      >
                        3D
                      </Button>
                      <Button
                        variant={viewPeriod === 10 ? "default" : "outline"}
                        size="sm"
                        className="h-8 px-2 text-xs"
                        onClick={() => setViewPeriod(10)}
                      >
                        10D
                      </Button>
                    </div>
                  </div>
                </div>

              </CardHeader>
              <CardContent className="w-full min-w-0 overflow-x-auto">
                {ganttTasks.length > 0 ? (
                  <div className="h-[500px] w-full min-w-0">
                    <GanttChart tasks={ganttTasks} viewPeriod={viewPeriod} />
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-64 border border-dashed rounded-md border-muted-foreground/50 w-full">
                    <p className="text-muted-foreground text-center">Gantt chart visualization would appear here</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Add the CreateTaskDialog component */}
      <CreateTaskDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        projectId={projectFilter !== "all" ? Number(projectFilter) : undefined}
        preselectedCategory={preselectedCategory}
      />

      {/* Add the EditTaskDialog component */}
      <EditTaskDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        task={selectedTask}
      />

      {/* Add the ImportTaskDialog component */}
      <ImportTaskDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        defaultProjectId={projectFilter !== "all" ? Number(projectFilter) : undefined}
        defaultTier1Category={selectedTier1 || undefined}
        defaultTier2Category={selectedTier2 || undefined}
      />

      {/* DEBUG: Show theme debug info for first few projects */}
      {projectFilter === "all" && (
        <div className="space-y-2">
        </div>
      )}

    </Layout>
  );
}
