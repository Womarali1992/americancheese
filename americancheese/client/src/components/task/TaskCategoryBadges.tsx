import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, Plus, Star } from "lucide-react";
import { Task, TaskCategory } from "@/types";
import { CategoryBadge } from "@/components/ui/category-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ManageTaskCategoriesDialog } from "./ManageTaskCategoriesDialog";

interface TaskCategoryBadgesProps {
  task: Task;
  compact?: boolean;
  showManageButton?: boolean;
  onCategoriesChanged?: () => void;
}

export function TaskCategoryBadges({
  task,
  compact = false,
  showManageButton = false,
  onCategoriesChanged,
}: TaskCategoryBadgesProps) {
  const [manageOpen, setManageOpen] = useState(false);

  // Fetch additional categories for this task
  const { data: taskCategories = [] } = useQuery<TaskCategory[]>({
    queryKey: [`/api/tasks/${task.id}/categories`],
    enabled: task.id > 0,
  });

  // Secondary categories (non-primary from the junction table)
  const secondaryCategories = taskCategories.filter((tc) => !tc.isPrimary);

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {/* Primary category (from task's tier1/tier2 fields) */}
      {task.tier1Category && (
        <div className="flex items-center gap-0.5">
          <CategoryBadge
            category={task.tier1Category}
            type="tier1"
            color={task.tier1Color}
            variant="solid"
            className={compact ? "text-[10px] px-1.5 py-0" : ""}
          />
          {task.tier2Category && (
            <>
              <ChevronRight className="h-3 w-3 text-muted-foreground" />
              <CategoryBadge
                category={task.tier2Category}
                type="tier2"
                color={task.tier2Color}
                variant="solid"
                className={compact ? "text-[10px] px-1.5 py-0" : ""}
              />
            </>
          )}
        </div>
      )}

      {/* Secondary categories */}
      {secondaryCategories.map((tc) => (
        <div key={tc.id} className="flex items-center gap-0.5">
          <span className="text-muted-foreground text-xs mx-0.5">|</span>
          <CategoryBadge
            category={tc.tier1Category || ""}
            type="tier1"
            variant="outline"
            className={compact ? "text-[10px] px-1.5 py-0" : "text-[11px]"}
          />
          {tc.tier2Category && (
            <>
              <ChevronRight className="h-2.5 w-2.5 text-muted-foreground" />
              <CategoryBadge
                category={tc.tier2Category}
                type="tier2"
                variant="outline"
                className={compact ? "text-[10px] px-1.5 py-0" : "text-[11px]"}
              />
            </>
          )}
        </div>
      ))}

      {/* Manage button */}
      {showManageButton && (
        <Button
          variant="ghost"
          size="sm"
          className="h-5 w-5 p-0 rounded-full text-muted-foreground hover:text-foreground"
          onClick={() => setManageOpen(true)}
          title="Manage categories"
        >
          <Plus className="h-3 w-3" />
        </Button>
      )}

      {showManageButton && (
        <ManageTaskCategoriesDialog
          open={manageOpen}
          onOpenChange={setManageOpen}
          taskId={task.id}
          projectId={task.projectId}
          onCategoriesChanged={onCategoriesChanged}
        />
      )}
    </div>
  );
}
