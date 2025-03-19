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
import { GanttChart } from "@/components/charts/GanttChart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDate } from "@/lib/utils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Search, 
  Plus, 
  Calendar, 
  MoreHorizontal, 
  Paperclip, 
  MessageSquare
} from "lucide-react";
import { CreateTaskDialog } from "./CreateTaskDialog";
import { Task, Project } from "@/../../shared/schema";

export default function TasksPage() {
  const [projectFilter, setProjectFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
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

  // Filter tasks based on search query, project, and status
  const filteredTasks = tasks?.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesProject = projectFilter === "all" || task.projectId.toString() === projectFilter;
    const matchesStatus = statusFilter === "all" || task.status === statusFilter;
    
    return matchesSearch && matchesProject && matchesStatus;
  });

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
            <div className="flex gap-2 w-full md:w-auto">
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
            </div>
          </CardContent>
        </Card>

        {/* Tasks List */}
        <Card className="bg-white">
          <CardHeader className="border-b border-slate-200 px-6 py-4 flex items-center justify-between">
            <CardTitle className="font-medium">Task List</CardTitle>
            <div className="text-sm text-slate-500">{tasks?.length || 0} tasks total</div>
          </CardHeader>
          <CardContent className="p-0 divide-y divide-slate-200">
            {filteredTasks?.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-slate-500">No tasks found matching your filters</p>
              </div>
            ) : (
              filteredTasks?.map(task => (
                <div key={task.id} className="px-6 py-4 hover:bg-slate-50">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-start gap-3">
                      <div className="mt-1">
                        <Checkbox
                          checked={task.completed}
                          onCheckedChange={(checked) => toggleTaskCompletion(task.id, checked === true)}
                          className="h-4 w-4 rounded border-slate-300 text-task"
                        />
                      </div>
                      <div>
                        <h4 className={`text-base font-medium ${task.completed ? 'line-through text-slate-500' : ''}`}>
                          {task.title}
                        </h4>
                        <p className="text-sm text-slate-500 mt-1">{getProjectName(task.projectId)}</p>
                      </div>
                    </div>
                    <StatusBadge status={task.status} />
                  </div>
                  <div className="flex justify-between items-center ml-7">
                    <div className="flex items-center gap-6 text-sm text-slate-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(task.endDate)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span>Assigned: </span>
                        <span>{task.assignedTo || "Unassigned"}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" className="text-slate-400 hover:text-slate-600">
                        <Paperclip className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-slate-400 hover:text-slate-600">
                        <MessageSquare className="h-4 w-4" />
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
    </Layout>
  );
}
