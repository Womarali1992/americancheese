import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, User, Building2 } from "lucide-react";
import { type Task } from "@shared/schema";

interface TaskSelectorProps {
  value?: string | number;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  projectId?: number;
  disabled?: boolean;
  className?: string;
}

export function TaskSelector({
  value,
  onValueChange,
  placeholder = "Select a task",
  projectId,
  disabled = false,
  className
}: TaskSelectorProps) {
  // Fetch all tasks
  const { data: tasks = [], isLoading } = useQuery<Task[]>({
    queryKey: projectId ? ['/api/projects', projectId, 'tasks'] : ['/api/tasks'],
    enabled: !disabled,
  });

  // Filter tasks by project if specified
  const filteredTasks = projectId 
    ? tasks.filter(task => task.projectId === projectId)
    : tasks;

  // Sort tasks by title for better UX
  const sortedTasks = [...filteredTasks].sort((a, b) => a.title.localeCompare(b.title));

  const formatStatus = (status: string) => {
    return status
      .split("_")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      case "on_hold":
        return "bg-yellow-100 text-yellow-800";
      case "not_started":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Select 
      value={value?.toString()} 
      onValueChange={onValueChange}
      disabled={disabled || isLoading}
    >
      <SelectTrigger className={className}>
        <SelectValue placeholder={isLoading ? "Loading tasks..." : placeholder} />
      </SelectTrigger>
      <SelectContent className="max-h-80">
        {sortedTasks.length === 0 ? (
          <div className="p-2 text-sm text-muted-foreground text-center">
            {isLoading ? "Loading tasks..." : "No tasks available"}
          </div>
        ) : (
          sortedTasks.map((task) => (
            <SelectItem key={task.id} value={task.id.toString()}>
              <div className="flex items-center justify-between w-full">
                <div className="flex flex-col gap-1 min-w-0 flex-1">
                  <div className="font-medium truncate">{task.title}</div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Building2 className="h-3 w-3" />
                      <span>{task.tier1Category}</span>
                      {task.tier2Category && (
                        <>
                          <span>/</span>
                          <span>{task.tier2Category}</span>
                        </>
                      )}
                    </div>
                    {task.assignedTo && (
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        <span>{task.assignedTo}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <CalendarDays className="h-3 w-3" />
                      <span>{task.startDate} - {task.endDate}</span>
                    </div>
                  </div>
                </div>
                <Badge
                  variant="secondary"
                  className={`ml-2 text-xs ${getStatusColor(task.status)}`}
                >
                  {formatStatus(task.status)}
                </Badge>
              </div>
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  );
}