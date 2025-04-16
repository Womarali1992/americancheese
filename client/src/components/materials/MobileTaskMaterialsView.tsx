import React, { useState } from 'react';
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from "@/components/ui/accordion";
import { Package } from 'lucide-react';

// This component is a simplified version of TaskMaterialsView specifically for mobile
export function MobileTaskMaterialsView({ 
  materials, 
  projectId, 
  className = "" 
}: { 
  materials: any[]; 
  projectId: number;
  className?: string;
}) {
  // Filter materials for this project
  const projectMaterials = materials.filter(m => m.projectId === projectId);
  
  // Calculate total cost
  const totalCost = projectMaterials.reduce(
    (sum, mat) => sum + (mat.cost || 0) * (mat.quantity || 1), 
    0
  );

  // Format material status
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

  return (
    <div className={`mt-1 ${className}`}>
      <Accordion type="single" collapsible className="w-full border-0">
        <AccordionItem value="materials-entries" className="border-0">
          <AccordionTrigger className="py-1 text-sm text-muted-foreground hover:no-underline">
            <div className="flex items-center justify-between w-full">
              <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-md font-medium flex items-center">
                <Package className="h-4 w-4 mr-1" />
                Materials ({projectMaterials.length})
                {totalCost > 0 && (
                  <span className="ml-2 text-xs bg-orange-200 text-orange-900 px-1.5 py-0.5 rounded-full">
                    ${totalCost.toFixed(2)}
                  </span>
                )}
              </span>
              {/* Dropdown indicator will be handled automatically by the AccordionTrigger component */}
            </div>
          </AccordionTrigger>
          <AccordionContent>
            {projectMaterials.length > 0 ? (
              <div className="space-y-2 pl-2 mt-2 max-h-[200px] overflow-y-auto">
                {projectMaterials.map((material) => (
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
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-slate-500">No materials for this project</p>
              </div>
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}