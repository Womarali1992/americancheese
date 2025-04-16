import React, { useState } from 'react';
import { Package, ChevronDown, ChevronUp } from 'lucide-react';

// Mobile-optimized component to show task-specific materials in a single section
export function MobileTaskMaterialsView({ 
  materials, 
  projectId, 
  taskId,
  associatedTask,
  className = "" 
}: { 
  materials: any[]; 
  projectId: number;
  taskId?: number;
  associatedTask?: any;
  className?: string;
}) {
  // Local state to track dropdown visibility
  const [isOpen, setIsOpen] = useState(false);
  
  // Filter project materials first
  const projectMaterials = materials.filter(m => m.projectId === projectId);
  
  // Set default materials to show (all project materials)
  let sectionMaterials = projectMaterials;
  
  // If we have associated task with materialIds, filter to show only those materials
  if (associatedTask && associatedTask.materialIds && Array.isArray(associatedTask.materialIds) && associatedTask.materialIds.length > 0) {
    // Convert material IDs to numbers for consistency
    const materialIds = associatedTask.materialIds.map((id: any) => 
      typeof id === 'string' ? parseInt(id) : id
    );
    
    // Filter materials based on IDs from the task
    const taskSpecificMaterials = materials.filter(material => 
      materialIds.includes(material.id)
    );
    
    // Only use filtered materials if we found some
    if (taskSpecificMaterials.length > 0) {
      sectionMaterials = taskSpecificMaterials;
    }
  }
  
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
  
  // Calculate total cost
  const totalCost = sectionMaterials.reduce(
    (sum, mat) => sum + (mat.cost || 0) * (mat.quantity || 1), 
    0
  );

  // Toggle dropdown state
  const toggleDropdown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  return (
    <div className={`mt-1 ${className}`}>
      <div className="w-full border-0">
        {/* Custom header that toggles content visibility */}
        <button 
          type="button"
          className="flex items-center justify-between w-full py-1 text-sm text-muted-foreground hover:bg-slate-50/50 rounded-md transition-colors"
          onClick={toggleDropdown}
        >
          <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-md font-medium flex items-center">
            <Package className="h-4 w-4 mr-1" />
            Materials ({sectionMaterials.length})
            {totalCost > 0 && (
              <span className="ml-2 text-xs bg-orange-200 text-orange-900 px-1.5 py-0.5 rounded-full">
                ${totalCost.toFixed(2)}
              </span>
            )}
            {isOpen ? (
              <ChevronUp className="h-4 w-4 ml-2" />
            ) : (
              <ChevronDown className="h-4 w-4 ml-2" />
            )}
          </span>
        </button>
        
        {/* Material content - shown only when isOpen is true */}
        {isOpen && (
          <div className="mt-2">
            {sectionMaterials.length > 0 ? (
              <div className="space-y-2 pl-2 mt-2 max-h-[200px] overflow-y-auto">
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
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-slate-500">No materials available</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}