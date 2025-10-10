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
import { getTier1Color, getTier2Color } from "@/lib/unified-color-system";
import { getProjectTheme } from "@/lib/project-themes";

interface Project {
  id: number;
  name: string;
  status: string;
  budget: number;
  location?: string;
  startDate: string;
  endDate: string;
  colorTheme?: string | null;
  useGlobalTheme?: boolean;
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

  // Fetch all project categories for index-based color assignment
  const { data: allProjectCategories = [] } = useQuery<any[]>({
    queryKey: ["/api/all-project-categories"],
    queryFn: async () => {
      const categoriesByProject = await Promise.all(
        projects.map(async (project) => {
          const response = await fetch(`/api/projects/${project.id}/categories`);
          if (!response.ok) return [];
          const categories = await response.json();
          return categories.map((cat: any) => ({ ...cat, projectId: project.id }));
        })
      );
      return categoriesByProject.flat();
    },
    enabled: projects.length > 0
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

  // Get project card styling based on project theme
  const getProjectCardStyle = (project: Project) => {
    const { status, colorTheme, useGlobalTheme, id } = project;

    // Get the theme for this project
    const theme = getProjectTheme(colorTheme && !useGlobalTheme ? colorTheme : undefined, id);

    // Use theme's primary and secondary colors for gradient
    const primaryColor = theme?.primary || '#556b2f';
    const secondaryColor = theme?.secondary || '#8b4513';

    if (status === "completed") {
      return { background: `linear-gradient(135deg, #22c55e, #16a34a)` };
    } else if (status === "on_hold") {
      return { background: `linear-gradient(135deg, #6b7280, #4b5563)` };
    } else {
      return { background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` };
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
                  style={getProjectCardStyle(project)}
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
                      {(() => {
                        // Use the same theme logic as the header gradient
                        const theme = getProjectTheme(project.colorTheme && !project.useGlobalTheme ? project.colorTheme : undefined, project.id);

                        // Get colors from the theme (these will match the gradient colors)
                        const primaryColor = theme?.primary || '#556b2f';
                        const secondaryColor = theme?.secondary || '#8b4513';
                        const tertiaryColor = theme?.accent || '#d4a574';
                        const quaternaryColor = theme?.muted || '#8fbc8f';

                        // Debug logging
                        console.log(`Project ${project.id} (${project.name}):`, {
                          colorTheme: project.colorTheme,
                          useGlobalTheme: project.useGlobalTheme,
                          themeName: theme?.name,
                          primaryColor,
                          secondaryColor,
                          tertiaryColor
                        });

                        return (
                          <>
                            <button
                              className="inline-flex items-center justify-center gap-2 px-2 py-1 h-6 text-xs font-medium rounded-full border transition-all duration-200 hover:shadow-sm whitespace-nowrap flex-shrink-0 hover:brightness-95"
                              style={{
                                backgroundColor: primaryColor,
                                borderColor: primaryColor,
                                color: 'white'
                              }}
                            >
                              <span
                                className="w-2 h-2 rounded-full mr-1 flex-shrink-0"
                                style={{ backgroundColor: 'rgba(255, 255, 255, 0.8)' }}
                              ></span>
                              <span className="truncate">{project.name}</span>
                            </button>
                            <button
                              className="inline-flex items-center justify-center gap-2 px-2 py-1 h-6 text-xs font-medium rounded-full border transition-all duration-200 hover:shadow-sm whitespace-nowrap flex-shrink-0 hover:brightness-95"
                              style={{
                                backgroundColor: secondaryColor,
                                borderColor: secondaryColor,
                                color: 'white'
                              }}
                            >
                              <Building className="h-3 w-3 mr-1 flex-shrink-0" />
                              <span className="truncate">{project.status.replace('_', ' ').toUpperCase()}</span>
                            </button>
                            {project.location && (
                              <button
                                className="inline-flex items-center justify-center gap-2 px-2 py-1 h-6 text-xs font-medium rounded-full border transition-all duration-200 hover:shadow-sm whitespace-nowrap flex-shrink-0 hover:brightness-95"
                                style={{
                                  backgroundColor: tertiaryColor,
                                  borderColor: tertiaryColor,
                                  color: 'white'
                                }}
                              >
                                <span className="truncate max-w-[80px] sm:max-w-none">{project.location}</span>
                              </button>
                            )}
                          </>
                        );
                      })()}
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
                {filteredTasks.slice(0, 5).map(task => {
                  const tier1Color = task.tier1Category
                    ? getTier1Color(task.tier1Category, allProjectCategories, task.projectId, projects)
                    : null;
                  const tier2Color = task.tier2Category
                    ? getTier2Color(task.tier2Category, allProjectCategories, task.projectId, projects, task.tier1Category)
                    : null;

                  if (task.tier1Category) {
                    console.log('📊 Dashboard tier1:', {
                      category: task.tier1Category,
                      projectId: task.projectId,
                      color: tier1Color,
                      projectsCount: projects.length,
                      project: projects.find(p => p.id === task.projectId)
                    });
                  }

                  return (
                    <div key={task.id} className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{task.title}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                          <span>{getProjectName(task.projectId)}</span>
                          {task.tier1Category && (
                            <>
                              <span>•</span>
                              <span
                                className="px-2 py-0.5 rounded-full text-white font-medium"
                                style={{ backgroundColor: tier1Color || '#6366f1' }}
                              >
                                {task.tier1Category}
                              </span>
                            </>
                          )}
                          {task.tier2Category && (
                            <>
                              <span>•</span>
                              <span
                                className="px-2 py-0.5 rounded-full text-white font-medium"
                                style={{ backgroundColor: tier2Color || '#64748b' }}
                              >
                                {task.tier2Category}
                              </span>
                            </>
                          )}
                          <span>•</span>
                          <span>Due {formatDate(task.dueDate)}</span>
                        </div>
                      </div>
                      <SimpleStatusBadge status={task.status} />
                    </div>
                  );
                })}
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
                      style={getProjectCardStyle(project)}
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