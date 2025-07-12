import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { Layout } from "@/components/layout/Layout";
import { TaskAttachments } from "@/components/task/TaskAttachments";
import { TaskLabor } from "@/components/task/TaskLabor";
import { TaskMaterials } from "@/components/task/TaskMaterials";
import { TaskMaterialsView } from "@/components/materials/TaskMaterialsView";
import { ProjectSelector } from "@/components/project/ProjectSelector";
import { getMergedTasks } from "@/components/task/TaskTemplateService";
import { ManageCategoriesDialog } from "@/components/task/ManageCategoriesDialog";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
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
import { getStatusBorderColor, getStatusBgColor, getProgressColor, formatTaskStatus, getTier1CategoryColor, formatCategoryName } from "@/lib/color-utils";
import { getCategoryNames } from "@/lib/category-names";
import { formatDate } from "@/lib/utils";
import { useTier2CategoriesByTier1Name } from "@/hooks/useTemplateCategories";
import { TaskCard } from "@/components/task/TaskCard";
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
  ArrowLeft
} from "lucide-react";
import { CreateTaskDialog } from "./CreateTaskDialog";
import { EditTaskDialog } from "./EditTaskDialog";

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
  setExpandedDescriptionTaskId
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
}) {
  const [selectedTasks, setSelectedTasks] = useState<Set<number>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const { toast } = useToast();
  // Use the location hook for navigation
  const [, navigate] = useLocation();
  
  // Get actual tasks for this category
  const actualTasks = tasksByTier2[selectedTier1 || '']?.[selectedTier2 || ''] || [];
  const projectId = projectFilter !== "all" ? parseInt(projectFilter) : 0;
  
  // Handlers for multi-select functionality
  const handleTaskSelection = (taskId: number, isSelected: boolean) => {
    setSelectedTasks(prev => {
      const newSet = new Set(prev);
      if (isSelected) {
        newSet.add(taskId);
      } else {
        newSet.delete(taskId);
      }
      return newSet;
    });
  };
  
  const handleSelectAll = () => {
    const allTaskIds = mergedTasks.filter(task => task.id).map(task => task.id);
    setSelectedTasks(new Set(allTaskIds));
  };
  
  const handleDeselectAll = () => {
    setSelectedTasks(new Set());
  };
  
  const handleBulkDelete = async () => {
    if (selectedTasks.size === 0) {
      toast({
        title: "No tasks selected",
        description: "Please select tasks to delete",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Delete tasks one by one
      const deletePromises = Array.from(selectedTasks).map(taskId => 
        fetch(`/api/tasks/${taskId}`, { method: 'DELETE' })
      );
      
      await Promise.all(deletePromises);
      
      // Refresh tasks data
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      if (projectFilter !== "all") {
        queryClient.invalidateQueries({ queryKey: ["/api/projects", Number(projectFilter), "tasks"] });
      }
      
      toast({
        title: "Tasks deleted",
        description: `Successfully deleted ${selectedTasks.size} task${selectedTasks.size > 1 ? 's' : ''}`,
      });
      
      // Reset selection
      setSelectedTasks(new Set());
      setIsSelectionMode(false);
      
    } catch (error) {
      toast({
        title: "Error deleting tasks",
        description: "Failed to delete selected tasks. Please try again.",
        variant: "destructive",
      });
    }
  };
  
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
      {/* Selection Controls */}
      <div className="flex items-center justify-between bg-slate-100 p-3 rounded-lg border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <Button
            variant={isSelectionMode ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setIsSelectionMode(!isSelectionMode);
              if (!isSelectionMode) {
                setSelectedTasks(new Set());
              }
            }}
          >
            {isSelectionMode ? "Cancel Selection" : "Select Tasks"}
          </Button>
          
          {isSelectionMode && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
                disabled={selectedTasks.size === mergedTasks.filter(t => t.id).length}
              >
                Select All
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDeselectAll}
                disabled={selectedTasks.size === 0}
              >
                Deselect All
              </Button>
            </>
          )}
        </div>
        
        {isSelectionMode && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600">
              {selectedTasks.size} selected
            </span>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleBulkDelete}
              disabled={selectedTasks.size === 0}
            >
              Delete Selected
            </Button>
          </div>
        )}
      </div>

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
          <div key={task.id} className={`relative ${isSelectionMode ? 'border-2 border-dashed border-slate-200 p-2 rounded-lg' : ''}`}>
            {isSelectionMode && task.id && (
              <div className="absolute top-2 left-2 z-10 bg-white rounded-full p-1 shadow-sm">
                <Checkbox
                  checked={selectedTasks.has(task.id)}
                  onCheckedChange={(checked) => handleTaskSelection(task.id, checked as boolean)}
                />
              </div>
            )}
            <TaskCard
              task={task}
              className={isSelectionMode ? 'ml-8' : ''}
              compact={false}
              showActions={!isSelectionMode}
              showManageTasksButton={!isSelectionMode}
              getProjectName={getProjectName}
            />
          </div>
        );
      })}
    </div>
  );
}
// Using Task from @/types to ensure compatibility with frontend components

