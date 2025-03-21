import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/layout/Layout";
import { TaskAttachments } from "@/components/task/TaskAttachments";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { StatusBadge } from "@/components/ui/status-badge";
import { CategoryBadge } from "@/components/ui/category-badge";
import { GanttChart } from "@/components/charts/GanttChartNew";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getStatusColor, getStatusBgColor, getProgressColor, formatTaskStatus } from "@/lib/task-utils";
import { formatDate } from "@/lib/utils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Search, 
  Plus, 
  Calendar, 
  MoreHorizontal,
  Edit,
  Building, 
  Zap, 
  Droplet, 
  HardHat, 
  Mailbox, 
  FileCheck, 
  Landmark, 
  LayoutGrid,
  Construction,
  ChevronLeft,
  User,
  Fan,
  Layers,
  Columns,
  Paintbrush,
  Trees
} from "lucide-react";
import { CreateTaskDialog } from "./CreateTaskDialog";
import { EditTaskDialog } from "./EditTaskDialog";
import { Task, Project } from "@/../../shared/schema";

export default function TasksPage() {
  const [projectFilter, setProjectFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("list");
  const { toast } = useToast();

  const { data: tasks = [], isLoading: tasksLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  const { data: projects = [], isLoading: projectsLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const toggleTaskCompletion = async (taskId: number, completed: boolean) => {
    try {
      await apiRequest("PUT", `/api/tasks/${taskId}`, { completed });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      
      toast({
        title: completed ? "Task completed" : "Task reopened",
        description: completed ? "Task marked as completed" : "Task marked as not completed",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update task status",
        variant: "destructive",
      });
    }
  };

  // Prepare the data for the Gantt chart
  const ganttTasks = tasks?.map(task => ({
    id: task.id,
    title: task.title.length > 20 ? task.title.substring(0, 20) + '...' : task.title,
    description: task.description || null,
    startDate: new Date(task.startDate),
    endDate: new Date(task.endDate),
    status: task.status,
    assignedTo: task.assignedTo || null,
    category: task.category || 'general',
    contactIds: task.contactIds || null,
    materialIds: task.materialIds || null,
    projectId: task.projectId,
    completed: task.completed || null,
    materialsNeeded: task.materialsNeeded || null,
    durationDays: Math.ceil((new Date(task.endDate).getTime() - new Date(task.startDate).getTime()) / (1000 * 60 * 60 * 24)),
  }));

  // Filter tasks based on search query, project, status, and category
  const filteredTasks = tasks?.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesProject = projectFilter === "all" || task.projectId.toString() === projectFilter;
    const matchesStatus = statusFilter === "all" || task.status === statusFilter;
    const matchesCategory = categoryFilter === "all" || task.category === categoryFilter;
    const matchesSelectedCategory = !selectedCategory || task.category === selectedCategory;
    
    return matchesSearch && matchesProject && matchesStatus && matchesCategory && matchesSelectedCategory;
  });

  // Group tasks by category
  const tasksByCategory = tasks?.reduce((acc, task) => {
    const category = task.category || 'other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(task);
    return acc;
  }, {} as Record<string, Task[]>);

  // Calculate completion percentage for each category
  const categoryCompletion = Object.entries(tasksByCategory || {}).reduce((acc, [category, tasks]) => {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.completed).length;
    acc[category] = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    return acc;
  }, {} as Record<string, number>);

  // Get category icon
  const getCategoryIcon = (category: string, className: string = "h-5 w-5") => {
    switch (category) {
      case 'foundation':
        return <Landmark className={className} />;
      case 'framing':
        return <Construction className={className} />;
      case 'electrical':
        return <Zap className={className} />;
      case 'plumbing':
        return <Droplet className={className} />;
      case 'hvac':
        return <Fan className={className} />;
      case 'windows_doors':
        return <LayoutGrid className={className} />;
      case 'drywall':
        return <Layers className={className} />;
      case 'flooring':
        return <Columns className={className} />;
      case 'painting':
        return <Paintbrush className={className} />;
      case 'landscaping':
        return <Trees className={className} />;
      default:
        return <Construction className={className} />;
    }
  };
  
  // Get category icon background color
  const getCategoryIconBackground = (category: string) => {
    switch (category.toLowerCase()) {
      case 'foundation':
        return 'bg-stone-200';
      case 'framing':
        return 'bg-purple-200';
      case 'electrical':
        return 'bg-yellow-200';
      case 'plumbing':
        return 'bg-blue-200';
      case 'hvac':
        return 'bg-gray-200';
      case 'windows_doors':
        return 'bg-sky-200';
      case 'drywall':
        return 'bg-neutral-200';
      case 'flooring':
        return 'bg-orange-200';
      case 'painting':
        return 'bg-indigo-200';
      case 'landscaping':
        return 'bg-emerald-200';
      default:
        return 'bg-slate-200';
    }
  };
  
  // Get category progress bar color
  const getCategoryProgressColor = (category: string) => {
    switch (category) {
      case 'foundation':
        return 'bg-stone-500';
      case 'framing':
        return 'bg-purple-500';
      case 'electrical':
        return 'bg-yellow-500';
      case 'plumbing':
        return 'bg-blue-500';
      case 'hvac':
        return 'bg-gray-500';
      case 'windows_doors':
        return 'bg-sky-500';
      case 'drywall':
        return 'bg-neutral-500';
      case 'flooring':
        return 'bg-orange-500';
      case 'painting':
        return 'bg-indigo-500';
      case 'landscaping':
        return 'bg-emerald-500';
      default:
        return 'bg-slate-500';
    }
  };
  
  // Get category description
  const getCategoryDescription = (category: string) => {
    switch (category) {
      case 'foundation':
        return 'Base structure and concrete work';
      case 'framing':
        return 'Structural framework and support';
      case 'electrical':
        return 'Wiring, panels, and lighting';
      case 'plumbing':
        return 'Water and drainage systems';
      case 'hvac':
        return 'Heating, ventilation, and cooling';
      case 'windows_doors':
        return 'Entry points and glass fixtures';
      case 'drywall':
        return 'Interior wall construction';
      case 'flooring':
        return 'Floor surfaces and materials';
      case 'painting':
        return 'Surface finishes and coatings';
      case 'landscaping':
        return 'Exterior grounds and vegetation';
      default:
        return 'General construction tasks';
    }
  };
  
  // Format category name for display
  const formatCategoryName = (category: string): string => {
    if (category === 'windows_doors') {
      return 'Windows/Doors';
    }
    
    return category
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Get project name by ID
  const getProjectName = (projectId: number) => {
    const project = projects?.find(p => p.id === projectId);
    return project ? project.name : "Unknown Project";
  };

  if (tasksLoading || projectsLoading) {
    return (
      <Layout>
        <div className="space-y-6 p-4">
          <div className="flex justify-between items-center">
            <div className="h-8 bg-slate-200 rounded w-32 animate-pulse"></div>
            <div className="h-10 bg-slate-200 rounded w-32 animate-pulse"></div>
          </div>

          <div className="h-10 bg-slate-200 rounded w-full animate-pulse"></div>

          <div className="flex gap-2">
            <div className="h-10 bg-slate-200 rounded w-32 animate-pulse"></div>
            <div className="h-10 bg-slate-200 rounded w-32 animate-pulse"></div>
          </div>

          <div className="h-12 bg-slate-200 rounded w-full animate-pulse"></div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="animate-pulse border border-slate-200">
                <CardHeader className="p-4">
                  <div className="flex justify-between">
                    <div className="h-6 bg-slate-200 rounded w-1/2"></div>
                    <div className="h-6 bg-slate-200 rounded w-16"></div>
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <div className="h-4 bg-slate-200 rounded w-1/3"></div>
                      <div className="h-4 bg-slate-200 rounded w-8"></div>
                    </div>
                    <div className="h-2 bg-slate-200 rounded w-full"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6 p-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-orange-500">Tasks</h1>
          <Button 
            className="bg-orange-500 hover:bg-orange-600 text-white font-medium shadow-sm"
            onClick={() => setCreateDialogOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4 text-white" /> Add Task
          </Button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-orange-500" />
          <Input 
            placeholder="Search tasks..." 
            className="w-full pl-9 border-slate-200"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap gap-2 w-full">
          <Select value={projectFilter} onValueChange={setProjectFilter}>
            <SelectTrigger className="border border-slate-200 rounded-lg">
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
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="border border-slate-200 rounded-lg">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="not_started">Not Started</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-slate-100">
            <TabsTrigger value="list" className="data-[state=active]:bg-white">List View</TabsTrigger>
            <TabsTrigger value="timeline" className="data-[state=active]:bg-white">Timeline View</TabsTrigger>
          </TabsList>
          
          <TabsContent value="list" className="space-y-4 mt-4">
            {/* Category Cards or Selected Category Tasks */}
            {!selectedCategory ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(tasksByCategory || {}).map(([category, tasks]) => {
                  const inProgress = tasks.filter(t => t.status === 'in_progress').length;
                  const completed = tasks.filter(t => t.completed).length;
                  const totalTasks = tasks.length;
                  const completionPercentage = Math.round((completed / totalTasks) * 100) || 0;
                  
                  return (
                    <Card 
                      key={category} 
                      className="rounded-lg border bg-card text-card-foreground shadow-sm h-full transition-all hover:shadow-md cursor-pointer"
                      onClick={() => setSelectedCategory(category)}
                    >
                      <div className={`flex flex-col space-y-1.5 p-6 rounded-t-lg ${getCategoryIconBackground(category)}`}>
                        <div className="flex justify-center py-4">
                          <div className="p-2 rounded-full bg-white bg-opacity-70">
                            {getCategoryIcon(category, "h-8 w-8 text-orange-500")}
                          </div>
                        </div>
                      </div>
                      <div className="p-6 pt-6">
                        <h3 className="text-2xl font-semibold leading-none tracking-tight capitalize">
                          {formatCategoryName(category)}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-2">
                          {getCategoryDescription(category)}
                        </p>
                        <div className="mt-4 space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">
                              {completed} of {totalTasks} completed
                            </span>
                            <span className="font-medium">{completionPercentage}%</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-2">
                            <div 
                              className={`rounded-full h-2 ${getCategoryProgressColor(category)}`}
                              style={{ width: `${completionPercentage}%` }}
                            ></div>
                          </div>
                          <div className="flex justify-between items-center mt-3 pt-2 border-t">
                            <span className="text-sm text-muted-foreground">
                              {inProgress > 0 && `${inProgress} in progress`}
                            </span>
                            <span className="text-sm bg-slate-100 rounded-full px-2 py-1 font-medium">
                              {totalTasks} {totalTasks === 1 ? 'task' : 'tasks'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            ) : (
              /* Display tasks of the selected category */
              <>
                <div className="flex items-center gap-2 mb-4">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setSelectedCategory(null)}
                    className="flex items-center gap-1 text-orange-500 hover:text-orange-600 hover:bg-orange-50"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-left">
                      <path d="m15 18-6-6 6-6"/>
                    </svg>
                    Back to categories
                  </Button>
                  <div className={`px-2 py-1 ${getCategoryIconBackground(selectedCategory)} text-zinc-800 rounded-full text-sm font-medium flex items-center gap-1`}>
                    {getCategoryIcon(selectedCategory, "h-4 w-4")}
                    {formatCategoryName(selectedCategory)}
                  </div>
                </div>
                
                <div className="space-y-4">
                  {tasksByCategory[selectedCategory]?.map((task) => {
                    // Calculate progress
                    const now = new Date();
                    const start = new Date(task.startDate);
                    const end = new Date(task.endDate);
                    
                    let progress = 0;
                    if (task.status === "completed") progress = 100;
                    else if (task.status === "not_started") progress = 0;
                    else {
                      // If task hasn't started yet
                      if (now < start) progress = 0;
                      // If task has ended
                      else if (now > end) progress = task.status === "in_progress" ? 90 : 100;
                      else {
                        // Calculate progress based on dates
                        const totalDuration = end.getTime() - start.getTime();
                        const elapsedDuration = now.getTime() - start.getTime();
                        progress = Math.round((elapsedDuration / totalDuration) * 100);
                        progress = Math.min(progress, 100);
                      }
                    }
                    
                    return (
                      <Card key={task.id} className={`border-l-4 ${getStatusColor(task.status)} shadow-sm hover:shadow transition-shadow duration-200`}>
                        <CardHeader className="p-4 pb-2">
                          <div className="flex justify-between items-start">
                            <CardTitle className="text-base font-semibold">{task.title}</CardTitle>
                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusBgColor(task.status)}`}>
                              {formatTaskStatus(task.status)}
                            </span>
                          </div>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                          <div className="flex items-center text-sm text-muted-foreground mt-1">
                            <Calendar className="h-4 w-4 mr-1 text-orange-500" />
                            {formatDate(task.startDate)} - {formatDate(task.endDate)}
                          </div>
                          <div className="flex items-center text-sm text-muted-foreground mt-1">
                            <User className="h-4 w-4 mr-1 text-orange-500" />
                            {task.assignedTo || "Unassigned"}
                          </div>
                          <div className="mt-2">
                            <div className="w-full bg-slate-100 rounded-full h-2">
                              <div className={`${getCategoryProgressColor(task.category || 'default')} rounded-full h-2`} style={{ width: `${progress}%` }}></div>
                            </div>
                            <div className="flex justify-between text-xs mt-1">
                              <span>{getProjectName(task.projectId)}</span>
                              <span>{progress}% Complete</span>
                            </div>
                          </div>
                          
                          {/* Display attached contacts and materials */}
                          <TaskAttachments task={task} />
                          
                          <div className="flex justify-end mt-2">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-orange-500 hover:text-orange-600"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedTask(task);
                                setEditDialogOpen(true);
                              }}
                            >
                              <Edit className="h-4 w-4 text-orange-500" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </>
            )}
          </TabsContent>
          
          <TabsContent value="timeline" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Gantt Chart View</CardTitle>
              </CardHeader>
              <CardContent>
                {ganttTasks.length > 0 ? (
                  <div className="h-[500px]">
                    <GanttChart tasks={ganttTasks} />
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-64 border border-dashed rounded-md border-muted-foreground/50">
                    <p className="text-muted-foreground">Gantt chart visualization would appear here</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Add the CreateTaskDialog component */}
      <CreateTaskDialog 
        open={createDialogOpen} 
        onOpenChange={setCreateDialogOpen} 
      />
      
      {/* Add the EditTaskDialog component */}
      <EditTaskDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        task={selectedTask}
      />
    </Layout>
  );
}
