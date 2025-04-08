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
import { ProjectBudgetCompactChart } from "@/components/charts/ProjectBudgetCompactChart";
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
import { getStatusBorderColor, getStatusBgColor, getProgressColor } from "@/lib/color-utils";
import { useTabNavigation } from "@/hooks/useTabNavigation";
import { useToast } from "@/hooks/use-toast";
import { CreateProjectDialog } from "@/pages/projects/CreateProjectDialog";
import { TaskAttachments } from "@/components/task/TaskAttachments";
import { ProjectLabor } from "@/components/project/ProjectLabor";
import { TaskMaterialsView } from "@/components/materials/TaskMaterialsView";
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
  Package,
  User,
  CheckCircle,
  Zap
} from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"; // Added carousel imports


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
    // Our standardized color palette
    const colors = [
      "border-[#7E6551]", // brown
      "border-[#533747]", // taupe
      "border-[#466362]", // teal
      "border-[#8896AB]", // slate
      "border-[#C5D5E4]"  // blue
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

  // Compute dashboard metrics
  const metrics = {
    activeProjects: projects.filter((p: any) => p.status === "active").length || 0,
    openTasks: tasks.filter((t: any) => !t.completed).length || 0,
    pendingMaterials: materials.filter((m: any) => m.status === "ordered").length || 0,
    budgetUtilization: 72 // Hard-coded for now
  };

  // Upcoming deadlines
  const upcomingDeadlines = tasks.filter((task: any) => !task.completed)
    .sort((a: any, b: any) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime())
    .slice(0, 4);
    
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
    
    // Group tasks by their explicit tier1Category field
    const tasksByTier1 = projectTasks.reduce((acc: Record<string, any[]>, task: any) => {
      if (!task.tier1Category) return acc;
      
      // Standardize the tier1 category name
      const tier1Raw = task.tier1Category.toLowerCase();
      const tier1 = standardizedCategoryMap[tier1Raw] || tier1Raw;
      
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
    
    // Calculate the average progress for each project (for display consistency)
    const totalProgress = Math.round(
      (acc[project.id].structural + acc[project.id].systems + 
       acc[project.id].sheathing + acc[project.id].finishings) / 4
    );
    
    // Update the project.progress value to match our calculated progress 
    // This ensures all progress bars show the same value
    // Set it to 45% for Riverside Apartments (id: 1) as requested, otherwise use calculated value
    if (project.id === 1) {
      project.progress = 45; // Hard-coded 45% for Riverside Apartments
    } else {
      project.progress = project.progress || totalProgress;
    }
    
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
    
    // Process each expense
    projectExpenses.forEach((expense: any) => {
      // Handle main categories (materials or labor)
      if (expense.category === 'materials') {
        expenseData.materials += expense.amount;
      } else if (expense.category === 'labor') {
        expenseData.labor += expense.amount;
      }
      
      // Handle subcategories if they exist
      if (expense.category.includes('structural')) {
        if (expense.category.includes('materials')) {
          expenseData.systems.structural.materials += expense.amount;
        } else if (expense.category.includes('labor')) {
          expenseData.systems.structural.labor += expense.amount;
        }
      } else if (expense.category.includes('systems')) {
        if (expense.category.includes('materials')) {
          expenseData.systems.systems.materials += expense.amount;
        } else if (expense.category.includes('labor')) {
          expenseData.systems.systems.labor += expense.amount;
        }
      } else if (expense.category.includes('sheathing')) {
        if (expense.category.includes('materials')) {
          expenseData.systems.sheathing.materials += expense.amount;
        } else if (expense.category.includes('labor')) {
          expenseData.systems.sheathing.labor += expense.amount;
        }
      } else if (expense.category.includes('finishings')) {
        if (expense.category.includes('materials')) {
          expenseData.systems.finishings.materials += expense.amount;
        } else if (expense.category.includes('labor')) {
          expenseData.systems.finishings.labor += expense.amount;
        }
      }
    });
    
    return expenseData;
  };
  
  // Create real expense data based on expenses
  const realExpenseData = {
    projects: projects.map((project: any) => ({
      id: project.id,
      name: project.name,
      ...calculateProjectExpenses(project.id)
    }))
  };
  
  if (projectsLoading || tasksLoading || materialsLoading || contactsLoading || expensesLoading) {
    return (
      <Layout>
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold hidden md:block">Dashboard</h2>

          <Carousel className="w-full max-w-5xl mx-auto relative"> {/* Carousel for loading state */}
            <CarouselContent>
              {[1, 2, 3, 4].map((i) => (
                <CarouselItem key={i} className="md:basis-1/2 lg:basis-1/3">
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-5 space-y-3">
                      <div className="flex justify-between items-start">
                        <div className="space-y-2">
                          <div className="h-4 bg-slate-200 rounded w-20"></div>
                          <div className="h-6 bg-slate-200 rounded w-12"></div>
                        </div>
                        <div className="h-10 w-10 bg-slate-200 rounded-lg"></div>
                      </div>
                      <div className="h-4 bg-slate-200 rounded w-32"></div>
                    </CardContent>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="left-0 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full opacity-70 hover:opacity-100 z-10" />
            <CarouselNext className="right-0 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full opacity-70 hover:opacity-100 z-10" />
          </Carousel>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="animate-pulse">
              <CardContent className="p-4 space-y-4">
                <div className="h-6 bg-slate-200 rounded w-1/3"></div>
                <div className="space-y-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="space-y-2">
                      <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                      <div className="h-2 bg-slate-200 rounded w-full"></div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="animate-pulse">
              <CardContent className="p-4 space-y-4">
                <div className="h-6 bg-slate-200 rounded w-1/3"></div>
                <div className="h-60 bg-slate-200 rounded"></div>
              </CardContent>
            </Card>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold hidden md:block">Dashboard</h2>

        {/* Quick Action Buttons */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Button
            variant="outline"
            className="flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 rounded-lg p-4 h-24"
            onClick={() => navigateToTab("tasks")}
          >
            <div className="w-10 h-10 bg-task bg-opacity-10 rounded-full flex items-center justify-center mb-2">
              <Plus className="text-task h-5 w-5" />
            </div>
            <span className="text-sm font-medium">Add Task</span>
          </Button>

          <Button
            variant="outline"
            className="flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 rounded-lg p-4 h-24"
            onClick={activateAllTasks}
          >
            <div className="w-10 h-10 bg-task bg-opacity-10 rounded-full flex items-center justify-center mb-2">
              <Zap className="text-task h-5 w-5" />
            </div>
            <span className="text-sm font-medium">Activate All Tasks</span>
          </Button>

          <Button
            variant="outline"
            className="flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 rounded-lg p-4 h-24"
            onClick={() => navigateToTab("materials")}
          >
            <div className="w-10 h-10 bg-material bg-opacity-10 rounded-full flex items-center justify-center mb-2">
              <Settings className="text-material h-5 w-5" />
            </div>
            <span className="text-sm font-medium">Update Inventory</span>
          </Button>

          <Button
            variant="outline"
            className="flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 rounded-lg p-4 h-24"
            onClick={() => navigateToTab("expenses")}
          >
            <div className="w-10 h-10 bg-expense bg-opacity-10 rounded-full flex items-center justify-center mb-2">
              <DollarSign className="text-expense h-5 w-5" />
            </div>
            <span className="text-sm font-medium">Record Expense</span>
          </Button>

          <Button
            variant="outline"
            className="flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 rounded-lg p-4 h-24"
            onClick={() => navigateToTab("projects")}
          >
            <div className="w-10 h-10 bg-dashboard bg-opacity-10 rounded-full flex items-center justify-center mb-2">
              <ClipboardList className="text-dashboard h-5 w-5" />
            </div>
            <span className="text-sm font-medium">View Reports</span>
          </Button>
        </div>

        {/* Progress and Budget sections have been moved inside each project card */}

        {/* Projects Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Projects</h2>
            <Button className="bg-project hover:bg-blue-600" onClick={handleCreateProject}>
              <Plus className="mr-1 h-4 w-4" />
              Create New Project
            </Button>
          </div>

          <Card className="bg-white">
            <CardContent className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-2.5 text-slate-400 h-4 w-4" />
                <Input
                  placeholder="Search projects..."
                  className="pl-9 pr-4 py-2 border border-slate-300 rounded-lg w-full"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex gap-2 w-full md:w-auto">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="border border-slate-300 rounded-lg">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="on_hold">On Hold</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
                <Select defaultValue="recent">
                  <SelectTrigger className="border border-slate-300 rounded-lg">
                    <SelectValue placeholder="Sort By" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recent">Recent</SelectItem>
                    <SelectItem value="name_asc">Name A-Z</SelectItem>
                    <SelectItem value="budget_high">Budget: High to Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {filteredProjects?.length === 0 ? (
            <div className="text-center py-12">
              <Building className="mx-auto h-12 w-12 text-slate-300" />
              <h3 className="mt-4 text-lg font-medium text-slate-900">No projects found</h3>
              <p className="mt-2 text-sm text-slate-500">Get started by creating a new project</p>
              <Button className="mt-4 bg-project hover:bg-blue-600" onClick={handleCreateProject}>
                <Plus className="mr-1 h-4 w-4" />
                Create New Project
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <Carousel className="w-full max-w-5xl mx-auto relative"> {/* Carousel for projects */}
                <CarouselContent>
                  {filteredProjects.slice(0, showAllProjects ? undefined : 3).map((project: any) => {
                    // Get tasks for this project
                    const projectTasks = tasks.filter((task: any) => task.projectId === project.id);
                    
                    // Get the project progress data
                    const projectProgress = projectTier1Progress[project.id] || {
                      structural: 0,
                      systems: 0,
                      sheathing: 0,
                      finishings: 0
                    };

                    // Create task object that matches TaskAttachments interface requirements
                    const projectForTasks = {
                      id: project.id,
                      title: project.name,
                      description: project.description || undefined,
                      status: project.status,
                      startDate: project.startDate,
                      endDate: project.endDate,
                      projectId: project.id,
                      category: "project",
                      completed: project.status === "completed",
                      contactIds: Array.from(new Set(
                        projectTasks
                          .filter((task: any) => task.contactIds)
                          .flatMap((task: any) => Array.isArray(task.contactIds) ? task.contactIds : [])
                      )),
                      materialIds: Array.from(new Set(
                        projectTasks
                          .filter((task: any) => task.materialIds)
                          .flatMap((task: any) => Array.isArray(task.materialIds) ? task.materialIds : [])
                      ))
                    };

                    return (
                      <CarouselItem key={project.id} className="md:basis-1/2 lg:basis-1/2">
                        <div className="space-y-3">
                          {/* Project Card */}
                          <Card
                            key={`card-${project.id}`}
                            className={`border-l-4 ${getProjectColor(project.id)} shadow-sm hover:shadow transition-shadow duration-200`}
                          >
                            <CardHeader className="p-4 pb-2">
                              <div className="flex justify-between items-start">
                                <div className="flex items-center">
                                  <CardTitle className="text-base font-semibold">{project.name}</CardTitle>
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigate(`/projects/${project.id}`);
                                    }}
                                    className="ml-2 p-1 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                                    title="View project details"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                                      <polyline points="15 3 21 3 21 9"></polyline>
                                      <line x1="10" y1="14" x2="21" y2="3"></line>
                                    </svg>
                                  </button>
                                </div>
                                <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusBgColor(project.status)}`}>
                                  {project.status.replace('_', ' ')}
                                </span>
                              </div>
                            </CardHeader>
                            <CardContent className="p-4 pt-0">
                              <div className="flex items-center text-sm text-muted-foreground mt-1">
                                <MapPin className="h-4 w-4 mr-1" />
                                {project.location || "No location specified"}
                              </div>
                              <div className="flex items-center text-sm text-muted-foreground mt-1">
                                <Calendar className="h-4 w-4 mr-1" />
                                {formatDate(project.startDate)} - {formatDate(project.endDate)}
                              </div>
                              
                              {/* Display labor/contacts for this project */}
                              <ProjectLabor projectId={project.id} />

                              {/* Integrated Project Progress Chart */}
                              <div className="mt-3 pt-2 border-t border-slate-100">
                                <ProjectProgressChart
                                  key={`progress-${project.id}`}
                                  projectId={project.id}
                                  projectName={project.name}
                                  progress={projectProgress}
                                  expanded={false}
                                  className="mt-0"
                                />
                              </div>

                              {/* Integrated Expense Overview */}
                              <div className="mt-3 pt-2 border-t border-slate-100">
                                <ProjectBudgetCompactChart
                                  key={`expense-${project.id}`}
                                  projectId={project.id}
                                  projectName={project.name}
                                  budget={{
                                    // Find the project in realExpenseData to use actual expense data
                                    materials: realExpenseData.projects.find(p => p.id === project.id)?.materials || 0,
                                    labor: realExpenseData.projects.find(p => p.id === project.id)?.labor || 0,
                                    // Use real expense data for systems if available
                                    systems: realExpenseData.projects.find(p => p.id === project.id)?.systems || {
                                      structural: { materials: 0, labor: 0 },
                                      systems: { materials: 0, labor: 0 },
                                      sheathing: { materials: 0, labor: 0 },
                                      finishings: { materials: 0, labor: 0 }
                                    }
                                  }}
                                  expanded={false}
                                  className="mt-0"
                                />
                              </div>

                              {/* Display project contacts using TaskAttachments */}
                              <TaskAttachments task={projectForTasks} className="mt-2" />
                              
                              {/* Display project labor */}
                              <ProjectLabor projectId={project.id} className="mt-2" />
                              
                              {/* Display project materials */}
                              <TaskMaterialsView task={projectForTasks} compact={true} className="mt-2" />
                            </CardContent>
                          </Card>
                        </div>
                      </CarouselItem>
                    );
                  })}
                </CarouselContent>
                <CarouselPrevious className="left-0 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full opacity-70 hover:opacity-100 z-10" />
                <CarouselNext className="right-0 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full opacity-70 hover:opacity-100 z-10" />
              </Carousel>

              {filteredProjects && filteredProjects.length > 3 && (
                <div className="flex justify-center mt-6">
                  <Button
                    variant="outline"
                    onClick={() => setShowAllProjects(!showAllProjects)}
                    className="flex items-center gap-1"
                  >
                    {showAllProjects ? (
                      <>Show Less <ChevronDown className="h-4 w-4" /></>
                    ) : (
                      <>Show More <ChevronRight className="h-4 w-4" /></>
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Dashboard Widgets */}
        <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
          {/* Upcoming Deadlines */}
          <Card className="bg-white">
            <CardHeader className="border-b border-slate-200 p-4">
              <CardTitle className="font-medium">Upcoming Deadlines</CardTitle>
            </CardHeader>
            <CardContent className="p-0 divide-y divide-slate-200">
              {upcomingDeadlines?.length === 0 ? (
                <div className="p-4 text-center">
                  <p className="text-slate-500">No upcoming deadlines</p>
                </div>
              ) : (
                upcomingDeadlines.map((task: any) => {
                  const daysLeft = getDaysLeft(task.endDate);
                  return (
                    <div key={task.id} className="p-4 flex justify-between items-center">
                      <div>
                        <h4 className="font-medium">{task.title}</h4>
                        <p className="text-sm text-slate-500 mt-1">{getProjectName(task.projectId)}</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-medium ${getDeadlineColor(daysLeft)}`}>
                          {formatDate(task.endDate)}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          {daysLeft < 0 ? "Overdue" : `${daysLeft} days left`}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>

        {/* Project Creation Dialog */}
        <CreateProjectDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />
      </div>
    </Layout>
  );
}