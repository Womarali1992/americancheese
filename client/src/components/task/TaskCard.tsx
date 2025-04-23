import React, { useState } from 'react';
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
import { getStatusBorderColor, getStatusBgColor, getProgressColor, formatTaskStatus } from '@/lib/color-utils';
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
  
  return (
    <Card 
      key={task.id} 
      className={`border-l-4 ${getStatusBorderColor(safeStatus)} shadow-sm hover:shadow-md transition-shadow duration-200 ${className} overflow-hidden`}
      onClick={compact ? undefined : handleCardClick}
    >
      <CardHeader className={`p-4 pb-2 bg-gradient-to-r ${
        safeStatus === "completed" ? "from-green-50 to-green-100" : 
        safeStatus === "in_progress" ? "from-yellow-50 to-yellow-100" : 
        safeStatus === "delayed" ? "from-red-50 to-red-100" : 
        "from-slate-50 to-slate-100"
      } border-b border-slate-200`}>
        <div className="flex justify-between items-start">
          <div className="flex items-center">
            <div 
              className="flex items-center mr-2"
              onClick={(e) => handleTaskCompletion(e)}
            >
              <Checkbox 
                id={`complete-task-${task.id}`} 
                checked={isCompleted}
                className="mr-1 bg-white"
              />
            </div>
            <div className="flex items-center">
              <div className="h-full w-1 rounded-full bg-green-500 mr-2 self-stretch"></div>
              <CardTitle className="text-base font-semibold text-slate-900">{task.title}</CardTitle>
            </div>
          </div>
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
            safeStatus === "completed" ? "bg-green-100 text-green-800 border border-green-200" :
            safeStatus === "in_progress" ? "bg-yellow-100 text-yellow-800 border border-yellow-200" :
            safeStatus === "delayed" ? "bg-red-100 text-red-800 border border-red-200" :
            "bg-slate-100 text-slate-800 border border-slate-200"
          }`}>
            {formatTaskStatus(safeStatus)}
          </span>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="flex items-center text-sm text-muted-foreground mt-1">
          <Calendar className="h-4 w-4 mr-1 text-orange-500" />
          {formatDate(task.startDate || new Date())} - {formatDate(task.endDate || new Date())}
        </div>
        <div className="flex items-center text-sm text-muted-foreground mt-1">
          <User className="h-4 w-4 mr-1 text-orange-500" />
          {task.assignedTo || "Unassigned"}
        </div>
        <div className="mt-2">
          <div className="w-full bg-slate-100 rounded-full h-2">
            <div 
              className={`${getProgressColor(progress)} rounded-full h-2`} 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-xs mt-1">
            <span>{getProjectName ? getProjectName(task.projectId) : task.projectName || `Project #${task.projectId}`}</span>
            <span>{progress}% Complete</span>
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
        
        {showActions && !compact && (
          <div className="mt-3 flex justify-end items-center">
            <div className="flex gap-2">
              {showManageTasksButton && task.projectId && (
                <div className="relative">
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
                      className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-green-600 hover:bg-green-700 text-white h-9 px-3 py-2"
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <ListTodo className="h-4 w-4" />
                        <span>Manage Tasks</span>
                      </div>
                    </SelectTrigger>
                    <SelectContent>
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
                </div>
              )}
              <Button
                variant="outline"
                size="sm"
                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/tasks/${task.id}`);
                }}
              >
                <ChevronRight className="h-4 w-4 mr-1" />
                View Details
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsDeleteDialogOpen(true);
                }}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
            </div>
          </div>
        )}
        
        {/* Delete Confirmation Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                Confirm Task Deletion
              </DialogTitle>
              <DialogDescription>
                Are you sure you want to delete task "{task.title}"? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="pt-2">
              <p className="text-sm text-muted-foreground">
                Deleting this task will remove it permanently from the system. Any associated labor records, materials, and attachments may also be affected.
              </p>
            </div>
            <DialogFooter className="flex sm:justify-end gap-2 mt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsDeleteDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                type="button" 
                variant="destructive" 
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