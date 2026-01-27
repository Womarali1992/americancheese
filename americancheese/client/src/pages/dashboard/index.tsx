import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { Layout } from "@/components/layout/Layout";
import { apiRequest } from "@/lib/queryClient";
import { hexToRgba, lightenColor, darkenColor, getStatusBgColor, formatTaskStatus, getTier1Color as getUnifiedTier1Color, getTier2Color as getUnifiedTier2Color } from "@/lib/unified-color-system";
import { COLOR_THEMES as THEMES } from "@/lib/color-themes";
import { useUnifiedColors } from "@/hooks/useUnifiedColors";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BudgetBarChart } from "@/components/charts/BudgetBarChart";
import { BudgetExpandableChart } from "@/components/charts/BudgetExpandableChart";
import { ProgressBar } from "@/components/charts/ProgressBar";
import { ProjectProgressChart } from "@/components/charts/ProjectProgressChart";
import { ProjectBudgetCompactChartSimple } from "@/components/charts/ProjectBudgetCompactChartSimple";
import { GanttChartLabor } from "@/components/charts/GanttChartLabor";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import { AvatarGroup } from "@/components/ui/avatar-group";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate, calculateTotal } from "@/lib/utils";
// Simple formatCategoryName function
const formatCategoryName = (name: string, _projectId?: number) => name.replace(/_/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
// Simple getStatusBorderColor function
const getStatusBorderColor = (status: string) => {
  const s = status?.toLowerCase() || '';
  if (s.includes('complet')) return '#22c55e';
  if (s.includes('progress')) return '#f59e0b';
  return '#94a3b8';
};
// Fallback colors
const FALLBACK_COLORS = { primary: '#6366f1' };

import { useTabNavigation } from "@/hooks/useTabNavigation";
import { useToast } from "@/hooks/use-toast";
import { CreateProjectDialog } from "@/pages/projects/CreateProjectDialog";
import { CreateExpenseDialog } from "@/pages/expenses/CreateExpenseDialog";
import { EditExpenseDialog } from "@/pages/expenses/EditExpenseDialog";
import { TaskCard } from "@/components/task/TaskCard";
import { LaborCard } from "@/components/labor/LaborCard";
import { getIconForMaterialTier } from "@/components/project/iconUtils";
import {
  Building,
  Calendar,
  CheckCircle2,
  CheckSquare,
  Layers,
  Grid,
  ClipboardList,
  DollarSign,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
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
  ExternalLink,
  Download,
  Wallet,
  Eye,
  Edit,
  Trash2,
  Home,
  X
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { CategoryProgressColumns } from "@/components/project/CategoryProgressColumns";


// Simple data structures
const mockUsers = [
  { name: "John Doe", image: undefined },
  { name: "Jane Smith", image: undefined },
  { name: "Robert Chen", image: undefined },
];

// Simple URL converter
const convertLinksToHtml = (text: string) => {
  if (!text) return "";
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.replace(urlRegex, (url) => 
    `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline">${url}</a>`
  );
};

export default function DashboardPage() {
  const { navigateToTab } = useTabNavigation();
  const [, navigate] = useLocation();
  const params = useParams();
  const projectIdFromUrl = params.projectId ? Number(params.projectId) : undefined;

  // Simplified state management
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showAllProjects, setShowAllProjects] = useState(false);
  const [searchDropdownOpen, setSearchDropdownOpen] = useState(false);
  const [createExpenseOpen, setCreateExpenseOpen] = useState(false);
  const [editExpenseOpen, setEditExpenseOpen] = useState(false);
  const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<any>(null);
  const [projectFilter, setProjectFilter] = useState(projectIdFromUrl ? projectIdFromUrl.toString() : "all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [breakdownView, setBreakdownView] = useState<'default' | 'materials' | 'labor'>('default');
  const [forceRefresh, setForceRefresh] = useState(Date.now());
  const [viewPeriod, setViewPeriod] = useState(3);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Simple click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (searchDropdownOpen && !target.closest('.search-dropdown-container')) {
        setSearchDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [searchDropdownOpen]);

  // Simplified color system
  const { activeTheme, getTier1Color, getTier2Color, adminCategories: allCategories } = useUnifiedColors(null);

  const { data: projects = [], isLoading: projectsLoading } = useQuery<any[]>({
    queryKey: ["/api/projects"],
  });

  const { data: tasks = [], isLoading: tasksLoading } = useQuery<any[]>({
    queryKey: ["/api/tasks"],
  });

  // Simple function to get project color using new color system
  const getProjectColor = (id: number): string => {
    const project = projects.find((p: any) => p.id === id);
    
    // If project has a custom theme, use its primary color
    if (project?.colorTheme) {
      const themeKey = project.colorTheme.toLowerCase().replace(/\s+/g, '-');
      const theme = THEMES[themeKey];
      if (theme) return theme.tier1.subcategory1;
    }

    // Otherwise, cycle through the active theme's colors based on project ID
    // This ensures different projects have different colors on the dashboard
    const themeColors = [
      activeTheme.tier1.subcategory1,
      activeTheme.tier1.subcategory2,
      activeTheme.tier1.subcategory3,
      activeTheme.tier1.subcategory4,
      activeTheme.tier1.subcategory5
    ];
    
    // Use project ID to pick a stable color from the theme
    const colorIndex = (id - 1) % themeColors.length;
    return themeColors[colorIndex];
  };

  // Simple tier1 color getter using new system
  const getSimpleTier1Color = (categoryName: string, projectId?: number, _index?: number) => {
    const color = getUnifiedTier1Color(categoryName, allCategories, projectId, projects);
    console.log(`🎨 TIER1: "${categoryName}" project=${projectId} → ${color}`);
    return color;
  };

  // Simple tier2 color getter using new system
  const getSimpleTier2Color = (categoryName: string, tier1Parent: string, projectId?: number) => {
    const color = getUnifiedTier2Color(categoryName, allCategories, projectId, projects, tier1Parent);
    console.log(`🎨 TIER2: "${categoryName}" (parent: ${tier1Parent}) project=${projectId} → ${color}`);
    return color;
  };
  
  // Debug task loading
  console.log(`📊 Dashboard Tasks Debug:`, {
    totalTasks: tasks.length,
    tasksLoading,
    sampleTasks: tasks.slice(0, 2).map(t => ({
      id: t?.id,
      title: t?.title,
      projectId: t?.projectId,
      tier1Category: t?.tier1Category,
      tier2Category: t?.tier2Category
    }))
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

  // Fetch all project categories for color assignment
  const { data: allProjectCategories = [] } = useQuery<any[]>({
    queryKey: ["/api/all-project-categories"],
    queryFn: async () => {
      // Fetch categories for all projects
      const categoriesByProject = await Promise.all(
        projects.map(async (project: any) => {
          const response = await fetch(`/api/projects/${project.id}/categories`);
          if (!response.ok) return [];
          const categories = await response.json();
          // Properly flatten hierarchical data - tier1 categories have tier2 children nested
          const flatCategories: any[] = [];
          categories.forEach((tier1Cat: any) => {
            // Add the tier1 category with projectId
            flatCategories.push({ ...tier1Cat, projectId: project.id, children: undefined });
            // Also add all tier2 children with projectId
            if (tier1Cat.children && Array.isArray(tier1Cat.children)) {
              tier1Cat.children.forEach((tier2Cat: any) => {
                flatCategories.push({ ...tier2Cat, projectId: project.id });
              });
            }
          });
          return flatCategories;
        })
      );
      return categoriesByProject.flat();
    },
    enabled: projects.length > 0
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
  
  // Calculate budget remaining
  const budgetRemaining = totalBudget - totalSpent;
  
  // Budget percentage
  const budgetPercentage = Math.round((totalSpent / totalBudget) * 100);
  
  // Get top 5 material expenses
  const getTopMaterialExpenses = () => {
    if (!expenses) return [];

    // Filter expenses that are related to materials
    const materialExpenses = expenses
      .filter((expense: any) => expense.category.toLowerCase().includes('material'))
      .sort((a: any, b: any) => b.amount - a.amount)
      .slice(0, 5);

    return materialExpenses.map((expense: any) => ({
      name: expense.description,
      amount: expense.amount,
      percentage: Math.round((expense.amount / totalSpent) * 100)
    }));
  };

  // Get top 5 labor expenses
  const getTopLaborExpenses = () => {
    if (!expenses) return [];

    // Filter expenses that are related to labor
    const laborExpenses = expenses
      .filter((expense: any) => expense.category.toLowerCase().includes('labor') || 
                         expense.category.toLowerCase().includes('staff') ||
                         expense.category.toLowerCase().includes('contractor'))
      .sort((a: any, b: any) => b.amount - a.amount)
      .slice(0, 5);

    return laborExpenses.map((expense: any) => ({
      name: expense.description,
      amount: expense.amount,
      percentage: Math.round((expense.amount / totalSpent) * 100)
    }));
  };

  // Get the expense data based on selected view
  const getExpenseData = () => {
    if (breakdownView === 'materials') {
      return getTopMaterialExpenses();
    } else if (breakdownView === 'labor') {
      return getTopLaborExpenses();
    }

    // Calculate actual total for materials
    const materialsTotal = expenses?.filter((expense: any) => 
      expense.category.toLowerCase().includes('material')
    ).reduce((sum: number, expense: any) => sum + expense.amount, 0) || 0;

    // Calculate actual total for labor
    const laborTotal = expenses?.filter((expense: any) => 
      expense.category.toLowerCase().includes('labor') || 
      expense.category.toLowerCase().includes('staff') ||
      expense.category.toLowerCase().includes('contractor')
    ).reduce((sum: number, expense: any) => sum + expense.amount, 0) || 0;

    // Default view - return categories based on DB data
    return [
      { name: 'Materials', amount: materialsTotal, percentage: Math.round((materialsTotal / totalSpent) * 100) || 0 },
      { name: 'Labor', amount: laborTotal, percentage: Math.round((laborTotal / totalSpent) * 100) || 0 },
      { name: 'Equipment', amount: 0, percentage: 0 },
      { name: 'Permits', amount: 0, percentage: 0 },
      { name: 'Misc', amount: 0, percentage: 0 }
    ];
  };
  
  // Filter expenses based on search and filters
  const filteredExpenses = expenses?.filter((expense: any) => {
    const matchesSearch = expense.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          expense.vendor?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesProject = projectFilter === "all" || expense.projectId.toString() === projectFilter;
    const matchesCategory = categoryFilter === "all" || expense.category === categoryFilter;

    return matchesSearch && matchesProject && matchesCategory;
  });
  
  // Delete expense mutation
  const deleteExpenseMutation = useMutation({
    mutationFn: async (expenseId: number) => {
      try {
        const response = await fetch(`/api/expenses/${expenseId}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          // Try to get the error message from the response
          let errorText = "";
          try {
            const errorData = await response.json();
            errorText = errorData.message || `Status ${response.status}`;
          } catch (e) {
            errorText = `Status ${response.status}`;
          }

          throw new Error(`Failed to delete expense: ${errorText}`);
        }

        return true;
      } catch (err) {
        console.error("Error in delete mutation:", err);
        throw err;
      }
    },
    onSuccess: () => {
      toast({
        title: "Expense deleted",
        description: "The expense has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      // Also invalidate project-specific expenses if we're viewing a specific project
      if (projectFilter !== "all") {
        queryClient.invalidateQueries({ 
          queryKey: ["/api/projects", Number(projectFilter), "expenses"] 
        });
      }
      setDeleteAlertOpen(false);
      setSelectedExpense(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete expense: ${error instanceof Error ? error.message : "Please try again."}`,
        variant: "destructive",
      });
      console.error("Failed to delete expense:", error);
    },
  });

  const handleDelete = () => {
    if (selectedExpense) {
      console.log("Deleting expense with ID:", selectedExpense.id);
      console.log("Selected expense:", selectedExpense);
      deleteExpenseMutation.mutate(selectedExpense.id);
    }
  };
  
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
  
  // Helper function to get supplier info by ID
  const getSupplierInfo = (supplierId: number | null) => {
    if (!supplierId) return null;
    const supplier = contacts.find((c: any) => c.id === supplierId && c.type === "supplier");
    
    if (!supplier) return null;
    
    return {
      id: supplier.id,
      name: supplier.firstName 
        ? `${supplier.firstName} ${supplier.lastName || ''}`.trim()
        : supplier.company || "Unknown Supplier",
      company: supplier.company,
      phone: supplier.phone,
      email: supplier.email,
      type: supplier.type,
      category: supplier.role || "Building Materials",
      initials: supplier.initials || (supplier.firstName ? supplier.firstName.charAt(0) : (supplier.company ? supplier.company.charAt(0) : "S"))
    };
  };
  
  // Helper function to find supplier for a material
  const getSupplierForMaterial = (material: any) => {
    // First try to get by supplierId if available
    if (material.supplierId) {
      const supplierInfo = getSupplierInfo(material.supplierId);
      if (supplierInfo) return supplierInfo;
    }
    
    // If no supplierId or not found, try to match by supplier name from contacts
    if (material.supplier) {
      const matchingSupplier = contacts.find((c: any) => 
        c.type === "supplier" && 
        (
          c.company === material.supplier ||
          (c.firstName && `${c.firstName} ${c.lastName || ''}`.includes(material.supplier)) ||
          (c.lastName && material.supplier.includes(c.lastName))
        )
      );
      
      if (matchingSupplier) {
        return getSupplierInfo(matchingSupplier.id);
      }
      
      // If no match found in contacts but we have a supplier name, create a basic info object
      return {
        id: 0,
        name: material.supplier,
        company: material.supplier,
        type: "supplier",
        category: "Building Materials",
        initials: material.supplier.charAt(0)
      };
    }
    
    return null;
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
    
    // Calculate completion percentage for each tier - only for tiers that have tasks
    const progressByTier: Record<string, number> = {};
    
    console.log('Task categories found:', Object.keys(tasksByTier1));
    
    // Process only tier1 categories that actually have tasks
    Object.keys(tasksByTier1).forEach(tier => {
      const tierTasks = tasksByTier1[tier] || [];
      const totalTasks = tierTasks.length;
      
      // Only process categories that have tasks
      if (totalTasks > 0) {
        // Debug information to show which tasks are marked as completed
        console.log('Tasks in tier', tier, ':', tierTasks.map((t: any) => ({
          id: t.id, 
          title: t.title, 
          completed: t.completed, 
          status: t.status
        })));
        
        // Check both the completed flag and status field (tasks marked as 'completed' should count)
        const completedTasks = tierTasks.filter((task: any) => 
          task.completed === true || task.status === 'completed'
        ).length;
        
        progressByTier[tier] = Math.round((completedTasks / totalTasks) * 100);
      }
    });
    
    console.log('Progress for project', projectId, ':', progressByTier);
    
    return progressByTier;
  };
  
  // Map to store project tier1 progress data
  const projectTier1Progress = projects.reduce((acc: Record<number, any>, project: any) => {
    acc[project.id] = calculateTier1Progress(project.id);
    
    // Get hidden categories for this project
    const hiddenCategories = project.hiddenCategories || [];
    
    // Only include categories that have tasks and are not hidden
    const availableCategories = Object.keys(acc[project.id]);
    let visibleCategories = availableCategories.filter(cat => !hiddenCategories.includes(cat));
    
    // If all categories are hidden (unusual case), just use all available categories
    if (visibleCategories.length === 0) {
      visibleCategories = availableCategories;
    }
    
    // Calculate the average progress for each project based on visible categories that have tasks
    const totalProgress = visibleCategories.length > 0 ? Math.round(
      visibleCategories.reduce((sum, cat) => sum + (acc[project.id][cat] || 0), 0) / visibleCategories.length
    ) : 0;
    
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
  
  // Function to get project name by ID
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

  // Labor deletion mutation
  const deleteLaborMutation = useMutation({
    mutationFn: async (laborId: number) => {
      return apiRequest(`/api/labor/${laborId}`, 'DELETE');
    },
    onSuccess: () => {
      // Refresh all relevant queries
      queryClient.invalidateQueries({ queryKey: ['/api/labor'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      projects.forEach((project: any) => {
        queryClient.invalidateQueries({ 
          queryKey: ["/api/projects", project.id, "labor"] 
        });
      });
      
      toast({
        title: "Success",
        description: "Labor record deleted successfully",
      });
    },
    onError: (error) => {
      console.error("Error deleting labor record:", error);
      toast({
        title: "Error",
        description: "Could not delete labor record. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Handle labor deletion
  const handleLaborDelete = (laborId: number) => {
    deleteLaborMutation.mutate(laborId);
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
      <div className="space-y-3 w-full max-w-full overflow-hidden px-1 sm:px-3">
        <div className="bg-white border-2 border-indigo-500 rounded-lg shadow-sm">
          {/* First row with title and buttons */}
          <div className="flex justify-between items-center p-3 sm:p-4 bg-indigo-50 rounded-t-lg">
            <div className="flex items-center gap-4 flex-1">
              <h1 className="text-xl sm:text-2xl font-bold text-indigo-600">Dashboard</h1>
            </div>
            <div className="flex items-center gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48 border-indigo-500 rounded-lg focus:ring-indigo-500">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="on_hold">On Hold</SelectItem>
                  <SelectItem value="planning">Planning</SelectItem>
                </SelectContent>
              </Select>
              
              {/* Search Dropdown */}
              <div className="relative search-dropdown-container">
                <Button 
                  variant="outline"
                  className="border-indigo-500 text-indigo-600 hover:bg-indigo-50 font-medium shadow-sm h-9 px-3"
                  onClick={() => setSearchDropdownOpen(!searchDropdownOpen)}
                  size="sm"
                >
                  <Search className="h-4 w-4" />
                </Button>
                
                {searchDropdownOpen && (
                  <div className="absolute top-full right-0 mt-2 w-80 bg-white border border-indigo-200 rounded-lg shadow-lg z-50 p-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-2.5 h-4 w-4 text-indigo-600" />
                      <Input 
                        placeholder="Search projects..." 
                        className="w-full pl-9 border-indigo-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-lg"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        autoFocus
                      />
                      {searchQuery && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute right-1 top-1 h-8 w-8 rounded-md hover:bg-indigo-50"
                          onClick={() => setSearchQuery("")}
                        >
                          <X className="h-4 w-4 text-indigo-600" />
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              <Button 
                className="bg-indigo-600 text-white hover:bg-indigo-700 font-medium shadow-sm h-9 px-4"
                onClick={handleCreateProject}
                size="sm"
              >
                <Plus className="mr-2 h-4 w-4 text-white" /> 
                New Project
              </Button>
            </div>
          </div>
        </div>

        {/* Unified Key Metrics Badge */}
        <div className="bg-slate-50 border-2 border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
          <div className="grid grid-cols-2 md:grid-cols-4">
            {/* Active Projects */}
            <div className="p-4 flex items-center justify-center border-r border-b md:border-b-0 border-slate-200">
              <div className="flex items-center gap-3">
                <Building className="h-6 w-6 text-indigo-600" />
                <div className="text-2xl font-bold text-slate-800">{metrics.activeProjects}</div>
              </div>
            </div>
            
            {/* Open Tasks */}
            <div className="p-4 flex items-center justify-center md:border-r border-b md:border-b-0 border-slate-200">
              <div className="flex items-center gap-3">
                <CheckSquare className="h-6 w-6 text-green-600" />
                <div className="text-2xl font-bold text-slate-800">{metrics.openTasks}</div>
              </div>
            </div>
            
            {/* Pending Materials */}
            <div className="p-4 flex items-center justify-center border-r md:border-r border-slate-200">
              <div className="flex items-center gap-3">
                <Package className="h-6 w-6 text-orange-600" />
                <div className="text-2xl font-bold text-slate-800">{metrics.pendingMaterials}</div>
              </div>
            </div>
            
            {/* Budget Used */}
            <div className="p-4 flex items-center justify-center">
              <div className="flex items-center gap-3">
                <Users className="h-6 w-6 text-blue-600" />
                <div className="text-2xl font-bold text-slate-800">{metrics.budgetUtilization}%</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Project Pages Navigation - Above Card Header */}
        {filteredProjects.length > 1 && (
          <div className="mb-4">
            <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm">
              <div className="flex gap-2 overflow-x-auto pb-1">
                {filteredProjects.map((project: any, index: number) => {
                  const projectColor = getProjectColor(project.id);
                  return (
                    <Button
                      key={`name-${project.id}`}
                      variant="outline"
                      size="sm"
                      className="h-7 px-3 text-xs font-medium whitespace-nowrap flex-shrink-0 rounded-full border transition-all duration-200 hover:shadow-sm"
                      style={{
                        backgroundColor: projectColor + '15',
                        borderColor: projectColor + '40',
                        color: projectColor
                      }}
                      onClick={() => {
                        // Scroll the carousel to show this project
                        const carouselItem = document.querySelector(`[data-project-id="${project.id}"]`);
                        if (carouselItem) {
                          carouselItem.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
                        }
                      }}
                    >
                      <span className="w-2 h-2 rounded-full mr-2" style={{
                        backgroundColor: projectColor
                      }}></span>
                      {project.name}
                    </Button>
                  );
                })}
              </div>

            </div>
          </div>
        )}

        {/* Projects Overview */}
        <Card className="overflow-hidden border-slate-200 bg-white shadow-sm hover:shadow-md transition-all duration-200 rounded-xl relative border-l-4 border-l-indigo-500">
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
                  <div className="p-3">
                    <Carousel className="w-full relative">
                      {/* Position the navigation buttons on the sides of the cards */}
                      <CarouselPrevious className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 h-10 w-10 bg-white/80 hover:bg-white/90 border border-slate-200" />
                      <CarouselNext className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 h-10 w-10 bg-white/80 hover:bg-white/90 border border-slate-200" />
                      
                      <CarouselContent>
                        {filteredProjects.map((project: any) => (
                          <CarouselItem key={project.id} data-project-id={project.id} className="md:basis-full lg:basis-full w-full max-w-full">
                            <div className="border border-slate-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200 max-w-full mx-1 sm:mx-0">
                              <div 
                                className="p-3 relative"
                                style={{
                                  // Use earth tone gradient colors based on project ID with lightened effect
                                  background: (() => {
                                    const color = getProjectColor(project.id);
                                    // Add white and a subtle tint to create a lighter, more refined gradient
                                    return `linear-gradient(to right, rgba(255,255,255,0.85), ${color}40), linear-gradient(to bottom, rgba(255,255,255,0.9), ${color}30)`;
                                  })(),
                                  borderBottom: `1px solid ${getProjectColor(project.id)}`
                                }}
                              >
                                <div className="flex justify-between items-start">
                                  <div className="flex items-start flex-1">
                                    <div 
                                      className="h-full w-1 rounded-full mr-3 self-stretch"
                                      style={{ backgroundColor: getProjectColor(project.id) }}
                                    ></div>
                                    <div className="flex-1">
                                      <div className="mb-2">
                                        <div className="flex items-center gap-3 flex-wrap">
                                          <h3 
                                            className="text-lg font-semibold text-slate-800 hover:text-slate-600 cursor-pointer transition-colors duration-200"
                                            onClick={() => navigate(`/projects/${project.id}`)}
                                          >
                                            {project.name}
                                          </h3>
                                          
                                          {/* Tier 1 Category Badges */}
                                          <div className="flex flex-wrap items-center gap-1 sm:gap-1.5">
                                            {(() => {
                                              // Get tier 1 categories from the project's configured categories (in correct order)
                                              // IMPORTANT: Keep full category objects to access their `color` property
                                              const projectConfiguredCategoryObjects = allProjectCategories
                                                .filter((cat: any) => cat.projectId === project.id && cat.type === 'tier1')
                                                .sort((a: any, b: any) => (a.sortOrder || 0) - (b.sortOrder || 0));

                                              // Get tasks to check which categories have tasks
                                              const projectTasks = tasks.filter((task: any) => task.projectId === project.id);

                                              // Define preferred category order (workout categories first, then others)
                                              const preferredOrder = ['pull', 'push', 'legs', 'cardio', 'structural', 'systems', 'software engineering', 'product management', 'design / ux', 'marketing / go-to-market (gtm)'];

                                              // Get unique categories from tasks and create pseudo-category objects
                                              const taskCategoryObjects: any[] = [];
                                              const seenCategories = new Set<string>();
                                              projectTasks.forEach((task: any) => {
                                                const cat = task.tier1Category;
                                                if (cat && !seenCategories.has(cat)) {
                                                  seenCategories.add(cat);
                                                  taskCategoryObjects.push({ name: cat, color: null }); // No stored color for task-derived categories
                                                }
                                              });

                                              // Sort task-derived categories by preferred order
                                              taskCategoryObjects.sort((a, b) => {
                                                const indexA = preferredOrder.indexOf(a.name.toLowerCase());
                                                const indexB = preferredOrder.indexOf(b.name.toLowerCase());
                                                if (indexA !== -1 && indexB !== -1) return indexA - indexB;
                                                if (indexA !== -1) return -1;
                                                if (indexB !== -1) return 1;
                                                return a.name.localeCompare(b.name);
                                              });

                                              // Use configured categories if available, otherwise use task-derived categories
                                              // IMPORTANT: Show ALL configured categories, not just ones with tasks
                                              const projectTier1CategoryObjects = projectConfiguredCategoryObjects.length > 0
                                                ? projectConfiguredCategoryObjects
                                                : taskCategoryObjects;

                                              // Limit to 4 categories for mobile space
                                              const displayedCategoryObjects = projectTier1CategoryObjects.slice(0, 4);

                                              // Debug logging
                                              console.log(`📋 Project ${project.id} (${project.name}) categories:`, {
                                                configuredCategories: projectConfiguredCategoryObjects.map((c: any) => ({ name: c.name, color: c.color })),
                                                taskCategories: taskCategoryObjects.map((c: any) => c.name),
                                                displayedCategories: displayedCategoryObjects.map((c: any) => ({ name: c.name, color: c.color }))
                                              });

                                              return displayedCategoryObjects.map((categoryObj: any, categoryIndex: number) => {
                                                const tier1Category = categoryObj.name;
                                                const getTier1Icon = (tier1: string, className: string = "h-3 w-3") => {
                                                  const lowerCaseTier1 = (tier1 || '').toLowerCase();

                                                  // Check for specific category names in this project
                                                  if (lowerCaseTier1.includes('ali') || lowerCaseTier1.includes('apartment')) {
                                                    return <Building className={`${className}`} />;
                                                  }

                                                  if (lowerCaseTier1.includes('ux') || lowerCaseTier1.includes('ui') || lowerCaseTier1.includes('design')) {
                                                    return <Cog className={`${className}`} />;
                                                  }

                                                  if (lowerCaseTier1.includes('search') || lowerCaseTier1.includes('agent')) {
                                                    return <PanelTop className={`${className}`} />;
                                                  }

                                                  if (lowerCaseTier1.includes('website') || lowerCaseTier1.includes('admin') || lowerCaseTier1.includes('web')) {
                                                    return <Sofa className={`${className}`} />;
                                                  }

                                                  return <Home className={`${className}`} />;
                                                };

                                                // PRIORITY: Use category's stored color FIRST, then fall back to computed color
                                                const storedColor = categoryObj.color;
                                                const computedColor = getSimpleTier1Color(tier1Category, project.id, categoryIndex);
                                                const baseColor = storedColor || computedColor || '#6b7280';
                                                console.log(`🎨 Category "${tier1Category}" color: stored=${storedColor || 'NONE'}, computed=${computedColor}, final=${baseColor}`);
                                                // Ensure baseColor is a valid hex string
                                                const validBaseColor = (typeof baseColor === 'string' && baseColor.startsWith && baseColor.startsWith('#')) ? baseColor : '#6b7280';
                                                const badgeColors = {
                                                  bg: lightenColor(validBaseColor, 0.9),      // Very light background
                                                  border: lightenColor(validBaseColor, 0.6), // Medium border
                                                  text: darkenColor(validBaseColor, 0.2)     // Darker text
                                                };

                                                return (
                                                  <Button
                                                    key={tier1Category}
                                                    variant="outline"
                                                    size="sm"
                                                    className="px-1.5 sm:px-2 py-1 h-6 text-xs font-medium rounded-full border transition-all duration-200 hover:shadow-sm whitespace-nowrap flex-shrink-0"
                                                    style={{
                                                      backgroundColor: badgeColors.bg,
                                                      borderColor: badgeColors.border,
                                                      color: badgeColors.text
                                                    }}
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      navigate(`/tasks?tier1=${encodeURIComponent(tier1Category)}&projectId=${project.id}`);
                                                    }}
                                                  >
                                                    {getTier1Icon(tier1Category, "h-3 w-3 mr-0.5 sm:mr-1 flex-shrink-0")}
                                                    <span className="truncate max-w-[80px] sm:max-w-none">
                                                      {formatCategoryName(tier1Category, project.id)}
                                                    </span>
                                                  </Button>
                                                );
                                              });
                                            })()}
                                          </div>
                                        </div>
                                      </div>
                                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                                        <div className="flex items-center text-sm text-slate-700 font-medium">
                                          <MapPin className="h-4 w-4 mr-1 text-slate-600" />
                                          {project.location || "No location specified"}
                                        </div>
                                        <div className="flex flex-wrap items-center gap-2">
                                          <span className={`text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap ${
                                            project.status === "active" ? "bg-green-200 text-green-800 border border-green-300" :
                                            project.status === "planned" ? "bg-blue-200 text-blue-800 border border-blue-300" :
                                            project.status === "completed" ? "bg-[#503e49]/20 text-[#503e49] border border-[#503e49]/30" :
                                            "bg-orange-200 text-orange-800 border border-orange-300"
                                          }`}>
                                            {project.status === "active" ? "Active" : 
                                             project.status === "planned" ? "Planned" : 
                                             project.status === "completed" ? "Completed" : 
                                             "On Hold"}
                                          </span>
                                          <span className="text-xs bg-white bg-opacity-80 text-slate-800 px-2 py-1 rounded-full border border-slate-200 font-medium whitespace-nowrap">
                                            Due: {formatDate(project.endDate)}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div className="flex-shrink-0 ml-4">
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
                              
                              <div className="p-3">
                                <div className="mt-1 grid grid-cols-1 gap-4">
                                  {/* Progress Overview - Enhanced - Full Width */}
                                  <div>
                                    <div className="bg-white p-3 rounded-lg shadow-sm border border-slate-100 overflow-hidden max-w-full">
                                      {/* Overall progress indicator - with meter style */}
                                      <div className="mb-4">
                                        <div className="flex justify-between items-center mb-2">
                                          <div className="flex items-center">
                                            <div 
                                              className="w-1 h-5 rounded-sm mr-2"
                                              style={{
                                                backgroundColor: getProjectColor(project.id)
                                              }}
                                            ></div>
                                            <span className="text-base font-semibold">Overall Completion</span>
                                          </div>
                                          <div 
                                            className="text-sm font-bold rounded-full px-3 py-0.5 bg-white/70"
                                            style={{ 
                                              color: getProjectColor(project.id),
                                              border: `1px solid ${getProjectColor(project.id)}40`
                                            }}
                                          >
                                            {project.progress || 0}%
                                          </div>
                                        </div>
                                        <div 
                                          className="w-full rounded-lg h-3 bg-slate-100 cursor-pointer hover:bg-slate-200 transition-colors"
                                          onClick={() => navigate(`/tasks?projectId=${project.id}`)}
                                          title={`View all tasks for ${project.name}`}
                                        >
                                          <div
                                            className="h-3 rounded-lg transition-all duration-300 shadow-sm hover:shadow-md"
                                            style={{ 
                                              width: `${Math.min(Math.max(project.progress || 0, 0), 100)}%`,
                                              backgroundColor: getProjectColor(project.id)
                                            }}
                                          >
                                            {(project.progress || 0) > 15 && (
                                              <div className="h-full flex items-center justify-end pr-1">
                                                <div className="h-2 w-[1px] bg-white opacity-50 mr-[3px]"></div>
                                                <div className="h-2 w-[1px] bg-white opacity-50 mr-[3px]"></div>
                                                <div className="h-2 w-[1px] bg-white opacity-50"></div>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                      
                                      {/* System Progress Charts - Always expanded by default */}
                                      <div className="space-y-3">
                                        <div className="w-full">
                                          <div className="flex items-center justify-between w-full mb-1 border-b-2 border-slate-200 pb-1 text-left">
                                            <div className="flex items-center">
                                              <h4 className="text-sm font-medium text-slate-700">Progress by Construction Phase</h4>
                                            </div>
                                          </div>
                                          <div className="mt-2">
                                            {/* Use our reusable component that respects hidden categories */}
                                            <CategoryProgressColumns 
                                              tasks={tasks.filter((task: any) => task.projectId === project.id)} 
                                              hiddenCategories={project.hiddenCategories || []}
                                              projectId={project.id}
                                              isLoading={tasksLoading}
                                            />
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
        <Card className="overflow-hidden border-slate-200 bg-white shadow-sm hover:shadow-md transition-all duration-200 rounded-xl relative border-l-4 border-l-indigo-500 mb-6">
          <CardHeader className="p-4 bg-white border-b-2 border-indigo-500">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg font-semibold text-indigo-600">Current & Upcoming Labor</CardTitle>
              {upcomingLaborTasks?.length > 0 && (
                <div className="text-sm bg-indigo-50 text-indigo-600 rounded-full px-3 py-1 font-medium border border-indigo-300">
                  {upcomingLaborTasks.length} {upcomingLaborTasks.length === 1 ? 'Entry' : 'Entries'}
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
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
                                    onDelete={(laborId) => handleLaborDelete(laborId)}
                                  />
                                  
                                  <div className="mt-2">
                                    <Button
                                      variant="outline"
                                      className="w-full flex items-center justify-center text-indigo-600 hover:text-indigo-700 border-indigo-300 hover:border-indigo-400"
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
                                
                                {/* Task Card - Second Row - Clean Modern Design */}
                                {associatedTask && (
                                  <div className="w-full">
                                    <Card 
                                      key={associatedTask.id} 
                                      className={`border-l-4 ${getStatusBorderColor(associatedTask.status)} shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden cursor-pointer`}
                                      onClick={() => navigate(`/tasks/${associatedTask.id}`)}
                                    >
                                      <CardHeader className="flex flex-col space-y-1.5 p-4 pb-8 w-full overflow-hidden border-b border-green-100 bg-green-50">
                                        {/* Tier Category Badges */}
                                        <div className="flex items-center justify-between gap-2 mb-1.5">
                                          <div className="flex items-center gap-2">
                                            {associatedTask.tier2Category && (() => {
                                              const tier2Color = getSimpleTier2Color(associatedTask.tier2Category, associatedTask.tier1Category, associatedTask.projectId);
                                              return (
                                                <span
                                                  className="text-xs font-medium px-2 py-0.5 rounded-full"
                                                  style={{
                                                    backgroundColor: hexToRgba(tier2Color, 0.12),
                                                    color: tier2Color,
                                                    border: `1px solid ${hexToRgba(tier2Color, 0.25)}`
                                                  }}
                                                >
                                                  {associatedTask.tier2Category}
                                                </span>
                                              );
                                            })()}
                                            
                                            {associatedTask.tier1Category && (
                                              <span
                                                className="text-xs font-normal"
                                                style={{
                                                  color: getSimpleTier1Color(associatedTask.tier1Category, associatedTask.projectId)
                                                }}
                                              >
                                                {associatedTask.tier1Category}
                                              </span>
                                            )}
                                          </div>
                                          
                                          <div className="flex items-center gap-2">
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
                                        
                                        <div className="flex items-center">
                                          <CardTitle className="text-base font-medium text-slate-800 px-3 py-2 bg-white rounded-md border border-slate-100 w-full mb-2">{associatedTask.title}</CardTitle>
                                        </div>
                                      </CardHeader>
                                      <CardContent className="p-4">
                                        {/* Time and dates info in a clean, minimal format */}
                                        <div className="flex items-center justify-between mb-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
                                          <div className="flex flex-col items-center">
                                            <p className="text-xs text-slate-500 font-medium uppercase">Start</p>
                                            <p className="text-sm font-medium text-slate-700">{formatDate(associatedTask.startDate || new Date())}</p>
                                          </div>
                                          <div className="h-6 border-r border-slate-200"></div>
                                          <div className="flex flex-col items-center">
                                            <p className="text-xs text-slate-500 font-medium uppercase">End</p>
                                            <p className="text-sm font-medium text-slate-700">{formatDate(associatedTask.endDate || new Date())}</p>
                                          </div>
                                          <div className="h-6 border-r border-slate-200"></div>
                                          <div className="flex flex-col items-center">
                                            <p className="text-xs text-slate-500 font-medium uppercase">Progress</p>
                                            <p className="text-sm font-medium text-slate-700">{associatedTask.progress || 0}%</p>
                                          </div>
                                        </div>
                                        
                                        {/* Assignee */}
                                        <div className="flex items-center mb-3">
                                          <div className="p-2 rounded-full bg-green-100 mr-3">
                                            <User className="h-4 w-4 text-green-600" />
                                          </div>
                                          <div>
                                            <p className="text-xs text-slate-500 font-medium">ASSIGNED TO</p>
                                            <p className="text-sm font-medium text-slate-700">{associatedTask.assignedTo || "Unassigned"}</p>
                                          </div>
                                        </div>
                                        
                                        {/* Project */}
                                        <div className="flex items-center mb-3">
                                          <div className="p-2 rounded-full bg-green-100 mr-3">
                                            <Building className="h-4 w-4 text-green-600" />
                                          </div>
                                          <div>
                                            <p className="text-xs text-slate-500 font-medium">PROJECT</p>
                                            <p className="text-sm font-medium text-slate-700">{getProjectName(associatedTask.projectId)}</p>
                                          </div>
                                        </div>
                                        
                                        {/* Progress bar */}
                                        <div className="mb-3 mt-3">
                                          <div className="w-full bg-slate-100 rounded-full h-2">
                                            <div 
                                              className="bg-green-500 rounded-full h-2" 
                                              style={{ width: `${associatedTask.progress || 0}%` }}
                                            ></div>
                                          </div>
                                        </div>
                                        
                                        {/* Labor and Materials status tags */}
                                        <div className="flex flex-wrap gap-2 mt-3">
                                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-md font-medium text-xs flex items-center">
                                            <Users className="h-3 w-3 mr-1" />
                                            Labor Assigned
                                          </span>
                                          
                                          <span className="px-2 py-1 bg-slate-100 text-slate-800 rounded-md font-medium text-xs flex items-center">
                                            <Package className="h-3 w-3 mr-1" />
                                            {taskMaterialCounts[associatedTask.id] || 0} Materials
                                          </span>
                                        </div>
                                      </CardContent>
                                    </Card>
                                    
                                    <div className="mt-2">
                                      <Button
                                        variant="outline"
                                        className="w-full flex items-center justify-center text-green-600 hover:text-green-700"
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
                                
                                {/* Materials Card - Show Project Materials - Clean Modern Design */}
                                <div className="w-full">
                                  <Card className="border-l-4 border-orange-500 shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
                                    <CardHeader className="flex flex-col space-y-1.5 p-4 pb-8 w-full overflow-hidden border-b border-orange-100 bg-orange-50">
                                      <div className="flex items-center justify-between gap-2 mb-1.5">
                                        <div className="flex items-center gap-2">
                                          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-orange-100 text-orange-800">
                                            Materials
                                          </span>
                                          <span className="text-xs font-normal text-orange-700">
                                            Project Resources
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <span className="text-xs px-2 py-1 rounded-full font-medium bg-orange-100 text-orange-800 border border-orange-200">
                                            Project Materials
                                          </span>
                                        </div>
                                      </div>
                                      
                                      <div className="flex items-center">
                                        <CardTitle className="text-base font-medium text-slate-800 px-3 py-2 bg-white rounded-md border border-slate-100 w-full mb-2">Materials Overview</CardTitle>
                                      </div>
                                    </CardHeader>
                                    <CardContent className="p-4 pt-2">
                                      {(() => {
                                        // Get all materials for this project
                                        const projectMaterials = materials.filter(m => 
                                          m.projectId === labor.projectId
                                        ).slice(0, 5); // Show only first 5 for mobile view
                                        
                                        if (projectMaterials.length === 0) {
                                          return (
                                            <div className="text-center py-6">
                                              <Package className="h-12 w-12 mx-auto text-slate-300 mb-2" />
                                              <h3 className="text-sm font-medium text-slate-700">No Materials</h3>
                                              <p className="text-xs text-slate-500 mt-1">No materials associated with this project.</p>
                                            </div>
                                          );
                                        }
                                        
                                        // Group materials by supplier
                                        const supplierGroups: {[key: string]: {supplier: any, materials: any[]}} = {};
                                        
                                        projectMaterials.forEach(material => {
                                          // Get a unique key for the supplier
                                          const supplierKey = material.supplier || material.supplierId?.toString() || 'unknown';
                                          
                                          // Initialize group if needed
                                          if (!supplierGroups[supplierKey]) {
                                            const supplierInfo = getSupplierForMaterial(material);
                                            supplierGroups[supplierKey] = {
                                              supplier: supplierInfo,
                                              materials: []
                                            };
                                          }
                                          
                                          // Add material to the group
                                          supplierGroups[supplierKey].materials.push(material);
                                        });
                                        
                                        return (
                                          <div className="space-y-4 max-h-[320px] overflow-y-auto">
                                            {Object.entries(supplierGroups).map(([key, group]) => (
                                              <div key={key} className="space-y-2">
                                                {/* Supplier Card */}
                                                {group.supplier && (
                                                  <Card className="bg-white shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                                                    <div className="p-2 border-b border-slate-200 flex justify-between items-center">
                                                      <div className="flex items-center">
                                                        <div className="h-8 w-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-medium">
                                                          {group.supplier.initials || group.supplier.name.charAt(0)}
                                                        </div>
                                                        <div className="ml-2">
                                                          <h3 className="text-sm font-medium">{group.supplier.name}</h3>
                                                          <p className="text-xs text-slate-500">{group.supplier.company || "Supplier"}</p>
                                                        </div>
                                                      </div>
                                                      {group.supplier.category && (
                                                        <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
                                                          {group.supplier.category}
                                                        </Badge>
                                                      )}
                                                    </div>
                                                  </Card>
                                                )}
                                                
                                                {/* Material Items */}
                                                {group.materials.map(material => (
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
                                                          {material.quantity} {material.unit || 'units'} {material.cost ? `• ${formatCurrency(material.cost)}` : ''}
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
                                              </div>
                                            ))}
                                            
                                            {/* If there are more materials than shown, indicate there's more */}
                                            {projectMaterials.length < materials.filter(m => m.projectId === labor.projectId).length && (
                                              <div className="text-center py-1 text-xs text-blue-600">
                                                +{materials.filter(m => m.projectId === labor.projectId).length - projectMaterials.length} more materials
                                              </div>
                                            )}
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
                        <div className="flex flex-col h-full">
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
                            onDelete={(laborId) => handleLaborDelete(laborId)}
                          />
                        </div>
                        
                        {/* Enhanced Task Card (if found) */}
                        {associatedTask ? (
                          <div className="flex flex-col h-full">
                            <Card 
                              key={associatedTask.id} 
                              className={`border-l-4 ${getStatusBorderColor(associatedTask.status)} shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden cursor-pointer flex-grow`}
                              onClick={() => navigate(`/tasks/${associatedTask.id}`)}
                            >
                              <CardHeader className="flex flex-col space-y-1.5 p-6 pb-10 w-full overflow-hidden border-b border-green-100 bg-green-50 h-[150px]">
                                {/* Tier Category Badges */}
                                <div className="flex items-center justify-between gap-2 mb-1.5">
                                  <div className="flex items-center gap-2">
                                    {associatedTask.tier2Category && (() => {
                                      const tier2Color = getSimpleTier2Color(associatedTask.tier2Category, associatedTask.tier1Category, associatedTask.projectId);
                                      return (
                                        <span
                                          className="text-xs font-medium px-2 py-0.5 rounded-full"
                                          style={{
                                            backgroundColor: hexToRgba(tier2Color, 0.12),
                                            color: tier2Color,
                                            border: `1px solid ${hexToRgba(tier2Color, 0.25)}`
                                          }}
                                        >
                                          {associatedTask.tier2Category}
                                        </span>
                                      );
                                    })()}

                                    {associatedTask.tier1Category && (
                                      <span
                                        className="text-xs font-normal"
                                        style={{
                                          color: getSimpleTier1Color(associatedTask.tier1Category, associatedTask.projectId)
                                        }}
                                      >
                                        {associatedTask.tier1Category}
                                      </span>
                                    )}
                                  </div>
                                  
                                  <div className="flex items-center gap-2">
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
                                
                                <div className="flex items-center">
                                  <CardTitle className="text-base font-medium text-slate-800 px-3 py-2 bg-white rounded-md border border-slate-100 w-full mb-2">{associatedTask.title}</CardTitle>
                                </div>
                              </CardHeader>
                              <CardContent className="p-6 flex-grow flex flex-col">
                                {/* Time and dates info in a clean, minimal format */}
                                <div className="flex items-center justify-between mb-5 bg-slate-50 p-4 rounded-lg border border-slate-100">
                                  <div className="flex flex-col items-center">
                                    <p className="text-xs text-slate-500 font-medium uppercase">Start</p>
                                    <p className="font-medium text-slate-700">{formatDate(associatedTask.startDate || new Date())}</p>
                                  </div>
                                  <div className="h-6 border-r border-slate-200"></div>
                                  <div className="flex flex-col items-center">
                                    <p className="text-xs text-slate-500 font-medium uppercase">End</p>
                                    <p className="font-medium text-slate-700">{formatDate(associatedTask.endDate || new Date())}</p>
                                  </div>
                                  <div className="h-6 border-r border-slate-200"></div>
                                  <div className="flex flex-col items-center">
                                    <p className="text-xs text-slate-500 font-medium uppercase">Progress</p>
                                    <p className="font-medium text-slate-700">{associatedTask.progress || 0}%</p>
                                  </div>
                                </div>
                                
                                {/* Assignee */}
                                <div className="flex items-center mb-4">
                                  <div className="p-2 rounded-full bg-green-100 mr-3">
                                    <User className="h-4 w-4 text-green-600" />
                                  </div>
                                  <div>
                                    <p className="text-xs text-slate-500 font-medium">ASSIGNED TO</p>
                                    <p className="font-medium text-slate-700">{associatedTask.assignedTo || "Unassigned"}</p>
                                  </div>
                                </div>
                                
                                {/* Project */}
                                <div className="flex items-center mb-4">
                                  <div className="p-2 rounded-full bg-green-100 mr-3">
                                    <Building className="h-4 w-4 text-green-600" />
                                  </div>
                                  <div>
                                    <p className="text-xs text-slate-500 font-medium">PROJECT</p>
                                    <p className="font-medium text-slate-700">{getProjectName(associatedTask.projectId)}</p>
                                  </div>
                                </div>
                                
                                {/* Progress bar */}
                                <div className="mb-4 mt-4">
                                  <div className="w-full bg-slate-100 rounded-full h-2">
                                    <div 
                                      className="bg-green-500 rounded-full h-2" 
                                      style={{ width: `${associatedTask.progress || 0}%` }}
                                    ></div>
                                  </div>
                                </div>
                                
                                {/* Labor and Materials status tags */}
                                <div className="flex flex-wrap gap-2 mt-4">
                                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded-md font-medium text-xs flex items-center">
                                    <Users className="h-3 w-3 mr-1" />
                                    Labor Assigned
                                  </span>
                                  
                                  <span className="px-2 py-1 bg-slate-100 text-slate-800 rounded-md font-medium text-xs flex items-center">
                                    <Package className="h-3 w-3 mr-1" />
                                    {associatedTask.materialIds && associatedTask.materialIds.length > 0 
                                      ? `${associatedTask.materialIds.length} Materials` 
                                      : 'No Materials'}
                                  </span>
                                </div>
                                
                                {/* Task Description - simplified */}
                                {associatedTask.description && (
                                  <div className="mt-4 p-3 bg-slate-50 rounded-md border border-slate-100">
                                    <p className="text-xs text-slate-500 font-medium mb-1">DESCRIPTION</p>
                                    <p className="text-sm text-slate-700">{associatedTask.description}</p>
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                            
                            {/* Add View Task Details button to match other cards */}
                            <div className="mt-2">
                              <Button
                                variant="outline"
                                className="w-full flex items-center justify-center text-green-600 hover:text-green-700"
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
                        <div className="flex flex-col h-full">
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
                                  <CardHeader className="flex flex-col space-y-1.5 p-6 pb-10 w-full overflow-hidden border-b border-orange-100 bg-orange-50 h-[150px]">
                                    {/* Tier Category Badges */}
                                    <div className="flex items-center justify-between gap-2 mb-1.5">
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-orange-100 text-orange-800">
                                          Materials
                                        </span>
                                        {associatedTask?.tier2Category && (
                                          <span
                                            className="text-xs font-normal"
                                            style={{
                                              color: getSimpleTier2Color(associatedTask.tier2Category, associatedTask.tier1Category, associatedTask.projectId)
                                            }}
                                          >
                                            {associatedTask.tier2Category}
                                          </span>
                                        )}
                                        {associatedTask?.tier1Category && (
                                          <span
                                            className="text-xs font-normal"
                                            style={{
                                              color: getSimpleTier1Color(associatedTask.tier1Category, associatedTask.projectId)
                                            }}
                                          >
                                            {associatedTask.tier1Category}
                                          </span>
                                        )}
                                      </div>
                                      
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs px-2 py-1 rounded-full font-medium bg-orange-100 text-orange-800 border border-orange-200">
                                          {relatedMaterials.length} Items
                                        </span>
                                      </div>
                                    </div>
                                    
                                    <div className="flex items-center">
                                      <CardTitle className="text-base font-medium text-slate-800 px-3 py-2 bg-white rounded-md border border-slate-100 w-full mb-2">
                                        {relatedMaterials.length > 0 && relatedMaterials[0].section 
                                          ? `${relatedMaterials[0].section} Materials` 
                                          : "Project Materials"
                                        }
                                      </CardTitle>
                                    </div>
                                  </CardHeader>
                                  <CardContent className="p-6 flex-grow flex flex-col">
                                    {relatedMaterials.length > 0 ? (
                                      <div className="space-y-4">
                                        {/* Summary Info */}
                                        <div className="flex items-center justify-between mb-5 bg-slate-50 p-4 rounded-lg border border-slate-100">
                                          <div className="flex flex-col items-center">
                                            <p className="text-xs text-slate-500 font-medium uppercase">Total Items</p>
                                            <p className="font-medium text-slate-700">{relatedMaterials.length}</p>
                                          </div>
                                          <div className="h-6 border-r border-slate-200"></div>
                                          <div className="flex flex-col items-center">
                                            <p className="text-xs text-slate-500 font-medium uppercase">Total Value</p>
                                            <p className="font-medium text-slate-700">
                                              {formatCurrency(relatedMaterials.reduce((sum, mat) => sum + (mat.price || 0) * (mat.quantity || 1), 0))}
                                            </p>
                                          </div>
                                          <div className="h-6 border-r border-slate-200"></div>
                                          <div className="flex flex-col items-center">
                                            <p className="text-xs text-slate-500 font-medium uppercase">Status</p>
                                            <p className="font-medium text-slate-700">
                                              {relatedMaterials.some(m => m.status === 'received') ? 'Partial' : 'Pending'}
                                            </p>
                                          </div>
                                        </div>
                                        
                                        {/* Materials List */}
                                        <div className="space-y-3">
                                          <p className="text-xs text-slate-500 font-medium">MATERIALS</p>
                                          {relatedMaterials.map((material: any) => (
                                            <div key={material.id} className="p-3 bg-slate-50 rounded-md border border-slate-100 flex justify-between">
                                              <div className="flex items-center">
                                                <div className="p-2 rounded-full bg-orange-100 mr-3">
                                                  <Package className="h-4 w-4 text-orange-600" />
                                                </div>
                                                <div>
                                                  <h4 className="text-sm font-medium text-slate-800">{material.name}</h4>
                                                  <p className="text-xs text-slate-500">
                                                    {material.quantity} {material.unit} • {formatCurrency(material.price || 0)}
                                                  </p>
                                                </div>
                                              </div>
                                              <span className={`text-xs px-2 py-1 h-fit rounded-full self-center ${
                                                material.status === 'ordered' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                                                material.status === 'received' ? 'bg-green-100 text-green-800 border border-green-200' :
                                                'bg-slate-100 text-slate-800 border border-slate-200'
                                              }`}>
                                                {material.status || 'pending'}
                                              </span>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="flex flex-col justify-center items-center p-6 text-center bg-slate-50 rounded-lg border border-slate-100">
                                        <div className="p-3 rounded-full bg-orange-50 mb-2">
                                          <Package className="h-6 w-6 text-orange-300" />
                                        </div>
                                        <p className="text-slate-700 font-medium">No materials assigned</p>
                                        <p className="text-xs text-slate-500 mt-1 max-w-xs">
                                          Materials can be assigned to tasks or labor entries from the resources section
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
          {/* Project Timeline Overview */}
          <Card className="bg-white border border-slate-200 overflow-hidden w-full border-l-4 border-l-indigo-500">
            <CardHeader className="p-5 bg-white border-b-2 border-indigo-500">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <div className="h-full w-1 rounded-full bg-indigo-500 mr-3 self-stretch"></div>
                  <CardTitle className="text-lg font-semibold text-indigo-600">Project Timeline Overview</CardTitle>
                </div>
                <div className="flex items-center space-x-2">
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
            <CardContent className="p-0">
              {!tasksLoading && tasks.length > 0 ? (
                <div style={{ 
                    height: "500px",
                    overflow: "hidden"
                  }}>
                  <GanttChartLabor 
                    tasks={tasks.map(task => ({
                      id: task.id,
                      name: task.title,
                      startDate: new Date(task.startDate),
                      endDate: new Date(task.endDate),
                      progress: task.completionPercentage || 0,
                      dependencies: [],
                      status: task.status
                    }))}
                    viewPeriod={viewPeriod}
                  />
                </div>
              ) : (
                <div className="text-center py-10 text-slate-500">
                  {tasksLoading ? (
                    <div className="flex flex-col items-center">
                      <svg className="animate-spin h-8 w-8 text-slate-400 mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <p>Loading task timeline data...</p>
                    </div>
                  ) : "No tasks available for timeline display"}
                </div>
              )}
            </CardContent>
          </Card>


        </div>

        {/* Expenses & Budget section has been moved to project details page */}

        {/* Project Creation Dialog */}
        <CreateProjectDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />
      </div>

      {/* Create Expense Dialog */}
      <CreateExpenseDialog
        open={createExpenseOpen}
        onOpenChange={setCreateExpenseOpen}
        projectId={projectFilter !== "all" ? Number(projectFilter) : undefined}
      />

      {/* Edit Expense Dialog */}
      <EditExpenseDialog
        open={editExpenseOpen}
        onOpenChange={setEditExpenseOpen}
        expense={selectedExpense}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={deleteAlertOpen} onOpenChange={setDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this expense record. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}