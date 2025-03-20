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
  User
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
    startDate: new Date(task.startDate),
    endDate: new Date(task.endDate),
    status: task.status,
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
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'foundation':
        return <Landmark className="h-5 w-5" />;
      case 'framing':
        return <Construction className="h-5 w-5" />;
      case 'electrical':
        return <Zap className="h-5 w-5" />;
      case 'plumbing':
        return <Droplet className="h-5 w-5" />;
      case 'hvac':
        return <Building className="h-5 w-5" />;
      case 'windows_doors':
        return <Mailbox className="h-5 w-5" />;
      case 'drywall':
        return <HardHat className="h-5 w-5" />;
      case 'flooring':
        return <LayoutGrid className="h-5 w-5" />;
      case 'painting':
        return <FileCheck className="h-5 w-5" />;
      default:
        return <Construction className="h-5 w-5" />;
    }
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
          <h1 className="text-2xl font-bold text-green-500">Tasks</h1>
          <Button 
            className="bg-green-500 hover:bg-green-600 text-white font-medium shadow-sm"
            onClick={() => setCreateDialogOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" /> Add Task
          </Button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
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
                      className="cursor-pointer hover:shadow-md transition-all duration-200 border-slate-200 hover:border-green-300"
                      onClick={() => setSelectedCategory(category)}
                    >
                      <CardHeader className="p-4 pb-2">
                        <div className="flex justify-between items-center">
                          <CardTitle className="text-lg font-semibold flex items-center">
                            {getCategoryIcon(category)}
                            <span className="ml-2 capitalize">{category.replace('_', ' ')}</span>
                          </CardTitle>
                          <span className="text-sm bg-slate-100 rounded-full px-2 py-1 font-medium">
                            {totalTasks} {totalTasks === 1 ? 'task' : 'tasks'}
                          </span>
                        </div>
                      </CardHeader>
                      <CardContent className="p-4 pt-2">
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">
                              {inProgress > 0 && `${inProgress} in progress • `}
                              {completed} of {totalTasks} completed
                            </span>
                            <span className="font-medium">{completionPercentage}%</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-2">
                            <div 
                              className="bg-green-500 rounded-full h-2" 
                              style={{ width: `${completionPercentage}%` }}
                            ></div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              /* Display tasks of the selected category */
              <>
                <div className="flex items-center mb-4">
                  <Button
                    variant="outline"
                    className="mr-2"
                    onClick={() => setSelectedCategory(null)}
                  >
                    &#8592; Back
                  </Button>
                  <h2 className="text-lg font-medium capitalize">{selectedCategory.replace('_', ' ')}</h2>
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
                            <Calendar className="h-4 w-4 mr-1" />
                            {formatDate(task.startDate)} - {formatDate(task.endDate)}
                          </div>
                          <div className="flex items-center text-sm text-muted-foreground mt-1">
                            <User className="h-4 w-4 mr-1" />
                            {task.assignedTo || "Unassigned"}
                          </div>
                          <div className="mt-2">
                            <div className="w-full bg-slate-100 rounded-full h-2">
                              <div className={getProgressColor(task.status)} style={{ width: `${progress}%` }}></div>
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
                              className="text-blue-500 hover:text-blue-700"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedTask(task);
                                setEditDialogOpen(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
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
                  <div className="h-64">
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
