import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link2, Plus, X, Package, ChevronRight } from "lucide-react";
import { Task, Material } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AddTaskReferenceDialog } from "./AddTaskReferenceDialog";

interface ReferencedTasksSectionProps {
  taskId: number;
  projectId: number;
  referencedTaskIds: string[] | null;
  onUpdateReferencedTasks: (taskIds: string[]) => void;
}

export function ReferencedTasksSection({
  taskId,
  projectId,
  referencedTaskIds,
  onUpdateReferencedTasks,
}: ReferencedTasksSectionProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  // Fetch all tasks for this project
  const { data: allTasks = [] } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  // Fetch materials to show count per referenced task
  const { data: allMaterials = [] } = useQuery<Material[]>({
    queryKey: ["/api/materials"],
  });

  // Filter to get referenced tasks
  const referencedTasks = allTasks.filter((task) =>
    referencedTaskIds?.includes(task.id.toString())
  );

  // Get material count for a task
  const getMaterialCount = (taskId: number) => {
    return allMaterials.filter((m) =>
      m.taskIds?.includes(taskId.toString())
    ).length;
  };

  // Remove a referenced task
  const handleRemoveTask = (taskIdToRemove: number) => {
    const newIds = (referencedTaskIds || []).filter(
      (id) => id !== taskIdToRemove.toString()
    );
    onUpdateReferencedTasks(newIds);
  };

  // Add new task references
  const handleAddTasks = (newTaskIds: number[]) => {
    const existingIds = referencedTaskIds || [];
    const combinedIds = [
      ...new Set([...existingIds, ...newTaskIds.map((id) => id.toString())]),
    ];
    onUpdateReferencedTasks(combinedIds);
    setDialogOpen(false);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link2 className="h-4 w-4 text-blue-600" />
          <h4 className="font-medium text-sm">Referenced Tasks</h4>
          {referencedTasks.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {referencedTasks.length}
            </Badge>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setDialogOpen(true)}
          className="h-7 text-xs"
        >
          <Plus className="h-3 w-3 mr-1" />
          Add Task
        </Button>
      </div>

      {referencedTasks.length === 0 ? (
        <div className="text-sm text-muted-foreground py-2 px-3 bg-muted/50 rounded-md">
          No tasks referenced. Add a task to reference its materials.
        </div>
      ) : (
        <div className="space-y-2">
          {referencedTasks.map((task) => {
            const materialCount = getMaterialCount(task.id);
            return (
              <Card key={task.id} className="border-blue-200 bg-blue-50/50">
                <CardContent className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm truncate">
                          {task.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        {task.tier1Category && (
                          <span className="flex items-center gap-1">
                            {task.tier1Category}
                            {task.tier2Category && (
                              <>
                                <ChevronRight className="h-3 w-3" />
                                {task.tier2Category}
                              </>
                            )}
                          </span>
                        )}
                        {materialCount > 0 && (
                          <span className="flex items-center gap-1 text-orange-600">
                            <Package className="h-3 w-3" />
                            {materialCount} materials
                          </span>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                      onClick={() => handleRemoveTask(task.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <AddTaskReferenceDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        projectId={projectId}
        currentTaskId={taskId}
        existingReferencedTaskIds={
          referencedTaskIds?.map((id) => parseInt(id)) || []
        }
        onAddTasks={handleAddTasks}
      />
    </div>
  );
}
