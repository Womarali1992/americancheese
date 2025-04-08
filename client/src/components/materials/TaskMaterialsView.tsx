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
  
  // Create one wordbank item for each section with nested subsections
  const materialItems: WordbankItem[] = sortedSections.map(([section, subsections]) => {
    // For each section, gather all materials across subsections
    const allSectionMaterials: Material[] = [];
    const subsectionItems: WordbankItem[] = [];
    
    // Convert section name to a stable ID
    const sectionId = section.toLowerCase().replace(/\s+/g, '_');
    
    // Process each subsection
    Object.entries(subsections).forEach(([subsection, materials]) => {
      // Add materials to the overall count
      allSectionMaterials.push(...materials);
      
      // Create mappings for this subsection
      const materialNames: Record<number, string> = {};
      const materialQuantities: Record<number, string> = {};
      const materialUnits: Record<number, string> = {};
      
      materials.forEach(material => {
        materialNames[material.id] = material.name;
        materialQuantities[material.id] = material.quantity?.toString() || '0';
        materialUnits[material.id] = material.unit || 'units';
      });
      
      // Create a properly formatted, unique subsection ID
      const subsectionId = `${sectionId}___${subsection.toLowerCase().replace(/\s+/g, '_')}`;
      
      // Create a wordbank item for this subsection
      subsectionItems.push({
        id: subsectionId,
        label: subsection,
        subtext: `${materials.length} material${materials.length !== 1 ? 's' : ''}`,
        color: 'text-slate-500',
        metadata: {
          materialIds: materials.map(material => material.id),
          materialNames,
          materialQuantities,
          materialUnits,
          isSubsection: true,
          parentSection: sectionId
        }
      });
    });
    
    // Create a section item with nested subsection items and directly aggregate all material IDs too
    // This ensures compatibility with the existing Wordbank component's material ID structure
    const allMaterialIds: number[] = [];
    const allMaterialNames: Record<number, string> = {};
    const allMaterialQuantities: Record<number, string> = {};
    const allMaterialUnits: Record<number, string> = {};
    
    allSectionMaterials.forEach(material => {
      allMaterialIds.push(material.id);
      allMaterialNames[material.id] = material.name;
      allMaterialQuantities[material.id] = material.quantity?.toString() || '0';
      allMaterialUnits[material.id] = material.unit || 'units';
    });
    
    return {
      id: section.toLowerCase().replace(/\s+/g, '_'), // Create a unique string ID for the section
      label: section,
      subtext: `${allSectionMaterials.length} material${allSectionMaterials.length !== 1 ? 's' : ''}`,
      color: 'text-slate-600',
      metadata: {
        // Include both the materialsIds array for compatibility and the subsections for the new hierarchy
        materialIds: allMaterialIds,
        materialNames: allMaterialNames,
        materialQuantities: allMaterialQuantities,
        materialUnits: allMaterialUnits,
        subsections: subsectionItems,
        totalMaterials: allSectionMaterials.length
      }
    };
  });

  // Handle click on material section or subsection item
  const handleMaterialSelect = (id: number | string) => {
    // For section-based ID (string), handle section or subsection click
    if (typeof id === 'string') {
      // Check if this is a subsection ID (contains the triple underscore separator)
      if (id.includes('___')) {
        // Parse the ID to get section and subsection parts
        const parts = id.split('___');
        const sectionId = parts[0];
        const rawSubsectionId = parts[1];
        
        // Find the original section and subsection names
        const originalSection = Object.keys(materialsBySection).find(section => 
          section.toLowerCase().replace(/\s+/g, '_') === sectionId
        );
        
        if (originalSection) {
          // Find the matching subsection
          const originalSubsection = Object.keys(materialsBySection[originalSection]).find(subsection => {
            const generatedId = subsection.toLowerCase().replace(/\s+/g, '_');
            return generatedId === rawSubsectionId;
          });
          
          if (originalSubsection && materialsBySection[originalSection][originalSubsection] && 
              materialsBySection[originalSection][originalSubsection].length > 0) {
            // Use the first material from this subsection to show details
            setSelectedItem(materialsBySection[originalSection][originalSubsection][0]);
          }
        }
      } else {
        // This is a main section click, find all materials in this section
        const originalSection = Object.keys(materialsBySection).find(section => 
          section.toLowerCase().replace(/\s+/g, '_') === id
        );
        
        if (originalSection) {
          // Get all materials in all subsections of this section
          const allMaterials: Material[] = [];
          
          Object.values(materialsBySection[originalSection]).forEach(materialsArray => {
            allMaterials.push(...materialsArray);
          });
          
          if (allMaterials.length > 0) {
            // Use the first material to show details
            setSelectedItem(allMaterials[0]);
          }
        }
      }
    } else {
      // For numeric ID, find the individual material directly
      const material = taskMaterials.find(m => m.id === id);
      if (material) {
        setSelectedItem(material);
      }
    }
  };

  // For empty material list in compact mode
  if (taskMaterials.length === 0 && compact) {
    return (
      <div className={`flex items-center text-sm text-muted-foreground mt-1 ${className}`}>
        <Package className="h-4 w-4 mr-1 text-orange-500" />
        <span>No materials</span>
      </div>
    );
  }

  // For compact mode with materials, show more details in a clickable view
  if (compact) {
    // Get total material cost
    const totalCost = taskMaterials.reduce((sum, mat) => sum + (mat.cost || 0) * (mat.quantity || 1), 0);
    
    // Setup state for showing materials popup
    const [showDetails, setShowDetails] = useState(false);
    
    return (
      <>
        <div 
          className={`flex items-center text-sm text-muted-foreground mt-1 ${className} cursor-pointer hover:text-blue-600`}
          onClick={() => setShowDetails(true)}
        >
          <Package className="h-4 w-4 mr-1 text-orange-500" />
          <span>{taskMaterials.length} materials</span>
          {totalCost > 0 && (
            <span className="ml-1 text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded-full">
              {formatCurrency(totalCost)}
            </span>
          )}
          <ChevronDown className="h-3 w-3 ml-1 text-slate-500" />
        </div>
        
        {showDetails && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            onClick={() => setShowDetails(false)}
          >
            <Card className="w-full max-w-md" onClick={e => e.stopPropagation()}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center">
                  <Package className="h-5 w-5 mr-2 text-orange-500" />
                  Materials for {task.title}
                </CardTitle>
                <CardDescription>
                  {taskMaterials.length} materials, {formatCurrency(totalCost)} total
                </CardDescription>
              </CardHeader>
              <CardContent className="max-h-[60vh] overflow-y-auto">
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
                      <AccordionItem key={sectionId} value={sectionId} className="border rounded-md mb-2">
                        <AccordionTrigger className="py-2 px-3 text-sm hover:no-underline">
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
                                      <div className="flex items-center justify-between w-full pr-2">
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
                                      </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="py-1 space-y-2">
                                      {materials.map(material => (
                                        <div key={material.id} className="p-2 border rounded-md bg-slate-50">
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
                                <div key={material.id} className="p-2 border rounded-md bg-slate-50">
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
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button variant="ghost" onClick={() => setShowDetails(false)}>Close</Button>
              </CardFooter>
            </Card>
          </div>
        )}
      </>
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
        <Package className="h-4 w-4 mr-1 text-orange-500" />
        <span>Materials ({taskMaterials.length} items)</span>
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