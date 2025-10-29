import React, { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from '@/components/ui/button';
import { PlayCircle, PauseCircle, CheckCircle } from 'lucide-react';

interface TaskStatusToggleProps {
  task: any;
  onStatusChange?: (newStatus: string) => void;
  compact?: boolean;
}

export function TaskStatusToggle({ task, onStatusChange, compact = false }: TaskStatusToggleProps) {
  const { toast } = useToast();
  const [currentStatus, setCurrentStatus] = useState(task.status || 'not_started');
  const [isUpdating, setIsUpdating] = useState(false);

  // Status options with their respective icons and colors
  const statusOptions = [
    { value: 'not_started', label: 'Not Started', icon: PauseCircle, color: 'text-slate-500' },
    { value: 'in_progress', label: 'In Progress', icon: PlayCircle, color: 'text-yellow-500' },
    { value: 'completed', label: 'Completed', icon: CheckCircle, color: 'text-green-500' }
  ];

  // Get current status option
  const currentStatusOption = statusOptions.find(option => option.value === currentStatus) || statusOptions[0];
  const StatusIcon = currentStatusOption.icon;

  // Handle status change
  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === currentStatus) return;
    
    setIsUpdating(true);
    
    try {
      const updateData = {
        status: newStatus,
        // If the new status is completed, also set completed flag to true
        completed: newStatus === 'completed'
      };
      
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      if (response.ok) {
        setCurrentStatus(newStatus);
        
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
        
        // Notify parent component if needed
        if (onStatusChange) {
          onStatusChange(newStatus);
        }
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: errorData.message || "Failed to update task status. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error updating task status:", error);
      toast({
        title: "Error",
        description: "Something went wrong while updating the task status. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  if (compact) {
    // Display just the icon button in compact mode
    return (
      <div className="flex items-center gap-2">
        <Button 
          variant="ghost"
          size="sm"
          className={`p-1 ${currentStatusOption.color}`}
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            
            // Cycle through statuses: not_started -> in_progress -> completed -> not_started
            const currentIndex = statusOptions.findIndex(option => option.value === currentStatus);
            const nextIndex = (currentIndex + 1) % statusOptions.length;
            handleStatusChange(statusOptions[nextIndex].value);
          }}
          disabled={isUpdating}
        >
          <StatusIcon className="h-5 w-5" />
        </Button>
      </div>
    );
  }

  // Full select dropdown for normal mode
  return (
    <div className="flex items-center gap-2">
      <Select
        value={currentStatus}
        onValueChange={handleStatusChange}
        disabled={isUpdating}
      >
        <SelectTrigger className="w-[140px] border border-slate-200">
          <div className="flex items-center gap-2">
            <StatusIcon className={`h-4 w-4 ${currentStatusOption.color}`} />
            <SelectValue placeholder="Select Status" />
          </div>
        </SelectTrigger>
        <SelectContent>
          {statusOptions.map(option => {
            const OptionIcon = option.icon;
            return (
              <SelectItem key={option.value} value={option.value}>
                <div className="flex items-center gap-2">
                  <OptionIcon className={`h-4 w-4 ${option.color}`} />
                  <span>{option.label}</span>
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
}