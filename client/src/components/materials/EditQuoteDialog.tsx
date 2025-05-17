import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
// Using any to avoid type conflicts with Material from schema
type MaterialType = any;

interface EditQuoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  materials: MaterialType[];
  projectId?: number;
}

export function EditQuoteDialog({ open, onOpenChange, materials, projectId }: EditQuoteDialogProps) {
  const queryClient = useQueryClient();
  const [isPurchased, setIsPurchased] = useState(false);
  const [section, setSection] = useState("");
  const [subsection, setSubsection] = useState("");
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Extract quote information from the first material (we assume all materials in the same quote have the same quote details)
  const quoteInfo = materials.length > 0 ? {
    quoteNumber: materials[0].quoteNumber || "",
    quoteDate: materials[0].quoteDate || "",
    supplier: materials[0].supplier || "",
    supplierId: materials[0].supplierId || null
  } : null;
  
  // Get tasks for the current project for the task dropdown
  const { data: tasks = [] } = useQuery<any[]>({
    queryKey: ["/api/tasks", { projectId }],
    enabled: !!projectId
  });
  
  // Determine if materials are already purchased
  useEffect(() => {
    if (materials.length > 0) {
      // Check if any material is already marked as purchased/ordered
      const anyPurchased = materials.some(m => 
        m.status.toLowerCase() === "ordered" || 
        m.status.toLowerCase() === "delivered" || 
        m.status.toLowerCase() === "received" || 
        m.status.toLowerCase() === "installed"
      );
      setIsPurchased(anyPurchased);
      
      // Check if materials already have section/subsection
      if (materials[0].section) {
        setSection(materials[0].section);
      }
      if (materials[0].subsection) {
        setSubsection(materials[0].subsection);
      }
      
      // Check if materials are already assigned to a task
      if (materials[0].taskIds && materials[0].taskIds.length > 0) {
        const taskId = Number(materials[0].taskIds[0]);
        if (!isNaN(taskId)) {
          setSelectedTaskId(taskId);
        }
      }
    }
  }, [materials]);
  
  // Create mutation for updating materials
  const updateMaterialsMutation = useMutation({
    mutationFn: async (updatedData: any) => {
      return apiRequest("/api/materials/batch-update", "POST", updatedData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/materials"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      
      toast({
        title: "Success",
        description: "Quote materials have been updated",
      });
      
      onOpenChange(false);
    },
    onError: (error) => {
      console.error("Error updating quote materials:", error);
      toast({
        title: "Error",
        description: "Failed to update quote materials",
        variant: "destructive",
      });
    }
  });
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Prepare data for batch update
      const materialIds = materials.map(m => m.id);
      const updates = {
        materialIds,
        updates: {
          // If purchased is toggled, update the status but keep isQuote true to maintain visibility
          ...(isPurchased && {
            status: "ordered",
            orderDate: new Date().toISOString().split('T')[0]
            // Note: Not changing isQuote flag so the quote remains visible
          }),
          // Update section and subsection if provided
          ...(section && { section }),
          ...(subsection && { subsection }),
          // Update taskIds if a task is selected
          ...(selectedTaskId && { taskIds: [selectedTaskId] })
        }
      };
      
      await updateMaterialsMutation.mutateAsync(updates);
    } catch (error) {
      console.error("Error in form submission:", error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Quote</DialogTitle>
          <DialogDescription>
            Update the quote status, assign materials to a task, or categorize materials.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {/* Display Quote Information */}
          <div className="space-y-2">
            <Label>Quote Number</Label>
            <Input readOnly value={quoteInfo?.quoteNumber || "Not specified"} />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Quote Date</Label>
              <Input 
                readOnly 
                value={quoteInfo?.quoteDate ? new Date(quoteInfo.quoteDate).toLocaleDateString() : "Not specified"} 
              />
            </div>
            <div className="space-y-2">
              <Label>Supplier</Label>
              <Input readOnly value={quoteInfo?.supplier || "Not specified"} />
            </div>
          </div>
          
          <div className="border-t pt-4 mt-4">
            <h3 className="text-md font-medium mb-4">Quote Status</h3>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Mark as Purchased/Ordered</Label>
                <p className="text-sm text-muted-foreground">
                  This will convert the quote to an actual order
                </p>
              </div>
              <Switch 
                checked={isPurchased} 
                onCheckedChange={setIsPurchased}
              />
            </div>
          </div>
          
          <div className="border-t pt-4 mt-4">
            <h3 className="text-md font-medium mb-4">Task Assignment</h3>
            <div className="space-y-2">
              <Label>Assign to Task</Label>
              <Select 
                value={selectedTaskId?.toString() || "none"} 
                onValueChange={(value) => setSelectedTaskId(value && value !== "none" ? Number(value) : null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a task" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {tasks.map((task: any) => (
                    <SelectItem key={task.id} value={task.id.toString()}>
                      {task.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="border-t pt-4 mt-4">
            <h3 className="text-md font-medium mb-4">Categorization</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Section</Label>
                <Input 
                  placeholder="e.g., Subfloor" 
                  value={section} 
                  onChange={(e) => setSection(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Subsection</Label>
                <Input 
                  placeholder="e.g., Walls" 
                  value={subsection} 
                  onChange={(e) => setSubsection(e.target.value)}
                />
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Updating..." : "Update Quote"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}