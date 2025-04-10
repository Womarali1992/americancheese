import { useState, useEffect } from "react";
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
import { GanttChart } from "@/components/charts/GanttChartNew";
import { formatDate } from "@/lib/utils";
import { getStatusBorderColor, getStatusBgColor, getProgressColor, formatTaskStatus } from "@/lib/color-utils";
import { Wordbank, WordbankItem } from "@/components/ui/wordbank";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Contact, Material, Labor } from "@/../../shared/schema";

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
  // Fields for labor dates
  laborStartDate?: string;
  laborEndDate?: string;
  hasLinkedLabor?: boolean;
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
  const [tasksWithLabor, setTasksWithLabor] = useState<Task[]>([]);
  
  // Fetch labor data for all tasks and update them with labor dates
  useEffect(() => {
    // Create a copy of the tasks array to modify
    const updatedTasks = [...tasks];
    
    // Track how many tasks we need to process
    let pendingTasks = updatedTasks.length;
    
    // If no tasks, just set the state
    if (pendingTasks === 0) {
      setTasksWithLabor(updatedTasks);
      return;
    }
    
    // For each task, check if it has labor entries
    updatedTasks.forEach(task => {
      // Fetch labor entries for this task
      fetch(`/api/tasks/${task.id}/labor`)
        .then(response => response.json())
        .then(laborEntries => {
          if (laborEntries && laborEntries.length > 0) {
            // Sort labor entries by work date
            const sortedLabor = [...laborEntries].sort((a, b) => 
              new Date(a.workDate).getTime() - new Date(b.workDate).getTime()
            );
            
            // Get earliest and latest labor dates
            const firstLabor = sortedLabor[0];
            const lastLabor = sortedLabor[sortedLabor.length - 1];
            
            // Update task with labor dates
            task.laborStartDate = firstLabor.workDate || firstLabor.startDate;
            task.laborEndDate = lastLabor.workDate || lastLabor.endDate;
            task.hasLinkedLabor = true;
            
            console.log(`Task ${task.id} has ${laborEntries.length} labor entries. Labor dates: ${task.laborStartDate} - ${task.laborEndDate}`);
          } else {
            task.hasLinkedLabor = false;
          }
        })
        .catch(error => {
          console.error(`Error fetching labor for task ${task.id}:`, error);
          task.hasLinkedLabor = false;
        })
        .finally(() => {
          // Decrement pending tasks counter
          pendingTasks--;
          
          // If all tasks are processed, update state
          if (pendingTasks === 0) {
            setTasksWithLabor(updatedTasks);
          }
        });
    });
  }, [tasks]);
  
  // Use tasksWithLabor instead of tasks for display
  const displayTasks = tasksWithLabor.length > 0 ? tasksWithLabor : tasks;
  
  // Filter tasks based on search
  const filteredTasks = displayTasks?.filter(task => 
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
  
  // Sort tasks within each category by task ID pattern (DR1, DR2, FR1, FR2, etc.)
  Object.keys(tasksByCategory || {}).forEach(category => {
    tasksByCategory[category].sort((a, b) => {
      // Extract task codes and numbers from titles (e.g., "DR1", "FR2", "PL3", etc.)
      // This matches any 2-letter code followed by numbers
      const aMatch = a.title.match(/([A-Z]{2})(\d+)/i);
      const bMatch = b.title.match(/([A-Z]{2})(\d+)/i);
      
      // If both have code/number patterns
      if (aMatch && bMatch) {
        // First compare the code (DR, FR, PL, etc.)
        const aCode = aMatch[1].toUpperCase();
        const bCode = bMatch[1].toUpperCase();
        
        if (aCode === bCode) {
          // Same code, compare by number
          return parseInt(aMatch[2]) - parseInt(bMatch[2]);
        }
        
        // Different codes, sort alphabetically by code
        return aCode.localeCompare(bCode);
      }
      
      // If only one has a code pattern, prioritize it
      if (aMatch) return -1;
      if (bMatch) return 1;
      
      // Otherwise, sort alphabetically by title
      return a.title.localeCompare(b.title);
    });
  });
  
  // Get unique categories
  const categories = Object.keys(tasksByCategory || {}).sort();
  
  // Sort tasks by template ID pattern (DR1, DR2, FR1, FR2, etc.)
  const sortedTasks = [...(tasks || [])].sort((a, b) => {
    // Extract task codes and numbers from titles (e.g., "DR1", "FR2", "PL3", etc.)
    // This matches any 2-letter code followed by numbers
    const aMatch = a.title.match(/([A-Z]{2})(\d+)/i);
    const bMatch = b.title.match(/([A-Z]{2})(\d+)/i);
    
    // If both have code/number patterns
    if (aMatch && bMatch) {
      // First compare the code (DR, FR, PL, etc.)
      const aCode = aMatch[1].toUpperCase();
      const bCode = bMatch[1].toUpperCase();
      
      if (aCode === bCode) {
        // Same code, compare by number
        return parseInt(aMatch[2]) - parseInt(bMatch[2]);
      }
      
      // Different codes, sort alphabetically by code
      return aCode.localeCompare(bCode);
    }
    
    // If only one has a code pattern, prioritize it
    if (aMatch) return -1;
    if (bMatch) return 1;
    
    // Otherwise, sort alphabetically by title
    return a.title.localeCompare(b.title);
  });
  
  // Format tasks for Gantt chart with proper null handling
  // Use tasksWithLabor instead of sortedTasks to include labor dates
  const ganttTasks = displayTasks.map(task => {
    // Determine if we should use task dates or labor dates
    const useLabor = task.hasLinkedLabor && task.laborStartDate && task.laborEndDate;
    
    // Choose appropriate dates
    const startDate = useLabor ? new Date(task.laborStartDate!) : new Date(task.startDate);
    const endDate = useLabor ? new Date(task.laborEndDate!) : new Date(task.endDate);
    
    // Add a visual indicator that labor dates are being used
    const title = useLabor ? `${task.title} (Labor)` : task.title;
    
    return {
      id: task.id,
      title: title,
      description: task.description || null,
      startDate: startDate,
      endDate: endDate,
      status: task.status,
      assignedTo: task.assignedTo || null,
      category: task.category || "other",
      contactIds: task.contactIds || null,
      materialIds: task.materialIds || null,
      projectId: task.projectId,
      completed: task.completed ?? null,
      materialsNeeded: task.materialsNeeded || null,
      hasLinkedLabor: useLabor,
      durationDays: Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    };
  }) || [];
  
  // Get appropriate icon for each category
  const getCategoryIcon = (category: string, className: string = "h-5 w-5") => {
    switch (category.toLowerCase()) {
      case 'foundation':
        return <Landmark className={`${className} text-stone-700`} />;
      case 'electrical':
        return <Zap className={`${className} text-yellow-600`} />;
      case 'plumbing':
        return <Droplet className={`${className} text-blue-600`} />;
      case 'roof':
        return <HardHat className={`${className} text-red-600`} />;
      case 'windows & doors':
        return <Mailbox className={`${className} text-amber-700`} />;
      case 'permits & approvals':
        return <FileCheck className={`${className} text-indigo-600`} />;
      case 'exterior':
        return <Landmark className={`${className} text-sky-600`} />;
      case 'framing':
        return <Construction className={`${className} text-orange-600`} />;
      case 'drywall':
        return <LayoutGrid className={`${className} text-green-600`} />;
      case 'uncategorized':
        return <Package className={`${className} text-slate-700`} />;
      default:
        return <Construction className={`${className} text-gray-700`} />;
    }
  };
  
  // Get category icon background color
  const getCategoryIconBackground = (category: string) => {
    switch (category.toLowerCase()) {
      case 'foundation':
        return 'bg-stone-200';
      case 'electrical':
        return 'bg-yellow-200';
      case 'plumbing':
        return 'bg-blue-200';
      case 'roof':
        return 'bg-red-200';
      case 'windows & doors':
        return 'bg-amber-200';
      case 'permits & approvals':
        return 'bg-indigo-200';
      case 'exterior':
        return 'bg-sky-200';
      case 'framing':
        return 'bg-orange-200';
      case 'drywall':
        return 'bg-green-200';
      case 'uncategorized':
        return 'bg-slate-200';
      default:
        return 'bg-gray-200';
    }
  };
  
  // Get category description
  const getCategoryDescription = (category: string) => {
    switch (category.toLowerCase()) {
      case 'foundation':
        return 'Base construction and support';
      case 'electrical':
        return 'Wiring, panels, and lighting';
      case 'plumbing':
        return 'Pipes, fixtures, and fittings';
      case 'roof':
        return 'Roof construction and materials';
      case 'windows & doors':
        return 'Openings and entry points';
      case 'permits & approvals':
        return 'Legal documents and certifications';
      case 'exterior':
        return 'Outer structure and finishing';
      case 'framing':
        return 'Structural framework elements';
      case 'drywall':
        return 'Interior wall installation';
      case 'uncategorized':
        return 'Other miscellaneous tasks';
      default:
        return 'Construction and building tasks';
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
              <div className="flex items-center gap-2 mb-4">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setSelectedCategory(null)}
                  className="flex items-center gap-1 text-green-500 hover:text-green-600 hover:bg-green-50"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-left">
                    <path d="m15 18-6-6 6-6"/>
                  </svg>
                  Back to categories
                </Button>
                <div className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium flex items-center gap-1">
                  {getCategoryIcon(selectedCategory, "h-4 w-4")}
                  {selectedCategory}
                </div>
              </div>
              
              <div className="space-y-4">
                {tasksByCategory[selectedCategory]?.map((task) => {
                  const progress = getTaskProgress(task);
                  
                  return (
                    <Card key={task.id} className={`border-l-4 ${getStatusBorderColor(task.status)} shadow-sm hover:shadow transition-shadow duration-200`}>
                      <CardHeader className="py-3 px-4">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center">
                            <div className={`w-3 h-3 rounded-full mr-2 ${task.status === 'completed' ? 'bg-green-500' : task.status === 'in_progress' ? 'bg-blue-500' : 'bg-amber-500'}`}></div>
                            <CardTitle className="text-base font-semibold line-clamp-1">{task.title}</CardTitle>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusBgColor(task.status)}`}>
                            {formatTaskStatus(task.status)}
                          </span>
                        </div>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <div className="grid grid-cols-2 gap-2 mb-2">
                          <div className="flex items-center text-sm text-muted-foreground">
                            <CalendarDays className="h-4 w-4 mr-1 flex-shrink-0" />
                            <span className="truncate">{formatDate(task.startDate)} - {formatDate(task.endDate)}</span>
                          </div>
                          <div className="flex items-center text-sm text-muted-foreground">
                            <User className="h-4 w-4 mr-1 flex-shrink-0" />
                            <span className="truncate">{task.assignedTo || "Unassigned"}</span>
                          </div>
                        </div>

                        <div className="mb-3">
                          <div className="w-full bg-slate-100 rounded-full h-2">
                            <div className={getProgressColor(task.status)} style={{ width: `${progress}%` }}></div>
                          </div>
                          <div className="text-xs text-right mt-1">{progress}% Complete</div>
                        </div>
                        
                        {/* Always display attached contacts and materials */}
                        <TaskAttachments task={task} className="mt-1" />
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
                    className="rounded-lg border bg-card text-card-foreground shadow-sm h-full transition-all hover:shadow-md cursor-pointer"
                    onClick={() => setSelectedCategory(category)}
                  >
                    <div className={`flex flex-col space-y-1.5 p-6 rounded-t-lg ${getCategoryIconBackground(category)}`}>
                      <div className="flex justify-center py-4">
                        <div className="p-2 rounded-full bg-white bg-opacity-70">
                          {getCategoryIcon(category, "h-8 w-8 text-green-500")}
                        </div>
                      </div>
                    </div>
                    <div className="p-6 pt-6">
                      <h3 className="text-2xl font-semibold leading-none tracking-tight">
                        {category}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-2">
                        {getCategoryDescription(category)}
                      </p>
                      <div className="mt-4 text-sm text-muted-foreground">
                        <div className="flex justify-between mb-1">
                          <span>{totalTasks} {totalTasks === 1 ? 'task' : 'tasks'}</span>
                          <span>{completionPercentage}% complete</span>
                        </div>
                        <div className="flex justify-between">
                          <span>{completed} completed</span>
                          {inProgress > 0 && <span>{inProgress} in progress</span>}
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 mt-2">
                          <div 
                            className="bg-green-500 rounded-full h-2" 
                            style={{ width: `${completionPercentage}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
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
                <div className="h-[500px]">
                  <GanttChart 
                    tasks={ganttTasks} 
                    onAddTask={onAddTask}
                    onUpdateTask={async (id, updatedTaskData) => {
                      try {
                        const response = await fetch(`/api/tasks/${id}`, {
                          method: 'PUT',
                          headers: {
                            'Content-Type': 'application/json',
                          },
                          body: JSON.stringify(updatedTaskData),
                        });
                        
                        if (!response.ok) {
                          throw new Error('Failed to update task');
                        }
                        
                        // Invalidate and refetch tasks query
                        queryClient.invalidateQueries({ 
                          queryKey: ["/api/projects", projectId, "tasks"] 
                        });
                      } catch (error) {
                        console.error('Error updating task:', error);
                      }
                    }}
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