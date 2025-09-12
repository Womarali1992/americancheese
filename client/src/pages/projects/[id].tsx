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
import { CategoryDescriptionList } from "@/components/project/CategoryDescriptionList";
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
  Settings,
  Wand2
} from "lucide-react";
import { CreateTaskDialog } from "@/pages/tasks/CreateTaskDialog";
import { EditProjectDialog } from "./EditProjectDialog";
import { ProjectThemeSelector } from "@/components/project/ProjectThemeSelector";
import { ProjectDescriptionEditor } from "@/components/project/ProjectDescriptionEditor";
import { useProjectTheme } from "@/hooks/useProjectTheme";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { getPresetOptions } from "@shared/presets";

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
  const [replaceExistingTasks, setReplaceExistingTasks] = useState(false);
  const { theme: projectTheme, themeName } = useProjectTheme(projectId);
  
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
  
  // Get project styling based on theme and status
  const getProjectCardStyle = (status: string) => {
    if (!projectTheme) return { background: '#556b2f' };
    
    if (status === "completed") {
      return { background: `linear-gradient(135deg, #22c55e, #16a34a)` };
    } else if (status === "on_hold") {
      return { background: `linear-gradient(135deg, #6b7280, #4b5563)` };
    } else {
      return { background: `linear-gradient(135deg, ${projectTheme.primary}, ${projectTheme.secondary})` };
    }
  };

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
                <span className="text-sm text-muted-foreground">{formatDate(project.startDate)} - {formatDate(project.endDate)}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
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

            <Card>
              <CardContent className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Project Categories</h3>
                  <span className="text-sm text-muted-foreground">Overview</span>
                </div>
                <CategoryDescriptionList 
                  projectId={projectId}
                  hiddenCategories={hiddenCategories} 
                />
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
              Tasks
            </TabsTrigger>
            <TabsTrigger value="timeline" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Timeline
            </TabsTrigger>
            <TabsTrigger value="resources" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Resources
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>
          
          
          <TabsContent value="tasks" className="space-y-0">
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
                <div className="h-[500px]">
                  {ganttTasks.length > 0 ? (
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
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
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
            <ResourcesTab projectId={projectId} />
          </TabsContent>
          
          <TabsContent value="settings" className="space-y-0">
            <Card>
              <CardHeader>
                <CardTitle>Project Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <ProjectThemeSelector 
                    projectId={projectId} 
                    currentTheme={themeName}
                    onThemeChange={() => {
                      // Theme change is handled internally by the selector
                    }}
                  />
                </div>
                
                <div className="border-t pt-6">
                  <h3 className="text-sm font-medium mb-4">Project Presets & Templates</h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">Current preset:</span>
                      <span className="font-medium">{project.presetId}</span>
                    </div>
                    
                    <div className="flex flex-col gap-3">
                      <div className="flex gap-2">
                        <Select onValueChange={async (presetId) => {
                          try {
                            const response = await fetch(`/api/projects/${projectId}/create-tasks-from-preset-templates`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ presetId, replaceExisting: replaceExistingTasks })
                            });
                            if (!response.ok) throw new Error('Failed to load templates');
                            const result = await response.json();
                            queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "tasks"] });
                            alert(`Created ${result.createdTasks ? result.createdTasks.length : 0} tasks from ${result.presetName || presetId} preset`);
                          } catch (error) {
                            alert('Failed to load templates');
                          }
                        }}>
                          <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="Load preset templates..." />
                          </SelectTrigger>
                          <SelectContent>
                            {getPresetOptions().map(preset => (
                              <SelectItem key={preset.value} value={preset.value}>
                                <div className="flex flex-col">
                                  <span className="font-medium">{preset.label}</span>
                                  <span className="text-xs text-muted-foreground">{preset.description}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        
                        <Button 
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            try {
                              const response = await fetch(`/api/projects/${projectId}/load-preset-categories`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ presetId: project.presetId })
                              });
                              if (!response.ok) throw new Error('Failed to load preset');
                              queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId] });
                              alert('Preset categories loaded successfully');
                            } catch (error) {
                              alert('Failed to load preset categories');
                            }
                          }}
                        >
                          <Building className="h-4 w-4 mr-2" /> Load Categories
                        </Button>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="replace-tasks" 
                          checked={replaceExistingTasks}
                          onCheckedChange={setReplaceExistingTasks}
                        />
                        <label 
                          htmlFor="replace-tasks" 
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          Replace existing tasks when loading templates
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="border-t pt-6">
                  <h3 className="text-sm font-medium mb-3">Quick Actions</h3>
                  <div className="flex flex-col gap-4">
                    
                    <div className="flex flex-wrap gap-2">
                    
                    <Button 
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        try {
                          const response = await fetch(`/api/projects/${projectId}/create-tasks-from-templates`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' }
                          });
                          if (!response.ok) throw new Error('Failed to create tasks');
                          const result = await response.json();
                          queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "tasks"] });
                          alert(`Created ${result.createdTasks ? result.createdTasks.length : 0} tasks`);
                        } catch (error) {
                          alert('Failed to create tasks');
                        }
                      }}
                    >
                      <ListTodo className="h-4 w-4 mr-2" /> Generate All Tasks
                    </Button>
                    
                    <a 
                      href={`/tasks?projectId=${projectId}`}
                      className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium h-9 px-3 border border-input bg-background hover:bg-accent hover:text-accent-foreground"
                    >
                      <ListTodo className="h-4 w-4 mr-2" /> Manage Tasks
                    </a>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        
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