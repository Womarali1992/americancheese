import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Package, Users, AlertCircle, CheckCircle2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface BulkAssignMaterialDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  materialId: number;
  materialName: string;
  projectId?: number;
}

export function BulkAssignMaterialDialog({
  open,
  onOpenChange,
  materialId,
  materialName,
  projectId,
}: BulkAssignMaterialDialogProps) {
  const [selectedProjectId, setSelectedProjectId] = useState<number | undefined>(projectId);
  const [selectedTier1Category, setSelectedTier1Category] = useState<string>("");
  const [selectedTier2Category, setSelectedTier2Category] = useState<string>("");
  const [assignmentResult, setAssignmentResult] = useState<{
    success: boolean;
    message: string;
    results?: {
      totalTasks: number;
      successCount: number;
      failureCount: number;
      updatedTaskIds: number[];
      failedTaskIds: number[];
    };
  } | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch projects
  const { data: projects = [] } = useQuery({
    queryKey: ["/api/projects"],
  }) as { data: any[] };

  // Fetch tasks for the selected project to get available categories
  const { data: tasks = [] } = useQuery({
    queryKey: ["/api/projects", selectedProjectId, "tasks"],
    enabled: !!selectedProjectId,
  }) as { data: any[] };

  // Extract unique tier1 and tier2 categories from tasks
  const tier1Categories = Array.from(
    new Set(tasks.map(task => task.tier1Category).filter(Boolean))
  ).sort();

  const tier2Categories = Array.from(
    new Set(
      tasks
        .filter(task => !selectedTier1Category || task.tier1Category === selectedTier1Category)
        .map(task => task.tier2Category)
        .filter(Boolean)
    )
  ).sort();

  // Get count of tasks that would be affected
  const getTaskCount = () => {
    if (!selectedTier2Category) return 0;
    return tasks.filter(task => {
      const matchesTier2 = task.tier2Category === selectedTier2Category;
      const matchesTier1 = !selectedTier1Category || task.tier1Category === selectedTier1Category;
      return matchesTier2 && matchesTier1;
    }).length;
  };

  // Bulk assignment mutation
  const bulkAssignMutation = useMutation({
    mutationFn: async () => {
      if (!selectedProjectId || !selectedTier2Category) {
        throw new Error("Project and tier 2 category are required");
      }

      const response = await apiRequest(
        `/api/materials/${materialId}/assign-to-tier2-category`,
        "POST",
        {
          projectId: selectedProjectId,
          tier1Category: selectedTier1Category || undefined,
          tier2Category: selectedTier2Category,
        }
      );

      return response;
    },
    onSuccess: (data) => {
      setAssignmentResult(data);
      
      // Invalidate relevant queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/materials"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      if (selectedProjectId) {
        queryClient.invalidateQueries({ queryKey: ["/api/projects", selectedProjectId, "materials"] });
        queryClient.invalidateQueries({ queryKey: ["/api/projects", selectedProjectId, "tasks"] });
      }

      toast({
        title: "Material Assigned",
        description: data.message,
      });
    },
    onError: (error: any) => {
      setAssignmentResult({
        success: false,
        message: error.message || "Failed to assign material to tasks",
      });
      
      toast({
        title: "Assignment Failed",
        description: error.message || "Failed to assign material to tasks",
        variant: "destructive",
      });
    },
  });

  const handleAssign = () => {
    if (!selectedProjectId || !selectedTier2Category) {
      toast({
        title: "Missing Information",
        description: "Please select a project and tier 2 category",
        variant: "destructive",
      });
      return;
    }

    bulkAssignMutation.mutate();
  };

  const handleClose = () => {
    setAssignmentResult(null);
    setSelectedTier1Category("");
    setSelectedTier2Category("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Bulk Assign Material to Category
          </DialogTitle>
          <DialogDescription>
            Assign "{materialName}" to all tasks in a specific tier 2 category
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!assignmentResult ? (
            <>
              {/* Project Selection */}
              <div className="space-y-2">
                <Label htmlFor="project">Project</Label>
                <Select
                  value={selectedProjectId?.toString() || ""}
                  onValueChange={(value) => {
                    setSelectedProjectId(Number(value));
                    setSelectedTier1Category("");
                    setSelectedTier2Category("");
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id.toString()}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Tier 1 Category Selection (Optional) */}
              {selectedProjectId && tier1Categories.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="tier1">Tier 1 Category (Optional)</Label>
                  <Select
                    value={selectedTier1Category}
                    onValueChange={(value) => {
                      setSelectedTier1Category(value);
                      setSelectedTier2Category("");
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All tier 1 categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All tier 1 categories</SelectItem>
                      {tier1Categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category.charAt(0).toUpperCase() + category.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Tier 2 Category Selection */}
              {selectedProjectId && tier2Categories.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="tier2">Tier 2 Category *</Label>
                  <Select
                    value={selectedTier2Category}
                    onValueChange={setSelectedTier2Category}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select tier 2 category" />
                    </SelectTrigger>
                    <SelectContent>
                      {tier2Categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category.charAt(0).toUpperCase() + category.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Task Count Preview */}
              {selectedTier2Category && (
                <Alert>
                  <Users className="h-4 w-4" />
                  <AlertTitle>Preview</AlertTitle>
                  <AlertDescription>
                    This will assign the material to{" "}
                    <strong>{getTaskCount()} tasks</strong> in the{" "}
                    <strong>{selectedTier2Category}</strong> category
                    {selectedTier1Category && (
                      <span> within the <strong>{selectedTier1Category}</strong> tier 1 category</span>
                    )}.
                  </AlertDescription>
                </Alert>
              )}
            </>
          ) : (
            /* Assignment Result */
            <Alert className={assignmentResult.success ? "border-green-200" : "border-red-200"}>
              {assignmentResult.success ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-600" />
              )}
              <AlertTitle>
                {assignmentResult.success ? "Assignment Successful" : "Assignment Failed"}
              </AlertTitle>
              <AlertDescription>
                {assignmentResult.message}
                {assignmentResult.results && (
                  <div className="mt-2 text-sm">
                    <p>• Total tasks: {assignmentResult.results.totalTasks}</p>
                    <p>• Successfully assigned: {assignmentResult.results.successCount}</p>
                    {assignmentResult.results.failureCount > 0 && (
                      <p>• Failed: {assignmentResult.results.failureCount}</p>
                    )}
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          {!assignmentResult ? (
            <>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                onClick={handleAssign}
                disabled={!selectedProjectId || !selectedTier2Category || bulkAssignMutation.isPending}
              >
                {bulkAssignMutation.isPending ? "Assigning..." : "Assign to Tasks"}
              </Button>
            </>
          ) : (
            <Button onClick={handleClose}>Close</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}