import React from 'react';
import { useQuery } from "@tanstack/react-query";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from "@/components/ui/accordion";
import { Package } from 'lucide-react';

// Mobile-optimized component to show task materials in sections with single dropdown
export function MobileTaskMaterialsView({ 
  materials, 
  projectId, 
  taskId,
  className = "" 
}: { 
  materials: any[]; 
  projectId: number;
  taskId?: number;
  className?: string;
}) {
  // Get the associated task to find its materialIds
  const task = taskId ? 
    { id: taskId, projectId: projectId } : 
    { id: projectId, projectId: projectId };
    
  // Filter to project materials first
  const projectMaterials = materials.filter(m => m.projectId === projectId);
  
  // We'll use this array for the final display
  let filteredMaterials = projectMaterials;
  
  // Fetch the task by ID
  const { data: tasks = [] } = useQuery<any[]>({
    queryKey: ["/api/tasks"],
    enabled: !!taskId, // Only run this query if taskId is provided
  });
  
  // Find the task record
  const taskRecord = tasks.find(t => t.id === taskId);
  
  if (taskRecord && taskRecord.materialIds && taskRecord.materialIds.length > 0) {
    // Convert material IDs to numbers for consistency
    const materialIds = Array.isArray(taskRecord.materialIds) 
      ? taskRecord.materialIds.map((id: any) => typeof id === 'string' ? parseInt(id) : id) 
      : [];
      
    // Filter materials based on IDs from the task
    filteredMaterials = materials.filter(material => 
      materialIds.includes(material.id)
    );
    
    // If no materials match, fall back to project materials
    if (filteredMaterials.length === 0) {
      filteredMaterials = projectMaterials;
    }
  }
  
  console.log("MobileTaskMaterialsView - Materials:", {
    all: materials.length,
    projectMaterials: projectMaterials.length,
    filteredMaterials: filteredMaterials.length,
    taskId: taskId,
    projectId: projectId
  });
  
  // Calculate total cost of all materials
  const totalCost = filteredMaterials.reduce(
    (sum, mat) => sum + (mat.cost || 0) * (mat.quantity || 1), 
    0
  );

  // Format material status for display
  const formatMaterialStatus = (status?: string): string => {
    if (!status) return "Pending";
    
    switch(status.toLowerCase()) {
      case 'pending': return 'Pending';
      case 'ordered': return 'Ordered';
      case 'received': return 'Received';
      case 'installed': return 'Installed';
      case 'returned': return 'Returned';
      default: return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  // Group materials by section
  const materialsBySection: Record<string, any[]> = {};
  
  filteredMaterials.forEach(material => {
    const section = material.section || "Uncategorized";
    
    if (!materialsBySection[section]) {
      materialsBySection[section] = [];
    }
    
    materialsBySection[section].push(material);
  });

  // Sort sections alphabetically
  const sortedSections = Object.entries(materialsBySection).sort((a, b) => {
    if (a[0] === "Uncategorized") return 1;
    if (b[0] === "Uncategorized") return -1;
    return a[0].localeCompare(b[0]);
  });

  return (
    <div className={`mt-1 ${className}`}>
      <Accordion type="single" collapsible className="w-full border-0">
        <AccordionItem value="materials" className="border-0">
          <AccordionTrigger className="py-1 text-sm text-muted-foreground hover:no-underline">
            <div className="flex items-center justify-between w-full">
              <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-md font-medium flex items-center">
                <Package className="h-4 w-4 mr-1" />
                Materials ({filteredMaterials.length})
                {totalCost > 0 && (
                  <span className="ml-2 text-xs bg-orange-200 text-orange-900 px-1.5 py-0.5 rounded-full">
                    ${totalCost.toFixed(2)}
                  </span>
                )}
              </span>
            </div>
          </AccordionTrigger>
          
          <AccordionContent>
            {filteredMaterials.length > 0 ? (
              <div className="mt-3 pl-2 max-h-[280px] overflow-y-auto space-y-4">
                {sortedSections.map(([section, sectionMaterials]) => {
                  const sectionCost = sectionMaterials.reduce(
                    (sum, mat) => sum + (mat.cost || 0) * (mat.quantity || 1), 
                    0
                  );
                  
                  return (
                    <div key={section} className="border border-orange-200 bg-orange-50 rounded-md p-3">
                      <div className="flex justify-between items-center mb-2">
                        <div className="font-medium text-sm text-orange-800">{section}</div>
                        <div className="flex items-center gap-2">
                          <span className="px-1.5 py-0.5 bg-orange-100 text-orange-800 rounded-full text-xs">
                            {sectionMaterials.length} items
                          </span>
                          {sectionCost > 0 && (
                            <span className="px-1.5 py-0.5 bg-orange-200 text-orange-900 rounded-full text-xs">
                              ${sectionCost.toFixed(2)}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        {sectionMaterials.map((material) => (
                          <div 
                            key={material.id} 
                            className="p-2 border border-orange-200 rounded-md bg-white hover:bg-orange-50 transition-colors"
                          >
                            <div className="flex justify-between items-center">
                              <div className="font-medium text-sm">{material.name}</div>
                              <div className="text-sm font-medium px-1.5 py-0.5 bg-green-100 text-green-800 rounded-full">
                                ${((material.cost || 0) * (material.quantity || 1)).toFixed(2)}
                              </div>
                            </div>
                            <div className="flex justify-between text-xs text-slate-500 mt-1">
                              <div className="flex items-center">
                                <span>{material.quantity} {material.unit || 'units'}</span>
                              </div>
                              <span className={`px-1.5 py-0.5 rounded-full text-xs ${
                                material.status === 'delivered' || material.status === 'received' ? 'bg-green-100 text-green-700' :
                                material.status === 'ordered' ? 'bg-blue-100 text-blue-700' :
                                'bg-amber-100 text-amber-700'
                              }`}>
                                {formatMaterialStatus(material.status)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-slate-500">No materials available</p>
              </div>
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}