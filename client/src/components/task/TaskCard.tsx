import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { 
  Calendar, 
  User,
  ChevronRight,
  ListTodo,
  Trash2,
  AlertTriangle,
  CheckCircle,
  CheckSquare,
  Users,
  PlayCircle,
  PauseCircle
} from 'lucide-react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { formatDate } from '@/lib/utils';
import { getStatusBorderColor, getStatusBgColor, getProgressColor, formatTaskStatus, getTier1CategoryColor, getThemeTaskCardColors } from '@/lib/color-utils';
import { getThemeTier1Color, getThemeTier2Color } from '@/lib/color-themes';
import { CategoryBadge } from '@/components/ui/category-badge';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';
import { TaskLabor } from '@/components/task/TaskLabor';
import { TaskMaterials } from '@/components/task/TaskMaterials';
import { TaskStatusToggle } from '@/components/task/TaskStatusToggle';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

interface TaskCardProps {
  task: any;
  className?: string;
  compact?: boolean;
  showActions?: boolean;
  showManageTasksButton?: boolean; // New property to show Manage Tasks button
  getProjectName?: (id: number) => string;
}

export function TaskCard({ task, className = '', compact = false, showActions = true, showManageTasksButton = false, getProjectName }: TaskCardProps) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isCompleted, setIsCompleted] = useState(task.completed || task.status === 'completed');
  
  // Calculate task progress
  const progress = task.progress !== undefined ? task.progress :
    task.status === 'completed' || isCompleted ? 100 :
    task.status === 'not_started' ? 0 : 50;
  
  // Handle card click
  const handleCardClick = () => {
    navigate(`/tasks/${task.id}`);
  };

  // Handle task completion toggle
  const handleTaskCompletion = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click event
    
    try {
      const newStatus = !isCompleted;
      const updateData = {
        completed: newStatus,
        status: newStatus ? 'completed' : task.status === 'completed' ? 'in_progress' : task.status
      };
      
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      if (response.ok) {
        setIsCompleted(newStatus);
        
        toast({
          title: newStatus ? "Task Completed" : "Task Reopened",
          description: `"${task.title}" has been marked as ${newStatus ? 'completed' : 'in progress'}.`,
          variant: "default",
        });

        // Invalidate queries to refresh the tasks list
        queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
        if (task.projectId) {
          queryClient.invalidateQueries({ queryKey: ['/api/projects', task.projectId, 'tasks'] });
        }
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: errorData.message || "Failed to update task. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error updating task:", error);
      toast({
        title: "Error",
        description: "Something went wrong while updating the task. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle delete task
  const handleDeleteTask = async () => {
    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        // If deletion was successful
        toast({
          title: "Task Deleted",
          description: `"${task.title}" has been successfully deleted.`,
          variant: "default",
        });

        // Invalidate queries to refresh the tasks list
        queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
        if (task.projectId) {
          queryClient.invalidateQueries({ queryKey: ['/api/projects', task.projectId, 'tasks'] });
        }
        
        // Close the delete confirmation dialog
        setIsDeleteDialogOpen(false);
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: errorData.message || "Failed to delete task. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error deleting task:", error);
      toast({
        title: "Error",
        description: "Something went wrong while deleting the task. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  // Ensure status is a valid string to prevent toLowerCase errors
  const safeStatus = task.status || 'not_started';
  
  // Force re-render when theme changes and keep updated category colors
  const [themeVersion, setThemeVersion] = useState(0);
  // Store live category colors for the task
  const [liveTier1Color, setLiveTier1Color] = useState<string | null>(null);
  const [liveTier2Color, setLiveTier2Color] = useState<string | null>(null);
  const [themeCardColors, setThemeCardColors] = useState<any>(null);
  
  // Update live colors from themes
  useEffect(() => {
    if (task.tier1Category) {
      // Always get the latest color from the theme system
      const tier1Color = getThemeTier1Color(task.tier1Category);
      setLiveTier1Color(tier1Color);
      
      if (task.tier2Category) {
        const tier2Color = getThemeTier2Color(task.tier2Category);
        setLiveTier2Color(tier2Color);
      }
    }
    
    // Get theme-based card colors
    const cardColors = getThemeTaskCardColors(task.tier1Category, task.tier2Category);
    setThemeCardColors(cardColors);
  }, [task.tier1Category, task.tier2Category, themeVersion]);
  
  // Listen for theme changes
  useEffect(() => {
    const handleThemeChange = (event: Event) => {
      // Force a re-render when theme changes
      setThemeVersion(prev => prev + 1);
      console.log('Theme changed, updating task card colors');
      
      // Force immediate refresh of colors
      if (task.tier1Category) {
        const tier1Color = getThemeTier1Color(task.tier1Category);
        setLiveTier1Color(tier1Color);
        
        if (task.tier2Category) {
          const tier2Color = getThemeTier2Color(task.tier2Category);
          setLiveTier2Color(tier2Color);
        }
      }
    };
    
    window.addEventListener('theme-changed', handleThemeChange);
    
    return () => {
      window.removeEventListener('theme-changed', handleThemeChange);
    };
  }, [task.tier1Category, task.tier2Category]);
  
  return (
    <Card 
      key={`${task.id}-${themeVersion}`} 
      className={`border-l-4 shadow-sm hover:shadow transition-all duration-200 ${className} overflow-hidden w-full min-w-0 max-w-full cursor-pointer`}
      style={{
        borderLeftColor: themeCardColors?.borderColor || (
          safeStatus === "completed" ? "#10b981" : 
          safeStatus === "in_progress" ? "#3b82f6" : 
          safeStatus === "delayed" ? "#f59e0b" : 
          "#94a3b8"
        )
      }}
      onClick={compact ? undefined : handleCardClick}
    >
      <CardHeader 
        className={`p-5 pb-3 border-b ${
          safeStatus === "completed" ? "border-emerald-100" : 
          safeStatus === "in_progress" ? "border-blue-100" : 
          safeStatus === "delayed" ? "border-orange-100" : 
          "border-slate-100"
        }`}
        style={{
          backgroundColor: themeCardColors?.backgroundColor || (
            safeStatus === "completed" ? "rgb(236, 253, 245)" : 
            safeStatus === "in_progress" ? "rgb(239, 246, 255)" : 
            safeStatus === "delayed" ? "rgb(255, 251, 235)" : 
            "rgb(248, 250, 252)"
          )
        }}
      >
        <div className="flex justify-between items-start gap-2 w-full">
          <div className="flex items-center min-w-0 flex-1">
            <div 
              className="flex items-center mr-2 touch-manipulation flex-shrink-0"
              onClick={(e) => handleTaskCompletion(e)}
            >
              <Checkbox 
                id={`complete-task-${task.id}`} 
                checked={isCompleted}
                className="bg-white h-5 w-5"
              />
            </div>
            <div className="flex items-center min-w-0 flex-1">
              <CardTitle className="text-sm sm:text-base font-semibold line-clamp-2 break-words overflow-hidden">{task.title}</CardTitle>
            </div>
          </div>
          <span className={`text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap flex-shrink-0 ${getStatusBgColor(safeStatus)}`}>
            {formatTaskStatus(safeStatus)}
          </span>
        </div>
      </CardHeader>
      <CardContent className="p-5 pt-4">
        <div className="flex items-center text-xs sm:text-sm text-slate-500 w-full overflow-hidden">
          <Calendar className="h-4 w-4 mr-2 text-slate-400 flex-shrink-0" />
          <span className="overflow-hidden text-ellipsis whitespace-nowrap w-full">
            {formatDate(task.startDate || new Date())} - {formatDate(task.endDate || new Date())}
          </span>
        </div>
        <div className="flex items-center text-xs sm:text-sm text-slate-500 mt-2 w-full overflow-hidden">
          <User className="h-4 w-4 mr-2 text-slate-400 flex-shrink-0" />
          <span className="overflow-hidden text-ellipsis whitespace-nowrap w-full">
            {task.assignedTo || "Unassigned"}
          </span>
        </div>
        
        {/* Display task description if available */}
        {task.description && (
          <div className="mt-3 p-2 bg-slate-50 rounded-md border border-slate-200">
            <div className="text-xs sm:text-sm text-slate-700 leading-relaxed">
              {task.description.split('\n').map((line, index) => (
                <p key={index} className={index > 0 ? "mt-1" : ""}>
                  {line}
                </p>
              ))}
            </div>
          </div>
        )}
        
        {/* Display tier1Category badge if available */}
        {task.tier1Category && (
          <div className="flex items-center mt-3 mb-1 flex-wrap gap-1.5">
            <CategoryBadge 
              category={task.tier1Category} 
              type="tier1"
              className="text-xs"
              color={liveTier1Color || task.tier1Color || null}
            />
            {/* Display tier2Category badge if available */}
            {task.tier2Category && (
              <CategoryBadge 
                category={task.tier2Category} 
                type="tier2"
                className="text-xs"
                color={liveTier2Color || task.tier2Color || null}
              />
            )}
          </div>
        )}
        
        <div className="mt-4">
          <div className="w-full rounded-full h-2 bg-slate-100">
            <div 
              className="rounded-full h-2 transition-all duration-300"
              style={{ 
                width: `${progress}%`, 
                backgroundColor: 
                  progress > 80 ? '#10b981' : // emerald-500  
                  progress > 40 ? '#3b82f6' : // blue-500
                                  '#94a3b8'   // slate-400
              }}
            ></div>
          </div>
          <div className="flex justify-between text-xs mt-2 w-full overflow-hidden text-slate-500">
            <span className="truncate max-w-[70%] pr-2">{getProjectName ? getProjectName(task.projectId) : task.projectName || `Project #${task.projectId}`}</span>
            <span className="whitespace-nowrap flex-shrink-0 font-medium">{progress}% Complete</span>
          </div>
        </div>

        {/* Labor entries display */}
        {task.id && (
          <div className="mt-3">
            <TaskLabor 
              taskId={task.id} 
              compact={true}
              className="mt-2"
            />
          </div>
        )}
        
        {/* Materials entries display */}
        {task.id && (
          <div className="mt-2">
            <TaskMaterials 
              taskId={task.id} 
              compact={true}
              className="mt-2"
            />
          </div>
        )}
        
        {showActions && !compact && (
          <div className="mt-3 flex flex-col justify-end w-full">
            <div className="flex flex-col w-full space-y-2">

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
                {task.projectId && (
                  <Select
                    value={safeStatus}
                    onValueChange={(newStatus) => {
                      // Call the same function that TaskStatusToggle would use
                      if (newStatus === safeStatus) return;
                      
                      // Handle the special case for viewing project tasks
                      if (newStatus === 'project_tasks') {
                        navigate(`/tasks?projectId=${task.projectId}`);
                        return;
                      }
                      
                      const updateData = {
                        status: newStatus,
                        // If the new status is completed, also set completed flag to true
                        completed: newStatus === 'completed'
                      };
                      
                      fetch(`/api/tasks/${task.id}`, {
                        method: 'PUT',
                        headers: {
                          'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(updateData)
                      })
                      .then(response => {
                        if (response.ok) {
                          // Update completed state if status changes to completed
                          if (newStatus === 'completed' && !isCompleted) {
                            setIsCompleted(true);
                          } else if (newStatus !== 'completed' && isCompleted) {
                            setIsCompleted(false);
                          }
                          
                          toast({
                            title: "Task Status Updated",
                            description: `Task has been marked as "${newStatus.replace('_', ' ').toUpperCase()}"`,
                            variant: "default",
                          });
                  
                          // Invalidate queries to refresh the tasks list
                          queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
                          if (task.projectId) {
                            queryClient.invalidateQueries({ queryKey: ['/api/projects', task.projectId, 'tasks'] });
                          }
                        } else {
                          response.json().then(errorData => {
                            toast({
                              title: "Error",
                              description: errorData.message || "Failed to update task status. Please try again.",
                              variant: "destructive",
                            });
                          });
                        }
                      })
                      .catch(error => {
                        console.error("Error updating task status:", error);
                        toast({
                          title: "Error",
                          description: "Something went wrong while updating the task status. Please try again.",
                          variant: "destructive",
                        });
                      });
                    }}
                  >
                    <SelectTrigger 
                      className="inline-flex items-center justify-center gap-1 sm:gap-2 whitespace-nowrap rounded-md text-xs sm:text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-green-600 hover:bg-green-700 text-white h-8 sm:h-9 px-2 sm:px-3 py-1 sm:py-2 w-full overflow-hidden min-w-0"
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <ListTodo className="h-4 w-4 flex-shrink-0" />
                        <span className="truncate">Manage Tasks</span>
                      </div>
                    </SelectTrigger>
                    <SelectContent className="min-w-[200px]">
                      <SelectItem value="not_started">
                        <div className="flex items-center gap-2">
                          <PauseCircle className="h-4 w-4 text-slate-500" />
                          <span>Not Started</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="in_progress">
                        <div className="flex items-center gap-2">
                          <PlayCircle className="h-4 w-4 text-yellow-500" />
                          <span>In Progress</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="completed">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span>Completed</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="project_tasks">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-blue-500" />
                          <span>View Project Tasks</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                )}
                {!task.projectId && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-green-600 hover:text-green-700 hover:bg-green-50"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/tasks`);
                    }}
                  >
                    <ListTodo className="h-4 w-4 mr-1 flex-shrink-0" />
                    <span className="truncate">Manage Tasks</span>
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsDeleteDialogOpen(true);
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-1 flex-shrink-0" />
                  <span className="truncate">Delete</span>
                </Button>
              </div>
            </div>
          </div>
        )}
        
        {/* Delete Confirmation Dialog - Mobile optimized */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="w-[95%] max-w-md mx-auto rounded-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
                <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0" />
                Confirm Task Deletion
              </DialogTitle>
              <DialogDescription className="text-sm sm:text-base">
                Are you sure you want to delete task "{task.title.length > 30 ? task.title.substring(0, 30) + '...' : task.title}"? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="pt-2">
              <p className="text-xs sm:text-sm text-muted-foreground">
                Deleting this task will remove it permanently from the system. Any associated labor records, materials, and attachments may also be affected.
              </p>
            </div>
            <DialogFooter className="flex flex-col sm:flex-row sm:justify-end gap-2 mt-4">
              <Button 
                type="button" 
                variant="outline" 
                className="w-full sm:w-auto text-sm h-10 sm:h-9"
                onClick={() => setIsDeleteDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                type="button" 
                variant="destructive" 
                className="w-full sm:w-auto text-sm h-10 sm:h-9"
                onClick={handleDeleteTask}
              >
                Delete Task
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}