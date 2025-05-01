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
import { formatDate } from "@/lib/utils";
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
  // Use the location hook for navigation
  const [, navigate] = useLocation();
  
  // Get actual tasks for this category
  const actualTasks = tasksByTier2[selectedTier1 || '']?.[selectedTier2 || ''] || [];
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
            className=""
            compact={false}
            showActions={true}
            showManageTasksButton={true}
            getProjectName={getProjectName}
          />
        );
      })}
    </div>
  );
}
// Using Task from @/types to ensure compatibility with frontend components

export default function TasksPage() {
  const [, setLocation] = useLocation();
  const params = useParams();
  
  // Get project ID from URL query parameter
  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const projectIdFromUrl = searchParams.get('projectId') ? Number(searchParams.get('projectId')) : undefined;
  const { toast } = useToast();
  
  const [projectFilter, setProjectFilter] = useState(projectIdFromUrl ? projectIdFromUrl.toString() : "all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  
  // Hierarchical category navigation state - initialize to null for all categories
  // Setting both to null will show all predefined tasks by default
  const [selectedTier1, setSelectedTier1] = useState<string | null>(null);
  const [selectedTier2, setSelectedTier2] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  const [activeTab, setActiveTab] = useState<string>("list");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [expandedDescriptionTaskId, setExpandedDescriptionTaskId] = useState<number | null>(null);
  const [manageCategoriesOpen, setManageCategoriesOpen] = useState<boolean>(false);

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
        description: `Loading templates for ${formatCategoryName(tier2)}...`,
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
          description: `Templates for ${formatCategoryName(tier2)} loaded successfully`,
          variant: "default"
        });
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: errorData.message || `Failed to load templates for ${formatCategoryName(tier2)}`,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error(`Error loading templates for ${tier2}:`, error);
      toast({
        title: "Error",
        description: `Failed to load templates for ${formatCategoryName(tier2)}. Please try again.`,
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
    const isNotHidden = !hiddenCategories.includes(task.tier1Category?.toLowerCase());
    
    return matchesSearch && matchesProject && matchesStatus && matchesCategory && matchesSelectedCategory && isNotHidden;
  });

  // Group tasks by tier1Category (Structural, Systems, Sheathing, Finishings)
  const tasksByTier1 = tasks?.reduce((acc, task) => {
    const tier1 = task.tier1Category || 'Uncategorized';
    if (!acc[tier1]) {
      acc[tier1] = [];
    }
    acc[tier1].push(task);
    return acc;
  }, {} as Record<string, Task[]>);
  
  // Group tasks by tier2Category within each tier1Category
  const tasksByTier2 = tasks?.reduce((acc, task) => {
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

  // Calculate completion percentage for tier1 categories
  const tier1Completion = Object.entries(tasksByTier1 || {}).reduce((acc, [tier1, tasks]) => {
    const totalTasks = tasks.length;
    
    // Check both the completed flag and status field (tasks marked as 'completed' should count)
    const completedTasks = tasks.filter(task => 
      task.completed === true || task.status === 'completed'
    ).length;
    
    acc[tier1] = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    return acc;
  }, {} as Record<string, number>);
  
  // Calculate completion percentage for tier2 categories
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
  
  // Get tier1 icon background color using our earth tone palette with opacity
  const getTier1Background = (tier1: string) => {
    // Map tier1 categories to bold gradient backgrounds for material tier one cards
    switch (tier1.toLowerCase()) {
      case 'structural':
        return 'bg-gradient-to-r from-green-600 to-green-700'; // Bold green for structural
      case 'systems':
        return 'bg-gradient-to-r from-slate-600 to-slate-700'; // Bold slate blue for systems
      case 'sheathing':
        return 'bg-gradient-to-r from-red-600 to-red-700'; // Bold red for sheathing
      case 'finishings':
        return 'bg-gradient-to-r from-amber-600 to-amber-700'; // Bold amber for finishings
      default:
        return 'bg-gradient-to-r from-stone-600 to-stone-700'; // Bold stone for default
    }
  };
  
  // Get tier2 icon background color
  const getTier2Background = (tier2: string) => {
    const lowerTier2 = tier2.toLowerCase();
    switch (lowerTier2) {
      case 'foundation':
        return 'bg-stone-200';
      case 'framing':
        return 'bg-purple-200';
      case 'roofing':
        return 'bg-red-200';
      // Handle both electric and electrical consistently
      case 'electric':
      case 'electrical':
        return 'bg-yellow-200';
      case 'plumbing':
        return 'bg-blue-200';
      case 'hvac':
        // Updated to a more silver color
        return 'bg-slate-300';
      case 'barriers':
        return 'bg-teal-200';
      case 'drywall':
        return 'bg-neutral-200';
      case 'exteriors':
        return 'bg-sky-200';
      case 'windows':
        return 'bg-orange-200';
      case 'doors':
        return 'bg-amber-200';
      case 'cabinets':
        return 'bg-[#503e49]/20';
      case 'fixtures':
        return 'bg-indigo-200';
      case 'flooring':
        return 'bg-amber-200';
      case 'permits':
        return 'bg-indigo-200';
      default:
        return 'bg-slate-200';
    }
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
  
  // Get tier2 progress bar color
  const getTier2ProgressColor = (tier2: string) => {
    const lowerTier2 = tier2.toLowerCase();
    switch (lowerTier2) {
      case 'foundation':
        return 'bg-stone-500';
      case 'framing':
        return 'bg-[#503e49]';
      case 'roofing':
        return 'bg-red-500';
      // Handle both electric and electrical consistently
      case 'electric':
      case 'electrical':
        return 'bg-yellow-500';
      case 'plumbing':
        return 'bg-blue-500';
      case 'hvac':
        // Updated to match the silver color
        return 'bg-slate-500';
      case 'barriers':
        return 'bg-teal-500';
      case 'drywall':
        return 'bg-neutral-500';
      case 'exteriors':
        return 'bg-sky-500';
      case 'windows':
        return 'bg-orange-500';
      case 'doors':
        return 'bg-amber-500';
      case 'cabinets':
        return 'bg-[#503e49]';
      case 'fixtures':
        return 'bg-indigo-500';
      case 'flooring':
        return 'bg-amber-500';
      case 'permits':
        return 'bg-indigo-500';
      default:
        return 'bg-slate-500';
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
  
  // Format category name for display
  const formatCategoryName = (category: string): string => {
    if (category === 'windows_doors') {
      return 'Windows/Doors';
    }
    
    return category
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Get project name by ID
  const getProjectName = (projectId: number) => {
    const project = projects?.find(p => p.id === projectId);
    return project ? project.name : "Unknown Project";
  };
  
  // Predefined tier1 categories (broad categories)
  const predefinedTier1Categories = [
    'structural',
    'systems',
    'sheathing',
    'finishings'
  ];
  
  // Predefined tier2 categories for each tier1 category
  const predefinedTier2Categories: Record<string, string[]> = {
    'structural': ['foundation', 'framing', 'roofing'],
    'systems': ['electrical', 'plumbing', 'hvac'], // Changed from 'electric' to 'electrical' to match database values
    'sheathing': ['barriers', 'drywall', 'exteriors', 'siding', 'insulation'], // Added siding and insulation to match database values
    'finishings': ['windows', 'doors', 'cabinets', 'fixtures', 'flooring'],
    'Uncategorized': ['permits', 'other']
  };

  if (tasksLoading || projectsLoading) {
    return (
      <Layout>
        <div className="space-y-6 p-4">
          <div className="flex justify-between items-center">
            <div className="h-8 bg-slate-200 rounded w-32 animate-pulse"></div>
            <div className="h-10 bg-slate-200 rounded w-32 animate-pulse"></div>
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
      <div className="space-y-6 p-4">
        {/* Success Message Alert */}
        {successMessage && (
          <div className="bg-green-100 border border-green-300 text-green-700 px-4 py-3 rounded relative mb-4">
            <span className="block sm:inline">{successMessage}</span>
          </div>
        )}
        
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-green-500">Tasks</h1>
          <Button 
            className="bg-orange-500 hover:bg-orange-600 text-white font-medium shadow-sm"
            onClick={() => setCreateDialogOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4 text-white" /> Add Task
          </Button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-orange-500" />
          <Input 
            placeholder="Search tasks..." 
            className="w-full pl-9 border-slate-200"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap gap-2 w-full">
          <div className="flex gap-2">
            <ProjectSelector 
              selectedProjectId={projectFilter} 
              onChange={handleProjectChange}
              className="w-[180px]"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="border border-slate-200 rounded-lg">
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
        
        {/* Show selected project name if a project is selected - with modern design */}
        {projectFilter !== "all" && (
          <div className="p-5 mb-4 bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-200 rounded-lg shadow-sm overflow-hidden">
            <div className="flex items-center gap-3">
              <div className="h-full w-1 rounded-full bg-blue-500 mr-2 self-stretch"></div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-slate-900">{getProjectName(Number(projectFilter))}</h3>
                <p className="text-sm text-slate-600">Viewing tasks for this project</p>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="bg-white text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200 shadow-sm"
                  onClick={() => setManageCategoriesOpen(true)}
                >
                  <Layers className="h-4 w-4 mr-1" />
                  Manage Categories
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="bg-white text-slate-600 hover:text-slate-800 border-slate-200 shadow-sm" 
                  onClick={() => handleProjectChange("all")}
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  All Projects
                </Button>
              </div>
            </div>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-slate-100">
            <TabsTrigger value="list" className="data-[state=active]:bg-white">List View</TabsTrigger>
            <TabsTrigger value="timeline" className="data-[state=active]:bg-white">Timeline View</TabsTrigger>
          </TabsList>
          
          <TabsContent value="list" className="space-y-4 mt-4">
            {/* 3-Tier Navigation Structure */}
            {!selectedTier1 ? (
              /* TIER 1: Display broad categories (Structural, Systems, Sheathing, Finishings) */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-hidden px-1 sm:px-0">
                {/* Show only visible tier1 categories (not in hiddenCategories) */}
                {predefinedTier1Categories
                  .filter((tier1) => !hiddenCategories.includes(tier1.toLowerCase()))
                  .map((tier1) => {
                    // Use existing tasks data if available, otherwise show empty stats
                    const tasks = tasksByTier1?.[tier1] || [];
                    const inProgress = tasks.filter(t => t.status === 'in_progress').length;
                    const completed = tasks.filter(t => t.completed).length;
                    const totalTasks = tasks.length;
                    const completionPercentage = tier1Completion[tier1] || 0;
                  
                  return (
                    <Card 
                      key={tier1} 
                      className="rounded-lg border bg-card text-card-foreground shadow-sm h-full transition-all hover:shadow-md cursor-pointer"
                      onClick={() => setSelectedTier1(tier1)}
                    >
                      <div className={`flex flex-col space-y-1.5 p-6 rounded-t-lg ${getTier1Background(tier1)}`}>
                        <div className="flex justify-center py-4">
                          <div className="p-2 rounded-full bg-white bg-opacity-70">
                            {getTier1Icon(tier1, "h-8 w-8")}
                          </div>
                        </div>
                      </div>
                      <div className="p-6 pt-6">
                        <h3 className="text-2xl font-semibold leading-none tracking-tight capitalize">
                          {formatCategoryName(tier1)}
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
                              className={`rounded-full h-2 ${getTier1ProgressColor(tier1)}`}
                              style={{ width: `${completionPercentage}%` }}
                            ></div>
                          </div>
                          <div className="flex justify-between items-center mt-3 pt-2 border-t">
                            <span className="text-sm text-muted-foreground">
                              {inProgress > 0 && `${inProgress} in progress`}
                            </span>
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
                    className="flex items-center gap-1 text-orange-500 hover:text-orange-600 hover:bg-orange-50"
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
                    className={`px-2 py-1 ${getTier1Background(selectedTier1)} text-zinc-800 rounded-full text-sm font-medium flex items-center gap-1 hover:brightness-95`}
                  >
                    {getTier1Icon(selectedTier1, "h-4 w-4")}
                    {formatCategoryName(selectedTier1)}
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
                    Add Task for {formatCategoryName(selectedTier1)}
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-hidden px-1 sm:px-0">
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
                        className="rounded-lg border bg-card text-card-foreground shadow-sm h-full transition-all hover:shadow-md cursor-pointer"
                        onClick={() => setSelectedTier2(tier2)}
                      >
                        <div className={`flex flex-col space-y-1.5 p-6 rounded-t-lg ${getTier2Background(tier2)}`}>
                          <div className="flex justify-center py-4">
                            <div className="p-2 rounded-full bg-white bg-opacity-70">
                              {getTier2Icon(tier2, "h-8 w-8")}
                            </div>
                          </div>
                        </div>
                        <div className="p-6 pt-6">
                          <h3 className="text-2xl font-semibold leading-none tracking-tight capitalize">
                            {formatCategoryName(tier2)}
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
                                className={`rounded-full h-2 ${getTier2ProgressColor(tier2)}`}
                                style={{ width: `${completionPercentage}%` }}
                              ></div>
                            </div>
                            <div className="flex justify-between items-center mt-3 pt-2 border-t">
                              <span className="text-sm text-muted-foreground">
                                {inProgress > 0 && `${inProgress} in progress`}
                              </span>
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
                                title={`Load templates for ${formatCategoryName(tier2)} category`}
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
                              <Plus className="h-3.5 w-3.5 mr-1" /> Add Task in {formatCategoryName(tier2)}
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
                <div className="flex items-center gap-2 mb-4">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => {
                      setSelectedTier2(null);
                    }}
                    className="flex items-center gap-1 text-orange-500 hover:text-orange-600 hover:bg-orange-50"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Back to {formatCategoryName(selectedTier1)} categories
                  </Button>
                  
                  <div className="flex items-center gap-1">
                    <Button 
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        // Keep the current tier1 selected but reset tier2
                        setSelectedTier2(null);
                      }}
                      className={`px-2 py-1 ${getTier1Background(selectedTier1)} text-zinc-800 rounded-full text-sm font-medium flex items-center gap-1 hover:brightness-95`}
                    >
                      {getTier1Icon(selectedTier1, "h-4 w-4")}
                      {formatCategoryName(selectedTier1)}
                    </Button>
                    <span className="text-gray-400 mx-1">→</span>
                    <Button 
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedTier2(null);
                      }}
                      className={`px-2 py-1 ${getTier2Background(selectedTier2)} text-zinc-800 rounded-full text-sm font-medium flex items-center gap-1 hover:brightness-95`}
                    >
                      {getTier2Icon(selectedTier2, "h-4 w-4")}
                      {formatCategoryName(selectedTier2)}
                    </Button>
                  </div>
                </div>
                
                {/* Add Task button with pre-populated tier1 and tier2 */}
                <div className="flex justify-end mb-4">
                  <Button 
                    onClick={() => {
                      // Pre-populate with both tier1 and tier2 categories
                      handleAddTaskWithCategories(
                        selectedTier1 || 'Uncategorized', 
                        selectedTier2 || ''
                      );
                    }}
                    className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white"
                    size="sm"
                  >
                    <Plus className="h-4 w-4" />
                    Add {formatCategoryName(selectedTier1)} / {formatCategoryName(selectedTier2)} Task
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
          
          <TabsContent value="timeline" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Gantt Chart View</CardTitle>
              </CardHeader>
              <CardContent>
                {ganttTasks.length > 0 ? (
                  <div className="h-[500px]">
                    <GanttChart tasks={ganttTasks} />
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-64 border border-dashed rounded-md border-muted-foreground/50">
                    <p className="text-muted-foreground">Gantt chart visualization would appear here</p>
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
