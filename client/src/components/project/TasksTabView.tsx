import { useState } from "react";
import { 
  CalendarDays, Plus, User, Search, 
  Hammer, Mailbox, Building, FileCheck, 
  Zap, Droplet, HardHat, Construction, 
  Landmark, LayoutGrid, UserCircle, Package
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GanttChart } from "@/components/charts/GanttChart";
import { formatDate } from "@/lib/utils";
import { getStatusColor, getStatusBgColor, getProgressColor, formatTaskStatus } from "@/lib/task-utils";
import { Wordbank, WordbankItem } from "@/components/ui/wordbank";
import { useQuery } from "@tanstack/react-query";
import { Contact, Material } from "@/../../shared/schema";

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
  category?: string;
  contactIds?: string[] | number[];
  materialIds?: string[] | number[];
  materialsNeeded?: string;
}

interface TasksTabViewProps {
  tasks: Task[];
  projectId: number;
  onAddTask?: () => void;
}

// Import the TaskAttachments component
import { TaskAttachments } from "@/components/task/TaskAttachments";

export function TasksTabView({ tasks, projectId, onAddTask }: TasksTabViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  // Filter tasks based on search
  const filteredTasks = tasks?.filter(task => 
    task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (task.description?.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (task.assignedTo?.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  
  // Group tasks by category
  const tasksByCategory = filteredTasks?.reduce((groups, task) => {
    const category = task.category || 'Uncategorized';
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(task);
    return groups;
  }, {} as Record<string, Task[]>);
  
  // Get unique categories
  const categories = Object.keys(tasksByCategory || {}).sort();
  
  // Format tasks for Gantt chart
  const ganttTasks = tasks?.map(task => ({
    id: task.id,
    title: task.title,
    description: task.description,
    startDate: new Date(task.startDate),
    endDate: new Date(task.endDate),
    status: task.status,
    assignedTo: task.assignedTo,
    category: task.category,
    contactIds: task.contactIds,
    materialIds: task.materialIds,
    durationDays: Math.ceil((new Date(task.endDate).getTime() - new Date(task.startDate).getTime()) / (1000 * 60 * 60 * 24))
  })) || [];
  
  // Get appropriate icon for each category
  const getCategoryIcon = (category: string) => {
    const iconClass = "h-5 w-5 text-slate-600";
    
    switch (category.toLowerCase()) {
      case 'foundation':
        return <Building className={iconClass} />;
      case 'electrical':
        return <Zap className={iconClass} />;
      case 'plumbing':
        return <Droplet className={iconClass} />;
      case 'roof':
        return <HardHat className={iconClass} />;
      case 'windows & doors':
        return <Mailbox className={iconClass} />;
      case 'permits & approvals':
        return <FileCheck className={iconClass} />;
      case 'exterior':
        return <Landmark className={iconClass} />;
      case 'uncategorized':
        return <LayoutGrid className={iconClass} />;
      default:
        return <Construction className={iconClass} />;
    }
  };
  
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
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-green-500">Tasks</h1>
        <Button 
          className="bg-green-500 hover:bg-green-600 text-white font-medium shadow-sm" 
          onClick={onAddTask}
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

      <Tabs defaultValue="list">
        <TabsList className="grid w-full grid-cols-2 bg-slate-100">
          <TabsTrigger value="list" className="data-[state=active]:bg-white">List View</TabsTrigger>
          <TabsTrigger value="timeline" className="data-[state=active]:bg-white">Timeline View</TabsTrigger>
        </TabsList>
        
        <TabsContent value="list" className="space-y-4 mt-4">
          {filteredTasks?.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-slate-500">No tasks found</p>
            </div>
          ) : selectedCategory ? (
            // Display tasks of the selected category
            <>
              <div className="flex items-center mb-4">
                <Button
                  variant="outline"
                  className="mr-2"
                  onClick={() => setSelectedCategory(null)}
                >
                  &#8592; Back
                </Button>
                <h2 className="text-lg font-medium">{selectedCategory}</h2>
              </div>
              
              <div className="space-y-4">
                {tasksByCategory[selectedCategory]?.map((task) => {
                  const progress = getTaskProgress(task);
                  
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
                          <CalendarDays className="h-4 w-4 mr-1" />
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
                          <div className="text-xs text-right mt-1">{progress}% Complete</div>
                        </div>
                        
                        {/* Display attached contacts and materials if any */}
                        <TaskAttachments task={task} />
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </>
          ) : (
            // Display category cards
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {categories.map(category => {
                const inProgress = tasksByCategory[category].filter(t => t.status === 'in_progress').length;
                const completed = tasksByCategory[category].filter(t => t.status === 'completed').length;
                const totalTasks = tasksByCategory[category].length;
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
                          <span className="ml-2">{category}</span>
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
          )}
        </TabsContent>
        
        <TabsContent value="timeline" className="mt-4">
          <Card>
            <CardContent className="p-4">
              {ganttTasks.length > 0 ? (
                <div className="h-80">
                  <GanttChart 
                    tasks={ganttTasks} 
                    onAddTask={onAddTask}
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center h-64 border border-dashed rounded-md border-muted-foreground/50">
                  <p className="text-muted-foreground">No tasks to display</p>
                  <Button 
                    className="ml-2 bg-green-500 hover:bg-green-600 text-white"
                    size="sm"
                    onClick={onAddTask}
                  >
                    <Plus className="h-4 w-4 mr-2" /> Add Task
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}