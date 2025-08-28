import React, { useState } from "react";
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
  User
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
}

export default function SimpleTasksPage() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [projectFilter, setProjectFilter] = useState("all");
  const { toast } = useToast();
  const [, navigate] = useLocation();

  // Fetch data
  const { data: tasks = [], isLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  // Helper functions
  const getProjectName = (projectId: number) => {
    const project = projects.find(p => p.id === projectId);
    return project?.name || "Unknown Project";
  };

  // Filter tasks
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (task.description || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || task.status === statusFilter;
    const matchesProject = projectFilter === "all" || task.projectId === parseInt(projectFilter);
    return matchesSearch && matchesStatus && matchesProject;
  });

  const handleEditTask = (task: Task) => {
    setSelectedTask(task);
    setEditDialogOpen(true);
  };

  const handleViewTask = (taskId: number) => {
    navigate(`/tasks/${taskId}`);
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
                <Card key={task.id} className="hover:shadow-lg transition-shadow">
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
                    <div className="flex items-center text-sm text-gray-600">
                      <Building className="w-4 h-4 mr-1" />
                      {getProjectName(task.projectId)}
                    </div>
                    
                    {task.description && (
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {task.description}
                      </p>
                    )}

                    {task.category && (
                      <div className="text-sm text-gray-600">
                        Category: {task.category}
                      </div>
                    )}

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${progress}%` }}
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