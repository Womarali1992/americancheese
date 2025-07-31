import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/ui/status-badge";
import { ProgressBar } from "@/components/charts/ProgressBar";
import { Button } from "@/components/ui/button";
import { BudgetChart } from "@/components/charts/BudgetChart";
import { GanttChart } from "@/components/charts/GanttChartNew";
import { VintageGanttChart } from "@/components/charts/VintageGanttChart";
import { formatDate, formatCurrency } from "@/lib/utils";
import { AvatarGroup } from "@/components/ui/avatar-group";
import { DataTable } from "@/components/ui/data-table";
import { TasksTabView } from "@/components/project/TasksTabView";
import { ResourcesTab } from "@/components/project/ResourcesTab";
import { CategoryProgressList } from "@/components/project/CategoryProgressList";
import { 
  Building, 
  Calendar, 
  MapPin, 
  Clock, 
  Users, 
  ArrowLeft,
  Clipboard, 
  DollarSign, 
  Package,
  Plus,
  ListTodo,
  Settings
} from "lucide-react";
import { CreateTaskDialog } from "@/pages/tasks/CreateTaskDialog";
import { EditProjectDialog } from "./EditProjectDialog";
import { ProjectThemeSettings } from "@/components/theme/project-theme-settings";
import { ProjectDescriptionEditor } from "@/components/project/ProjectDescriptionEditor";

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
  
  const isLoading = isLoadingProject || isLoadingTasks || isLoadingExpenses || isLoadingMaterials;
  
  // Filter tasks based on hidden categories
  const hiddenCategories = project?.hiddenCategories || [];
  const filteredTasks = tasks?.filter(task => {
    // Skip tasks with hidden tier1 categories
    const tier1 = task.tier1Category?.toLowerCase();
    if (tier1 && hiddenCategories.includes(tier1)) {
      return false;
    }
    return true;
  }) || [];
  
  // Process tasks for Gantt chart - only show filtered tasks
  const ganttTasks = filteredTasks.map(task => ({
    id: task.id,
    title: task.title,
    description: task.description,
    startDate: new Date(task.startDate),
    endDate: new Date(task.endDate),
    status: task.status,
    assignedTo: task.assignedTo,
    category: task.category,
    contactIds: task.contactIds,
    materialIds: task.materialIds,
    durationDays: Math.ceil((new Date(task.endDate).getTime() - new Date(task.startDate).getTime()) / (1000 * 60 * 60 * 24))
  })) || [];
  
  // Calculate project progress based on filtered tasks
  const calculateTier1Progress = () => {
    // Group tasks by tier1Category
    const tasksByTier1 = filteredTasks.reduce((acc, task) => {
      if (!task.tier1Category) return acc;
      
      // Create a standardized category name
      const tier1 = task.tier1Category.toLowerCase();
      
      if (!acc[tier1]) {
        acc[tier1] = [];
      }
      acc[tier1].push(task);
      return acc;
    }, {} as Record<string, any[]>);
    
    // Calculate completion percentage for each tier
    const progressByTier: Record<string, number> = {
      structural: 0,
      systems: 0, 
      sheathing: 0,
      finishings: 0
    };
    
    // Process each tier1 category
    Object.keys(progressByTier).forEach(tier => {
      // Skip hidden categories
      if (hiddenCategories.includes(tier)) {
        delete progressByTier[tier];
        return;
      }
      
      const tierTasks = tasksByTier1[tier] || [];
      const totalTasks = tierTasks.length;
      
      // Check both the completed flag and status field
      const completedTasks = tierTasks.filter(task => 
        task.completed === true || task.status === 'completed'
      ).length;
      
      progressByTier[tier] = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    });
    
    // Calculate overall progress based on visible categories
    const visibleCategories = Object.keys(progressByTier);
    if (visibleCategories.length === 0) return 0;
    
    const totalProgress = visibleCategories.reduce(
      (sum, tier) => sum + progressByTier[tier], 0
    ) / visibleCategories.length;
    
    return Math.round(totalProgress);
  };
  
  // Calculate the project progress based on filtered tasks
  const calculatedProgress = calculateTier1Progress();
  
  // Process budget data
  const totalBudget = 100000; // This would ideally come from the project data
  const totalExpenses = expenses?.reduce((acc, expense) => acc + expense.amount, 0) || 0;
  const materialCosts = expenses?.filter(expense => expense.category === "materials")
    .reduce((acc, expense) => acc + expense.amount, 0) || 0;
  const laborCosts = expenses?.filter(expense => expense.category === "labor")
    .reduce((acc, expense) => acc + expense.amount, 0) || 0;
  
  const budgetData = {
    spent: totalExpenses,
    remaining: totalBudget - totalExpenses,
    materials: materialCosts,
    labor: laborCosts
  };
  
  // Task columns for data table
  const taskColumns = [
    { header: "Title", accessorKey: "title" },
    { 
      header: "Status", 
      accessorKey: "status",
      cell: (task) => <StatusBadge status={task.status} />
    },
    { 
      header: "Start Date", 
      accessorKey: "startDate",
      cell: (task) => formatDate(task.startDate)
    },
    { 
      header: "End Date", 
      accessorKey: "endDate",
      cell: (task) => formatDate(task.endDate)
    },
    { 
      header: "Assignee", 
      accessorKey: "assignedTo",
      cell: (task) => task.assignedTo || "-"
    }
  ];
  
  // Expense columns for data table
  const expenseColumns = [
    { header: "Description", accessorKey: "description" },
    { 
      header: "Amount", 
      accessorKey: "amount",
      cell: (expense) => formatCurrency(expense.amount)
    },
    { 
      header: "Date", 
      accessorKey: "date",
      cell: (expense) => formatDate(expense.date)
    },
    { 
      header: "Category", 
      accessorKey: "category",
      cell: (expense) => expense.category
    }
  ];
  
  // Material columns for data table
  const materialColumns = [
    { header: "Name", accessorKey: "name" },
    { header: "Type", accessorKey: "type" },
    { 
      header: "Quantity", 
      accessorKey: "quantity",
      cell: (material) => material.quantity
    },
    { 
      header: "Status", 
      accessorKey: "status",
      cell: (material) => <StatusBadge status={material.status} />
    },
    { 
      header: "Supplier", 
      accessorKey: "supplier",
      cell: (material) => material.supplier || "-"
    }
  ];
  
  // Handle back button
  const handleBack = () => {
    setLocation("/projects");
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
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={handleBack} className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-2xl font-semibold">{project.name}</h2>
            <StatusBadge status={project.status} />
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline"
              onClick={() => setShowEditProjectDialog(true)}
            >
              Edit Project
            </Button>
            <a 
              href={`/tasks?projectId=${projectId}`}
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-green-600 hover:bg-green-700 text-white h-10 px-4 py-2 gap-2"
            >
              <ListTodo className="h-4 w-4" />
              Manage Tasks
            </a>
            <Button 
              variant="outline"
              onClick={async () => {
                try {
                  const response = await fetch(`/api/projects/${projectId}/create-tasks-from-templates`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    }
                  });
                  
                  if (!response.ok) {
                    throw new Error('Failed to create tasks from templates');
                  }
                  
                  const result = await response.json();
                  console.log('Created tasks:', result);
                  
                  // Refresh tasks data
                  queryClient.invalidateQueries({ 
                    queryKey: ["/api/projects", projectId, "tasks"] 
                  });
                  
                  alert(`Successfully created ${result.createdTasks.length} tasks from templates`);
                } catch (error) {
                  console.error('Error creating tasks from templates:', error);
                  alert('Failed to create tasks from templates');
                }
              }}
            >
              <ListTodo className="h-4 w-4 mr-2" /> Generate All Tasks
            </Button>
            <Button 
              variant="outline" 
              className="border-amber-200 hover:bg-amber-50"
              onClick={async () => {
                try {
                  const response = await fetch(`/api/projects/${projectId}/load-standard-templates`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    }
                  });
                  
                  if (!response.ok) {
                    throw new Error('Failed to load standard templates');
                  }
                  
                  const result = await response.json();
                  console.log('Loaded templates:', result);
                  
                  // Refresh project data
                  queryClient.invalidateQueries({ 
                    queryKey: ["/api/projects", projectId] 
                  });
                  
                  alert('Standard templates loaded successfully');
                } catch (error) {
                  console.error('Error loading standard templates:', error);
                  alert('Failed to load standard templates');
                }
              }}
            >
              <Building className="h-4 w-4 mr-2" /> Load Templates
            </Button>
            <Button 
              className="bg-project hover:bg-blue-600"
              onClick={() => {
                setShowTaskDialog(true);
              }}
            >
              <Plus className="h-4 w-4 mr-2" /> Add Task
            </Button>
          </div>
        </div>
        
        {/* Project Overview Card */}
        <Card className="bg-white">
          <CardContent className="p-6">
            <div>
              <h3 className="text-lg font-medium mb-4">Project Overview</h3>
              
              {/* Project Description Editor */}
              <div className="mb-6">
                <ProjectDescriptionEditor project={project} />
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="flex items-start gap-2">
                  <MapPin className="text-slate-400 h-5 w-5 mt-0.5" />
                  <div>
                    <p className="text-sm text-slate-500">Location</p>
                    <p className="font-medium">{project.location}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Calendar className="text-slate-400 h-5 w-5 mt-0.5" />
                  <div>
                    <p className="text-sm text-slate-500">Start Date</p>
                    <p className="font-medium">{formatDate(project.startDate)}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Clock className="text-slate-400 h-5 w-5 mt-0.5" />
                  <div>
                    <p className="text-sm text-slate-500">End Date</p>
                    <p className="font-medium">{formatDate(project.endDate)}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Users className="text-slate-400 h-5 w-5 mt-0.5" />
                  <div>
                    <p className="text-sm text-slate-500">Team</p>
                    <AvatarGroup users={mockUsers} max={3} size="sm" />
                  </div>
                </div>
              </div>
              
              <div className="mt-4">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-sm font-medium">Overall Progress</p>
                  <p className="text-sm text-slate-500">{calculatedProgress}%</p>
                </div>
                <ProgressBar 
                  value={calculatedProgress} 
                  color={
                    project.status === "completed" ? "brown" : 
                    project.status === "on_hold" ? "taupe" : 
                    project.status === "active" ? "teal" : 
                    project.status === "delayed" ? "slate" : "blue"
                  }
                  className="mb-2"
                />
                
                {/* Category-level progress - respects hidden categories */}
                <div className="mt-6">
                  <h4 className="text-sm font-medium mb-3">Progress by Category</h4>
                  <CategoryProgressList 
                    tasks={tasks || []} 
                    hiddenCategories={hiddenCategories} 
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Project Budget Overview Card */}
        <Card className="bg-white">
          <CardContent className="p-6">
            <h3 className="text-lg font-medium mb-4">Project Budget Overview</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="col-span-2">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  {/* New styled budget cards */}
                  <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-3 rounded-lg border border-slate-200">
                    <div className="flex items-center mb-1">
                      <div className="w-2 h-2 rounded-full bg-blue-500 mr-2"></div>
                      <p className="text-xs text-slate-600 font-medium uppercase tracking-wide">Total Budget</p>
                    </div>
                    <p className="text-lg font-bold text-slate-800">{formatCurrency(project.budget || totalBudget)}</p>
                  </div>
                  
                  <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-3 rounded-lg border border-orange-200">
                    <div className="flex items-center mb-1">
                      <div className="w-2 h-2 rounded-full bg-orange-500 mr-2"></div>
                      <p className="text-xs text-orange-800 font-medium uppercase tracking-wide">Materials</p>
                    </div>
                    <p className="text-lg font-bold text-orange-800">
                      {formatCurrency(materialCosts)}
                    </p>
                  </div>
                  
                  <div className="bg-gradient-to-br from-[#f5f2f4] to-[#e8e2e5] p-3 rounded-lg border border-[#d8d2d6]">
                    <div className="flex items-center mb-1">
                      <div className="w-2 h-2 rounded-full bg-[#635158] mr-2"></div>
                      <p className="text-xs text-[#635158] font-medium uppercase tracking-wide">Labor</p>
                    </div>
                    <p className="text-lg font-bold text-[#635158]">
                      {formatCurrency(laborCosts)}
                    </p>
                  </div>
                  
                  <div className="bg-gradient-to-br from-green-50 to-green-100 p-3 rounded-lg border border-green-200">
                    <div className="flex items-center mb-1">
                      <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                      <p className="text-xs text-green-800 font-medium uppercase tracking-wide">Spent Total</p>
                    </div>
                    <p className="text-lg font-bold text-green-800">{formatCurrency(totalExpenses)}</p>
                  </div>
                  
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-3 rounded-lg border border-purple-200">
                    <div className="flex items-center mb-1">
                      <div className="w-2 h-2 rounded-full bg-purple-500 mr-2"></div>
                      <p className="text-xs text-purple-800 font-medium uppercase tracking-wide">Remaining</p>
                    </div>
                    <p className="text-lg font-bold text-purple-800">{formatCurrency((project.budget || totalBudget) - totalExpenses)}</p>
                  </div>
                  
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-3 rounded-lg border border-blue-200">
                    <div className="flex items-center mb-1">
                      <div className="w-2 h-2 rounded-full bg-blue-500 mr-2"></div>
                      <p className="text-xs text-blue-800 font-medium uppercase tracking-wide">Other Expenses</p>
                    </div>
                    <p className="text-lg font-bold text-blue-800">
                      {formatCurrency(totalExpenses - materialCosts - laborCosts)}
                    </p>
                  </div>
                  
                  <div className="bg-slate-50 p-4 rounded-lg md:col-span-3">
                    <div className="flex justify-between items-center mb-1">
                      <p className="text-xs text-slate-500 font-medium">Budget Utilization</p>
                      <p className="text-xs font-bold text-slate-700">
                        {Math.min(
                          Math.max(
                            Math.round(totalExpenses / (project.budget || totalBudget) * 100),
                            0
                          ), 
                          100
                        )}%
                      </p>
                    </div>
                    <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${Math.round(totalExpenses / (project.budget || totalBudget) * 100) > 90 ? "bg-orange-500" : "bg-teal-500"}`}
                        style={{ 
                          width: `${Math.min(
                            Math.max(
                              Math.round(totalExpenses / (project.budget || totalBudget) * 100), 
                              0
                            ), 
                            100
                          )}%`
                        }}
                      >
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <div className="h-48">
                  <BudgetChart data={budgetData} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Tabs for Tasks, Budget, Materials */}
        <Tabs defaultValue="timeline" className="space-y-4">
          <TabsList className="grid grid-cols-4 md:w-auto">
            <TabsTrigger 
              value="timeline" 
              className="flex items-center gap-2 data-[state=active]:bg-project data-[state=active]:text-white"
            >
              <Calendar className="h-4 w-4" /><span className="hidden md:inline">Timeline</span>
            </TabsTrigger>
            <TabsTrigger 
              value="tasks" 
              className="flex items-center gap-2 data-[state=active]:bg-task data-[state=active]:text-white"
            >
              <Clipboard className="h-4 w-4" /><span className="hidden md:inline">Tasks</span>
            </TabsTrigger>
            <TabsTrigger 
              value="expenses" 
              className="flex items-center gap-2 data-[state=active]:bg-expense data-[state=active]:text-white"
            >
              <DollarSign className="h-4 w-4" /><span className="hidden md:inline">Expenses</span>
            </TabsTrigger>
            <TabsTrigger 
              value="materials" 
              className="flex items-center gap-2 data-[state=active]:bg-material data-[state=active]:text-white"
            >
              <Package className="h-4 w-4" /><span className="hidden md:inline">Materials</span>
            </TabsTrigger>
            <TabsTrigger 
              value="settings" 
              className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-white"
            >
              <Settings className="h-4 w-4" /><span className="hidden md:inline">Settings</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="timeline" className="pt-4">
            <Card className="bg-white">
              <CardHeader className="border-b border-slate-100 pb-2">
                <CardTitle className="text-lg font-medium">Project Timeline</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="h-[500px]">
                  {ganttTasks.length > 0 ? (
                    <div className="relative">
                      {/* Add Button for adding new tasks */}
                      <div className="absolute top-0 right-0 z-10">
                        <Button 
                          className="bg-green-600 hover:bg-green-700 text-white"
                          size="sm"
                          onClick={() => {
                            setShowTaskDialog(true);
                          }}
                        >
                          <Plus className="h-4 w-4 mr-2" /> Add Task
                        </Button>
                      </div>
                      
                      {/* Vintage Gantt Chart */}
                      <VintageGanttChart 
                        tasks={ganttTasks.map(task => ({
                          ...task,
                          tier1Category: task.category || '',
                          tier2Category: task.category || ''
                        }))}
                        title={`${project.name} Timeline`}
                        subtitle="project tasks schedule"
                        projectId={projectId}
                        backgroundClass="bg-amber-50"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-slate-500">No tasks to display</p>
                      <Button 
                        className="ml-2 bg-project hover:bg-blue-600 text-white"
                        size="sm"
                        onClick={() => {
                          setShowTaskDialog(true);
                        }}
                      >
                        <Plus className="h-4 w-4 mr-2" /> Add Task
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="tasks" className="pt-4">
            <TasksTabView 
              tasks={tasks || []} 
              projectId={projectId} 
              project={project}
              onAddTask={() => setShowTaskDialog(true)} 
            />
          </TabsContent>
          
          <TabsContent value="expenses" className="pt-4">
            <Card className="bg-white">
              <CardHeader className="border-b border-slate-100 pb-2 flex flex-row justify-between">
                <CardTitle className="text-lg font-medium">Expenses</CardTitle>
                <Button className="bg-expense hover:bg-amber-600">Add Expense</Button>
              </CardHeader>
              <CardContent className="p-4">
                {expenses?.length > 0 ? (
                  <DataTable 
                    columns={expenseColumns} 
                    data={expenses} 
                  />
                ) : (
                  <div className="text-center py-8">
                    <DollarSign className="mx-auto h-8 w-8 text-slate-300" />
                    <p className="mt-2 text-slate-500">No expenses found</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="materials" className="pt-4">
            <ResourcesTab projectId={projectId} />
          </TabsContent>
          
          <TabsContent value="settings" className="pt-4">
            <Card className="bg-white">
              <CardHeader className="border-b border-slate-100 pb-2">
                <CardTitle className="text-lg font-medium">Project Settings</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-medium mb-3">Theme Settings</h3>
                    <ProjectThemeSettings projectId={projectId} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        {/* Upcoming Deadlines Section */}
        <Card className="overflow-hidden border-slate-200 bg-white shadow-sm hover:shadow-md transition-all duration-200 rounded-xl relative border-l-4 border-l-amber-500 w-full mt-6">
          <CardHeader className="p-4 bg-gradient-to-r from-amber-500 to-amber-600 border-b border-amber-700">
            <CardTitle className="text-lg font-semibold text-white">Upcoming Deadlines</CardTitle>
          </CardHeader>
          <CardContent className="p-0 divide-y divide-slate-200">
            {filteredTasks.filter(task => !task.completed).length === 0 ? (
              <div className="p-6 text-center">
                <Calendar className="h-12 w-12 mx-auto text-slate-300 mb-2" />
                <p className="text-slate-600 font-medium">No upcoming deadlines</p>
                <p className="text-xs text-slate-400 mt-1">All tasks are currently on schedule</p>
              </div>
            ) : (
              filteredTasks
                .filter(task => !task.completed)
                .sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime())
                .slice(0, 4)
                .map((task) => {
                  const daysLeft = Math.ceil((new Date(task.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
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
                          <p className="text-sm text-slate-500 mt-1">Due Date: {formatDate(task.endDate)}</p>
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
        
        {/* Expenses & Budget Section */}
        <Card className="overflow-hidden border-slate-200 bg-white shadow-sm hover:shadow-md transition-all duration-200 rounded-xl relative border-l-4 border-l-green-600 mt-6">
          <CardHeader className="p-4 bg-gradient-to-r from-green-600 to-green-500 border-b border-green-700">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg font-semibold text-white">Expenses & Budget</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                <p className="text-xs font-medium text-slate-500 uppercase mb-1">Total Budget</p>
                <p className="text-2xl font-semibold text-slate-800">{formatCurrency(project.budget || 0)}</p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                <p className="text-xs font-medium text-slate-500 uppercase mb-1">Total Spent</p>
                <p className="text-2xl font-semibold text-green-600">{formatCurrency(totalExpenses)}</p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                <p className="text-xs font-medium text-slate-500 uppercase mb-1">Remaining</p>
                <p className="text-2xl font-semibold text-blue-600">{formatCurrency((project.budget || 0) - totalExpenses)}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              {/* Materials vs Labor Breakdown */}
              <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                <h4 className="text-sm font-medium text-slate-700 mb-4">Expenses by Category</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                      <span className="text-sm text-slate-600">Materials</span>
                    </div>
                    <span className="text-sm font-medium">{formatCurrency(materialCosts)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-amber-500 mr-2"></div>
                      <span className="text-sm text-slate-600">Labor</span>
                    </div>
                    <span className="text-sm font-medium">{formatCurrency(laborCosts)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-gray-300 mr-2"></div>
                      <span className="text-sm text-slate-600">Other</span>
                    </div>
                    <span className="text-sm font-medium">{formatCurrency(totalExpenses - materialCosts - laborCosts)}</span>
                  </div>
                </div>
              </div>
              
              {/* Budget Progress */}
              <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                <h4 className="text-sm font-medium text-slate-700 mb-4">Budget Utilization</h4>
                <div className="mb-2 flex justify-between items-center">
                  <span className="text-sm text-slate-600">Progress</span>
                  <span className="text-sm font-medium">
                    {project.budget ? Math.round((totalExpenses / project.budget) * 100) : 0}%
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 mb-4">
                  <div 
                    className="bg-green-600 h-2.5 rounded-full" 
                    style={{ width: `${project.budget ? Math.min(Math.round((totalExpenses / project.budget) * 100), 100) : 0}%` }}
                  ></div>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  {project.budget && totalExpenses > project.budget 
                    ? "This project is over budget." 
                    : "Budget is on track."}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Task Creation Dialog */}
        <CreateTaskDialog 
          open={showTaskDialog}
          onOpenChange={setShowTaskDialog}
          projectId={projectId}
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
      </div>
    </Layout>
  );
}