import React from 'react';
import { useLocation } from 'wouter';
import { 
  Calendar, 
  User,
  ChevronRight,
  ListTodo
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
  
  // Calculate task progress
  const progress = task.progress !== undefined ? task.progress :
    task.status === 'completed' ? 100 :
    task.status === 'not_started' ? 0 : 50;
  
  // Handle card click
  const handleCardClick = () => {
    navigate(`/tasks/${task.id}`);
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
          </div>
        )}
      </CardContent>
    </Card>
  );
}