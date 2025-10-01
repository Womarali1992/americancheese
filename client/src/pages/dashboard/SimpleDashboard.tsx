import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SimpleStatusBadge } from "@/components/ui/simple-status-badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Building, Users, DollarSign, CheckCircle, Plus, Search } from "lucide-react";
import { CreateProjectDialog } from "@/pages/projects/CreateProjectDialog";
// Removed theme import - dashboard uses default styling

interface Project {
  id: number;
  name: string;
  status: string;
  budget: number;
  location?: string;
  startDate: string;
  endDate: string;
}

interface Task {
  id: number;
  title: string;
  status: string;
  projectId: number;
  dueDate: string;
  tier1Category?: string;
  tier2Category?: string;
  category?: string;
}

interface Material {
  id: number;
  name: string;
  cost: number;
  projectId: number;
}

interface Expense {
  id: number;
  amount: number;
  description: string;
  projectId: number;
  date: string;
}

export default function SimpleDashboard() {
  const [createProjectOpen, setCreateProjectOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string>("all");

  // Fetch data
  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const { data: tasks = [] } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  const { data: materials = [] } = useQuery<Material[]>({
    queryKey: ["/api/materials"],
  });

  const { data: expenses = [] } = useQuery<Expense[]>({
    queryKey: ["/api/expenses"],
  });

  // Filter data based on selected project
  const filteredTasks = selectedProject === "all" 
    ? tasks 
    : tasks.filter(task => task.projectId === parseInt(selectedProject));

  const filteredMaterials = selectedProject === "all"
    ? materials
    : materials.filter(material => material.projectId === parseInt(selectedProject));

  const filteredExpenses = selectedProject === "all"
    ? expenses
    : expenses.filter(expense => expense.projectId === parseInt(selectedProject));

  // Calculate statistics
  const totalBudget = projects.reduce((sum, project) => sum + (project.budget || 0), 0);
  const completedTasks = filteredTasks.filter(task => task.status === "completed").length;
  const totalMaterialCost = filteredMaterials.reduce((sum, material) => sum + (material.cost || 0), 0);
  const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);

  const getProjectName = (projectId: number) => {
    const project = projects.find(p => p.id === projectId);
    return project?.name || "Unknown Project";
  };

  // Simple dashboard project styling - uses basic color rotation
  const getProjectCardStyle = (projectId: number, status: string) => {
    const colors = [
      { primary: '#556b2f', secondary: '#8b4513' }, // Earth
      { primary: '#1e3a8a', secondary: '#0891b2' }, // Ocean
      { primary: '#15803d', secondary: '#16a34a' }, // Forest
      { primary: '#ea580c', secondary: '#f97316' }, // Sunset
      { primary: '#7c3aed', secondary: '#8b5cf6' }  // Purple
    ];
    
    const colorIndex = (projectId - 1) % colors.length;
    const color = colors[colorIndex];
    
    if (status === "completed") {
      return { background: `linear-gradient(135deg, #22c55e, #16a34a)` };
    } else if (status === "on_hold") {
      return { background: `linear-gradient(135deg, #6b7280, #4b5563)` };
    } else {
      return { background: `linear-gradient(135deg, ${color.primary}, ${color.secondary})` };
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <div className="flex gap-2">
            <Select value={selectedProject} onValueChange={setSelectedProject}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Projects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Projects</SelectItem>
                {projects.map(project => (
                  <SelectItem key={project.id} value={project.id.toString()}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={() => setCreateProjectOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              New Project
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{projects.length}</div>
              <p className="text-xs text-muted-foreground">
                Active projects in portfolio
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed Tasks</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedTasks}</div>
              <p className="text-xs text-muted-foreground">
                Out of {filteredTasks.length} total tasks
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalBudget)}</div>
              <p className="text-xs text-muted-foreground">
                Across all projects
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Material Costs</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalMaterialCost)}</div>
              <p className="text-xs text-muted-foreground">
                {filteredMaterials.length} materials tracked
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Project Overview Cards */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Project Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.slice(0, 6).map(project => (
              <Card key={project.id} className="overflow-hidden hover:shadow-lg transition-all duration-200">
                <div 
                  className="h-16 relative flex items-center px-4"
                  style={getProjectCardStyle(project.id, project.status)}
                >
                  <div className="flex items-center gap-3 w-full">
                    <div 
                      className="w-2 h-2 rounded-full"
                      style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.8)'
                      }}
                    ></div>
                    <h3 className="text-lg font-semibold text-white truncate">{project.name}</h3>
                  </div>
                </div>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 flex-wrap mb-3">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <button 
                        className="inline-flex items-center justify-center gap-2 px-2 py-1 h-6 text-xs font-medium rounded-full border transition-all duration-200 hover:shadow-sm whitespace-nowrap flex-shrink-0"
                        style={{
                          backgroundColor: 'white',
                          borderColor: 'white',
                          color: 'black'
                        }}
                      >
                        <span 
                          className="w-2 h-2 rounded-full mr-1 flex-shrink-0"
                          style={getProjectCardStyle(project.id, project.status)}
                        ></span>
                        <span className="truncate">{project.name}</span>
                      </button>
                      <button 
                        className="inline-flex items-center justify-center gap-2 px-2 py-1 h-6 text-xs font-medium rounded-full border transition-all duration-200 hover:shadow-sm whitespace-nowrap flex-shrink-0"
                        style={{
                          backgroundColor: 'white',
                          borderColor: 'white',
                          color: 'black'
                        }}
                      >
                        <Building className="h-3 w-3 mr-1 flex-shrink-0" />
                        <span className="truncate">{project.status.replace('_', ' ').toUpperCase()}</span>
                      </button>
                      {project.location && (
                        <button 
                          className="inline-flex items-center justify-center gap-2 px-2 py-1 h-6 text-xs font-medium rounded-full border transition-all duration-200 hover:shadow-sm whitespace-nowrap flex-shrink-0"
                          style={{
                            backgroundColor: 'white',
                            borderColor: 'white',
                            color: 'black'
                          }}
                        >
                          <span className="truncate max-w-[80px] sm:max-w-none">{project.location}</span>
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-3">
                    <div className="flex items-center text-sm text-slate-700 font-medium">
                      <Building className="h-4 w-4 mr-1 text-slate-600" />
                      {formatCurrency(project.budget)}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <SimpleStatusBadge status={project.status} />
                      <span className="text-xs bg-white bg-opacity-80 text-slate-800 px-2 py-1 rounded-full border border-slate-200 font-medium whitespace-nowrap">
                        Due: {formatDate(project.endDate)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Tasks */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredTasks.slice(0, 5).map(task => (
                  <div key={task.id} className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{task.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {getProjectName(task.projectId)} • {task.tier2Category && `${task.tier2Category} • `}Due {formatDate(task.dueDate)}
                      </p>
                    </div>
                    <SimpleStatusBadge status={task.status} />
                  </div>
                ))}
                {filteredTasks.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No tasks found
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Projects */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Projects</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {projects.slice(0, 5).map(project => (
                  <div key={project.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:shadow-sm transition-all">
                    <div 
                      className="w-1 h-12 rounded-full mr-3 flex-shrink-0"
                      style={getProjectCardStyle(project.id, project.status)}
                    ></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{project.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {project.location} • {formatCurrency(project.budget)}
                      </p>
                    </div>
                    <SimpleStatusBadge status={project.status} />
                  </div>
                ))}
                {projects.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No projects found
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <CreateProjectDialog 
        open={createProjectOpen} 
        onOpenChange={setCreateProjectOpen} 
      />
    </Layout>
  );
}