import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { 
  Calendar, 
  User,
  ChevronRight,
  ListTodo,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
  
  // Calculate task progress
  const progress = task.progress !== undefined ? task.progress :
    task.status === 'completed' ? 100 :
    task.status === 'not_started' ? 0 : 50;
  
  // Handle card click
  const handleCardClick = () => {
    navigate(`/tasks/${task.id}`);
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
      className={`border-l-4 ${getStatusBorderColor(safeStatus)} shadow-sm hover:shadow transition-shadow duration-200 ${className}`}
      onClick={compact ? undefined : handleCardClick}
    >
      <CardHeader className="p-4 pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-base font-semibold">{task.title}</CardTitle>
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusBgColor(safeStatus)}`}>
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
        
        {showActions && !compact && (
          <div className="mt-3 flex justify-end gap-2">
            {showManageTasksButton && task.projectId && (
              <a
                href={`/tasks?projectId=${task.projectId}`}
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-green-600 hover:bg-green-700 text-white h-9 px-3 py-2"
                onClick={(e) => {
                  e.stopPropagation();
                }}
              >
                <ListTodo className="h-4 w-4" />
                Manage Tasks
              </a>
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