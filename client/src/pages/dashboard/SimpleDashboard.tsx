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
                        {getProjectName(task.projectId)} • Due {formatDate(task.dueDate)}
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
                  <div key={project.id} className="flex items-center justify-between">
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