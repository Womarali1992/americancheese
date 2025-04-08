import { useQuery } from "@tanstack/react-query";
import { Package, ChevronDown, ChevronRight, Boxes, Box, HardDrive, Grid3X3 } from "lucide-react";
import type { Material } from "@/../../shared/schema";
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

interface TaskMaterialsDetailViewProps {
  task: Task;
  className?: string;
}

/**
 * Enhanced component to display materials for a task with better categorization headers
 */
export function TaskMaterialsDetailView({ task, className = "" }: TaskMaterialsDetailViewProps) {
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
  
  // First, group materials by section and then sub-section
  const materialsBySection: Record<string, Record<string, Material[]>> = {};
  
  taskMaterials.forEach(material => {
    const section = material.section || 'General';
    const subSection = material.subsection || 'General';
    
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

  // Sort sections alphabetically for predictable presentation
  const sortedSections = Object.entries(materialsBySection).sort(([a], [b]) => a.localeCompare(b));
  
  // For empty material list
  if (taskMaterials.length === 0) {
    return (
      <div className={`p-4 border rounded-md bg-slate-50 ${className}`}>
        <div className="flex items-center justify-center p-6 text-slate-500">
          <Package className="h-6 w-6 mr-2" />
          <span>No materials associated with this task</span>
        </div>
      </div>
    );
  }
  
  // Calculate total material cost and count
  const totalCost = taskMaterials.reduce((sum, mat) => sum + (mat.cost || 0) * (mat.quantity || 1), 0);
  const totalCount = taskMaterials.length;
  
  return (
    <div className={`${className}`}>
      <Card>
        <CardHeader className="pb-3 border-b">
          <CardTitle className="flex items-center text-xl font-semibold">
            <Boxes className="h-5 w-5 mr-2 text-blue-600" />
            Materials
          </CardTitle>
          <CardDescription>
            This task requires {totalCount} materials with an estimated cost of {formatCurrency(totalCost)}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4">
          <Accordion type="multiple" className="w-full space-y-2">
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
              const sectionIcon = getSectionIcon(section);
              
              return (
                <AccordionItem key={sectionId} value={sectionId} className="border rounded-md">
                  <AccordionTrigger className="py-3 px-4 text-md hover:no-underline hover:bg-slate-50">
                    <div className="flex items-center justify-between w-full pr-2">
                      <div className="font-medium flex items-center">
                        {sectionIcon}
                        <span>{section}</span>
                      </div>
                      <div className="flex items-center text-sm space-x-2">
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full">
                          {sectionMaterials.length} items
                        </span>
                        {sectionCost > 0 && (
                          <span className="px-2 py-0.5 bg-green-50 text-green-700 rounded-full">
                            {formatCurrency(sectionCost)}
                          </span>
                        )}
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 py-3 space-y-4 bg-slate-50">
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
                            <AccordionItem key={subsectionId} value={subsectionId} className="border rounded-md mb-2 bg-white">
                              <AccordionTrigger className="py-2 px-3 text-sm hover:no-underline">
                                <div className="flex items-center justify-between w-full pr-2">
                                  <div className="font-medium flex items-center">
                                    <Box className="h-4 w-4 mr-2 text-blue-500" />
                                    <span>{subsection}</span>
                                  </div>
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
                              <AccordionContent className="px-3 py-2 space-y-2">
                                {/* Display the materials in this subsection */}
                                {materials.map(material => (
                                  <MaterialCard key={material.id} material={material} />
                                ))}
                              </AccordionContent>
                            </AccordionItem>
                          );
                        })}
                      </Accordion>
                    ) : (
                      // If only one subsection (or just the default), show materials directly
                      <div className="space-y-2">
                        {sectionMaterials.map(material => (
                          <MaterialCard key={material.id} material={material} />
                        ))}
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </CardContent>
        <CardFooter className="border-t p-4 flex justify-between items-center">
          <div className="text-sm text-slate-600">Total: {totalCount} materials</div>
          <div className="text-md font-medium">Total Cost: {formatCurrency(totalCost)}</div>
        </CardFooter>
      </Card>
    </div>
  );
}

/**
 * Helper function to get an icon for a material section
 */
function getSectionIcon(section: string) {
  const iconClass = "h-5 w-5 mr-2";
  const lowerSection = section.toLowerCase();
  
  if (lowerSection.includes('sheath') || lowerSection.includes('panel')) {
    return <Grid3X3 className={`${iconClass} text-amber-600`} />;
  }
  if (lowerSection.includes('lumber') || lowerSection.includes('wood')) {
    return <HardDrive className={`${iconClass} text-orange-700`} />;
  }
  if (lowerSection.includes('drywall') || lowerSection.includes('wall')) {
    return <Grid3X3 className={`${iconClass} text-blue-600`} />;
  }
  if (lowerSection.includes('floor') || lowerSection.includes('foundation')) {
    return <Grid3X3 className={`${iconClass} text-green-600`} />;
  }
  
  // Default icon
  return <Package className={`${iconClass} text-slate-600`} />;
}

/**
 * Component to display an individual material card
 */
function MaterialCard({ material }: { material: Material }) {
  return (
    <Card className="border shadow-sm">
      <CardContent className="p-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1">
            <h4 className="font-medium text-sm">{material.name}</h4>
            <div className="flex flex-wrap gap-2 mt-1">
              {material.type && (
                <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full">
                  {material.type}
                </span>
              )}
              {material.category && (
                <span className="text-xs px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full">
                  {material.category}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4 mt-2 sm:mt-0">
            <div className="text-sm">
              <span className="font-medium">{material.quantity || 0}</span>
              <span className="text-slate-500 ml-1">{material.unit || 'units'}</span>
            </div>
            {material.cost && (
              <div className="text-sm font-medium text-green-700">
                {formatCurrency(material.cost * (material.quantity || 1))}
              </div>
            )}
          </div>
        </div>
        {material.notes && (
          <p className="text-xs text-slate-500 mt-2">{material.notes}</p>
        )}
      </CardContent>
    </Card>
  );
}