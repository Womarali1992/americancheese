import React, { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SimpleStatusBadge } from "@/components/ui/simple-status-badge";
import { SimpleProgressBar } from "@/components/ui/simple-progress-bar";
import { CreateTaskDialog } from "./CreateTaskDialog";
import { EditTaskDialog } from "./EditTaskDialog";
import { formatDate } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { ColorTest } from "@/components/test/ColorTest";
import { useColors } from "@/hooks/useTheme";
import { COLOR_THEMES, getActiveColorTheme } from "@/lib/color-themes";
import { getTier1Color, getTier2Color } from "@/lib/unified-color-system";
import {
  CheckSquare,
  Calendar,
  Building,
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Clock,
  User,
  Filter,
  X
} from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

interface Task {
  id: number;
  title: string;
  description?: string | null;
  status: string;
  priority?: string;
  projectId: number;
  assignedTo?: string | null;
  startDate: string;
  endDate: string;
  dueDate: string;
  category?: string;
  tier1Category?: string;
  tier2Category?: string;
  completed: boolean;
  contactIds?: string[] | null;
  materialIds?: string[] | null;
  materialsNeeded?: string | null;
  templateId?: string | null;
  estimatedCost?: number | null;
  actualCost?: number | null;
}

interface Project {
  id: number;
  name: string;
  colorTheme?: string | null;
  useGlobalTheme?: boolean;
}

