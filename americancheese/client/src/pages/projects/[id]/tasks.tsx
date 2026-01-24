import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Filter, 
  Search, 
  Edit,
  X,
  Sliders,
  ChevronRight,
  ChevronLeft
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { queryClient } from "@/lib/queryClient";
import { formatDate } from "@/lib/utils";
import { TaskCard } from "@/components/task/TaskCard";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useTheme } from "@/hooks/useTheme";
import { useTier2CategoriesByTier1Name } from "@/hooks/useTemplateCategories";

export default function ProjectTasksPage() {
  const params = useParams();
  const [, navigate] = useLocation();
  const projectId = Number(params.id);
  const { getColor, colorUtils } = useTheme(projectId);

  // Fetch categories from admin panel for this project
  const { data: tier2ByTier1Name, tier1Categories: dbTier1Categories, tier2Categories: dbTier2Categories } = useTier2CategoriesByTier1Name(projectId);

  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // State to track which task categories are visible
  const [visibleCategories, setVisibleCategories] = useState({
    structural: true,
    systems: true,
    sheathing: true,
    finishings: true
  });

  // Get project color based on theme and project ID
  const getProjectCardStyle = (projectId: number, status: string) => {
    // Get theme color based on project ID using project-specific theme
    const tier1Categories = ['structural', 'systems', 'sheathing', 'finishings'];
    const categoryIndex = (projectId - 1) % tier1Categories.length;
    const category = tier1Categories[categoryIndex];

    // Get the color from the project-specific theme
    const themeColor = getColor.tier1(category);

    // Convert hex to RGB for gradient
    const rgb = colorUtils.hexToRgb(themeColor);

    // Create gradient style based on status
    if (status === "completed") {
      // Green tint for completed projects
      return {
        background: `linear-gradient(135deg, rgba(34, 197, 94, 0.9), rgba(21, 128, 61, 0.9))`
      };
    } else if (status === "on_hold") {
      // Gray tint for on-hold projects
      return {
        background: `linear-gradient(135deg, rgba(107, 114, 128, 0.9), rgba(75, 85, 99, 0.9))`
      };
    } else {
      // Use theme color for active projects
      return {
        background: `linear-gradient(135deg, rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.9), rgba(${Math.max(0, rgb.r - 40)}, ${Math.max(0, rgb.g - 40)}, ${Math.max(0, rgb.b - 40)}, 0.9))`
      };
    }
  };

  // Get category header style based on category name
  const getCategoryHeaderStyle = (categoryName: string) => {
    // Get the color from the project-specific theme
    const color = getColor.tier1(categoryName.toLowerCase());

    return {
      backgroundColor: `${color}15`, // 15% opacity
      borderLeft: `4px solid ${color}`,
      color: color
    };
  };

  
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
  const { data: tasks = [], isLoading: isLoadingTasks } = useQuery({
    queryKey: ["/api/projects", projectId, "tasks"],
    queryFn: async () => {
      const response = await fetch(`/api/projects/${projectId}/tasks`);
      if (!response.ok) {
        throw new Error("Failed to fetch tasks");
      }
      return await response.json();
    },
  });

  // Prepare data for unified color system (must be after project query)
  const projectsArray = project ? [{ id: project.id, colorTheme: project.colorTheme, useGlobalTheme: project.useGlobalTheme }] : [];
  const adminCategories = React.useMemo(() => {
    const categories: any[] = [];
    if (dbTier1Categories) {
      dbTier1Categories.forEach((cat: any) => categories.push({ ...cat, type: 'tier1', projectId }));
    }
    if (dbTier2Categories) {
      dbTier2Categories.forEach((cat: any) => categories.push({ ...cat, type: 'tier2', projectId }));
    }
    return categories;
  }, [dbTier1Categories, dbTier2Categories, projectId]);

  // Get the visible tasks based on category filters
  const visibleTasks = tasks.filter(task => {
    // Filter by search query
    if (searchQuery && !task.title?.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    // Filter by tab
    if (activeTab === "completed" && !task.completed) return false;
    if (activeTab === "in_progress" && task.status !== "in_progress") return false;
    if (activeTab === "not_started" && task.status !== "not_started") return false;
    
    // Filter by visible categories
    const tier1 = task.tier1Category?.toLowerCase();
    if (tier1 && !visibleCategories[tier1]) return false;
    
    return true;
  });
  
  // Group tasks by tier1Category
  const groupedTasks = visibleTasks.reduce((groups, task) => {
    const tier1 = (task.tier1Category?.toLowerCase() || "other") as string;
    if (!groups[tier1]) {
      groups[tier1] = [];
    }
    groups[tier1].push(task);
    return groups;
  }, {} as Record<string, any[]>);
  
  // Save changes to task categories visibility
  const saveCategoryVisibility = async () => {
    // Here you would typically save this to user preferences in the backend
    // For now, we'll just close the dialog and let the UI state handle it
    setEditDialogOpen(false);
  };
  
  if (isLoadingProject || isLoadingTasks) {
    return (
      <Layout>
        <div className="container mx-auto p-4">
          <div className="flex justify-center items-center h-64">
            <div className="text-xl text-muted-foreground">Loading...</div>
          </div>
        </div>
      </Layout>
    );
  }
  
  if (!project) {
    return (
      <Layout>
        <div className="container mx-auto p-4">
          <div className="text-center py-8">
            <h2 className="text-xl font-semibold text-gray-800">Project not found</h2>
            <p className="text-gray-500 mt-2">The project you're looking for doesn't exist or has been removed.</p>
            <Button 
              className="mt-4" 
              onClick={() => navigate('/projects')}
            >
              Back to Projects
            </Button>
          </div>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <div className="container mx-auto p-4 space-y-6">
        {/* Project header with breadcrumb */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="text-sm text-muted-foreground mb-1">
              <a
                href="/projects"
                className="text-sm text-blue-600 hover:underline"
              >
                Projects
              </a>
              <ChevronRight className="inline-block h-4 w-4 mx-1" />
              <a
                href={`/projects/${projectId}`}
                className="text-sm text-blue-600 hover:underline"
              >
                {project.name}
              </a>
              <ChevronRight className="inline-block h-4 w-4 mx-1" />
              <span>Tasks</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">{project.name} Tasks</h1>
            {project && (
              <div 
                className="w-full h-2 rounded-full mt-2"
                style={getProjectCardStyle(projectId, project.status || 'active')}
              />
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Sliders className="h-4 w-4" />
                  Edit Task Visibility
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Task Category Visibility</DialogTitle>
                </DialogHeader>
                <div className="py-4 space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Select which task categories you want to show or hide in the task list.
                    Hidden categories will be removed from the task dashboard and project overview.
                  </p>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Structural Tasks</Label>
                        <p className="text-xs text-muted-foreground">Foundation, framing, roofing tasks</p>
                      </div>
                      <Switch 
                        checked={visibleCategories.structural}
                        onCheckedChange={(checked) => 
                          setVisibleCategories({...visibleCategories, structural: checked})
                        }
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Systems Tasks</Label>
                        <p className="text-xs text-muted-foreground">Electrical, plumbing, HVAC tasks</p>
                      </div>
                      <Switch 
                        checked={visibleCategories.systems}
                        onCheckedChange={(checked) => 
                          setVisibleCategories({...visibleCategories, systems: checked})
                        }
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Sheathing Tasks</Label>
                        <p className="text-xs text-muted-foreground">Drywall, insulation, exterior tasks</p>
                      </div>
                      <Switch 
                        checked={visibleCategories.sheathing}
                        onCheckedChange={(checked) => 
                          setVisibleCategories({...visibleCategories, sheathing: checked})
                        }
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Finishings Tasks</Label>
                        <p className="text-xs text-muted-foreground">Cabinets, flooring, trim tasks</p>
                      </div>
                      <Switch 
                        checked={visibleCategories.finishings}
                        onCheckedChange={(checked) => 
                          setVisibleCategories({...visibleCategories, finishings: checked})
                        }
                      />
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={saveCategoryVisibility}>
                    Save Changes
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            
            <a
              href={`/projects/${projectId}`}
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
            >
              Back to Project
            </a>
          </div>
        </div>
        
        {/* Search and filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-9 w-9 rounded-l-none"
                onClick={() => setSearchQuery("")}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        
        {/* Tabs for filtering by status */}
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">All Tasks</TabsTrigger>
            <TabsTrigger value="not_started">Not Started</TabsTrigger>
            <TabsTrigger value="in_progress">In Progress</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="mt-6">
            {Object.keys(groupedTasks).length === 0 ? (
              <div className="text-center py-12 border rounded-lg">
                <p className="text-muted-foreground">No tasks found</p>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(groupedTasks).map(([category, categoryTasks]) => (
                  <Card key={category}>
                    <CardHeader 
                      className="rounded-t-lg"
                      style={getCategoryHeaderStyle(category)}
                    >
                      <CardTitle className="text-lg capitalize">{category} Tasks</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="divide-y">
                        {categoryTasks.map((task) => (
                          <TaskCard
                            key={task.id}
                            task={task}
                            compact={true}
                            showProject={false}
                            projects={projectsArray}
                            adminCategories={adminCategories}
                          />
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="not_started" className="mt-6">
            {/* Same content structure as "all" tab, but filtered by status */}
            {Object.keys(groupedTasks).length === 0 ? (
              <div className="text-center py-12 border rounded-lg">
                <p className="text-muted-foreground">No tasks found</p>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(groupedTasks).map(([category, categoryTasks]) => (
                  <Card key={category}>
                    <CardHeader 
                      className="rounded-t-lg"
                      style={getCategoryHeaderStyle(category)}
                    >
                      <CardTitle className="text-lg capitalize">{category} Tasks</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="divide-y">
                        {categoryTasks.map((task) => (
                          <TaskCard
                            key={task.id}
                            task={task}
                            compact={true}
                            showProject={false}
                            projects={projectsArray}
                            adminCategories={adminCategories}
                          />
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="in_progress" className="mt-6">
            {/* Same content structure as "all" tab, but filtered by status */}
            {Object.keys(groupedTasks).length === 0 ? (
              <div className="text-center py-12 border rounded-lg">
                <p className="text-muted-foreground">No tasks found</p>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(groupedTasks).map(([category, categoryTasks]) => (
                  <Card key={category}>
                    <CardHeader 
                      className="rounded-t-lg"
                      style={getCategoryHeaderStyle(category)}
                    >
                      <CardTitle className="text-lg capitalize">{category} Tasks</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="divide-y">
                        {categoryTasks.map((task) => (
                          <TaskCard
                            key={task.id}
                            task={task}
                            compact={true}
                            showProject={false}
                            projects={projectsArray}
                            adminCategories={adminCategories}
                          />
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="completed" className="mt-6">
            {/* Same content structure as "all" tab, but filtered by status */}
            {Object.keys(groupedTasks).length === 0 ? (
              <div className="text-center py-12 border rounded-lg">
                <p className="text-muted-foreground">No tasks found</p>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(groupedTasks).map(([category, categoryTasks]) => (
                  <Card key={category}>
                    <CardHeader 
                      className="rounded-t-lg"
                      style={getCategoryHeaderStyle(category)}
                    >
                      <CardTitle className="text-lg capitalize">{category} Tasks</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="divide-y">
                        {categoryTasks.map((task) => (
                          <TaskCard
                            key={task.id}
                            task={task}
                            compact={true}
                            showProject={false}
                            projects={projectsArray}
                            adminCategories={adminCategories}
                          />
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}