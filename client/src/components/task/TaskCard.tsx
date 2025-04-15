import React from 'react';
import { useLocation } from 'wouter';
import { 
  Calendar, 
  User,
  ChevronRight
} from 'lucide-react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';
import { getStatusBorderColor, getStatusBgColor, getCategoryProgressColor, formatTaskStatus } from '@/lib/color-utils';

interface TaskCardProps {
  task: any;
  className?: string;
  compact?: boolean;
  showActions?: boolean;
  getProjectName?: (id: number) => string;
}

export function TaskCard({ task, className = '', compact = false, showActions = true, getProjectName }: TaskCardProps) {
  const [, navigate] = useLocation();
  
  // Calculate task progress
  const progress = task.progress !== undefined ? task.progress :
    task.status === 'completed' ? 100 :
    task.status === 'not_started' ? 0 : 50;
  
  // Handle card click
  const handleCardClick = () => {
    navigate(`/tasks/${task.id}`);
  };
  
  return (
    <Card 
      key={task.id} 
      className={`border-l-4 ${getStatusBorderColor(task.status)} shadow-sm hover:shadow transition-shadow duration-200 ${className}`}
      onClick={compact ? undefined : handleCardClick}
    >
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
          <Calendar className="h-4 w-4 mr-1 text-orange-500" />
          {formatDate(task.startDate)} - {formatDate(task.endDate)}
        </div>
        <div className="flex items-center text-sm text-muted-foreground mt-1">
          <User className="h-4 w-4 mr-1 text-orange-500" />
          {task.assignedTo || "Unassigned"}
        </div>
        <div className="mt-2">
          <div className="w-full bg-slate-100 rounded-full h-2">
            <div 
              className={`${getCategoryProgressColor(task.category || 'default')} rounded-full h-2`} 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-xs mt-1">
            <span>{getProjectName ? getProjectName(task.projectId) : task.projectName || `Project #${task.projectId}`}</span>
            <span>{progress}% Complete</span>
          </div>
        </div>
        
        {showActions && !compact && (
          <div className="mt-3 flex justify-end">
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