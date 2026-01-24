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
import { useColors, hexToRgba, getStatusBgColor, formatTaskStatus } from '@/lib/colors';
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
import { useCategoryNameMapping } from '@/hooks/useCategoryNameMapping';
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
  showManageTasksButton?: boolean;
  showProject?: boolean;
  getProjectName?: (id: number) => string;
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelection?: () => void;
}

export function TaskCard({ task, className = '', compact = false, showActions = true, showManageTasksButton = false, showProject = true, getProjectName, isSelectionMode = false, isSelected = false, onToggleSelection }: TaskCardProps) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isCompleted, setIsCompleted] = useState(task.completed || task.status === 'completed');

  // Get category name mapping for this project
  const { mapTier1CategoryName, mapTier2CategoryName } = useCategoryNameMapping(task.projectId);

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

  // Use simplified color system - single source of truth
  const { getTier1Color, getTier2Color } = useColors(task.projectId);

  // Get colors for this task
  const tier1Color = task.tier1Category ? getTier1Color(task.tier1Category) : null;
  const tier2Color = task.tier2Category ? getTier2Color(task.tier2Category, task.tier1Category) : null;
  const primaryColor = tier2Color || tier1Color || '#6366f1';


  return (
    <Card
      key={task.id}
      className={`border-l-4 shadow-sm hover:shadow transition-all duration-200 ${className} overflow-hidden w-full min-w-0 max-w-full cursor-pointer`}
      style={{
        borderLeftColor: primaryColor || '#94a3b8'
      }}
      onClick={compact || isSelectionMode ? undefined : handleCardClick}
    >
      <CardHeader
        className={`p-5 pb-3 border-b ${safeStatus === "completed" ? "border-emerald-200" :
            safeStatus === "in_progress" ? "border-blue-200" :
              safeStatus === "delayed" ? "border-yellow-200" :
                "border-slate-200"
          }`}
        style={{
          backgroundColor: primaryColor ? hexToRgba(primaryColor, 0.1) : 'rgb(241, 245, 249)'
        }}
      >
        <div className="flex justify-between items-start gap-2 w-full">
          <div className="flex items-center min-w-0 flex-1">
            {isSelectionMode ? (
              <div
                className="flex items-center mr-2 touch-manipulation flex-shrink-0"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleSelection?.();
                }}
              >
                <Checkbox
                  id={`select-task-${task.id}`}
                  checked={isSelected}
                  className="bg-white h-5 w-5"
                />
              </div>
            ) : (
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
            )}
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
              {task.description.split('\n').map((line: string, index: number) => (
                <p key={index} className={index > 0 ? "mt-1" : ""}>
                  {line}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Display category badges if available */}
        {(task.tier1Category || task.tier2Category) && (
          <div className="flex items-center mt-3 mb-1 flex-wrap gap-1.5">
            {task.tier1Category && (
              <CategoryBadge
                category={mapTier1CategoryName(task.tier1Category)}
                type="tier1"
                className="text-xs"
                color={tier1Color}
              />
            )}
            {task.tier2Category && (
              <CategoryBadge
                category={mapTier2CategoryName(task.tier2Category)}
                type="tier2"
                className="text-xs"
                color={tier2Color}
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
                  progress > 80 ? '#10b981' : // emerald-500 (completed)
                    progress > 40 ? '#6366f1' : // primary color
                      '#94a3b8'   // slate-400 (low progress)
              }}
            ></div>
          </div>
          <div className="flex justify-between text-xs mt-2 w-full overflow-hidden">
            <span
              className="truncate max-w-[70%] pr-2 font-medium"
              style={{
                color: primaryColor || '#64748b'
              }}
            >
              {getProjectName ? getProjectName(task.projectId) : task.projectName || `Project #${task.projectId}`}
            </span>
            <span className="whitespace-nowrap flex-shrink-0 font-medium text-slate-500">{progress}% Complete</span>
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