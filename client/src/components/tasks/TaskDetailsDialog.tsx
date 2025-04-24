import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDate } from "@/lib/utils";
import { CalendarDays, User, Tag, Clock } from "lucide-react";

interface TaskDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: any; // Task data with full details
}

export function TaskDetailsDialog({
  open,
  onOpenChange,
  task
}: TaskDetailsDialogProps) {
  if (!task) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            {task.title}
          </DialogTitle>
          <DialogDescription className="flex justify-between items-center">
            <StatusBadge status={task.status} />
            <div className="text-sm text-gray-500">
              ID: {task.id}
            </div>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {task.description && (
            <div className="space-y-1">
              <h4 className="text-sm font-medium text-gray-700">Description</h4>
              <p className="text-sm text-gray-600">{task.description}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-start gap-2">
              <CalendarDays className="h-4 w-4 text-gray-500 mt-0.5" />
              <div>
                <h4 className="text-xs font-medium text-gray-700">Start Date</h4>
                <p className="text-sm">{formatDate(task.startDate)}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Clock className="h-4 w-4 text-gray-500 mt-0.5" />
              <div>
                <h4 className="text-xs font-medium text-gray-700">End Date</h4>
                <p className="text-sm">{formatDate(task.endDate)}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-start gap-2">
              <User className="h-4 w-4 text-gray-500 mt-0.5" />
              <div>
                <h4 className="text-xs font-medium text-gray-700">Assigned To</h4>
                <p className="text-sm">{task.assignedTo || "Unassigned"}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Tag className="h-4 w-4 text-gray-500 mt-0.5" />
              <div>
                <h4 className="text-xs font-medium text-gray-700">Category</h4>
                <p className="text-sm">{task.category || "Uncategorized"}</p>
              </div>
            </div>
          </div>

          {/* Additional Categorization */}
          {(task.tier1Category || task.tier2Category) && (
            <div className="grid grid-cols-2 gap-4">
              {task.tier1Category && (
                <div className="flex items-start gap-2">
                  <Tag className="h-4 w-4 text-gray-500 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-medium text-gray-700">Main Category</h4>
                    <p className="text-sm capitalize">{task.tier1Category}</p>
                  </div>
                </div>
              )}
              {task.tier2Category && (
                <div className="flex items-start gap-2">
                  <Tag className="h-4 w-4 text-gray-500 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-medium text-gray-700">Sub Category</h4>
                    <p className="text-sm capitalize">{task.tier2Category}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}