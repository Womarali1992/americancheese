import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/layout/Layout";
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
import { GanttChart } from "@/components/charts/GanttChart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold hidden md:block">Tasks</h2>
            <div className="flex gap-2">
              <Button variant="outline" className="bg-white">
                <Calendar className="mr-1 h-4 w-4" />
                Calendar View
              </Button>
              <Button className="bg-task hover:bg-green-600">
                <Plus className="mr-1 h-4 w-4" />
                Create Task
              </Button>
            </div>
          </div>

          <Card className="animate-pulse">
            <CardContent className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="h-10 bg-slate-200 rounded w-full md:w-1/2"></div>
              <div className="flex gap-2 w-full md:w-auto">
                <div className="h-10 bg-slate-200 rounded w-28"></div>
                <div className="h-10 bg-slate-200 rounded w-28"></div>
              </div>
            </CardContent>
          </Card>

          <Card className="animate-pulse">
            <CardContent className="p-4 space-y-4">
              <div className="h-6 bg-slate-200 rounded w-1/4"></div>
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-16 bg-slate-200 rounded"></div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-semibold hidden md:block">Tasks</h2>
          <div className="flex gap-2">
            <Button variant="outline" className="bg-white border border-slate-300 text-slate-700">
              <Calendar className="mr-1 h-4 w-4" />
              Calendar View
            </Button>
            <Button 
              className="bg-green-500 hover:bg-green-600 text-white"
              onClick={() => setCreateDialogOpen(true)}
            >
              <Plus className="mr-1 h-4 w-4" />
              Create Task
            </Button>
          </div>
        </div>

        {/* Task Filters */}
        <Card className="bg-white">
          <CardContent className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-2.5 text-slate-400 h-4 w-4" />
              <Input
                placeholder="Search tasks..."
                className="pl-9 pr-4 py-2 border border-slate-300 rounded-lg w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-2 w-full md:w-auto">
              <Select value={projectFilter} onValueChange={setProjectFilter}>
                <SelectTrigger className="border border-slate-300 rounded-lg">
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
                <SelectTrigger className="border border-slate-300 rounded-lg">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="not_started">Not Started</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="border border-slate-300 rounded-lg">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="foundation">Foundation</SelectItem>
                  <SelectItem value="framing">Framing</SelectItem>
                  <SelectItem value="roof">Roof</SelectItem>
                  <SelectItem value="windows_doors">Windows/Doors</SelectItem>
                  <SelectItem value="electrical">Electrical</SelectItem>
                  <SelectItem value="plumbing">Plumbing</SelectItem>
                  <SelectItem value="hvac">HVAC</SelectItem>
                  <SelectItem value="insulation">Insulation</SelectItem>
                  <SelectItem value="drywall">Drywall</SelectItem>
                  <SelectItem value="flooring">Flooring</SelectItem>
                  <SelectItem value="painting">Painting</SelectItem>
                  <SelectItem value="landscaping">Landscaping</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Category Cards */}
        {!selectedCategory ? (
          <div className="bg-white rounded-lg border border-slate-200">
            <div className="border-b border-slate-200 px-6 py-4 flex items-center justify-between">
              <h3 className="font-medium">Task Categories</h3>
              <div className="text-sm text-slate-500">{tasks?.length || 0} tasks total</div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
              {Object.entries(tasksByCategory || {}).map(([category, tasks]) => (
                <Card 
                  key={category} 
                  className="hover:shadow-md transition-all cursor-pointer border border-slate-200"
                  onClick={() => setSelectedCategory(category)}
                >
                  <CardContent className="p-4 flex flex-col h-full">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-blue-100 text-blue-600">
                          {getCategoryIcon(category)}
                        </div>
                        <h4 className="font-medium text-slate-800 capitalize">
                          {category.replace('_', ' ')}
                        </h4>
                      </div>
                      <span className="bg-blue-50 text-blue-600 rounded-full px-2 py-1 text-xs font-medium">
                        {tasks.length} tasks
                      </span>
                    </div>
                    <div className="mt-2 mb-3">
                      <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                        <div 
                          className="h-full bg-green-500 rounded-full"
                          style={{ width: `${categoryCompletion[category]}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between mt-1 text-xs text-slate-500">
                        <span>{categoryCompletion[category]}% complete</span>
                        <span>{tasks.filter(t => t.completed).length}/{tasks.length} tasks</span>
                      </div>
                    </div>
                    <div className="mt-auto text-sm text-slate-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>
                          {
                            tasks.some(t => t.status === 'in_progress') 
                              ? 'In progress' 
                              : tasks.every(t => t.completed) 
                                ? 'Completed' 
                                : 'Not started'
                          }
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          /* Task List for Selected Category */
          <Card className="bg-white">
            <CardHeader className="border-b border-slate-200 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setSelectedCategory(null)}
                  className="p-1"
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-full bg-blue-100 text-blue-600">
                    {getCategoryIcon(selectedCategory)}
                  </div>
                  <CardTitle className="font-medium capitalize">
                    {selectedCategory.replace('_', ' ')} Tasks
                  </CardTitle>
                </div>
              </div>
              <div className="text-sm text-slate-500">
                {tasksByCategory[selectedCategory]?.length || 0} tasks
              </div>
            </CardHeader>
            <CardContent className="p-0 divide-y divide-slate-200">
              {tasksByCategory[selectedCategory]?.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-slate-500">No tasks found in this category</p>
                </div>
              ) : (
                tasksByCategory[selectedCategory]?.map(task => (
                  <div key={task.id} className="px-6 py-4 hover:bg-slate-50">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-start gap-3">
                        <div className="mt-1">
                          <Checkbox
                            checked={!!task.completed}
                            onCheckedChange={(checked) => toggleTaskCompletion(task.id, checked === true)}
                            className="h-4 w-4 rounded border-slate-300 text-task"
                          />
                        </div>
                        <div>
                          <h4 className={`text-base font-medium ${!!task.completed ? 'line-through text-slate-500' : ''}`}>
                            {task.title}
                          </h4>
                          <p className="text-sm text-slate-500 mt-1">{getProjectName(task.projectId)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={task.status} />
                      </div>
                    </div>
                    <div className="flex justify-between items-center ml-7">
                      <div className="flex items-center gap-6 text-sm text-slate-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDate(task.endDate)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          <span>{task.assignedTo || "Unassigned"}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-blue-500 hover:text-blue-700"
                          onClick={() => {
                            setSelectedTask(task);
                            setEditDialogOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-slate-400 hover:text-slate-600">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        )}

        {/* Gantt Chart */}
        <Card className="bg-white">
          <CardContent className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-medium">Timeline View</h3>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="border border-slate-300 bg-white text-slate-700 px-3 py-1.5 rounded-lg text-sm hover:bg-slate-50"
                >
                  Week
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border border-slate-300 bg-task bg-opacity-10 text-task px-3 py-1.5 rounded-lg text-sm font-medium"
                >
                  Month
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border border-slate-300 bg-white text-slate-700 px-3 py-1.5 rounded-lg text-sm hover:bg-slate-50"
                >
                  Quarter
                </Button>
              </div>
            </div>
            
            <GanttChart tasks={ganttTasks || []} />
          </CardContent>
        </Card>
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
