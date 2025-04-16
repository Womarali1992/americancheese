import React, { useState } from 'react';
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from "@/components/ui/accordion";
import { Package } from 'lucide-react';

// This component is a mobile-optimized version of TaskMaterialsView that shows materials by section
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

  // Group materials by section
  const materialsBySection: { [section: string]: any[] } = {};
  
  projectMaterials.forEach(material => {
    // Use the section field (or "Uncategorized" if not present)
    const section = material.section || "Uncategorized";
    
    if (!materialsBySection[section]) {
      materialsBySection[section] = [];
    }
    
    materialsBySection[section].push(material);
  });

  // Sort sections alphabetically
  const sortedSections = Object.entries(materialsBySection).sort((a, b) => {
    // Special handling to put Uncategorized at the end
    if (a[0] === "Uncategorized") return 1;
    if (b[0] === "Uncategorized") return -1;
    return a[0].localeCompare(b[0]);
  });

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
              {/* Dropdown indicator handled automatically by AccordionTrigger */}
            </div>
          </AccordionTrigger>
          <AccordionContent>
            {projectMaterials.length > 0 ? (
              <div className="space-y-3 pl-2 mt-2 max-h-[280px] overflow-y-auto">
                <Accordion type="multiple" className="w-full">
                  {sortedSections.map(([section, sectionMaterials]) => {
                    // Calculate section cost
                    const sectionCost = sectionMaterials.reduce(
                      (sum, mat) => sum + (mat.cost || 0) * (mat.quantity || 1), 
                      0
                    );
                    
                    // Create a unique ID for the section
                    const sectionId = section.toLowerCase().replace(/\s+/g, '_');
                    
                    return (
                      <AccordionItem key={sectionId} value={sectionId} className="border border-orange-200 bg-orange-50 rounded-md mb-2">
                        <AccordionTrigger className="py-2 text-xs hover:no-underline text-orange-800">
                          <div className="flex items-center justify-between w-full pr-2">
                            <div className="font-medium">{section}</div>
                            <div className="flex items-center text-xs space-x-2">
                              <span className="px-1.5 py-0.5 bg-orange-100 text-orange-800 rounded-full">
                                {sectionMaterials.length} items
                              </span>
                              {sectionCost > 0 && (
                                <span className="px-1.5 py-0.5 bg-orange-200 text-orange-900 rounded-full">
                                  ${sectionCost.toFixed(2)}
                                </span>
                              )}
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-2 py-2 space-y-2">
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
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
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