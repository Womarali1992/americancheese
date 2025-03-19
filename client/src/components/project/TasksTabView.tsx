import { useState } from "react";
import { CalendarDays, Plus, User, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GanttChart } from "@/components/charts/GanttChart";
import { formatDate } from "@/lib/utils";
import { getStatusColor, getStatusBgColor, getProgressColor, formatTaskStatus } from "@/lib/task-utils";

interface Task {
  id: number;
  title: string;
  description?: string;
  status: string;
  startDate: string;
  endDate: string;
  assignedTo?: string;
  projectId: number;
  completed?: boolean;
}

interface TasksTabViewProps {
  tasks: Task[];
  projectId: number;
  onAddTask?: () => void;
}

export function TasksTabView({ tasks, projectId, onAddTask }: TasksTabViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  
  // Filter tasks based on search
  const filteredTasks = tasks?.filter(task => 
    task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (task.description?.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (task.assignedTo?.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  
  // Format tasks for Gantt chart
  const ganttTasks = tasks?.map(task => ({
    id: task.id,
    title: task.title,
    startDate: new Date(task.startDate),
    endDate: new Date(task.endDate),
    status: task.status,
    durationDays: Math.ceil((new Date(task.endDate).getTime() - new Date(task.startDate).getTime()) / (1000 * 60 * 60 * 24))
  })) || [];
  
  // Estimate task progress based on dates and status
  const getTaskProgress = (task: Task): number => {
    if (task.status === "completed") return 100;
    if (task.status === "not_started") return 0;
    
    const now = new Date();
    const start = new Date(task.startDate);
    const end = new Date(task.endDate);
    
    // If task hasn't started yet
    if (now < start) return 0;
    
    // If task has ended
    if (now > end) return task.status === "in_progress" ? 90 : 100;
    
    // Calculate progress based on dates
    const totalDuration = end.getTime() - start.getTime();
    const elapsedDuration = now.getTime() - start.getTime();
    const progress = Math.round((elapsedDuration / totalDuration) * 100);
    
    return Math.min(progress, 100);
  };
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-green-500">Tasks</h2>
        <Button className="bg-green-500 hover:bg-green-600" onClick={onAddTask}>
          <Plus className="mr-2 h-4 w-4" /> Add Task
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-2.5 text-slate-400 h-4 w-4" />
        <Input 
          placeholder="Search tasks..." 
          className="pl-9 w-full border border-slate-300 rounded-lg"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <Tabs defaultValue="list" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="list">List View</TabsTrigger>
          <TabsTrigger value="timeline">Timeline View</TabsTrigger>
        </TabsList>
        
        <TabsContent value="list" className="space-y-4 mt-4">
          {filteredTasks?.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-slate-500">No tasks found</p>
            </div>
          ) : (
            filteredTasks?.map((task) => {
              const progress = getTaskProgress(task);
              
              return (
                <Card key={task.id} className={`border-l-4 ${getStatusColor(task.status)}`}>
                  <CardHeader className="p-4 pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-base">{task.title}</CardTitle>
                      <span className={`text-xs px-2 py-1 rounded-full ${getStatusBgColor(task.status)}`}>
                        {formatTaskStatus(task.status)}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    {task.description && (
                      <p className="text-sm text-slate-600 mb-2">{task.description}</p>
                    )}
                    <div className="flex items-center text-sm text-slate-500 mt-1">
                      <CalendarDays className="h-4 w-4 mr-1" />
                      {formatDate(task.startDate)} - {formatDate(task.endDate)}
                    </div>
                    {task.assignedTo && (
                      <div className="flex items-center text-sm text-slate-500 mt-1">
                        <User className="h-4 w-4 mr-1" />
                        {task.assignedTo}
                      </div>
                    )}
                    <div className="mt-2">
                      <div className="w-full bg-slate-100 rounded-full h-2">
                        <div className={getProgressColor(task.status)} style={{ width: `${progress}%` }}></div>
                      </div>
                      <div className="text-xs text-right mt-1">{progress}% Complete</div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>
        
        <TabsContent value="timeline" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Timeline View</CardTitle>
            </CardHeader>
            <CardContent>
              {ganttTasks.length > 0 ? (
                <div className="h-80">
                  <GanttChart tasks={ganttTasks} />
                </div>
              ) : (
                <div className="flex items-center justify-center h-64 border border-dashed rounded-md border-slate-200">
                  <p className="text-slate-500">No tasks to display</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}