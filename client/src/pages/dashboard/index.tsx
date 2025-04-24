import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Layout } from "@/components/layout/Layout";
import { queryClient } from "@/lib/queryClient";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BudgetBarChart } from "@/components/charts/BudgetBarChart";
import { BudgetExpandableChart } from "@/components/charts/BudgetExpandableChart";
import { ProgressBar } from "@/components/charts/ProgressBar";
import { ProjectProgressChart } from "@/components/charts/ProjectProgressChart";
import { ProjectBudgetCompactChartSimple } from "@/components/charts/ProjectBudgetCompactChartSimple";
import { VintageGanttChart } from "@/components/charts/VintageGanttChart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import { AvatarGroup } from "@/components/ui/avatar-group";
import { formatCurrency, formatDate } from "@/lib/utils";
import { getStatusBorderColor, getStatusBgColor, getProgressColor, formatTaskStatus } from "@/lib/color-utils";

import { useTabNavigation } from "@/hooks/useTabNavigation";
import { useToast } from "@/hooks/use-toast";
import { CreateProjectDialog } from "@/pages/projects/CreateProjectDialog";
import { TaskAttachments } from "@/components/task/TaskAttachments";
import { ProjectLabor } from "@/components/project/ProjectLabor";
import { TaskMaterialsView } from "@/components/materials/TaskMaterialsView";
import { LaborCard } from "@/components/labor/LaborCard";
import { TaskCard } from "@/components/task/TaskCard";
import { getIconForMaterialTier } from "@/components/project/iconUtils";
import {
  Building,
  Calendar,
  CheckCircle2,
  ClipboardList,
  DollarSign,
  ArrowUp,
  ArrowDown,
  Settings,
  Plus,
  MoreHorizontal,
  Search,
  Users,
  MapPin,
  Clock,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Package,
  User,
  CheckCircle,
  Zap,
  AlignLeft,
  PieChart,
  Cog,
  PanelTop,
  Sofa,
  ExternalLink
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { CategoryProgressList } from "@/components/project/CategoryProgressList";


// Initialize with empty expense data structure that will be replaced with real expense data
const expenseData = {
  projects: []
};

// Mock users for avatar group
const mockUsers = [
  { name: "John Doe", image: undefined },
  { name: "Jane Smith", image: undefined },
  { name: "Robert Chen", image: undefined },
];

// Utility function to convert URLs in text to clickable links
const convertLinksToHtml = (text: string) => {
  if (!text) return "";
  
  // URL regex pattern
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  
  // Replace URLs with clickable links
  return text.replace(urlRegex, (url) => {
    return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline">${url}</a>`;
  });
};

export default function DashboardPage() {
  const { navigateToTab } = useTabNavigation();
  const [, navigate] = useLocation();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showAllProjects, setShowAllProjects] = useState(false);
  const { toast } = useToast();

  // Function to get unique color for each project based on ID
  const getProjectColor = (id: number): string => {
    // Our stronger earth tone color palette
    const colors = [
      "border-[#556b2f]", // strong olive green
      "border-[#445566]", // deep steel blue
      "border-[#9b2c2c]", // strong red brick 
      "border-[#8b4513]", // strong saddle brown
      "border-[#5c4033]"  // rich brown
    ];

    // Use modulo to cycle through colors (ensures every project gets a color)
    return colors[(id - 1) % colors.length];
  };

  const { data: projects = [], isLoading: projectsLoading } = useQuery<any[]>({
    queryKey: ["/api/projects"],
  });

  const { data: tasks = [], isLoading: tasksLoading } = useQuery<any[]>({
    queryKey: ["/api/tasks"],
  });

  const { data: materials = [], isLoading: materialsLoading } = useQuery<any[]>({
    queryKey: ["/api/materials"],
  });

  const { data: contacts = [], isLoading: contactsLoading } = useQuery<any[]>({
    queryKey: ["/api/contacts"],
  });
  
  const { data: expenses = [], isLoading: expensesLoading } = useQuery<any[]>({
    queryKey: ["/api/expenses"],
  });
  
  const { data: laborRecords = [], isLoading: laborLoading } = useQuery<any[]>({
    queryKey: ["/api/labor"],
  });

  // Initialize task materials data structures
  const taskMaterials: {[key: number]: any[]} = {};
  const taskMaterialCounts: {[key: number]: number} = {};
  
  // Organize materials by task
  React.useEffect(() => {
    if (materials && materials.length > 0) {
      const taskMatMap: {[key: number]: any[]} = {};
      const taskMatCounts: {[key: number]: number} = {};
      
      console.log("API Response for materials query:", "/api/materials");
      console.log("Materials list received, fixing taskIds format if needed");
      
      materials.forEach((material) => {
        // Handle cases where taskId might be a string
        const taskId = typeof material.taskId === 'string' ? parseInt(material.taskId, 10) : material.taskId;
        
        if (taskId) {
          if (!taskMatMap[taskId]) {
            taskMatMap[taskId] = [];
          }
          taskMatMap[taskId].push(material);
          
          // Update count
          taskMatCounts[taskId] = (taskMatCounts[taskId] || 0) + 1;
        }
      });
      
      // Save the organized materials in our reference objects
      Object.keys(taskMatMap).forEach((taskId) => {
        taskMaterials[Number(taskId)] = taskMatMap[Number(taskId)];
        taskMaterialCounts[Number(taskId)] = taskMatCounts[Number(taskId)];
      });
      
      // Log for debugging
      console.log("Task materials map:", Object.keys(taskMaterials).length, "task entries");
    }
  }, [materials]);

  // Filter materials that are marked as quotes (these shouldn't count towards budget)
  const quotedMaterialIds = materials
    .filter((material) => material.isQuote === true)
    .map((material) => material.id);
  
  // Filter labor entries that are marked as quotes
  const quotedLaborIds = laborRecords
    .filter((labor) => labor.isQuote === true)
    .map((labor) => labor.id);
  
  // Calculate total budget and total spent across all projects, excluding quoted items
  const totalBudget = projects.reduce((sum, project) => sum + (project.budget || 0), 0);
  const totalSpent = expenses.reduce((sum, expense) => {
    // Check if this expense is related to a quoted material or labor entry
    const isMaterialQuote = expense.materialIds && expense.materialIds.some(id => quotedMaterialIds.includes(Number(id)));
    const isLaborQuote = expense.contactIds && expense.contactIds.some(id => quotedLaborIds.includes(Number(id)));
    
    // Only add to total if it's not a quote
    if (!isMaterialQuote && !isLaborQuote) {
      return sum + expense.amount;
    }
    return sum;
  }, 0);
  
  // Compute dashboard metrics
  const metrics = {
    activeProjects: projects.filter((p: any) => p.status === "active").length || 0,
    openTasks: tasks.filter((t: any) => !t.completed).length || 0,
    pendingMaterials: materials.filter((m: any) => m.status === "ordered").length || 0,
    budgetUtilization: totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0,
    totalBudget,
    totalSpent
  };

  // Upcoming deadlines
  const upcomingDeadlines = tasks.filter((task: any) => !task.completed)
    .sort((a: any, b: any) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime())
    .slice(0, 4);
    
  // Get upcoming labor tasks
  const upcomingLaborTasks = React.useMemo(() => {
    // Filter labor records for current or upcoming ones
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today
    
    // Log for debugging
    console.log("Total labor records for dashboard:", laborRecords.length);
    
    // Make sure we have the latest data
    const filteredLabor = laborRecords
      .filter((labor: any) => {
        // Keep labor entries that meet ANY of these conditions:
        // 1. End date is in the future or today
        // 2. OR Start date is in the future or today
        // 3. OR Work date is in the future or today
        // 4. AND are not completed yet
        
        let isRelevant = false;
        
        // Check end date
        if (labor.endDate) {
          const endDate = new Date(labor.endDate);
          endDate.setHours(0, 0, 0, 0);
          if (endDate >= today) isRelevant = true;
        }
        
        // Check start date
        if (labor.startDate) {
          const startDate = new Date(labor.startDate);
          startDate.setHours(0, 0, 0, 0);
          if (startDate >= today) isRelevant = true;
        }
        
        // Check work date
        if (labor.workDate) {
          const workDate = new Date(labor.workDate);
          workDate.setHours(0, 0, 0, 0);
          if (workDate >= today) isRelevant = true;
        }
        
        // Only include non-completed items
        return isRelevant && labor.status !== 'completed';
      })
      .sort((a: any, b: any) => {
        // Sort by the closest date (prioritize work date, then start date, then end date)
        const getClosestDate = (labor: any) => {
          if (labor.workDate) return new Date(labor.workDate);
          if (labor.startDate) return new Date(labor.startDate);
          if (labor.endDate) return new Date(labor.endDate);
          return new Date('2099-12-31'); // Far future for entries without dates
        };
        
        const dateA = getClosestDate(a);
        const dateB = getClosestDate(b);
        return dateA.getTime() - dateB.getTime();
      });
    
    // Log filtered results for debugging
    console.log("Filtered upcoming labor records:", filteredLabor.length);
    
    // Return the top 5 entries to show more upcoming labor
    return filteredLabor.slice(0, 5);
  }, [laborRecords]);
  
  // Find tasks associated with labor entries
  const getAssociatedTask = (laborEntry: any) => {
    let task;
    
    // If labor entry has a taskId, use that to find the task
    if (laborEntry.taskId) {
      task = tasks.find((t: any) => t.id === laborEntry.taskId);
    } else {
      // Otherwise, look for tasks in the same project with matching dates
      task = tasks.find((t: any) => 
        t.projectId === laborEntry.projectId &&
        new Date(t.startDate).getTime() <= new Date(laborEntry.endDate).getTime() &&
        new Date(t.endDate).getTime() >= new Date(laborEntry.startDate).getTime()
      );
    }
    
    // If no task is found, return null
    if (!task) return null;
    
    // Return the task with all required fields for the TaskCard component
    return {
      ...task,
      tier1Category: task.tier1Category || 'structural',
      tier2Category: task.tier2Category || 'default',
      materialsNeeded: task.materialsNeeded || '',
      assignedTo: task.assignedTo || '',
      contactIds: task.contactIds || [],
      materialIds: task.materialIds || [],
      projectName: getProjectName(task.projectId || 0),
      progress: task.progress || 0,
      isDashboard: false
    };
  };

  // Helper function to get contact full name by ID
  const getContactName = (contactId: number) => {
    const contact = contacts.find((c: any) => c.id === contactId);
    return contact ? `${contact.firstName} ${contact.lastName}` : "Unknown Contact";
  };
    
  // Calculate tier1 category progress for each project
  const calculateTier1Progress = (projectId: number) => {
    const projectTasks = tasks.filter((task: any) => task.projectId === projectId);
    
    // Create a map to ensure standardized naming for categories
    const standardizedCategoryMap: Record<string, string> = {
      'structural': 'structural',
      'structure': 'structural',
      'systems': 'systems',
      'system': 'systems',
      'sheathing': 'sheathing',
      'finishings': 'finishings',
      'finishing': 'finishings',
      'finishes': 'finishings'
    };
    
    // Get hidden categories from this project
    const currentProject = projects.find((p: any) => p.id === projectId);
    const projectHiddenCategories = currentProject?.hiddenCategories || [];
    
    // Group tasks by their explicit tier1Category field
    const tasksByTier1 = projectTasks.reduce((acc: Record<string, any[]>, task: any) => {
      if (!task.tier1Category) return acc;
      
      // Standardize the tier1 category name
      const tier1Raw = task.tier1Category.toLowerCase();
      const tier1 = standardizedCategoryMap[tier1Raw] || tier1Raw;
      
      // Skip tasks from hidden categories
      if (projectHiddenCategories.includes(tier1)) return acc;
      
      if (!acc[tier1]) {
        acc[tier1] = [];
      }
      acc[tier1].push(task);
      return acc;
    }, {});
    
    // Calculate completion percentage for each tier
    const progressByTier: Record<string, number> = {
      structural: 0,
      systems: 0, 
      sheathing: 0,
      finishings: 0
    };
    
    console.log('Task categories found:', Object.keys(tasksByTier1));
    
    // Process each tier1 category
    Object.keys(progressByTier).forEach(tier => {
      const tierTasks = tasksByTier1[tier] || [];
      const totalTasks = tierTasks.length;
      
      // Debug information to show which tasks are marked as completed
      if (tierTasks.length > 0) {
        console.log('Tasks in tier', tier, ':', tierTasks.map((t: any) => ({
          id: t.id, 
          title: t.title, 
          completed: t.completed, 
          status: t.status
        })));
      }
      
      // Check both the completed flag and status field (tasks marked as 'completed' should count)
      const completedTasks = tierTasks.filter((task: any) => 
        task.completed === true || task.status === 'completed'
      ).length;
      
      progressByTier[tier] = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    });
    
    console.log('Progress for project', projectId, ':', progressByTier);
    
    return progressByTier;
  };
  
  // Map to store project tier1 progress data
  const projectTier1Progress = projects.reduce((acc: Record<number, any>, project: any) => {
    acc[project.id] = calculateTier1Progress(project.id);
    
    // Get hidden categories for this project
    const hiddenCategories = project.hiddenCategories || [];
    
    // Only include visible categories in progress calculation
    let categories = ["structural", "systems", "sheathing", "finishings"];
    let visibleCategories = categories.filter(cat => !hiddenCategories.includes(cat));
    
    // If all categories are hidden (unusual case), just use all of them
    if (visibleCategories.length === 0) {
      visibleCategories = categories;
    }
    
    // Calculate the average progress for each project based on visible categories
    const totalProgress = Math.round(
      visibleCategories.reduce((sum, cat) => sum + acc[project.id][cat], 0) / visibleCategories.length
    );
    
    // Update the project.progress value to match our calculated progress 
    // This ensures all progress bars show the same value based on actual task completion
    project.progress = project.progress || totalProgress;
    
    return acc;
  }, {});

  // Filter projects based on search query and status
  const filteredProjects = projects.filter((project: any) => {
    const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         project.location?.toLowerCase()?.includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "all" || project.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getProjectName = (projectId: number) => {
    const project = projects.find((p: any) => p.id === projectId);
    return project ? project.name : "Unknown Project";
  };

  const getDaysLeft = (endDate: string | Date) => {
    const end = new Date(endDate);
    const today = new Date();
    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getDeadlineColor = (days: number) => {
    if (days < 0) return "text-red-600";
    if (days <= 3) return "text-red-600";
    if (days <= 7) return "text-amber-600";
    return "text-green-600";
  };
  
  // Format material status text
  const formatMaterialStatus = (status: string): string => {
    if (!status) return "Pending";
    
    switch(status.toLowerCase()) {
      case 'pending': return 'Pending';
      case 'ordered': return 'Ordered';
      case 'received': return 'Received';
      case 'installed': return 'Installed';
      case 'returned': return 'Returned';
      default: return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  const getGradientByStatus = (status: string) => {
    switch (status) {
      case "completed":
        return "from-green-600 to-green-700";
      case "on_hold":
        return "from-blue-400 to-blue-500";
      default:
        return "from-blue-500 to-blue-600";
    }
  };

  const handleCreateProject = () => {
    setCreateDialogOpen(true);
  };
  
  // Function to activate all tasks for all projects
  const activateAllTasks = async () => {
    try {
      const response = await fetch("/api/activate-all-tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        
        // Refresh tasks data
        queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
        // Refresh all project tasks
        projects.forEach((project: any) => {
          queryClient.invalidateQueries({ 
            queryKey: ["/api/projects", project.id, "tasks"] 
          });
        });
        
        toast({
          title: "Tasks Activated",
          description: `Successfully activated ${result.totalTasksCreated} tasks across all projects.`,
          variant: "default"
        });
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: errorData.message || "Failed to activate tasks",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error activating all tasks:", error);
      toast({
        title: "Error",
        description: "Failed to activate tasks. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Calculate real expense data from expenses
  const calculateProjectExpenses = (projectId: number) => {
    const projectExpenses = expenses.filter((expense: any) => expense.projectId === projectId);
    const project = projects.find((p: any) => p.id === projectId);
    
    // Get hidden categories for this project
    const hiddenCategories = project?.hiddenCategories || [];
    
    // Default structure for expense calculation
    const expenseData = {
      materials: 0,
      labor: 0,
      systems: {
        structural: { materials: 0, labor: 0 },
        systems: { materials: 0, labor: 0 },
        sheathing: { materials: 0, labor: 0 },
        finishings: { materials: 0, labor: 0 }
      }
    };
    
    // Process each expense, excluding quoted items
    projectExpenses.forEach((expense: any) => {
      // Check if this expense is related to a quoted material or labor entry
      const isMaterialQuote = expense.materialIds && expense.materialIds.some(id => quotedMaterialIds.includes(Number(id)));
      const isLaborQuote = expense.contactIds && expense.contactIds.some(id => quotedLaborIds.includes(Number(id)));
      
      // Skip quoted items in budget calculations
      if (isMaterialQuote || isLaborQuote) {
        return; // Skip this expense
      }
      
      if (expense.category === 'materials') {
        expenseData.materials += expense.amount;
        
        // If it has a tier1 category and that category is not hidden, add to that specific system
        if (expense.tier1Category && 
            expenseData.systems[expense.tier1Category] && 
            !hiddenCategories.includes(expense.tier1Category.toLowerCase())) {
          expenseData.systems[expense.tier1Category].materials += expense.amount;
        } else {
          // If no specific tier1 category or it's hidden, distribute evenly among visible categories
          let visibleCategories = ["structural", "systems", "sheathing", "finishings"]
            .filter(cat => !hiddenCategories.includes(cat));
          
          // If all categories are hidden (unusual), just distribute to all
          if (visibleCategories.length === 0) {
            visibleCategories = ["structural", "systems", "sheathing", "finishings"];
          }
          
          const distribution = expense.amount / visibleCategories.length;
          
          visibleCategories.forEach(category => {
            expenseData.systems[category].materials += distribution;
          });
        }
      } 
      else if (expense.category === 'labor') {
        expenseData.labor += expense.amount;
        
        // If it has a tier1 category and that category is not hidden, add to that specific system
        if (expense.tier1Category && 
            expenseData.systems[expense.tier1Category] && 
            !hiddenCategories.includes(expense.tier1Category.toLowerCase())) {
          expenseData.systems[expense.tier1Category].labor += expense.amount;
        } else {
          // If no specific tier1 category or it's hidden, distribute evenly among visible categories
          let visibleCategories = ["structural", "systems", "sheathing", "finishings"]
            .filter(cat => !hiddenCategories.includes(cat));
          
          // If all categories are hidden (unusual), just distribute to all
          if (visibleCategories.length === 0) {
            visibleCategories = ["structural", "systems", "sheathing", "finishings"];
          }
          
          const distribution = expense.amount / visibleCategories.length;
          
          visibleCategories.forEach(category => {
            expenseData.systems[category].labor += distribution;
          });
        }
      }
    });
    
    return expenseData;
  };

  // Prepare expense data for all projects
  const realExpenseData = {
    projects: projects.map((project: any) => {
      const projectExpenses = calculateProjectExpenses(project.id);
      return {
        id: project.id,
        name: project.name,
        budget: project.budget || 0,
        expenses: projectExpenses,
        totalSpent: (projectExpenses.materials || 0) + (projectExpenses.labor || 0)
      };
    })
  };

  return (
    <Layout>
      <div className="space-y-5 w-full max-w-full overflow-hidden px-1 sm:px-3">
        {/* Header - Responsive with stack on mobile */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <h1 className="text-xl md:text-2xl font-bold text-purple-600">Construction Dashboard</h1>
          <Button className="bg-purple-600 hover:bg-purple-700 w-full sm:w-auto" onClick={handleCreateProject}>
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Button>
        </div>

        {/* Search and Filter Bar - Full width on mobile, side by side on larger screens */}
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
          <div className="relative flex-1">
            <Input
              className="pl-10 pr-4 py-2 w-full border border-slate-300 rounded-md"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search className="h-5 w-5 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48 border border-slate-300">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="on_hold">On Hold</SelectItem>
              <SelectItem value="planning">Planning</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Key Metrics - 2-column grid on mobile, 4-column on desktop */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
          <Card className="bg-white shadow-sm">
            <CardContent className="p-3 md:p-4 flex items-center gap-3">
              <div className="bg-blue-50 p-2 md:p-3 rounded-full">
                <Building className="h-5 w-5 md:h-6 md:w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-xs md:text-sm text-slate-500">Active Projects</p>
                <h3 className="text-lg md:text-2xl font-semibold">{metrics.activeProjects}</h3>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white shadow-sm">
            <CardContent className="p-3 md:p-4 flex items-center gap-3">
              <div className="bg-amber-50 p-2 md:p-3 rounded-full">
                <ClipboardList className="h-5 w-5 md:h-6 md:w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-xs md:text-sm text-slate-500">Open Tasks</p>
                <h3 className="text-lg md:text-2xl font-semibold">{metrics.openTasks}</h3>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white shadow-sm">
            <CardContent className="p-3 md:p-4 flex items-center gap-3">
              <div className="bg-orange-50 p-2 md:p-3 rounded-full">
                <Package className="h-5 w-5 md:h-6 md:w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-xs md:text-sm text-slate-500">Pending Materials</p>
                <h3 className="text-lg md:text-2xl font-semibold">{metrics.pendingMaterials}</h3>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white shadow-sm">
            <CardContent className="p-3 md:p-4 flex items-center gap-3">
              <div className="bg-green-50 p-2 md:p-3 rounded-full">
                <DollarSign className="h-5 w-5 md:h-6 md:w-6 text-green-600" />
              </div>
              <div>
                <p className="text-xs md:text-sm text-slate-500">Budget Used</p>
                <h3 className="text-lg md:text-2xl font-semibold">{metrics.budgetUtilization}%</h3>
                <p className="text-xs md:text-sm text-slate-400">
                  {formatCurrency(metrics.totalSpent)} / {formatCurrency(metrics.totalBudget)}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Projects Overview */}
        <Card className="bg-white shadow-sm">
          <CardHeader className="p-4 md:p-5 bg-gradient-to-r from-purple-700 to-purple-500 border-b border-purple-800">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <div className="h-full w-1 rounded-full bg-white mr-2 md:mr-3 self-stretch"></div>
                <CardTitle className="text-base md:text-lg font-semibold text-white">Projects Overview</CardTitle>
              </div>
              {filteredProjects.length > 0 && (
                <div className="text-xs md:text-sm bg-white bg-opacity-80 text-purple-800 rounded-full px-2 md:px-3 py-1 font-medium border border-purple-200">
                  {filteredProjects.length} {filteredProjects.length === 1 ? 'Project' : 'Projects'}
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0 divide-y divide-slate-200">
            {filteredProjects.length === 0 ? (
              <div className="p-8 text-center">
                <Building className="h-10 w-10 mx-auto text-slate-300 mb-2" />
                <h3 className="text-lg font-medium text-slate-700">No Projects Found</h3>
                <p className="text-slate-500 mt-1">Get started by creating a new project.</p>
                <Button className="mt-4 bg-blue-600 hover:bg-blue-700" onClick={handleCreateProject}>
                  <Plus className="h-4 w-4 mr-2" /> Create New Project
                </Button>
              </div>
            ) : (
              <>
                {filteredProjects.length > 0 && (
                  <div className="p-5">
                    <Carousel className="w-full">
                      <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center">
                          <Building className="h-5 w-5 text-slate-700 mr-2" />
                          <h3 className="text-lg font-semibold">Projects ({filteredProjects.length})</h3>
                        </div>
                        <div className="flex gap-1">
                          <CarouselPrevious className="static h-8 w-8 transform-none translate-x-0" />
                          <CarouselNext className="static h-8 w-8 transform-none translate-x-0" />
                        </div>
                      </div>
                      
                      <CarouselContent>
                        {filteredProjects.map((project: any) => (
                          <CarouselItem key={project.id} className="md:basis-full lg:basis-full w-full max-w-full">
                            <div className="border border-slate-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200 max-w-full mx-1 sm:mx-0">
                              <div 
                                className="p-5 relative"
                                style={{
                                  // Use earth tone gradient colors based on project ID
                                  background: (() => {
                                    const color = getProjectColor(project.id).replace('border-[', '').replace(']', '');
                                    return `linear-gradient(to right, ${color}, ${color}80)`;
                                  })(),
                                  borderBottom: `1px solid ${getProjectColor(project.id).replace('border-[', '').replace(']', '')}`
                                }}
                              >
                                <div className="flex justify-between items-center">
                                  <div className="flex items-start">
                                    <div className={`h-full w-1 rounded-full ${getProjectColor(project.id).replace('border', 'bg')} mr-3 self-stretch`}></div>
                                    <div>
                                      <h3 
                                        className="text-lg font-semibold text-white hover:text-white/80 cursor-pointer transition-colors duration-200"
                                        onClick={() => navigate(`/projects/${project.id}`)}
                                      >
                                        {project.name}
                                      </h3>
                                      <div className="flex items-center text-sm text-white/90 mt-1 font-medium">
                                        <MapPin className="h-4 w-4 mr-1 text-white/80" />
                                        {project.location || "No location specified"}
                                      </div>
                                      <div className="flex items-center mt-2 gap-2">
                                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                          project.status === "active" ? "bg-green-200 text-green-800 border border-green-300" :
                                          project.status === "planned" ? "bg-blue-200 text-blue-800 border border-blue-300" :
                                          project.status === "completed" ? "bg-purple-200 text-purple-800 border border-purple-300" :
                                          "bg-orange-200 text-orange-800 border border-orange-300"
                                        }`}>
                                          {project.status === "active" ? "Active" : 
                                           project.status === "planned" ? "Planned" : 
                                           project.status === "completed" ? "Completed" : 
                                           "On Hold"}
                                        </span>
                                        <span className="text-xs bg-white bg-opacity-80 text-slate-800 px-2 py-1 rounded-full border border-slate-200 font-medium">
                                          Due: {formatDate(project.endDate)}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-center">
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full hover:bg-white hover:bg-opacity-70">
                                          <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => navigate(`/projects/${project.id}`)}>
                                          View Details
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => navigate(`/projects/${project.id}/tasks`)}>
                                          View Tasks
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => navigate(`/projects/${project.id}/resources`)}>
                                          View Resources
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="p-4">
                                <div className="mt-2 grid grid-cols-1 gap-6">
                                  {/* Progress Overview - Enhanced - Full Width */}
                                  <div>
                                    <div className="flex justify-between items-center mb-2">
                                      <h4 className="text-sm font-medium">Construction Progress</h4>
                                      <span className="text-xs bg-slate-100 px-2 py-1 rounded-full">
                                        Est. completion: {formatDate(project.endDate)}
                                      </span>
                                    </div>
                                    
                                    <div className="bg-white p-5 rounded-lg shadow-sm border border-slate-100 overflow-hidden max-w-full">
                                      {/* Overall progress indicator - with meter style */}
                                      <div className="mb-6">
                                        <div className="flex justify-between items-center mb-2">
                                          <div className="flex items-center">
                                            <div 
                                              className="w-1 h-5 rounded-sm mr-2"
                                              style={{
                                                backgroundColor: getProjectColor(project.id).replace('border-[', '').replace(']', '')
                                              }}
                                            ></div>
                                            <span className="text-base font-semibold">Overall Completion</span>
                                          </div>
                                          <div 
                                            className="text-sm font-bold rounded-full px-3 py-0.5 bg-white/70"
                                            style={{ 
                                              color: getProjectColor(project.id).replace('border-[', '').replace(']', ''),
                                              border: `1px solid ${getProjectColor(project.id).replace('border-[', '').replace(']', '')}40`
                                            }}
                                          >
                                            {project.progress || 0}%
                                          </div>
                                        </div>
                                        <ProgressBar 
                                          value={project.progress || 0} 
                                          color={getProjectColor(project.id).replace('border-', '').replace('[', '').replace(']', '')}
                                          variant="meter"
                                          showLabel={false}
                                          className="w-full"
                                        />
                                      </div>
                                      
                                      {/* System Progress Charts - Using CategoryProgressList with improved styling */}
                                      <div className="space-y-3">
                                        <div className="flex items-center justify-between mb-3">
                                          <h4 className="text-sm font-medium text-slate-700 border-b-2 border-slate-200 pb-1">Progress by Construction Phase</h4>
                                        </div>
                                        
                                        {/* Use our reusable component that respects hidden categories */}
                                        <CategoryProgressList 
                                          tasks={tasks.filter((task: any) => task.projectId === project.id)} 
                                          hiddenCategories={project.hiddenCategories || []}
                                        />
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {/* Budget Chart - Modern Redesign */}
                                  <div>
                                    <div className="flex justify-between items-center mb-2">
                                      <div className="flex items-center">
                                        <div className="w-1 h-5 rounded-sm mr-2 bg-purple-500"></div>
                                        <h4 className="text-base font-semibold text-purple-700">Budget Overview</h4>
                                      </div>
                                      <Button 
                                        variant="outline" 
                                        className="text-xs text-blue-600 h-7 px-3 rounded-full border-blue-200 hover:bg-blue-50"
                                        onClick={() => navigate(`/projects/${project.id}/expenses`)}
                                      >
                                        <DollarSign className="h-3 w-3 mr-1" />
                                        View Details
                                      </Button>
                                    </div>
                                    <div className="bg-white p-5 rounded-lg shadow-sm border border-slate-100 overflow-hidden max-w-full">
                                      {/* Budget values in cards */}
                                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                                        <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-3 rounded-lg border border-slate-200">
                                          <div className="flex items-center mb-1">
                                            <div className="w-2 h-2 rounded-full bg-blue-500 mr-2"></div>
                                            <p className="text-xs text-slate-600 font-medium uppercase tracking-wide">Budget</p>
                                          </div>
                                          <p className="text-lg font-bold text-slate-800">{formatCurrency(project.budget || 0)}</p>
                                        </div>
                                        
                                        <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-3 rounded-lg border border-orange-200">
                                          <div className="flex items-center mb-1">
                                            <div className="w-2 h-2 rounded-full bg-orange-500 mr-2"></div>
                                            <p className="text-xs text-orange-800 font-medium uppercase tracking-wide">Materials</p>
                                          </div>
                                          <p className="text-lg font-bold text-orange-800">
                                            {formatCurrency(
                                              expenses
                                                .filter((expense: any) => expense.projectId === project.id && expense.category === 'materials')
                                                .reduce((sum: number, expense: any) => sum + (expense.amount || 0), 0)
                                            )}
                                          </p>
                                        </div>
                                        
                                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-3 rounded-lg border border-blue-200">
                                          <div className="flex items-center mb-1">
                                            <div className="w-2 h-2 rounded-full bg-blue-500 mr-2"></div>
                                            <p className="text-xs text-blue-800 font-medium uppercase tracking-wide">Labor</p>
                                          </div>
                                          <p className="text-lg font-bold text-blue-800">
                                            {formatCurrency(
                                              expenses
                                                .filter((expense: any) => expense.projectId === project.id && expense.category === 'labor')
                                                .reduce((sum: number, expense: any) => sum + (expense.amount || 0), 0)
                                            )}
                                          </p>
                                        </div>
                                      </div>
                                      
                                      {/* Budget meter */}
                                      <div className="mt-3">
                                        <div className="flex justify-between items-center mb-1">
                                          <p className="text-xs text-slate-500 font-medium">Budget Utilization</p>
                                          <p 
                                            className="text-xs font-bold"
                                            style={{ 
                                              color: getProjectColor(project.id).replace('border-[', '').replace(']', '')
                                            }}
                                          >
                                            {Math.min(
                                              Math.max(
                                                Math.round(expenses
                                                  .filter((expense: any) => expense.projectId === project.id)
                                                  .reduce((sum: number, expense: any) => sum + (expense.amount || 0), 0) / 
                                                  (project.budget || 1) * 100),
                                                0
                                              ), 
                                              100
                                            )}%
                                          </p>
                                        </div>
                                        <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                                          <div
                                            style={{ 
                                              width: `${Math.min(
                                                Math.max(
                                                  expenses
                                                    .filter((expense: any) => expense.projectId === project.id)
                                                    .reduce((sum: number, expense: any) => sum + (expense.amount || 0), 0) / 
                                                    (project.budget || 1) * 100, 
                                                  0
                                                ), 
                                                100
                                              )}%`,
                                              height: '100%',
                                              borderRadius: '9999px',
                                              background: `linear-gradient(to right, ${getProjectColor(project.id).replace('border-[', '').replace(']', '')}, ${getProjectColor(project.id).replace('border-[', '').replace(']', '')}80)`
                                            }}
                                          >
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </CarouselItem>
                        ))}
                      </CarouselContent>
                    </Carousel>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Current & Upcoming Labor - Full Width */}
        <Card className="bg-white mb-6 border border-slate-200 rounded-lg overflow-hidden shadow-sm">
          <CardHeader className={`p-5 relative bg-gradient-to-r from-purple-700 to-purple-500 border-b border-purple-800`}>
            <div className="flex justify-between items-center">
              <div className="flex items-start">
                <div className="h-full w-1 rounded-full bg-white mr-3 self-stretch"></div>
                <CardTitle className="text-lg font-semibold text-white">Current & Upcoming Labor</CardTitle>
              </div>
              {upcomingLaborTasks?.length > 0 && (
                <div className="text-sm bg-white bg-opacity-80 text-purple-800 rounded-full px-3 py-1 font-medium border border-purple-200">
                  {upcomingLaborTasks.length} {upcomingLaborTasks.length === 1 ? 'Entry' : 'Entries'}
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            {upcomingLaborTasks?.length === 0 ? (
              <div className="text-center">
                <p className="text-slate-500">No upcoming labor scheduled</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Mobile view: Carousel */}
                <div className="lg:hidden">
                  <Carousel className="w-full">
                    <CarouselContent className="-ml-4">
                      {/* Group content by sets (Labor + Task + Materials) as single carousel items */}
                      {upcomingLaborTasks.map((labor: any) => {
                        // Find the associated task for this labor entry
                        const associatedTask = getAssociatedTask(labor);
                        
                        return (
                          <CarouselItem key={labor.id} className="pl-4 md:basis-full">
                            <div className="h-full p-2">
                              <h3 className="text-sm font-medium text-slate-600 mb-2">Work by {labor.fullName || getContactName(labor.contactId)}</h3>
                              
                              {/* Vertical stack for labor card, task, and materials - each on its own row */}
                              <div className="space-y-4">
                                {/* Labor Card - First Row */}
                                <div className="w-full">
                                  <LaborCard 
                                    labor={{
                                      ...labor,
                                      fullName: labor.fullName || getContactName(labor.contactId),
                                      projectName: getProjectName(labor.projectId),
                                      taskDescription: labor.taskDescription || `Work for ${getProjectName(labor.projectId)}`,
                                    }}
                                    onEdit={() => {
                                      if (labor.contactId) {
                                        navigate(`/contacts/${labor.contactId}/labor/${labor.id}`);
                                      }
                                    }}
                                  />
                                  
                                  <div className="mt-2">
                                    <Button
                                      variant="outline"
                                      className="w-full flex items-center justify-center text-blue-600 hover:text-blue-700"
                                      onClick={() => {
                                        if (labor.contactId) {
                                          navigate(`/contacts/${labor.contactId}/labor/${labor.id}`);
                                        }
                                      }}
                                    >
                                      <ChevronRight className="h-4 w-4 mr-1" /> View Labor Details
                                    </Button>
                                  </div>
                                </div>
                                
                                {/* Task Card - Second Row */}
                                {associatedTask && (
                                  <div className="w-full">
                                    <Card 
                                      key={associatedTask.id} 
                                      className={`border-l-4 ${getStatusBorderColor(associatedTask.status)} shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden`}
                                    >
                                      <CardHeader className={`p-4 pb-2 bg-gradient-to-r ${
                                        associatedTask.status === "completed" ? "from-green-500 to-green-600 border-b border-green-700" : 
                                        associatedTask.status === "in_progress" ? "from-yellow-500 to-yellow-600 border-b border-yellow-700" : 
                                        associatedTask.status === "delayed" ? "from-red-500 to-red-600 border-b border-red-700" : 
                                        "from-slate-500 to-slate-600 border-b border-slate-700"
                                      }`}>
                                        <div className="flex justify-between items-start">
                                          <div className="flex items-center">
                                            <div className="h-full w-1 rounded-full bg-white mr-2 self-stretch"></div>
                                            <CardTitle className="text-base font-semibold text-white">{associatedTask.title}</CardTitle>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <button 
                                              className="text-white hover:text-white/80 p-1 rounded-full hover:bg-white/10 transition-colors"
                                              onClick={() => navigate(`/tasks/${associatedTask.id}`)}
                                            >
                                              <ExternalLink className="h-4 w-4" />
                                            </button>
                                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                              associatedTask.status === "completed" ? "bg-green-100 text-green-800 border border-green-200" :
                                              associatedTask.status === "in_progress" ? "bg-yellow-100 text-yellow-800 border border-yellow-200" :
                                              associatedTask.status === "delayed" ? "bg-red-100 text-red-800 border border-red-200" :
                                              "bg-white bg-opacity-70 text-slate-800 border border-slate-200"
                                            }`}>
                                              {formatTaskStatus(associatedTask.status)}
                                            </span>
                                          </div>
                                        </div>
                                      </CardHeader>
                                      <CardContent className="overflow-y-auto p-4 pt-0">
                                        <div className="flex items-center text-sm text-muted-foreground mt-1">
                                          <Calendar className="h-4 w-4 mr-1 text-orange-500" />
                                          {formatDate(associatedTask.startDate || new Date())} - {formatDate(associatedTask.endDate || new Date())}
                                        </div>
                                        <div className="flex items-center text-sm text-muted-foreground mt-1">
                                          <User className="h-4 w-4 mr-1 text-orange-500" />
                                          {associatedTask.assignedTo || "Unassigned"}
                                        </div>
                                        
                                        {/* Task Description Collapsible */}
                                        {associatedTask.description && (
                                          <Collapsible className="mt-2">
                                            <CollapsibleTrigger className="flex items-center text-sm text-blue-600 hover:text-blue-800 font-medium">
                                              <AlignLeft className="h-4 w-4 mr-1" />
                                              <span>Description</span>
                                              <ChevronDown className="h-4 w-4 ml-1" />
                                            </CollapsibleTrigger>
                                            <CollapsibleContent className="bg-slate-50 p-2 mt-1 rounded-md text-sm">
                                              {associatedTask.description}
                                            </CollapsibleContent>
                                          </Collapsible>
                                        )}
                                        
                                        <div className="mt-2">
                                          <div className="w-full bg-slate-100 rounded-full h-2">
                                            <div 
                                              className={`${getProgressColor(associatedTask.progress || 0)} rounded-full h-2`} 
                                              style={{ width: `${associatedTask.progress || 0}%` }}
                                            ></div>
                                          </div>
                                          <div className="flex justify-between text-xs mt-1">
                                            <span>{getProjectName(associatedTask.projectId)}</span>
                                            <span>{associatedTask.progress || 0}% Complete</span>
                                          </div>
                                        </div>
                                        
                                        {/* Status Indicators */}
                                        <div className="flex flex-wrap gap-2 mt-2">
                                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-md font-medium flex items-center text-xs">
                                            <Users className="h-3 w-3 mr-1" />
                                            Labor Assigned
                                          </span>
                                          
                                          <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-md font-medium flex items-center text-xs">
                                            <Package className="h-3 w-3 mr-1" />
                                            {taskMaterialCounts[associatedTask.id] || 0} Materials
                                          </span>
                                        </div>
                                      </CardContent>
                                    </Card>
                                    
                                    <div className="mt-2">
                                      <Button
                                        variant="outline"
                                        className="w-full flex items-center justify-center text-blue-600 hover:text-blue-700"
                                        onClick={() => navigate(`/tasks/${associatedTask.id}`)}
                                      >
                                        <ChevronRight className="h-4 w-4 mr-1" /> View Task Details
                                      </Button>
                                    </div>
                                  </div>
                                )}
                                
                                {/* Materials List - Third Row */}
                                {/* Debug info */}
                                {console.log('Associated task for materials:', associatedTask?.id, 
                                  'Has materials?', associatedTask && !!taskMaterials[associatedTask.id], 
                                  'Count:', associatedTask && taskMaterials[associatedTask.id]?.length || 0,
                                  'All materials length:', materials.length,
                                  'First few taskIds:', materials.slice(0, 5).map(m => m.taskId))}
                                
                                {/* Materials Card - Show Project Materials - Modern Design */}
                                <div className="w-full">
                                  <Card className="shadow-sm border border-slate-200 overflow-hidden">
                                    <CardHeader className="p-4 pb-2 bg-gradient-to-r from-orange-600 to-orange-400 border-b border-orange-700">
                                      <div className="flex justify-between items-center">
                                        <div className="flex items-center">
                                          <div className="h-full w-1 rounded-full bg-white mr-2 self-stretch"></div>
                                          <CardTitle className="text-base font-semibold text-white">Materials</CardTitle>
                                        </div>
                                        <span className="text-xs bg-white bg-opacity-80 text-orange-800 rounded-full px-2 py-1 font-medium border border-orange-200">
                                          Project Materials
                                        </span>
                                      </div>
                                    </CardHeader>
                                    <CardContent className="p-4 pt-2">
                                      {(() => {
                                        // Get all materials for this project
                                        const projectMaterials = materials.filter(m => 
                                          m.projectId === labor.projectId
                                        ).slice(0, 5); // Show only first 5 for mobile view
                                        
                                        return projectMaterials.length > 0 ? (
                                          <div className="space-y-3 max-h-[280px] overflow-y-auto">
                                            {projectMaterials.map((material: any) => (
                                              <div 
                                                key={material.id} 
                                                className="flex items-center justify-between bg-slate-50 p-2 rounded-md hover:bg-slate-100"
                                              >
                                                <div className="flex items-center">
                                                  <div className="p-2 bg-orange-100 rounded-md mr-3">
                                                    <Package className="h-4 w-4 text-orange-600" />
                                                  </div>
                                                  <div>
                                                    <h4 className="text-sm font-medium">{material.name}</h4>
                                                    <p className="text-xs text-slate-500">
                                                      {material.quantity} {material.unit} &bull; {formatCurrency(material.price)}
                                                    </p>
                                                    {material.taskId && (
                                                      <button 
                                                        className="mt-1 text-xs text-blue-600 hover:text-blue-800 flex items-center"
                                                        onClick={(e) => {
                                                          e.stopPropagation();
                                                          navigate(`/tasks/${material.taskId}`);
                                                        }}
                                                      >
                                                        <ChevronRight className="h-3 w-3 mr-1" />
                                                        View related task
                                                      </button>
                                                    )}
                                                  </div>
                                                </div>
                                                <span className={`text-xs px-2 py-1 rounded-full ${
                                                  material.status === 'ordered' ? 'bg-blue-100 text-blue-800' :
                                                  material.status === 'received' ? 'bg-green-100 text-green-800' :
                                                  'bg-slate-100 text-slate-800'
                                                }`}>
                                                  {formatMaterialStatus(material.status)}
                                                </span>
                                              </div>
                                            ))}
                                            
                                            {/* If there are more materials than shown, indicate there's more */}
                                            {projectMaterials.length < materials.filter(m => m.projectId === labor.projectId).length && (
                                              <div className="text-center py-1 text-xs text-blue-600">
                                                +{materials.filter(m => m.projectId === labor.projectId).length - projectMaterials.length} more materials
                                              </div>
                                            )}
                                          </div>
                                        ) : (
                                          <div className="text-center py-6">
                                            <Package className="h-12 w-12 mx-auto text-slate-300 mb-2" />
                                            <h3 className="text-sm font-medium text-slate-700">No Materials</h3>
                                            <p className="text-xs text-slate-500 mt-1">No materials associated with this project.</p>
                                          </div>
                                        );
                                      })()}
                                      
                                      <Button 
                                        variant="outline" 
                                        className="w-full mt-3 text-orange-600 hover:text-orange-700"
                                        onClick={() => navigate(`/projects/${labor.projectId}/materials`)}
                                      >
                                        <Package className="h-4 w-4 mr-2" />
                                        View All Materials
                                      </Button>
                                    </CardContent>
                                  </Card>
                                </div>
                              </div>
                              
                              {/* Horizontal scroll indicator */}
                              <div className="flex justify-center gap-1 mt-2">
                                <div className="h-1 w-6 bg-blue-600 rounded-full"></div>
                                <div className="h-1 w-1 bg-slate-300 rounded-full"></div>
                                <div className="h-1 w-1 bg-slate-300 rounded-full"></div>
                              </div>
                            </div>
                          </CarouselItem>
                        );
                      })}
                    </CarouselContent>
                    <div className="flex justify-center mt-4 pb-2">
                      <CarouselPrevious className="static transform-none translate-y-0 mr-2" />
                      <CarouselNext className="static transform-none translate-y-0 ml-2" />
                    </div>
                  </Carousel>
                </div>
                
                {/* Desktop view: Grid layout */}
                <div className="hidden lg:block">
                  {upcomingLaborTasks.map((labor: any) => {
                    // Find the associated task for this labor entry
                    const associatedTask = getAssociatedTask(labor);
                    
                    return (
                      <div key={labor.id} className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                        {/* Labor Card */}
                        <div className="flex flex-col">
                          <LaborCard 
                            labor={{
                              ...labor,
                              // Ensure all required fields are present
                              // Using the values from the original labor record or defaults if missing
                              fullName: labor.fullName || getContactName(labor.contactId),
                              projectName: getProjectName(labor.projectId),
                              taskDescription: labor.taskDescription || `Work for ${getProjectName(labor.projectId)}`,
                            }}
                            onEdit={() => {
                              // Navigate to labor edit page if needed
                              if (labor.contactId) {
                                navigate(`/contacts/${labor.contactId}/labor/${labor.id}`);
                              }
                            }}
                          />
                          
                          {/* Add View Details button aligned with the task card button */}
                          <div className="mt-auto pt-2">
                            <Button
                              variant="outline"
                              className="w-full flex items-center justify-center text-blue-600 hover:text-blue-700"
                              onClick={() => {
                                if (labor.contactId) {
                                  navigate(`/contacts/${labor.contactId}/labor/${labor.id}`);
                                }
                              }}
                            >
                              <ChevronRight className="h-4 w-4 mr-1" /> View Labor Details
                            </Button>
                          </div>
                        </div>
                        
                        {/* Enhanced Task Card (if found) */}
                        {associatedTask ? (
                          <div className="flex flex-col">
                            <Card 
                              key={associatedTask.id} 
                              className={`border-l-4 ${getStatusBorderColor(associatedTask.status)} shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden`}
                            >
                              <CardHeader className={`p-4 pb-2 bg-gradient-to-r ${
                                associatedTask.status === "completed" ? "from-green-500 to-green-600 border-b border-green-700" : 
                                associatedTask.status === "in_progress" ? "from-yellow-500 to-yellow-600 border-b border-yellow-700" : 
                                associatedTask.status === "delayed" ? "from-red-500 to-red-600 border-b border-red-700" : 
                                "from-slate-500 to-slate-600 border-b border-slate-700"
                              }`}>
                                <div className="flex justify-between items-start">
                                  <div className="flex items-center">
                                    <div className="h-full w-1 rounded-full bg-white mr-2 self-stretch"></div>
                                    <CardTitle className="text-base font-semibold text-white">{associatedTask.title}</CardTitle>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <button 
                                      className="text-white hover:text-white/80 p-1 rounded-full hover:bg-white/10 transition-colors"
                                      onClick={() => navigate(`/tasks/${associatedTask.id}`)}
                                    >
                                      <ExternalLink className="h-4 w-4" />
                                    </button>
                                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                      associatedTask.status === "completed" ? "bg-green-100 text-green-800 border border-green-200" :
                                      associatedTask.status === "in_progress" ? "bg-yellow-100 text-yellow-800 border border-yellow-200" :
                                      associatedTask.status === "delayed" ? "bg-red-100 text-red-800 border border-red-200" :
                                      "bg-white bg-opacity-70 text-slate-800 border border-slate-200"
                                    }`}>
                                      {formatTaskStatus(associatedTask.status)}
                                    </span>
                                  </div>
                                </div>
                              </CardHeader>
                              <CardContent className="overflow-y-auto p-4 pt-0">
                                <div className="flex items-center text-sm text-muted-foreground mt-1">
                                  <Calendar className="h-4 w-4 mr-1 text-orange-500" />
                                  {formatDate(associatedTask.startDate || new Date())} - {formatDate(associatedTask.endDate || new Date())}
                                </div>
                                <div className="flex items-center text-sm text-muted-foreground mt-1">
                                  <User className="h-4 w-4 mr-1 text-orange-500" />
                                  {associatedTask.assignedTo || "Unassigned"}
                                </div>
                                
                                {/* Task Description Collapsible */}
                                {associatedTask.description && (
                                  <Collapsible className="mt-2">
                                    <CollapsibleTrigger className="flex items-center text-sm text-blue-600 hover:text-blue-800 font-medium">
                                      <AlignLeft className="h-4 w-4 mr-1" />
                                      <span>Description</span>
                                      <ChevronDown className="h-4 w-4 ml-1" />
                                    </CollapsibleTrigger>
                                    <CollapsibleContent className="bg-slate-50 p-2 mt-1 rounded-md text-sm">
                                      {associatedTask.description}
                                    </CollapsibleContent>
                                  </Collapsible>
                                )}
                                
                                <div className="mt-2">
                                  <div className="w-full bg-slate-100 rounded-full h-2">
                                    <div 
                                      className={`${getProgressColor(associatedTask.progress || 0)} rounded-full h-2`} 
                                      style={{ width: `${associatedTask.progress || 0}%` }}
                                    ></div>
                                  </div>
                                  <div className="flex justify-between text-xs mt-1">
                                    <span>{getProjectName(associatedTask.projectId)}</span>
                                    <span>{associatedTask.progress || 0}% Complete</span>
                                  </div>
                                </div>
                                
                                {/* Labor Status */}
                                <div className="flex items-center text-sm text-muted-foreground mt-2">
                                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-md font-medium flex items-center">
                                    <Users className="h-4 w-4 mr-1" />
                                    Labor Assigned
                                  </span>
                                </div>
                                
                                {/* Materials Status */}
                                <div className="flex items-center text-sm text-muted-foreground mt-1">
                                  <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-md font-medium flex items-center">
                                    <Package className="h-4 w-4 mr-1" />
                                    {associatedTask.materialIds && associatedTask.materialIds.length > 0 
                                      ? `${associatedTask.materialIds.length} Materials` 
                                      : 'No Materials'}
                                  </span>
                                </div>
                              </CardContent>
                            </Card>
                            
                            {/* Add View Full Details button at the bottom */}
                            <div className="mt-2">
                              <Button
                                variant="outline"
                                className="w-full flex items-center justify-center text-blue-600 hover:text-blue-700"
                                onClick={() => navigate(`/tasks/${associatedTask.id}`)}
                              >
                                <ChevronRight className="h-4 w-4 mr-1" /> View Task Details
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <Card className="border border-dashed border-slate-300 flex items-center justify-center">
                            <CardContent className="p-4 text-center text-slate-500">
                              <p>No associated task found</p>
                            </CardContent>
                          </Card>
                        )}
                        
                        {/* Materials Card - Third Column */}
                        <div className="flex flex-col">
                          {(() => {
                            // Extract material IDs from labor and task
                            const laborMaterialIds = labor.materialIds || [];
                            const taskMaterialIds = associatedTask?.materialIds || [];
                            
                            // Combine both sets of material IDs (remove duplicates)
                            const combinedIds = [...laborMaterialIds, ...taskMaterialIds];
                            // Create a map to track unique IDs without using Set
                            const uniqueIdsMap: Record<string, boolean> = {};
                            combinedIds.forEach(id => {
                              const idStr = typeof id === 'string' ? id : id.toString();
                              uniqueIdsMap[idStr] = true;
                            });
                            const uniqueIds = Object.keys(uniqueIdsMap);
                            const allMaterialIds = uniqueIds.map(id => id);
                            
                            // Find the actual material objects for these IDs
                            const relatedMaterials = materials.filter((material: any) => 
                              allMaterialIds.includes(material.id.toString())
                            );
                            
                            // Create a task-like object for the TaskMaterialsView component
                            const materialsTask = {
                              id: associatedTask?.id || labor.id,
                              title: associatedTask?.title || `Labor for ${getProjectName(labor.projectId)}`,
                              projectId: labor.projectId,
                              materialIds: allMaterialIds
                            };
                            
                            return (
                              <>
                                <Card className="border-l-4 border-orange-500 shadow-sm hover:shadow-md transition-shadow duration-200 flex-grow overflow-hidden">
                                  <CardHeader className="p-4 pb-2 bg-gradient-to-r from-orange-500 to-orange-600 border-b border-orange-700">
                                    <div className="flex justify-between items-center">
                                      <div className="flex items-center">
                                        <div className="h-full w-1 rounded-full bg-white mr-2 self-stretch"></div>
                                        <CardTitle className="text-base font-semibold text-white">Materials</CardTitle>
                                      </div>
                                      <span className="text-xs px-2 py-1 rounded-full font-medium bg-white bg-opacity-70 text-orange-800 border border-orange-200">
                                        {relatedMaterials.length} Items
                                      </span>
                                    </div>
                                  </CardHeader>
                                  <CardContent className="overflow-y-auto p-4 pt-0">
                                    {relatedMaterials.length > 0 ? (
                                      <div className="space-y-2">
                                        {/* Direct display of materials */}
                                        {relatedMaterials.map((material: any) => (
                                          <div key={material.id} className="p-2 bg-slate-50 rounded-md flex justify-between">
                                            <div className="flex items-center">
                                              <div className="p-2 bg-orange-100 rounded-md mr-2">
                                                <Package className="h-4 w-4 text-orange-600" />
                                              </div>
                                              <div>
                                                <h4 className="text-sm font-medium">{material.name}</h4>
                                                <p className="text-xs text-slate-500">
                                                  {material.quantity} {material.unit} • {formatCurrency(material.price || 0)}
                                                </p>
                                              </div>
                                            </div>
                                            <span className={`text-xs px-2 py-1 h-fit rounded-full ${
                                              material.status === 'ordered' ? 'bg-blue-100 text-blue-800' :
                                              material.status === 'received' ? 'bg-green-100 text-green-800' :
                                              'bg-slate-100 text-slate-800'
                                            }`}>
                                              {material.status || 'pending'}
                                            </span>
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <div className="flex flex-col justify-center items-center p-6 text-center">
                                        <Package className="h-8 w-8 text-slate-300 mb-2" />
                                        <p className="text-slate-500 text-sm">No materials assigned</p>
                                        <p className="text-xs text-slate-400 mt-1">
                                          Materials can be assigned to tasks or labor entries
                                        </p>
                                      </div>
                                    )}
                                  </CardContent>
                                </Card>
                                
                                {/* View Materials Button */}
                                <div className="mt-2">
                                  <Button
                                    variant="outline"
                                    className="w-full flex items-center justify-center text-orange-600 hover:text-orange-700"
                                    onClick={() => {
                                      // If there's a task, navigate to its materials page, otherwise to project materials
                                      if (associatedTask) {
                                        navigate(`/tasks/${associatedTask.id}/materials`);
                                      } else {
                                        navigate(`/projects/${labor.projectId}/resources`);
                                      }
                                    }}
                                  >
                                    <ChevronRight className="h-4 w-4 mr-1" /> View Materials Details
                                  </Button>
                                </div>
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dashboard Widgets */}
        <div className="grid grid-cols-1 gap-6 w-full max-w-full overflow-hidden">
          {/* Upcoming Deadlines - With Modern Design */}
          <Card className="bg-white border border-slate-200 overflow-hidden w-full">
            <CardHeader className="p-5 bg-gradient-to-r from-purple-500 to-purple-600 border-b border-purple-700">
              <div className="flex items-center">
                <div className="h-full w-1 rounded-full bg-white mr-3 self-stretch"></div>
                <CardTitle className="text-lg font-semibold text-white">Upcoming Deadlines</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-0 divide-y divide-slate-200">
              {upcomingDeadlines?.length === 0 ? (
                <div className="p-6 text-center">
                  <Calendar className="h-12 w-12 mx-auto text-slate-300 mb-2" />
                  <p className="text-slate-600 font-medium">No upcoming deadlines</p>
                  <p className="text-xs text-slate-400 mt-1">All tasks are currently on schedule</p>
                </div>
              ) : (
                upcomingDeadlines.map((task: any) => {
                  const daysLeft = getDaysLeft(task.endDate);
                  const isOverdue = daysLeft < 0;
                  return (
                    <div key={task.id} className="p-4 flex justify-between items-start hover:bg-slate-50">
                      <div className="flex items-start">
                        <div className={`p-2 rounded-md mr-3 ${
                          isOverdue ? "bg-red-100" : 
                          daysLeft <= 3 ? "bg-amber-100" : 
                          "bg-blue-100"
                        }`}>
                          <Calendar className={`h-4 w-4 ${
                            isOverdue ? "text-red-600" : 
                            daysLeft <= 3 ? "text-amber-600" : 
                            "text-blue-600"
                          }`} />
                        </div>
                        <div>
                          <h4 className="font-medium text-slate-800">{task.title}</h4>
                          <p className="text-sm text-slate-500 mt-1">{getProjectName(task.projectId)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-medium px-2 py-1 rounded-full ${
                          isOverdue ? "bg-red-100 text-red-800" : 
                          daysLeft <= 3 ? "bg-amber-100 text-amber-800" : 
                          "bg-green-100 text-green-800"
                        }`}>
                          {formatDate(task.endDate)}
                        </p>
                        <p className={`text-xs mt-1 font-medium ${
                          isOverdue ? "text-red-600" : 
                          daysLeft <= 3 ? "text-amber-600" : 
                          "text-green-600"
                        }`}>
                          {isOverdue ? `${Math.abs(daysLeft)} days overdue` : `${daysLeft} days left`}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>

        {/* Vintage Gantt Chart */}
        <Card className="col-span-full shadow-md">
          <CardHeader className="pb-2">
            <CardTitle>Project Timeline Overview</CardTitle>
            <CardDescription>Visualized task schedule across all active projects</CardDescription>
          </CardHeader>
          <CardContent>
            {!tasksLoading && tasks.length > 0 ? (
              <VintageGanttChart 
                tasks={tasks.map(task => ({
                  ...task,
                  startDate: new Date(task.startDate),
                  endDate: new Date(task.endDate)
                }))}
                title="Project Tasks Timeline"
                subtitle="scheduled & active project tasks"
                backgroundClass="bg-amber-50"
              />
            ) : (
              <div className="p-6 text-center text-gray-500">
                {tasksLoading ? "Loading task data..." : "No tasks available for timeline display"}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Project Creation Dialog */}
        <CreateProjectDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />
      </div>
    </Layout>
  );
}