export default function TasksPage() {
  const [, setLocation] = useLocation();
  const params = useParams();
  
  // Get project ID and category parameters from URL query parameter
  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const projectIdFromUrl = searchParams.get('projectId') ? Number(searchParams.get('projectId')) : undefined;
  const tier1FromUrl = searchParams.get('tier1') || null;
  const tier2FromUrl = searchParams.get('tier2') || null;
  const { toast } = useToast();
  
  const [projectFilter, setProjectFilter] = useState(projectIdFromUrl ? projectIdFromUrl.toString() : "all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  
  // Hierarchical category navigation state - initialize from URL parameters
  const [selectedTier1, setSelectedTier1] = useState<string | null>(tier1FromUrl);
  const [selectedTier2, setSelectedTier2] = useState<string | null>(tier2FromUrl);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  const [activeTab, setActiveTab] = useState<string>("list");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [expandedDescriptionTaskId, setExpandedDescriptionTaskId] = useState<number | null>(null);
  const [manageCategoriesOpen, setManageCategoriesOpen] = useState<boolean>(false);

  // Fetch categories from admin panel or aggregate from all projects
  const { data: tier2ByTier1Name, tier1Categories: dbTier1Categories, tier2Categories: dbTier2Categories } = useTier2CategoriesByTier1Name(
    projectFilter !== "all" ? parseInt(projectFilter) : null
  );

  // Force refresh when admin panel colors are updated
  const [refreshKey, setRefreshKey] = useState(0);
  
  useEffect(() => {
    const handleAdminColorsUpdated = async () => {
      console.log('Theme changed event received - refreshing colors');
      
      // Clear admin color system cache first
      try {
        const { clearColorCache } = await import('@/lib/admin-color-system');
        clearColorCache();
      } catch (error) {
        console.error('Error clearing color cache:', error);
      }
      
      // Invalidate template categories query - this is the key query that provides dbTier1Categories
      const templateCategoriesQueryKey = projectFilter !== "all" 
        ? [`/api/projects/${projectFilter}/template-categories`]
        : ['/api/admin/template-categories'];
      
      queryClient.invalidateQueries({ queryKey: templateCategoriesQueryKey });
      
      // Invalidate tasks query to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      
      // Force immediate refetch of category data to get fresh colors
      await queryClient.refetchQueries({ queryKey: templateCategoriesQueryKey });
      
      // Force component re-render to pick up new colors
      setRefreshKey(prev => prev + 1);
      
      console.log('Color refresh completed');
    };

    // Listen for admin color updates
    window.addEventListener('themeChanged', handleAdminColorsUpdated);
    
    return () => {
      window.removeEventListener('themeChanged', handleAdminColorsUpdated);
    };
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

  // State for pre-selected category when adding task from category card
  // Can be a simple string (legacy) or an object with tier1 and tier2 categories
  type CategoryPreselection = string | { tier1Category: string, tier2Category: string, category: string } | null;
  const [preselectedCategory, setPreselectedCategory] = useState<CategoryPreselection>(null);

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
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
      'Content-Type': 'application/json'
    }
  });
      if (!response.ok) {
        throw new Error("Failed to fetch tasks");
      }
      return response.json();
    },
  });
  
  // Templates will be loaded on-demand when accessing template functions
  // No need to explicitly call fetchTemplates() here
  // This avoids the double-loading issue

  const { data: projects = [], isLoading: projectsLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });
  
  // Update projectFilter when projectIdFromUrl changes
  useEffect(() => {
    if (projectIdFromUrl) {
      setProjectFilter(projectIdFromUrl.toString());
    }
  }, [projectIdFromUrl]);

  // Update selected categories when URL parameters change
  useEffect(() => {
    if (tier1FromUrl) {
      setSelectedTier1(tier1FromUrl);
    }
    if (tier2FromUrl) {
      setSelectedTier2(tier2FromUrl);
    }
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
  const ganttTasks = tasks?.map(task => ({
    id: task.id,
    title: task.title.length > 20 ? task.title.substring(0, 20) + '...' : task.title,
    description: task.description || null,
    startDate: new Date(task.startDate),
    endDate: new Date(task.endDate),
    status: task.status,
    assignedTo: task.assignedTo || null,
    category: task.category || 'general',
    contactIds: task.contactIds || null,
    materialIds: task.materialIds || null,
    projectId: task.projectId,
    completed: task.completed || null,
    materialsNeeded: task.materialsNeeded || null,
    durationDays: Math.ceil((new Date(task.endDate).getTime() - new Date(task.startDate).getTime()) / (1000 * 60 * 60 * 24)),
  }));

  // Get the current project to check for hidden categories
  const currentProject = projectFilter !== "all" 
    ? projects.find(p => p.id.toString() === projectFilter) 
    : null;
  const hiddenCategories = currentProject?.hiddenCategories || [];
  
  // Filter tasks based on search query, project, status, category, and hidden categories
  const filteredTasks = tasks?.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesProject = projectFilter === "all" || task.projectId.toString() === projectFilter;
    const matchesStatus = statusFilter === "all" || task.status === statusFilter;
    const matchesCategory = categoryFilter === "all" || task.category === categoryFilter;
    const matchesSelectedCategory = !selectedCategory || task.category === selectedCategory;
    const isNotHidden = !hiddenCategories.includes(task.tier1Category?.toLowerCase() || '');
    
    return matchesSearch && matchesProject && matchesStatus && matchesCategory && matchesSelectedCategory && isNotHidden;
  });

  // Group tasks by tier1Category (Structural, Systems, Sheathing, Finishings) - use filtered tasks
  const tasksByTier1 = filteredTasks?.reduce((acc, task) => {
    const tier1 = task.tier1Category || 'Uncategorized';
    if (!acc[tier1]) {
      acc[tier1] = [];
    }
    acc[tier1].push(task);
    return acc;
  }, {} as Record<string, Task[]>);
  
  // Group tasks by tier2Category within each tier1Category - use filtered tasks
  const tasksByTier2 = filteredTasks?.reduce((acc, task) => {
    const tier1 = task.tier1Category || 'Uncategorized';
    const tier2 = task.tier2Category || 'Other';
    
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
  const tasksByCategory = tasks?.reduce((acc, task) => {
    const category = task.category || 'other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(task);
    return acc;
  }, {} as Record<string, Task[]>);

  // Calculate completion percentage for tier1 categories using filtered tasks
  const tier1Completion = Object.entries(tasksByTier1 || {}).reduce((acc, [tier1, tasks]) => {
    const totalTasks = tasks.length;
    
    // Check both the completed flag and status field (tasks marked as 'completed' should count)
    const completedTasks = tasks.filter(task => 
      task.completed === true || task.status === 'completed'
    ).length;
    
    acc[tier1] = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    return acc;
  }, {} as Record<string, number>);
  
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
    
    if (lowerCaseTier1 === 'structural') {
      return <Building className={`${className} text-orange-600`} />;
    }
    
    if (lowerCaseTier1 === 'systems') {
      return <Cog className={`${className} text-blue-600`} />;
    }
    
    if (lowerCaseTier1 === 'sheathing') {
      return <PanelTop className={`${className} text-green-600`} />;
    }
    
    if (lowerCaseTier1 === 'finishings') {
      return <Sofa className={`${className} text-violet-600`} />;
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
  
  // Get tier1 category color from admin panel data
  const getTier1Color = (tier1: string) => {
    if (!tier1 || !dbTier1Categories) return '#6B7280'; // gray-500 fallback
    
    const category = dbTier1Categories.find((cat: any) => 
      cat.name.toLowerCase() === tier1.toLowerCase()
    );
    
    return category?.color || '#6B7280';
  };

  // Get tier1 icon background color using admin panel colors
  const getTier1Background = (tier1: string) => {
    // Return the actual color from admin panel for inline styling
    return getTier1Color(tier1);
  };
  
  // Get tier2 category color from admin panel data
  const getTier2Color = (tier2: string, tier1?: string) => {
    if (!tier2 || !dbTier2Categories) return '#6B7280'; // gray-500 fallback
    
    const category = dbTier2Categories.find((cat: any) => 
      cat.name.toLowerCase() === tier2.toLowerCase()
    );
    return category?.color || '#6B7280';
  };

  // Get tier2 icon background color using admin panel colors
  const getTier2Background = (tier2: string) => {
    // Return the actual color from admin panel for inline styling
    return getTier2Color(tier2);
  };
  
  // Get tier1 progress bar color using our earth tone palette
  const getTier1ProgressColor = (tier1: string) => {
    // Map tier1 categories to standard Tailwind classes for progress bars
    switch (tier1.toLowerCase()) {
      case 'structural':
        return 'bg-green-600';
      case 'systems':
        return 'bg-slate-600';
      case 'sheathing':
        return 'bg-red-600';
      case 'finishings':
        return 'bg-amber-600';
      default:
        return 'bg-stone-600';
    }
  };
  
  // Get tier2 progress bar color - using the same colors as in color-utils.ts
  const getTier2ProgressColor = (tier2: string) => {
    const lowerTier2 = tier2?.toLowerCase() || '';
    
    // Match colors used in getTier2CategoryColor in color-utils.ts
    switch (lowerTier2) {
      // Structural subcategories
      case 'foundation':
        return 'bg-emerald-600'; // #047857
      case 'framing':
        return 'bg-lime-600'; // #65a30d
      case 'roofing':
        return 'bg-green-700'; // #15803d
      case 'lumber':
        return 'bg-emerald-700'; // #047857
      case 'shingles':
        return 'bg-green-800'; // #166534
      
      // Systems subcategories
      case 'electric':
      case 'electrical':
        return 'bg-blue-600'; // #2563eb
      case 'plumbing':
        return 'bg-cyan-600'; // #0891b2
      case 'hvac':
        return 'bg-sky-600'; // #0284c7
      
      // Sheathing subcategories
      case 'barriers':
        return 'bg-rose-600'; // #e11d48
      case 'drywall':
        return 'bg-pink-600'; // #db2777
      case 'exteriors':
        return 'bg-red-500'; // #ef4444
      case 'siding':
        return 'bg-rose-500'; // #f43f5e
      case 'insulation':
        return 'bg-red-700'; // #b91c1c
      
      // Finishings subcategories
      case 'windows':
        return 'bg-amber-500'; // #f59e0b
      case 'doors':
        return 'bg-yellow-600'; // #ca8a04
      case 'cabinets':
        return 'bg-orange-600'; // #ea580c
      case 'fixtures':
        return 'bg-amber-700'; // #b45309
      case 'flooring':
        return 'bg-yellow-700'; // #a16207
      case 'paint':
        return 'bg-orange-500'; // #f97316
      case 'permits':
        return 'bg-amber-600';
        
      // Default fallback
      default:
        return 'bg-gray-600'; // #4b5563
    }
  };
  
  // Get category icon background color (for backward compatibility)
  const getCategoryIconBackground = (category: string) => {
    switch (category.toLowerCase()) {
      case 'foundation':
        return 'bg-stone-200';
      case 'framing':
        return 'bg-[#503e49]/20';
      case 'electrical':
        return 'bg-yellow-200';
      case 'plumbing':
        return 'bg-blue-200';
      case 'hvac':
        return 'bg-gray-200';
      case 'windows_doors':
        return 'bg-sky-200';
      case 'drywall':
        return 'bg-neutral-200';
      case 'flooring':
        return 'bg-orange-200';
      case 'painting':
        return 'bg-indigo-200';
      case 'landscaping':
        return 'bg-emerald-200';
      default:
        return 'bg-slate-200';
    }
  };
  
  // Get category progress bar color (for backward compatibility)
  const getCategoryProgressColor = (category: string) => {
    switch (category) {
      case 'foundation':
        return 'bg-stone-500';
      case 'framing':
        return 'bg-[#503e49]';
      case 'electrical':
        return 'bg-yellow-500';
      case 'plumbing':
        return 'bg-blue-500';
      case 'hvac':
        return 'bg-gray-500';
      case 'windows_doors':
        return 'bg-sky-500';
      case 'drywall':
        return 'bg-neutral-500';
      case 'flooring':
        return 'bg-orange-500';
      case 'painting':
        return 'bg-indigo-500';
      case 'landscaping':
        return 'bg-emerald-500';
      default:
        return 'bg-slate-500';
    }
  };
  
  // Get tier1 description
  const getTier1Description = (tier1: string) => {
    switch (tier1.toLowerCase()) {
      case 'structural':
        return 'Main building structure components and foundation';
      case 'systems':
        return 'Electrical, plumbing, and mechanical systems';
      case 'sheathing':
        return 'Exterior and interior enclosures and barriers';
      case 'finishings':
        return 'Interior fixtures, surfaces, and aesthetic elements';
      default:
        return 'General construction tasks';
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

  // Use project-specific category names for formatting
  const formatCategoryNameWithProject = (category: string): string => {
    if (!category) return '';
    
    // Get the current project ID for project-specific category names
    const projectId = projectFilter !== "all" ? parseInt(projectFilter) : currentProject?.id;
    
    // Use the project-specific category name formatting
    return formatCategoryName(category, projectId);
  };

  // Get project name by ID
  const getProjectName = (projectId: number) => {
    const project = projects?.find(p => p.id === projectId);
    return project ? project.name : "Unknown Project";
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
  
  // Get admin categories
  const adminTier1Categories = dbTier1Categories?.map((cat: any) => cat.name.toLowerCase()) || [];
  
  // When viewing a specific project, show ALL project categories, not just those with tasks
  // When viewing all projects, only show categories that have tasks
  let predefinedTier1Categories: string[];
  
  if (projectFilter !== "all") {
    // Show all project categories regardless of whether they have tasks
    predefinedTier1Categories = adminTier1Categories;
  } else {
    // Show only categories that have tasks when viewing all projects
    const adminCategoriesWithTasks = adminTier1Categories.filter(adminCat => 
      tasksWithTier1.some(taskCat => taskCat.toLowerCase() === adminCat.toLowerCase())
    );
    predefinedTier1Categories = adminCategoriesWithTasks;
  }
  
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
        
        <div className="bg-white border-2 border-green-500 rounded-lg shadow-sm w-full min-w-0 overflow-x-hidden">
          {/* First row with title and buttons */}
          <div className="flex justify-between items-center p-3 sm:p-4 bg-green-50 rounded-t-lg">
            <div className="flex items-center gap-4 flex-1">
              <h1 className="text-xl sm:text-2xl font-bold text-green-600">Tasks</h1>
            </div>
            <div className="hidden sm:flex items-center gap-2">
              {/* Project selector on desktop */}
              <div className="w-full min-w-0 max-w-[180px]">
                <ProjectSelector 
                  selectedProjectId={projectFilter !== "all" ? Number(projectFilter) : undefined} 
                  onChange={handleProjectChange}
                  className="bg-white border-green-300 rounded-lg focus:ring-green-500 w-full min-w-0"
                />
              </div>
              
              {/* Show All Projects button on desktop only when a project is selected */}
              {projectFilter !== "all" && (
                <Button 
                  variant="outline" 
                  size="sm"
                  className="bg-green-50 text-green-600 hover:text-green-700 hover:bg-green-100 border-2 border-green-500 shadow-sm h-9"
                  onClick={() => handleProjectChange("all")}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  All Projects
                </Button>
              )}
              
              {/* Status filter */}
              <div className="w-full min-w-0 max-w-[180px]">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full border-green-500 rounded-lg focus:ring-green-500 min-w-0">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="not_started">Not Started</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              

              
              <Button 
                className="bg-green-600 text-white hover:bg-green-700 font-medium shadow-sm h-9 px-4"
                onClick={() => setCreateDialogOpen(true)}
                size="sm"
              >
                <Plus className="mr-2 h-4 w-4 text-white" /> 
                Add Task
              </Button>
            </div>
            
            {/* Add Task button on mobile */}
            <div className="sm:hidden flex items-center">
              <Button 
                className="bg-green-600 text-white hover:bg-green-700 font-medium shadow-sm h-9 px-3"
                onClick={() => setCreateDialogOpen(true)}
                size="sm"
              >
                <Plus className="h-4 w-4 text-white" /> 
              </Button>
            </div>
          </div>
          
          {/* Second row with search bar */}
          <div className="px-3 sm:px-4 pb-3 bg-green-50 rounded-b-lg">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-green-600" />
              <Input 
                placeholder="Search tasks..." 
                className="w-full pl-9 border-green-300 focus:border-green-500 focus:ring-green-500 rounded-lg"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1 h-8 w-8 rounded-md hover:bg-green-50"
                  onClick={() => setSearchQuery("")}
                >
                  <X className="h-4 w-4 text-green-600" />
                </Button>
              )}
            </div>
          </div>
          
          {/* Project selector on mobile */}
          <div className="px-3 pb-3 flex flex-col gap-2 sm:hidden">
            <div className="w-full">
              <ProjectSelector 
                selectedProjectId={projectFilter !== "all" ? Number(projectFilter) : undefined} 
                onChange={handleProjectChange}
                className="w-full bg-white border-green-300 rounded-lg focus:ring-green-500"
              />
            </div>
            {/* Show All Projects button on mobile only when a project is selected */}
            {projectFilter !== "all" && (
              <Button 
                variant="outline" 
                size="sm"
                className="bg-green-50 text-green-600 hover:text-green-700 hover:bg-green-100 border-green-300 shadow-sm mt-2 w-full"
                onClick={() => handleProjectChange("all")}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                All Projects
              </Button>
            )}
          </div>
          

        </div>
        
        {/* Show selected project name if a project is selected - with modern design */}
        {projectFilter !== "all" && (
          <div className="p-4 sm:p-5 mb-4 bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-200 rounded-lg shadow-sm overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex items-start sm:items-center gap-2 flex-1">
                <div className="h-full w-1 rounded-full bg-blue-500 mr-2 self-stretch hidden sm:block"></div>
                <div className="w-1 h-12 rounded-full bg-blue-500 mr-2 self-start block sm:hidden"></div>
                <div>
                  <h3 className="text-lg sm:text-xl font-semibold text-slate-800 leading-tight">{getProjectName(Number(projectFilter))}</h3>
                  <p className="text-sm text-slate-600">Viewing tasks for this project</p>
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-2 mt-3 sm:mt-0">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="bg-white text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200 shadow-sm h-9"
                  onClick={() => setManageCategoriesOpen(true)}
                >
                  <Layers className="h-4 w-4 sm:mr-1" />
                  <span className="hidden sm:inline">Manage Categories</span>
                </Button>
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
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full min-w-0">
          <TabsList className="grid w-full grid-cols-2 border-green-500 min-w-0">
            <TabsTrigger 
              value="list" 
              className="data-[state=active]:bg-green-50 data-[state=active]:text-green-700"
            >
              List View
            </TabsTrigger>
            <TabsTrigger 
              value="timeline" 
              className="data-[state=active]:bg-green-50 data-[state=active]:text-green-700"
            >
              Timeline View
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="list" className="space-y-4 mt-2 w-full min-w-0 overflow-x-hidden">
            {/* 3-Tier Navigation Structure */}
            {!selectedTier1 ? (
              /* TIER 1: Display broad categories (Structural, Systems, Sheathing, Finishings) */
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 px-0 w-full min-w-0">
                {/* Show only visible tier1 categories (not in hiddenCategories) */}
                {predefinedTier1Categories
                  .filter((tier1: string) => !hiddenCategories.includes(tier1.toLowerCase()))
                  .map((tier1: string) => {
                    // Use existing tasks data if available, otherwise show empty stats
                    const tasks = tasksByTier1?.[tier1] || [];
                    const inProgress = tasks.filter(t => t.status === 'in_progress').length;
                    const completed = tasks.filter(t => t.completed).length;
                    const totalTasks = tasks.length;
                    const completionPercentage = tier1Completion[tier1] || 0;
                  
                  return (
                    <Card 
                      key={`${tier1}-${refreshKey}`} 
                      className="rounded-lg bg-card text-card-foreground shadow-sm h-full transition-all hover:shadow-md cursor-pointer overflow-hidden w-full min-w-0"
                      onClick={() => setSelectedTier1(tier1)}
                      style={{ border: `1px solid ${getTier1Color(tier1)}` }}
                    >
                      
                      <div 
                        className="flex flex-col space-y-1.5 p-6 rounded-t-lg"
                        style={{ backgroundColor: getTier1Color(tier1) }}
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
                                backgroundColor: getTier1Color(tier1)
                              }}
                            ></div>
                          </div>
                          <div className="flex justify-between items-center mt-3 pt-2 border-t">
                            <div className="flex items-center gap-2">
                              {(() => {
                                // Get unique project names for tasks in this tier1 category
                                const projectNames = tasks ? Array.from(new Set(
                                  tasks.filter(task => task.tier1Category === tier1)
                                       .map(task => getProjectName(task.projectId))
                                )) : [];
                                
                                return projectNames.length > 0 && (
                                  <div 
                                    className="bg-white rounded-full px-2 py-1 text-xs font-medium shadow-sm border"
                                    style={{ 
                                      color: getTier1Color(tier1),
                                      maxWidth: '120px'
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
                              <span className="text-sm text-muted-foreground">
                                {inProgress > 0 && `${inProgress} in progress`}
                              </span>
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
            ) : !selectedTier2 ? (
              /* TIER 2: Display specific categories within the selected Tier 1 */
              <>
                <div className="flex items-center gap-2 mb-4">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => {
                      setSelectedTier1(null);
                      setSelectedTier2(null);
                    }}
                    className="flex items-center gap-1 text-[#dcf5e3] hover:text-orange-600 hover:bg-orange-50"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Back to main categories
                  </Button>
                  <Button 
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      // Keep the current tier1 selected but reset tier2
                      setSelectedTier2(null);
                    }}
                    className={`px-2 py-1 ${getTier1Background(selectedTier1)} text-white rounded-full text-sm font-medium flex items-center gap-1 hover:brightness-95`}
                  >
                    {getTier1Icon(selectedTier1, "h-4 w-4 text-white")}
                    {formatCategoryNameWithProject(selectedTier1)}
                  </Button>
                </div>
                
                {/* Add Task button for current tier1 */}
                <div className="flex justify-end mb-4">
                  <Button 
                    onClick={() => {
                      // Pre-populate with the current tier1 category
                      handleAddTaskWithCategories(selectedTier1 || 'Uncategorized', '');
                    }}
                    className="flex items-center gap-1"
                    variant="default"
                    size="sm"
                  >
                    <Plus className="h-4 w-4" />
                    Add Task for {formatCategoryNameWithProject(selectedTier1)}
                  </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 px-0 w-full min-w-0">
                  {/* Show all tier2 categories */}
                  {predefinedTier2Categories[selectedTier1 || 'Uncategorized']?.map((tier2) => {
                    // Use existing tasks data if available, otherwise show empty stats
                    const tasks = tasksByTier2[selectedTier1 || '']?.[tier2] || [];
                    const inProgress = tasks.filter(t => t.status === 'in_progress').length;
                    const completed = tasks.filter(t => t.completed).length;
                    const totalTasks = tasks.length;
                    const completionPercentage = tier2Completion[selectedTier1 || '']?.[tier2] || 0;
                    
                    return (
                      <Card 
                        key={tier2} 
                        className="rounded-lg bg-card text-card-foreground shadow-sm h-full transition-all hover:shadow-md cursor-pointer overflow-hidden w-full min-w-0"
                        onClick={() => setSelectedTier2(tier2)}
                        style={{ border: `1px solid ${getTier2Color(tier2)}` }}
                      >
                        
                        <div 
                          className={`flex flex-col space-y-1.5 p-6 rounded-t-lg ${getTier2Background(tier2)}`}
                          style={{ backgroundColor: getTier2Color(tier2) }}
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
                                  backgroundColor: getTier2Color(tier2)
                                }}
                              ></div>
                            </div>
                            <div className="flex justify-between items-center mt-3 pt-2 border-t">
                              <div className="flex items-center gap-2">
                                {(() => {
                                  // Get unique project names for tasks in this tier2 category
                                  const projectNames = tasks ? Array.from(new Set(
                                    tasks.filter(task => task.tier1Category === selectedTier1 && task.tier2Category === tier2)
                                         .map(task => getProjectName(task.projectId))
                                  )) : [];
                                  
                                  return projectNames.length > 0 && (
                                    <div 
                                      className="bg-white rounded-full px-2 py-1 text-xs font-medium shadow-sm border"
                                      style={{ 
                                        color: getTier2Color(tier2),
                                        maxWidth: '120px'
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
                                <span className="text-sm text-muted-foreground">
                                  {inProgress > 0 && `${inProgress} in progress`}
                                </span>
                              </div>
                              <span className="text-sm bg-slate-100 rounded-full px-2 py-1 font-medium">
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
                <div className="mb-4 space-y-3 bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => {
                      setSelectedTier2(null);
                    }}
                    className="flex items-center gap-1 text-[#080800] hover:text-orange-600 hover:bg-orange-50 w-fit"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Back to {formatCategoryNameWithProject(selectedTier1)} categories
                  </Button>
                  
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-1">
                    <Button 
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        // Keep the current tier1 selected but reset tier2
                        setSelectedTier2(null);
                      }}
                      className="px-2 py-1 text-white rounded-full text-sm font-medium flex items-center gap-1 hover:brightness-95 w-fit"
                      style={{ 
                        backgroundColor: selectedTier1?.toLowerCase() === 'structural' ? 'var(--tier1-structural)' :
                                        selectedTier1?.toLowerCase() === 'systems' ? 'var(--tier1-systems)' :
                                        selectedTier1?.toLowerCase() === 'sheathing' ? 'var(--tier1-sheathing)' :
                                        selectedTier1?.toLowerCase() === 'finishings' ? 'var(--tier1-finishings)' : '#6b7280'
                      }}
                    >
                      {getTier1Icon(selectedTier1, "h-4 w-4 text-white")}
                      {formatCategoryNameWithProject(selectedTier1)}
                    </Button>
                    <span className="text-gray-400 mx-1 hidden sm:inline">→</span>
                    <span className="text-gray-400 text-xs sm:hidden">then</span>
                    <Button 
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedTier2(null);
                      }}
                      className="px-2 py-1 text-white rounded-full text-sm font-medium flex items-center gap-1 hover:brightness-95 w-fit"
                      style={{ 
                        backgroundColor: selectedTier2 ? `var(--tier2-${selectedTier2.toLowerCase()}, #6b7280)` : '#6b7280'
                      }}
                    >
                      {getTier2Icon(selectedTier2, "h-4 w-4 text-white")}
                      {formatCategoryNameWithProject(selectedTier2)}
                    </Button>
                  </div>
                </div>
                
                {/* Add Task button with pre-populated tier1 and tier2 */}
                <div className="flex justify-end mb-4">
                  <Button 
                    onClick={() => {
                      console.log('Add Task button clicked', { selectedTier1, selectedTier2 });
                      // Pre-populate with both tier1 and tier2 categories
                      handleAddTaskWithCategories(
                        selectedTier1 || 'structural', 
                        selectedTier2 || 'foundation'
                      );
                    }}
                    className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white"
                    size="sm"
                  >
                    <Plus className="h-4 w-4" />
                    Add {selectedTier1 && selectedTier2 
                      ? `${formatCategoryNameWithProject(selectedTier1)} / ${formatCategoryNameWithProject(selectedTier2)} Task`
                      : 'New Task'
                    }
                  </Button>
                </div>
                
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
                />
              </>
            )}
          </TabsContent>
          
          <TabsContent value="timeline" className="mt-4 w-full min-w-0 overflow-x-hidden">
            <Card className="w-full min-w-0">
              <CardHeader>
                <CardTitle className="text-base">Gantt Chart View</CardTitle>
              </CardHeader>
              <CardContent className="w-full min-w-0 overflow-x-auto">
                {ganttTasks.length > 0 ? (
                  <div className="h-[500px] w-full min-w-0">
                    <GanttChart tasks={ganttTasks} />
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
      
      {/* Add the ManageCategoriesDialog component */}
      {projectFilter !== "all" && (
        <ManageCategoriesDialog
          open={manageCategoriesOpen}
          onOpenChange={setManageCategoriesOpen}
          projectId={Number(projectFilter)}
          projectName={getProjectName(Number(projectFilter))}
        />
      )}
    </Layout>
  );
}
