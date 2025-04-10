import { useQuery } from "@tanstack/react-query";
import { Package, ChevronDown, ChevronRight } from "lucide-react";
import { Wordbank, WordbankItem } from "@/components/ui/wordbank";
import type { Material } from "@/../../shared/schema";
import { ItemDetailPopup } from "@/components/task/ItemDetailPopup";
import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// Use a local task interface to match the component's needs
interface Task {
  id: number;
  title?: string;
  description?: string | null;
  status?: string;
  startDate?: string;
  endDate?: string;
  assignedTo?: string | null;
  projectId: number;
  completed?: boolean;
  category?: string;
  tier1Category?: string;
  tier2Category?: string;
  contactIds?: string[] | null;
  materialIds?: string[] | null;
  materialsNeeded?: string | null;
  templateId?: string | null;
  estimatedCost?: number | null;
  actualCost?: number | null;
}

interface TaskMaterialsViewProps {
  task: Task;
  className?: string;
  compact?: boolean;
}

/**
 * Component to display materials for a task
 */
export function TaskMaterialsView({ task, className = "", compact = false }: TaskMaterialsViewProps) {
  // State for showing popup
  const [selectedItem, setSelectedItem] = useState<any>(null);
  
  // Fetch materials
  const { data: materials = [] } = useQuery<Material[]>({
    queryKey: ["/api/materials"],
  });
  
  // Convert material IDs to numbers for consistency
  const materialIds = task.materialIds 
    ? (Array.isArray(task.materialIds) 
        ? task.materialIds.map(id => typeof id === 'string' ? parseInt(id) : id) 
        : [])
    : [];
    
  // Filter materials based on IDs
  const taskMaterials = materials.filter(material => 
    materialIds.includes(material.id)
  );
  
  // Determine if this is a template task
  const isTemplateTask = task.id <= 0 || !task.materialIds;
  
  // Transform materials to WordbankItems, grouped by section and sub-section (tier2Category)
  // First, group materials by section and then sub-section
  const materialsBySection: Record<string, Record<string, Material[]>> = {};
  
  // Determine if this component is being rendered on the dashboard
  // The dashboard page creates a fake task with project properties
  const isDashboard = task.category === "project" || 
                     (task.title && task.projectId === task.id); // Project cards have projectId === id
  
  taskMaterials.forEach(material => {
    // On dashboard, use a higher level organization (the type or category property)
    // This will group materials by higher-level categories first (Sheathing, Drywall, etc.)
    const section = isDashboard 
      ? (material.category || material.type || 'General')  // Use category/type on dashboard
      : (material.section || 'General');                   // Use section in task cards
      
    // For the subsection, either use subsection directly or section based on context
    const subSection = isDashboard 
      ? (material.section || 'General')                    // Use section as subsection on dashboard 
      : (material.subsection || 'General');                // Use subsection in task cards
    
    // Initialize the section if it doesn't exist
    if (!materialsBySection[section]) {
      materialsBySection[section] = {};
    }
    
    // Initialize the sub-section if it doesn't exist
    if (!materialsBySection[section][subSection]) {
      materialsBySection[section][subSection] = [];
    }
    
    // Add the material to its section and sub-section
    materialsBySection[section][subSection].push(material);
  });

  // Sort sections according to the desired display order if on dashboard
  // The order should be: Sheathing, Drywall, First Floor, Walls
  const sortedSections = isDashboard 
    ? Object.entries(materialsBySection).sort(([sectionA], [sectionB]) => {
        // Define the order for common material categories
        const sectionOrder: Record<string, number> = {
          'Sheathing': 1,
          'Drywall': 2,
          'First Floor': 3,
          'Walls': 4,
          // Add more categories as needed
        };
        
        // Get the sort value for each section, defaulting to 999 for unknown sections
        const orderA = sectionOrder[sectionA] || 999;
        const orderB = sectionOrder[sectionB] || 999;
        
        // Sort by the defined order
        return orderA - orderB;
      })
    : Object.entries(materialsBySection);
  
  // For empty material list in compact mode
  if (taskMaterials.length === 0 && compact) {
    return (
      <div className={`flex items-center text-sm text-muted-foreground mt-1 ${className}`}>
        <Package className="h-4 w-4 mr-1 text-orange-500" />
        <span>No materials</span>
      </div>
    );
  }

  // For compact mode with materials, show expandable accordion inline
  if (compact) {
    // Get total material cost
    const totalCost = taskMaterials.reduce((sum, mat) => sum + (mat.cost || 0) * (mat.quantity || 1), 0);
    
    return (
      <div className={`mt-1 ${className}`}>
        <Accordion type="single" collapsible className="w-full border-0">
          <AccordionItem value="materials-entries" className="border-0">
            <AccordionTrigger className="py-1 text-sm text-muted-foreground hover:no-underline">
              <div className="flex-1 flex items-center">
                <Package className="h-4 w-4 mr-1 text-orange-500" />
                <span>{taskMaterials.length} materials</span>
                {totalCost > 0 && (
                  <span className="ml-1 text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded-full">
                    {formatCurrency(totalCost)}
                  </span>
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="mt-2 pl-2">
                <Accordion type="multiple" className="w-full space-y-1">
                  {sortedSections.map(([section, subsections]) => {
                    // Get all materials in this section across all subsections
                    const sectionMaterials: Material[] = [];
                    Object.values(subsections).forEach(materials => {
                      sectionMaterials.push(...materials);
                    });
                    
                    // Calculate section total cost
                    const sectionCost = sectionMaterials.reduce(
                      (sum, mat) => sum + (mat.cost || 0) * (mat.quantity || 1), 
                      0
                    );
                    
                    // Create a unique ID for the section
                    const sectionId = section.toLowerCase().replace(/\s+/g, '_');
                    
                    return (
                      <AccordionItem key={sectionId} value={sectionId} className="border border-slate-200 rounded-md mb-2">
                        <AccordionTrigger className="py-2 text-sm hover:no-underline">
                          <div className="font-medium">{section}</div>
                          <div className="flex items-center text-xs space-x-2">
                            <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded-full">
                              {sectionMaterials.length} items
                            </span>
                            {sectionCost > 0 && (
                              <span className="px-1.5 py-0.5 bg-green-50 text-green-700 rounded-full">
                                {formatCurrency(sectionCost)}
                              </span>
                            )}
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-3 py-2 space-y-3">
                          {/* If there are subsections, show them as nested accordions */}
                          {Object.entries(subsections).length > 1 ? (
                            <Accordion type="multiple" className="w-full">
                              {Object.entries(subsections).map(([subsection, materials]) => {
                                const subsectionId = `${sectionId}_${subsection.toLowerCase().replace(/\s+/g, '_')}`;
                                const subsectionCost = materials.reduce(
                                  (sum, mat) => sum + (mat.cost || 0) * (mat.quantity || 1), 
                                  0
                                );
                                
                                return (
                                  <AccordionItem key={subsectionId} value={subsectionId} className="border-b border-t-0 border-x-0 first:border-t-0 last:border-b-0">
                                    <AccordionTrigger className="py-2 text-xs hover:no-underline">
                                      <div className="font-medium">{subsection}</div>
                                      <div className="flex items-center text-xs space-x-2">
                                        <span className="text-blue-700">
                                          {materials.length} items
                                        </span>
                                        {subsectionCost > 0 && (
                                          <span className="text-green-700">
                                            {formatCurrency(subsectionCost)}
                                          </span>
                                        )}
                                      </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="py-1 space-y-2">
                                      {materials.map(material => (
                                        <div 
                                          key={material.id} 
                                          className="p-2 border rounded-md bg-slate-50 hover:bg-slate-100 cursor-pointer transition-colors"
                                          onClick={() => setSelectedItem(material)}
                                        >
                                          <div className="flex justify-between">
                                            <div className="font-medium text-xs">{material.name}</div>
                                            <div className="text-xs font-medium">{formatCurrency((material.cost || 0) * (material.quantity || 1))}</div>
                                          </div>
                                          <div className="flex justify-between text-xs text-muted-foreground mt-1">
                                            <div>{material.quantity} {material.unit || 'units'}</div>
                                            <div>{material.status || 'pending'}</div>
                                          </div>
                                        </div>
                                      ))}
                                    </AccordionContent>
                                  </AccordionItem>
                                );
                              })}
                            </Accordion>
                          ) : (
                            // If there's just one subsection, show materials directly
                            <div className="space-y-2">
                              {sectionMaterials.map(material => (
                                <div 
                                  key={material.id} 
                                  className="p-2 border rounded-md bg-slate-50 hover:bg-slate-100 cursor-pointer transition-colors"
                                  onClick={() => setSelectedItem(material)}
                                >
                                  <div className="flex justify-between">
                                    <div className="font-medium text-sm">{material.name}</div>
                                    <div className="text-sm font-medium">{formatCurrency((material.cost || 0) * (material.quantity || 1))}</div>
                                  </div>
                                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                                    <div>{material.quantity} {material.unit || 'units'}</div>
                                    <div>{material.status || 'pending'}</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      
        {/* Material detail popup */}
        {selectedItem && (
          <ItemDetailPopup
            item={selectedItem}
            itemType="material"
            onClose={() => setSelectedItem(null)}
          />
        )}
      </div>
    );
  }

  // Full view mode
  return (
    <div className={`mt-2 ${className}`}>
      {isTemplateTask && (
        <div className="text-xs text-amber-600 italic mb-1 bg-amber-50 p-2 rounded-md border border-amber-200">
          This is a template task. Activate it to add materials.
        </div>
      )}
      
      <div className="flex items-center text-sm font-medium mb-2">
        <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-md font-medium flex items-center">
          <Package className="h-4 w-4 mr-1" />
          Materials ({taskMaterials.length} items)
        </span>
      </div>

      {taskMaterials.length === 0 ? (
        <div className="text-sm text-slate-500 p-2 text-center border rounded-md bg-slate-50">
          {isTemplateTask ? "Activate task to add materials" : "No materials attached"}
        </div>
      ) : (
        <Accordion type="multiple" className="w-full border rounded-md bg-white space-y-1">
          {sortedSections.map(([section, subsections]) => {
            // Get all materials in this section across all subsections
            const sectionMaterials: Material[] = [];
            Object.values(subsections).forEach(materials => {
              sectionMaterials.push(...materials);
            });
            
            // Calculate section total cost
            const sectionCost = sectionMaterials.reduce(
              (sum, mat) => sum + (mat.cost || 0) * (mat.quantity || 1), 
              0
            );
            
            // Create a unique ID for the section
            const sectionId = section.toLowerCase().replace(/\s+/g, '_');
            
            return (
              <AccordionItem key={sectionId} value={`section-${sectionId}`} className="border-0 px-2">
                <AccordionTrigger className="py-2 text-sm hover:no-underline">
                  <div className="flex items-center justify-between w-full pr-2">
                    <div className="font-medium">{section}</div>
                    <div className="flex items-center text-xs space-x-2">
                      <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded-full">
                        {sectionMaterials.length} items
                      </span>
                      {sectionCost > 0 && (
                        <span className="px-1.5 py-0.5 bg-green-50 text-green-700 rounded-full">
                          {formatCurrency(sectionCost)}
                        </span>
                      )}
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pl-5 space-y-2 pt-1 pb-2">
                  {Object.entries(subsections).map(([subsection, materials]) => {
                    const subsectionId = `${sectionId}_${subsection.toLowerCase().replace(/\s+/g, '_')}`;
                    
                    // If there's only one subsection, don't nest it
                    if (Object.entries(subsections).length === 1) {
                      return (
                        <div key={subsectionId} className="space-y-2">
                          {materials.map(material => (
                            <div 
                              key={material.id} 
                              className="p-2 border rounded-md bg-slate-50 hover:bg-slate-100 cursor-pointer transition-colors"
                              onClick={() => setSelectedItem(material)}
                            >
                              <div className="flex justify-between items-center">
                                <div className="font-medium text-sm">{material.name}</div>
                                <div className="text-sm font-medium">{formatCurrency((material.cost || 0) * (material.quantity || 1))}</div>
                              </div>
                              <div className="flex justify-between text-xs text-slate-500 mt-1">
                                <div className="flex items-center">
                                  <span>{material.quantity} {material.unit || 'units'}</span>
                                </div>
                                <div className="flex items-center">
                                  {material.status && (
                                    <span className={`px-1.5 py-0.5 rounded-full text-xs ${
                                      material.status === 'delivered' ? 'bg-green-100 text-green-700' :
                                      material.status === 'ordered' ? 'bg-blue-100 text-blue-700' :
                                      'bg-amber-100 text-amber-700'
                                    }`}>
                                      {material.status}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    }
                    
                    // Otherwise, create a nested accordion for each subsection
                    return (
                      <Accordion key={subsectionId} type="single" collapsible className="w-full">
                        <AccordionItem value={subsectionId} className="border rounded-md">
                          <AccordionTrigger className="py-1 px-2 text-xs hover:no-underline">
                            <div className="flex items-center justify-between w-full pr-2">
                              <div className="font-medium">{subsection}</div>
                              <div className="text-xs">
                                {materials.length} items
                              </div>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="px-2 pt-0 pb-2">
                            <div className="space-y-2 mt-2">
                              {materials.map(material => (
                                <div 
                                  key={material.id} 
                                  className="p-2 border rounded-md bg-slate-50 hover:bg-slate-100 cursor-pointer transition-colors"
                                  onClick={() => setSelectedItem(material)}
                                >
                                  <div className="flex justify-between items-center">
                                    <div className="font-medium text-xs">{material.name}</div>
                                    <div className="text-xs font-medium">{formatCurrency((material.cost || 0) * (material.quantity || 1))}</div>
                                  </div>
                                  <div className="flex justify-between text-xs text-slate-500 mt-1">
                                    <div>{material.quantity} {material.unit || 'units'}</div>
                                    {material.status && (
                                      <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                                        material.status === 'delivered' ? 'bg-green-100 text-green-700' :
                                        material.status === 'ordered' ? 'bg-blue-100 text-blue-700' :
                                        'bg-amber-100 text-amber-700'
                                      }`}>
                                        {material.status}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    );
                  })}
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      )}

      {/* Material detail popup */}
      {selectedItem && (
        <ItemDetailPopup
          item={selectedItem}
          itemType="material"
          onClose={() => setSelectedItem(null)}
        />
      )}
    </div>
  );
}