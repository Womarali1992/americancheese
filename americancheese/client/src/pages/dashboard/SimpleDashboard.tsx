import React, { useState, useEffect } from "react";
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
import { getProjectTheme, applyProjectTheme } from "@/lib/project-themes";
import { getTier1Color, getTier2Color } from "@/lib/unified-color-system";
import { getCalendarSchedulePrefix } from "@/components/task/TaskTimeDisplay";

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
  calendarStartDate?: string | null;
  calendarStartTime?: string | null;
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

  // Apply theme based on selected project
  useEffect(() => {
    if (selectedProject !== "all") {
      const project = projects.find(p => p.id === parseInt(selectedProject));
      if (project?.colorTheme) {
        const theme = getProjectTheme(project.colorTheme, project.id);
        applyProjectTheme(theme, project.id);
      }
    } else {
      // Apply default global theme when viewing all projects
      const defaultTheme = getProjectTheme('Earth Tone');
      applyProjectTheme(defaultTheme);
    }
  }, [selectedProject, projects]);

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
          const response = await fetch(`/api/projects/${project.id}/template-categories`);
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
    const { status, id } = project;

    if (status === "completed") {
      return { background: `linear-gradient(135deg, #22c55e, #16a34a)` };
    } else if (status === "on_hold") {
      return { background: `linear-gradient(135deg, #6b7280, #4b5563)` };
    } else {
      // Get project-specific categories to determine tier1 colors
      // Sort by sortOrder first, then by id as stable tiebreaker
      const projectCategories = allProjectCategories
        .filter(cat => cat.projectId === id && cat.type === 'tier1')
        .sort((a, b) => {
          const sortDiff = (a.sortOrder || 0) - (b.sortOrder || 0);
          if (sortDiff !== 0) return sortDiff;
          return (a.id || 0) - (b.id || 0);
        });

      // PRIORITY: Use category's stored color FIRST, then fall back to computed color
      const projectColorTheme = projects.find(p => p.id === id)?.colorTheme || undefined;
      const color1 = projectCategories[0]
        ? (projectCategories[0].color || getTier1Color(projectCategories[0].name, allProjectCategories, id, projects))
        : '#556b2f';
      const color2 = projectCategories[1]
        ? (projectCategories[1].color || getTier1Color(projectCategories[1].name, allProjectCategories, id, projects))
        : '#8b4513';

      return { background: `linear-gradient(135deg, ${color1}, ${color2})` };
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
                        // Get project-specific categories to determine tier1 categories
                        // Sort by sortOrder first, then by id as stable tiebreaker
                        const projectCategories = allProjectCategories
                          .filter(cat => cat.projectId === project.id && cat.type === 'tier1')
                          .sort((a, b) => {
                            const sortDiff = (a.sortOrder || 0) - (b.sortOrder || 0);
                            if (sortDiff !== 0) return sortDiff;
                            return (a.id || 0) - (b.id || 0);
                          });

                        // PRIORITY: Use category's stored color FIRST, then fall back to computed color
                        const tier1Colors = projectCategories.slice(0, 4).map(cat => {
                          // Check if category has its own stored color
                          if (cat.color) {
                            console.log(`🎨 SimpleDash: "${cat.name}" using stored color: ${cat.color}`);
                            return cat.color;
                          }
                          // Fall back to computed color
                          const computed = getTier1Color(cat.name, allProjectCategories, project.id, projects);
                          console.log(`🎨 SimpleDash: "${cat.name}" using computed color: ${computed}`);
                          return computed;
                        });

                        // Fallback colors if we don't have 4 categories
                        const categoryColors = [
                          tier1Colors[0] || '#556b2f',
                          tier1Colors[1] || '#8b4513',
                          tier1Colors[2] || '#d4a574',
                          tier1Colors[3] || '#8fbc8f'
                        ];

                        return (
                          <>
                            {projectCategories.slice(0, 4).map((cat, index) => (
                              <button
                                key={cat.id || cat.name}
                                className="inline-flex items-center justify-center gap-2 px-2 py-1 h-6 text-xs font-medium rounded-full border transition-all duration-200 hover:shadow-sm whitespace-nowrap flex-shrink-0 hover:brightness-95"
                                style={{
                                  backgroundColor: categoryColors[index],
                                  borderColor: categoryColors[index],
                                  color: 'white'
                                }}
                              >
                                <span
                                  className="w-2 h-2 rounded-full mr-1 flex-shrink-0"
                                  style={{ backgroundColor: 'rgba(255, 255, 255, 0.8)' }}
                                ></span>
                                <span className="truncate">{cat.name}</span>
                              </button>
                            ))}
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
                  // Get project's colorTheme for this task
                  const taskProject = projects.find(p => p.id === task.projectId);
                  const taskColorTheme = taskProject?.colorTheme || undefined;

                  // PRIORITY: Look up category's stored color FIRST, then fall back to computed color
                  const tier1Cat = allProjectCategories.find(
                    (cat: any) => cat.projectId === task.projectId && cat.type === 'tier1' && cat.name === task.tier1Category
                  );
                  const tier2Cat = allProjectCategories.find(
                    (cat: any) => cat.projectId === task.projectId && cat.type === 'tier2' && cat.name === task.tier2Category
                  );

                  const tier1Color = task.tier1Category
                    ? (tier1Cat?.color || getTier1Color(task.tier1Category, allProjectCategories, task.projectId, projects))
                    : null;
                  const tier2Color = task.tier2Category
                    ? (tier2Cat?.color || getTier2Color(task.tier2Category, allProjectCategories, task.projectId, projects, task.tier1Category))
                    : null;

                  return (
                    <div key={task.id} className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {(() => {
                            const schedulePrefix = getCalendarSchedulePrefix(task.calendarStartDate, task.calendarStartTime);
                            return schedulePrefix ? (
                              <span><span className="font-semibold text-cyan-700">{schedulePrefix}</span> {task.title}</span>
                            ) : task.title;
                          })()}
                        </p>
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