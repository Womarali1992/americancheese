import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/ui/status-badge";
import { ProgressBar } from "@/components/charts/ProgressBar";
import { Button } from "@/components/ui/button";
import { BudgetChart } from "@/components/charts/BudgetChart";
import { GanttChart } from "@/components/charts/GanttChart";
import { formatDate, formatCurrency } from "@/lib/utils";
import { AvatarGroup } from "@/components/ui/avatar-group";
import { DataTable } from "@/components/ui/data-table";
import { 
  Building, 
  Calendar, 
  MapPin, 
  Clock, 
  Users, 
  ArrowLeft,
  Clipboard, 
  DollarSign, 
  Package
} from "lucide-react";

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
  
  // Process tasks for Gantt chart
  const ganttTasks = tasks?.map(task => ({
    id: task.id,
    title: task.title,
    startDate: new Date(task.startDate),
    endDate: new Date(task.dueDate),
    status: task.status,
    durationDays: Math.ceil((new Date(task.dueDate).getTime() - new Date(task.startDate).getTime()) / (1000 * 60 * 60 * 24))
  })) || [];
  
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
      header: "Due Date", 
      accessorKey: "dueDate",
      cell: (task) => formatDate(task.dueDate)
    },
    { 
      header: "Assignee", 
      accessorKey: "assignee",
      cell: () => <AvatarGroup users={[mockUsers[0]]} max={1} size="sm" />
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
            <Button variant="outline">Edit Project</Button>
            <Button className="bg-project hover:bg-blue-600">Add Task</Button>
          </div>
        </div>
        
        {/* Project Overview Card */}
        <Card className="bg-white">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="col-span-2">
                <h3 className="text-lg font-medium mb-2">Project Overview</h3>
                {project.description && (
                  <p className="text-slate-600 mb-4">{project.description}</p>
                )}
                
                <div className="grid grid-cols-2 gap-4 mb-4">
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
                    <p className="text-sm font-medium">Progress</p>
                    <p className="text-sm text-slate-500">{project.progress}%</p>
                  </div>
                  <ProgressBar value={project.progress} />
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-4">Budget Overview</h3>
                <div className="h-40">
                  <BudgetChart data={budgetData} />
                </div>
                <div className="mt-4 grid grid-cols-2 gap-4 text-center">
                  <div>
                    <p className="text-sm text-slate-500">Total Budget</p>
                    <p className="font-medium">{formatCurrency(totalBudget)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Spent</p>
                    <p className="font-medium">{formatCurrency(totalExpenses)}</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Tabs for Tasks, Budget, Materials */}
        <Tabs defaultValue="timeline" className="space-y-4">
          <TabsList className="grid grid-cols-4 md:w-auto">
            <TabsTrigger value="timeline" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" /><span className="hidden md:inline">Timeline</span>
            </TabsTrigger>
            <TabsTrigger value="tasks" className="flex items-center gap-2">
              <Clipboard className="h-4 w-4" /><span className="hidden md:inline">Tasks</span>
            </TabsTrigger>
            <TabsTrigger value="expenses" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" /><span className="hidden md:inline">Expenses</span>
            </TabsTrigger>
            <TabsTrigger value="materials" className="flex items-center gap-2">
              <Package className="h-4 w-4" /><span className="hidden md:inline">Materials</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="timeline" className="pt-4">
            <Card className="bg-white">
              <CardHeader className="border-b border-slate-100 pb-2">
                <CardTitle className="text-lg font-medium">Project Timeline</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="h-80">
                  {ganttTasks.length > 0 ? (
                    <GanttChart tasks={ganttTasks} />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-slate-500">No tasks to display</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="tasks" className="pt-4">
            <Card className="bg-white">
              <CardHeader className="border-b border-slate-100 pb-2 flex flex-row justify-between">
                <CardTitle className="text-lg font-medium">Tasks</CardTitle>
                <Button className="bg-task hover:bg-blue-600">Add Task</Button>
              </CardHeader>
              <CardContent className="p-4">
                {tasks?.length > 0 ? (
                  <DataTable 
                    columns={taskColumns} 
                    data={tasks} 
                  />
                ) : (
                  <div className="text-center py-8">
                    <Clipboard className="mx-auto h-8 w-8 text-slate-300" />
                    <p className="mt-2 text-slate-500">No tasks found</p>
                  </div>
                )}
              </CardContent>
            </Card>
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
            <Card className="bg-white">
              <CardHeader className="border-b border-slate-100 pb-2 flex flex-row justify-between">
                <CardTitle className="text-lg font-medium">Materials</CardTitle>
                <Button className="bg-material hover:bg-green-600">Add Material</Button>
              </CardHeader>
              <CardContent className="p-4">
                {materials?.length > 0 ? (
                  <DataTable 
                    columns={materialColumns} 
                    data={materials} 
                  />
                ) : (
                  <div className="text-center py-8">
                    <Package className="mx-auto h-8 w-8 text-slate-300" />
                    <p className="mt-2 text-slate-500">No materials found</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}