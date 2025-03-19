import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/layout/Layout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BudgetChart } from "@/components/charts/BudgetChart";
import { ProgressBar } from "@/components/charts/ProgressBar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency, formatDate } from "@/lib/utils";
import { 
  Building, 
  Calendar, 
  CheckCircle2, 
  ClipboardList, 
  DollarSign, 
  ArrowUp, 
  ArrowDown, 
  Settings, 
  Plus
} from "lucide-react";

// Placeholder data for budget overview
const budgetData = {
  spent: 1200000,
  remaining: 465000,
  materials: 48,
  labor: 52
};

export default function DashboardPage() {
  const { data: projects, isLoading: projectsLoading } = useQuery({
    queryKey: ["/api/projects"],
  });

  const { data: tasks, isLoading: tasksLoading } = useQuery({
    queryKey: ["/api/tasks"],
  });

  const { data: materials, isLoading: materialsLoading } = useQuery({
    queryKey: ["/api/materials"],
  });

  // Compute dashboard metrics
  const metrics = {
    activeProjects: projects?.filter(p => p.status === "active").length || 0,
    openTasks: tasks?.filter(t => !t.completed).length || 0,
    pendingMaterials: materials?.filter(m => m.status === "ordered").length || 0,
    budgetUtilization: 72 // Hard-coded for now
  };

  // Upcoming deadlines
  const upcomingDeadlines = tasks?.filter(task => !task.completed)
    .sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime())
    .slice(0, 4);

  const getProjectName = (projectId: number) => {
    const project = projects?.find(p => p.id === projectId);
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

  if (projectsLoading || tasksLoading || materialsLoading) {
    return (
      <Layout>
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold hidden md:block">Dashboard</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
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
            ))}
          </div>
          
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
        
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-white">
            <CardContent className="p-5">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="text-sm text-slate-500">Active Projects</p>
                  <p className="text-2xl font-semibold mt-1">{metrics.activeProjects}</p>
                </div>
                <div className="bg-dashboard bg-opacity-10 p-2 rounded-lg">
                  <Building className="text-dashboard h-5 w-5" />
                </div>
              </div>
              <div className="flex items-center text-sm">
                <span className="text-green-500 flex items-center mr-1">
                  <ArrowUp className="h-3 w-3" />
                  <span>2</span>
                </span>
                <span className="text-slate-500">from last month</span>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white">
            <CardContent className="p-5">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="text-sm text-slate-500">Open Tasks</p>
                  <p className="text-2xl font-semibold mt-1">{metrics.openTasks}</p>
                </div>
                <div className="bg-task bg-opacity-10 p-2 rounded-lg">
                  <CheckCircle2 className="text-task h-5 w-5" />
                </div>
              </div>
              <div className="flex items-center text-sm">
                <span className="text-red-500 flex items-center mr-1">
                  <ArrowDown className="h-3 w-3" />
                  <span>5</span>
                </span>
                <span className="text-slate-500">from last week</span>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white">
            <CardContent className="p-5">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="text-sm text-slate-500">Materials Pending</p>
                  <p className="text-2xl font-semibold mt-1">{metrics.pendingMaterials}</p>
                </div>
                <div className="bg-resource bg-opacity-10 p-2 rounded-lg">
                  <Settings className="text-resource h-5 w-5" />
                </div>
              </div>
              <div className="flex items-center text-sm">
                <span className="text-green-500 flex items-center mr-1">
                  <ArrowDown className="h-3 w-3" />
                  <span>3</span>
                </span>
                <span className="text-slate-500">deliveries this week</span>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white">
            <CardContent className="p-5">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="text-sm text-slate-500">Budget Utilization</p>
                  <p className="text-2xl font-semibold mt-1">{metrics.budgetUtilization}%</p>
                </div>
                <div className="bg-expense bg-opacity-10 p-2 rounded-lg">
                  <DollarSign className="text-expense h-5 w-5" />
                </div>
              </div>
              <div className="flex items-center text-sm">
                <span className="text-amber-500 flex items-center mr-1">
                  <ArrowUp className="h-3 w-3" />
                  <span>5%</span>
                </span>
                <span className="text-slate-500">since last month</span>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Charts and Graphs */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Project Progress */}
          <Card className="bg-white">
            <CardHeader className="border-b border-slate-200 p-4 flex justify-between items-center">
              <CardTitle className="font-medium">Project Progress</CardTitle>
              <Select defaultValue="30days">
                <SelectTrigger className="border border-slate-300 rounded-lg text-sm py-1 px-2 bg-white">
                  <SelectValue placeholder="Last 30 Days" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30days">Last 30 Days</SelectItem>
                  <SelectItem value="quarter">Last Quarter</SelectItem>
                  <SelectItem value="ytd">Year to Date</SelectItem>
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              {projects?.map(project => (
                <div key={project.id}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium">{project.name}</span>
                    <span className="text-sm text-slate-500">{project.progress}%</span>
                  </div>
                  <ProgressBar 
                    value={project.progress} 
                    color={project.status === "completed" ? "green" : project.status === "on_hold" ? "amber" : "default"}
                    showLabel={false}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
          
          {/* Budget Overview */}
          <Card className="bg-white">
            <CardHeader className="border-b border-slate-200 p-4 flex justify-between items-center">
              <CardTitle className="font-medium">Budget Overview</CardTitle>
              <Select defaultValue="all">
                <SelectTrigger className="border border-slate-300 rounded-lg text-sm py-1 px-2 bg-white">
                  <SelectValue placeholder="All Projects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Projects</SelectItem>
                  {projects?.map(project => (
                    <SelectItem key={project.id} value={project.id.toString()}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent className="p-4">
              <div className="h-60 flex items-center justify-center">
                <BudgetChart data={budgetData} />
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Quick Actions and Upcoming */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Actions */}
          <Card className="bg-white">
            <CardHeader className="border-b border-slate-200 p-4">
              <CardTitle className="font-medium">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="p-4 grid grid-cols-2 gap-3">
              <Button variant="outline" className="flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 rounded-lg p-4 h-auto">
                <div className="w-10 h-10 bg-task bg-opacity-10 rounded-full flex items-center justify-center mb-2">
                  <Plus className="text-task h-5 w-5" />
                </div>
                <span className="text-sm font-medium">Add Task</span>
              </Button>
              
              <Button variant="outline" className="flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 rounded-lg p-4 h-auto">
                <div className="w-10 h-10 bg-resource bg-opacity-10 rounded-full flex items-center justify-center mb-2">
                  <Settings className="text-resource h-5 w-5" />
                </div>
                <span className="text-sm font-medium">Update Inventory</span>
              </Button>
              
              <Button variant="outline" className="flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 rounded-lg p-4 h-auto">
                <div className="w-10 h-10 bg-expense bg-opacity-10 rounded-full flex items-center justify-center mb-2">
                  <DollarSign className="text-expense h-5 w-5" />
                </div>
                <span className="text-sm font-medium">Record Expense</span>
              </Button>
              
              <Button variant="outline" className="flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 rounded-lg p-4 h-auto">
                <div className="w-10 h-10 bg-dashboard bg-opacity-10 rounded-full flex items-center justify-center mb-2">
                  <ClipboardList className="text-dashboard h-5 w-5" />
                </div>
                <span className="text-sm font-medium">Generate Report</span>
              </Button>
            </CardContent>
          </Card>
          
          {/* Upcoming Deadlines */}
          <Card className="bg-white lg:col-span-2">
            <CardHeader className="border-b border-slate-200 p-4">
              <CardTitle className="font-medium">Upcoming Deadlines</CardTitle>
            </CardHeader>
            <CardContent className="p-0 divide-y divide-slate-200">
              {upcomingDeadlines?.length === 0 ? (
                <div className="p-4 text-center">
                  <p className="text-slate-500">No upcoming deadlines</p>
                </div>
              ) : (
                upcomingDeadlines?.map(task => {
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
      </div>
    </Layout>
  );
}