export default function SimpleTasksPage() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [projectFilter, setProjectFilter] = useState("all");
  const { toast } = useToast();
  const [location, setLocation] = useLocation();

  // Parse URL parameters for tier1 and tier2 filtering
  const urlParams = useMemo(() => {
    const search = location.split('?')[1];
    if (!search) return {};

    const params = new URLSearchParams(search);
    return {
      projectId: params.get('projectId'),
      tier1: params.get('tier1'),
      tier2: params.get('tier2')
    };
  }, [location]);

  // State for category navigation
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Sync URL parameters with selectedCategory state
  useEffect(() => {
    if (urlParams.tier1 || urlParams.tier2) {
      // If tier2 is specified, use it as selectedCategory (more specific)
      // Otherwise use tier1
      const categoryToSelect = urlParams.tier2 || urlParams.tier1;
      if (categoryToSelect && categoryToSelect !== selectedCategory) {
        setSelectedCategory(categoryToSelect);
      }
    } else if (!urlParams.tier1 && !urlParams.tier2 && selectedCategory) {
      // If no URL params but we have a selected category, clear it
      setSelectedCategory(null);
    }
  }, [urlParams.tier1, urlParams.tier2]);

  // Helper function to update URL with category parameters
  const updateURLWithCategory = (tier1?: string, tier2?: string) => {
    const [basePath] = location.split('?');
    const params = new URLSearchParams();

    if (tier1) {
      params.set('tier1', tier1);
    }

    if (tier2) {
      params.set('tier2', tier2);
    }

    const newURL = params.toString() ? `${basePath}?${params.toString()}` : basePath;
    setLocation(newURL);
  };

  // Helper function to navigate to a category and update URL
  const navigateToCategory = (category: string) => {
    // Determine if this category is a tier1 or tier2 category by looking at the tasks
    const sampleTask = tasks.find(task =>
      task.tier1Category === category || task.tier2Category === category
    );

    if (!sampleTask) {
      console.warn('No task found for category:', category);
      setSelectedCategory(category);
      return;
    }

    if (sampleTask.tier1Category === category) {
      // This is a tier1 category
      updateURLWithCategory(category);
    } else if (sampleTask.tier2Category === category) {
      // This is a tier2 category, we need to include its tier1 parent
      updateURLWithCategory(sampleTask.tier1Category, category);
    }

    setSelectedCategory(category);
  };

  // Helper function to clear category navigation
  const clearCategoryNavigation = () => {
    const [basePath] = location.split('?');
    const newURL = basePath;
    setLocation(newURL);
    setSelectedCategory(null);
  };

  // Fetch data
  const { data: tasks = [], isLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  // Fetch all categories for unified color system
  const { data: allCategories = [] } = useQuery<any[]>({
    queryKey: ["/api/all-categories"],
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

  // Debug: log project data when it changes
  React.useEffect(() => {
    if (projects.length > 0) {
      console.log("🔍 Tasks Page - All projects data:", projects.map(p => ({
        id: p.id,
        name: p.name,
        colorTheme: p.colorTheme,
        useGlobalTheme: p.useGlobalTheme
      })));
    }
  }, [projects]);


  // Helper functions
  const getProjectName = (projectId: number) => {
    const project = projects.find(p => p.id === projectId);
    return project?.name || "Unknown Project";
  };

  // Get category color for a task using the unified color system
  const getCategoryColor = (task: Task) => {
    // Prefer tier2 over tier1 for more specific color
    if (task.tier2Category) {
      return getTier2Color(task.tier2Category, allCategories, task.projectId, projects, task.tier1Category);
    } else if (task.tier1Category) {
      return getTier1Color(task.tier1Category, allCategories, task.projectId, projects);
    }
    // Fallback: use project-based color
    return getProjectColors(task.projectId).primaryColor;
  };

  // Get project-specific theme colors
  const getProjectColors = (projectId: number) => {
    const project = projects.find(p => p.id === projectId);

    // Debug logging (remove after testing)
    if (project?.colorTheme && !project.useGlobalTheme) {
      console.log(`🎨 Tasks - Project ${projectId} using theme: ${project.colorTheme}`);
    }

    // If project has a specific theme and is not using global theme
    if (project?.colorTheme && !project.useGlobalTheme) {
      const theme = COLOR_THEMES[project.colorTheme];
      if (theme) {
        // Use the first tier1 color as primary for this project
        const primaryColor = theme.tier1.subcategory1;
        return {
          primaryColor,
          backgroundColor: `${primaryColor}15`, // Add transparency
          textColor: primaryColor,
          borderColor: primaryColor
        };
      }
    }

    // Fallback to global theme with dynamic color selection based on project ID
    const globalTheme = getActiveColorTheme();
    const tier1Categories = ['subcategory1', 'subcategory2', 'subcategory3', 'subcategory4', 'subcategory5'];
    const categoryIndex = (projectId - 1) % tier1Categories.length;
    const category = tier1Categories[categoryIndex];
    const primaryColor = globalTheme.tier1[category as keyof typeof globalTheme.tier1];

    return {
      primaryColor,
      backgroundColor: `${primaryColor}15`, // Add transparency
      textColor: primaryColor,
      borderColor: primaryColor
    };
  };

  // Filter tasks
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (task.description || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || task.status === statusFilter;
    const matchesProject = projectFilter === "all" || task.projectId === parseInt(projectFilter);

    // Filter by URL parameters (tier1 and tier2)
    if (urlParams.tier1) {
      const taskTier1 = task.tier1Category?.toLowerCase();
      if (taskTier1 !== urlParams.tier1.toLowerCase()) {
        return false;
      }
    }

    if (urlParams.tier2) {
      const taskTier2 = task.tier2Category?.toLowerCase();
      if (taskTier2 !== urlParams.tier2.toLowerCase()) {
        return false;
      }
    }

    return matchesSearch && matchesStatus && matchesProject;
  });

  const handleEditTask = (task: Task) => {
    setSelectedTask(task);
    setEditDialogOpen(true);
  };

  const handleViewTask = (taskId: number) => {
    setLocation(`/tasks/${taskId}`);
  };

  const handleDeleteTask = async (taskId: number) => {
    if (confirm("Are you sure you want to delete this task?")) {
      try {
        // Add delete API call here
        toast({
          title: "Success",
          description: "Task deleted successfully",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete task",
          variant: "destructive",
        });
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 border-green-200";
      case "in_progress":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "not_started":
        return "bg-gray-100 text-gray-800 border-gray-200";
      case "on_hold":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 border-red-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "low":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getProgress = (task: Task) => {
    if (task.status === "completed") return 100;
    if (task.status === "not_started") return 0;
    if (task.status === "in_progress") {
      // Calculate based on dates if available
      const now = new Date();
      const start = new Date(task.startDate);
      const end = new Date(task.endDate);
      
      if (now < start) return 0;
      if (now > end) return 90; // Almost complete but not marked as done
      
      const total = end.getTime() - start.getTime();
      const elapsed = now.getTime() - start.getTime();
      return Math.min(Math.round((elapsed / total) * 100), 90);
    }
    return 0;
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Tasks</h1>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Task
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4 space-y-3">
                <div className="h-6 bg-gray-200 rounded w-3/4" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
                <div className="h-4 bg-gray-200 rounded w-full" />
                <div className="h-4 bg-gray-200 rounded w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-3xl font-bold">Tasks</h1>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Task
          </Button>
        </div>

        {/* Color Test */}
        <ColorTest />

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search tasks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={projectFilter} onValueChange={setProjectFilter}>
                <SelectTrigger className="w-full sm:w-48">
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
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="not_started">Not Started</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="on_hold">On Hold</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* URL Filter Indicators */}
        {(urlParams.projectId || urlParams.tier1 || urlParams.tier2) && (
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 text-blue-800 text-sm">
                  <Filter className="h-4 w-4" />
                  <span>Filtered by:</span>
                </div>
                <div className="flex items-center gap-2">
                  {urlParams.projectId && (
                    <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-medium">
                      Project #{urlParams.projectId}
                    </span>
                  )}
                  {urlParams.projectId && urlParams.tier1 && (
                    <span className="text-blue-600">→</span>
                  )}
                  {urlParams.tier1 && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                      {urlParams.tier1}
                    </span>
                  )}
                  {urlParams.tier1 && urlParams.tier2 && (
                    <span className="text-blue-600">→</span>
                  )}
                  {urlParams.tier2 && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                      {urlParams.tier2}
                    </span>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearCategoryNavigation}
                  className="ml-auto text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear Filter
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tasks Grid */}
        {filteredTasks.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <CheckSquare className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium mb-2">No tasks found</h3>
              <p className="text-gray-500 mb-4">
                {tasks.length === 0 
                  ? "Get started by creating your first task"
                  : "Try adjusting your search or filters"
                }
              </p>
              {tasks.length === 0 && (
                <Button onClick={() => setCreateDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Task
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTasks.map((task) => {
              const progress = getProgress(task);
              const isOverdue = new Date(task.dueDate) < new Date() && task.status !== "completed";

              return (
                <Card 
                  key={task.id} 
                  className="hover:shadow-lg transition-shadow"
                  style={{ 
                    borderLeft: `4px solid ${getProjectColors(task.projectId).primaryColor}` 
                  }}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg truncate">{task.title}</CardTitle>
                        <div className="flex items-center gap-2 mt-2">
                          <div className={`inline-block px-2 py-1 text-xs rounded-full border ${getStatusColor(task.status)}`}>
                            {task.status.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                          </div>
                          {task.priority && (
                            <div className={`inline-block px-2 py-1 text-xs rounded-full border ${getPriorityColor(task.priority)}`}>
                              {task.priority}
                            </div>
                          )}
                          {isOverdue && (
                            <div className="inline-block px-2 py-1 text-xs rounded-full border bg-red-100 text-red-800 border-red-200">
                              Overdue
                            </div>
                          )}
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewTask(task.id)}>
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditTask(task)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDeleteTask(task.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0 space-y-4">
                    <div className="flex items-center text-sm">
                      <Building 
                        className="w-4 h-4 mr-1" 
                        style={{ color: getProjectColors(task.projectId).primaryColor }}
                      />
                      <span style={{ color: getProjectColors(task.projectId).primaryColor }}>
                        {getProjectName(task.projectId)}
                      </span>
                    </div>
                    
                    {task.description && (
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {task.description}
                      </p>
                    )}

                    {(task.tier2Category || task.tier1Category || task.category) && (
                      <div className="flex items-center gap-2 flex-wrap">
                        {task.tier1Category && (
                          <button
                            onClick={() => navigateToCategory(task.tier1Category || '')}
                            className="px-2 py-1 text-xs font-medium rounded-full text-white transition-all hover:brightness-95"
                            style={{
                              backgroundColor: getTier1Color(task.tier1Category, allCategories, task.projectId, projects)
                            }}
                          >
                            {task.tier1Category}
                          </button>
                        )}
                        {task.tier2Category && (
                          <button
                            onClick={() => navigateToCategory(task.tier2Category || '')}
                            className="px-2 py-1 text-xs font-medium rounded-full text-white transition-all hover:brightness-95"
                            style={{
                              backgroundColor: getTier2Color(task.tier2Category, allCategories, task.projectId, projects, task.tier1Category)
                            }}
                          >
                            {task.tier2Category}
                          </button>
                        )}
                        {!task.tier1Category && !task.tier2Category && task.category && (
                          <button
                            onClick={() => navigateToCategory(task.category || '')}
                            className="px-2 py-1 text-xs font-medium rounded-full text-white transition-all hover:brightness-95"
                            style={{
                              backgroundColor: getCategoryColor(task)
                            }}
                          >
                            {task.category}
                          </button>
                        )}
                      </div>
                    )}

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="h-2 rounded-full transition-all duration-300"
                          style={{ 
                            width: `${progress}%`,
                            backgroundColor: getProjectColors(task.projectId).primaryColor
                          }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t text-sm text-gray-600">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        Due: {formatDate(task.dueDate)}
                      </div>
                      {task.assignedTo && (
                        <div className="flex items-center">
                          <User className="w-4 h-4 mr-1" />
                          {task.assignedTo}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <CreateTaskDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        projectId={urlParams.projectId ? parseInt(urlParams.projectId) : undefined}
        preselectedCategory={
          urlParams.tier1 && urlParams.tier2
            ? {
                tier1Category: urlParams.tier1,
                tier2Category: urlParams.tier2,
                category: urlParams.tier2.toLowerCase()
              }
            : undefined
        }
      />
      
      {selectedTask && (
        <EditTaskDialog 
          open={editDialogOpen} 
          onOpenChange={setEditDialogOpen}
          task={selectedTask}
        />
      )}
    </Layout>
  );
}