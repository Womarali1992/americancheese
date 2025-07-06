import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Package, User, Calendar, DollarSign, ChevronDown, ChevronRight, Plus } from 'lucide-react';
import { Material } from '@shared/schema';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { LinkifiedText } from "@/lib/linkUtils";
import { ItemDetailPopup } from '@/components/task/ItemDetailPopup';
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface TaskMaterialsProps {
  taskId: number;
  compact?: boolean;
  className?: string;
  mode?: 'compact' | 'full';
}

/**
 * Component to display materials for a task
 */
export function TaskMaterials({ taskId, compact = false, className = "", mode = 'compact' }: TaskMaterialsProps) {
  // States for showing detail popups
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);

  // Log for debugging
  console.log(`Task ${taskId} materials general data:`, { materialsCount: 0, taskId });

  // Fetch task-related materials
  const { data: taskMaterials = [], isLoading: isLoadingMaterials } = useQuery<Material[]>({
    queryKey: [`/api/tasks/${taskId}/materials`],
    enabled: taskId > 0,
    staleTime: 60000, // 1 minute
  });

  // Log for debugging
  console.log(`Direct task/${taskId}/materials query found ${taskMaterials.length} materials`, taskMaterials);

  // Fetch all materials (as a backup)
  const { data: allMaterials = [], isLoading: isLoadingAllMaterials } = useQuery<Material[]>({
    queryKey: ['/api/materials'],
    enabled: taskId > 0,
    staleTime: 60000, // 1 minute
  });

  // Filter materials for this task
  const taskAssociatedMaterials = allMaterials.filter(material => {
    if (!material.taskIds) return false;
    // Convert taskIds to numbers if they're strings
    const materialTaskIds = material.taskIds.map(id => 
      typeof id === 'string' ? parseInt(id) : id
    );
    return materialTaskIds.includes(taskId);
  });

  console.log(`Filtered all materials for task ${taskId}, found ${taskAssociatedMaterials.length} associated materials`, taskAssociatedMaterials);
  
  // Combine both sources
  const combinedMaterials = React.useMemo(() => {
    // Start with direct task materials results
    const allEntries = [...taskMaterials];
    
    // Add any filtered entries that weren't already added
    taskAssociatedMaterials.forEach(material => {
      if (!allEntries.some(m => m.id === material.id)) {
        allEntries.push(material);
      }
    });
    
    console.log(`Final combined materials for task ${taskId}:`, allEntries);
    return allEntries;
  }, [taskId, taskMaterials, taskAssociatedMaterials]);

  // Log the final list for debugging
  console.log("Task materials entries:", { allMaterials: allMaterials.length, filteredMaterials: taskAssociatedMaterials.length, taskId });

  // Calculate total materials cost
  const totalCost = React.useMemo(() => {
    return combinedMaterials.reduce((total, material) => {
      return total + ((material.cost || 0) * (material.quantity || 1));
    }, 0);
  }, [combinedMaterials]);

  // Group materials by category for better organization
  const materialsByCategory = React.useMemo(() => {
    const categories: Record<string, Material[]> = {};
    
    combinedMaterials.forEach(material => {
      const category = material.category || material.type || 'General';
      
      if (!categories[category]) {
        categories[category] = [];
      }
      
      categories[category].push(material);
    });
    
    return categories;
  }, [combinedMaterials]);

  // Handle clicking on a material entry
  const handleMaterialClick = (material: Material) => {
    setSelectedMaterial(material);
  };

  // If still loading, show minimal content
  if (isLoadingMaterials || isLoadingAllMaterials) {
    return (
      <div className={`flex items-center text-sm text-muted-foreground mt-1 ${className}`}>
        <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-md font-medium flex items-center">
          <Package className="h-4 w-4 mr-1" />
          Loading Materials...
        </span>
      </div>
    );
  }

  // If no material entries, show a simple badge with "No Materials"
  if (combinedMaterials.length === 0) {
    return (
      <div className={`flex items-center text-sm text-muted-foreground mt-1 ${className}`}>
        <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-md font-medium flex items-center">
          <Package className="h-4 w-4 mr-1" />
          No Materials
        </span>
      </div>
    );
  }

  // Check for full mode first (for the detail page)
  if (mode === 'full') {
    return (
      <div className={`${className}`}>
        <Card className="shadow-sm">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="flex items-center text-xl font-semibold">
              <Package className="h-5 w-5 mr-2 text-orange-600" />
              Materials
            </CardTitle>
            <CardDescription>
              This task has {combinedMaterials.length} materials with an estimated cost of {formatCurrency(totalCost)}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="p-4">
            <Accordion type="multiple" className="w-full space-y-3">
              {Object.entries(materialsByCategory).map(([category, materials]) => {
                // Calculate total category cost
                const categoryCost = materials.reduce((sum, material) => 
                  sum + ((material.cost || 0) * (material.quantity || 1)), 0
                );
                
                // Create a category ID
                const categoryId = category.toLowerCase().replace(/\s+/g, '-');
                
                return (
                  <AccordionItem 
                    key={categoryId} 
                    value={`category-${categoryId}`} 
                    className="border border-orange-200 rounded-md overflow-hidden"
                  >
                    <AccordionTrigger className="py-2 px-3 bg-orange-50 hover:bg-orange-100 hover:no-underline">
                      <div className="flex flex-col w-full space-y-2">
                        {/* Title with white background - smaller */}
                        <div className="bg-white px-2 py-1 rounded-md border border-orange-200 self-start">
                          <div className="flex items-center">
                            <Package className="h-4 w-4 mr-2 text-orange-600" />
                            <span className="text-sm font-medium">{category}</span>
                          </div>
                        </div>
                        
                        {/* Item count and cost */}
                        <div className="flex items-center justify-between w-full">
                          <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full text-xs">
                            {materials.length} items
                          </span>
                          {categoryCost > 0 && (
                            <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                              {formatCurrency(categoryCost)}
                            </span>
                          )}
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 py-3 bg-white">
                      <div className="grid gap-3 grid-cols-1">
                        {materials.map(material => (
                          <Card 
                            key={material.id} 
                            className="border border-orange-200 shadow-sm hover:shadow-md transition-all bg-white"
                            onClick={() => handleMaterialClick(material)}
                          >
                            <CardHeader className="py-2 px-3 border-b border-orange-100">
                              <div className="space-y-2">
                                {/* Title with white background - smaller */}
                                <div className="bg-white px-2 py-1 rounded-md border border-orange-200">
                                  <CardTitle className="text-sm font-medium text-slate-800">
                                    {material.name}
                                  </CardTitle>
                                </div>
                                
                                {/* Two items above cost */}
                                <div className="flex justify-between items-center text-xs">
                                  <div className="flex items-center space-x-2">
                                    <span className="px-2 py-1 bg-orange-50 text-orange-700 rounded-full">
                                      {material.quantity || 1} {material.unit || 'units'}
                                    </span>
                                    {material.status && (
                                      <span className="px-2 py-1 bg-amber-50 text-amber-700 rounded-full">
                                        {material.status}
                                      </span>
                                    )}
                                  </div>
                                  {material.cost && Number(material.cost) > 0 && (
                                    <div className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                                      {formatCurrency(Number(material.cost) * (material.quantity || 1))}
                                    </div>
                                  )}
                                </div>
                                
                                {/* Category tags */}
                                <CardDescription className="mt-1">
                                  <div className="flex flex-wrap gap-1">
                                    {material.type && (
                                      <span className="text-xs px-1.5 py-0.5 bg-orange-50 text-orange-700 rounded-full">
                                        {material.type}
                                      </span>
                                    )}
                                    {material.category && (
                                      <span className="text-xs px-1.5 py-0.5 bg-purple-50 text-purple-700 rounded-full">
                                        {material.category}
                                      </span>
                                    )}
                                  </div>
                                </CardDescription>
                              </div>
                            </CardHeader>
                            <CardContent className="py-2 px-3">
                              {material.details && (
                                <div className="text-sm text-slate-600 bg-slate-50 p-2 rounded-md">
                                  <p className="text-xs font-medium mb-1 text-slate-500">Description:</p>
                                  <LinkifiedText text={material.details} />
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </CardContent>
        </Card>
        
        {/* Material detail popup */}
        {selectedMaterial && (
          <ItemDetailPopup
            item={selectedMaterial}
            itemType="material"
            onClose={() => setSelectedMaterial(null)}
          />
        )}
      </div>
    );
  }

  // In compact mode, show a collapsible accordion right in the task card
  if (compact) {
    return (
      <>
        <div className={`mt-1 ${className}`}>
          <Accordion type="single" collapsible className="w-full border-0">
            <AccordionItem value="material-entries" className="border-0">
              <AccordionTrigger className="py-1 text-sm text-muted-foreground hover:no-underline">
                <div className="flex-1 flex items-center">
                  <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-md font-medium flex items-center mr-2">
                    <Package className="h-4 w-4 mr-1" />
                    Materials ({combinedMaterials.length})
                    {totalCost > 0 && (
                      <span className="ml-2 text-xs bg-orange-200 text-orange-900 px-1.5 py-0.5 rounded-full">
                        ${totalCost.toFixed(2)}
                      </span>
                    )}
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="mt-2 pl-2">
                  <Accordion type="multiple" className="w-full space-y-1">
                    {Object.entries(materialsByCategory).map(([category, materials]) => {
                      // Calculate category cost
                      const categoryCost = materials.reduce((sum, material) => 
                        sum + ((material.cost || 0) * (material.quantity || 1)), 0
                      );
                      
                      // Create a category ID
                      const categoryId = category.toLowerCase().replace(/\s+/g, '-');
                      
                      return (
                        <AccordionItem key={categoryId} value={`category-card-${categoryId}`} className="border border-orange-200 rounded-md mb-2 bg-orange-50">
                          <AccordionTrigger className="py-2 px-3 text-sm hover:no-underline">
                            <div className="flex items-center">
                              <Package className="h-4 w-4 mr-2 text-orange-500" />
                              <span className="font-medium">{category}</span>
                            </div>
                            <div className="flex items-center text-xs space-x-2">
                              <span className="px-1.5 py-0.5 bg-orange-50 text-orange-700 rounded-full">
                                {materials.length} items
                              </span>
                              {categoryCost > 0 && (
                                <span className="px-1.5 py-0.5 bg-green-50 text-green-700 rounded-full">
                                  {formatCurrency(categoryCost)}
                                </span>
                              )}
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="px-3 py-2 bg-orange-50">
                            <div className="space-y-2">
                              {materials.map(material => (
                                <div 
                                  key={material.id} 
                                  className="p-2 border border-orange-200 rounded-md bg-white hover:bg-orange-50 cursor-pointer transition-colors"
                                  onClick={() => setSelectedMaterial(material)}
                                >
                                  <div className="flex justify-between items-center">
                                    <div className="font-medium text-sm">
                                      {material.name}
                                    </div>
                                    <div className="text-sm font-medium">
                                      {material.quantity || 1} {material.unit || 'units'}
                                    </div>
                                  </div>
                                  <div className="flex justify-between items-center text-xs text-slate-500 mt-1">
                                    {material.type && (
                                      <div className="flex items-center">
                                        <Package className="h-3 w-3 mr-1" /> 
                                        {material.type}
                                      </div>
                                    )}
                                    {material.cost !== null && material.cost !== undefined && Number(material.cost) > 0 && (
                                      <div className="flex items-center px-1.5 py-0.5 bg-orange-200 text-orange-900 rounded-full">
                                        <DollarSign className="h-3 w-3 mr-1" /> 
                                        ${(Number(material.cost) * (material.quantity || 1)).toFixed(2)}
                                      </div>
                                    )}
                                  </div>
                                  {material.details && (
                                    <div className="text-xs text-slate-500 mt-1 line-clamp-2">
                                      <LinkifiedText text={material.details} />
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      );
                    })}
                  </Accordion>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
        
        {/* Material detail popup */}
        {selectedMaterial && (
          <ItemDetailPopup
            item={selectedMaterial}
            itemType="material"
            onClose={() => setSelectedMaterial(null)}
          />
        )}
      </>
    );
  }

  // Default view (not compact, not full)
  return (
    <div className={`mt-2 ${className}`}>
      <div className="flex items-center text-sm font-medium mb-2">
        <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-md font-medium flex items-center">
          <Package className="h-4 w-4 mr-1" />
          Materials ({combinedMaterials.length})
          {totalCost > 0 && (
            <span className="ml-2 text-xs bg-orange-200 text-orange-900 px-1.5 py-0.5 rounded-full">
              ${totalCost.toFixed(2)}
            </span>
          )}
        </span>
      </div>
      
      <Accordion type="multiple" className="w-full border rounded-md bg-white space-y-1">
        {Object.entries(materialsByCategory).map(([category, materials]) => {
          // Calculate category cost
          const categoryCost = materials.reduce((sum, material) => 
            sum + ((material.cost || 0) * (material.quantity || 1)), 0
          );
          
          // Create a category ID
          const categoryId = category.toLowerCase().replace(/\s+/g, '-');
          
          return (
            <AccordionItem key={categoryId} value={`category-${categoryId}`} className="border-0 px-2">
              <AccordionTrigger className="py-2 text-sm hover:no-underline">
                <div className="flex items-center justify-between w-full pr-2">
                  <div className="flex items-center">
                    <Package className="h-4 w-4 mr-2 text-orange-500" />
                    <span className="font-medium">{category}</span>
                  </div>
                  <div className="flex items-center text-xs space-x-2">
                    <span className="px-1.5 py-0.5 bg-orange-50 text-orange-700 rounded-full">
                      {materials.length} items
                    </span>
                    {categoryCost > 0 && (
                      <span className="px-1.5 py-0.5 bg-orange-200 text-orange-900 rounded-full">
                        ${categoryCost.toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pl-5 space-y-2 pt-1 pb-2">
                {materials.map(material => (
                  <div 
                    key={material.id} 
                    className="p-2 border border-orange-200 rounded-md bg-orange-50 hover:bg-orange-100 cursor-pointer transition-colors text-xs"
                    onClick={() => handleMaterialClick(material)}
                  >
                    <div className="flex justify-between items-center">
                      <div className="font-medium">
                        {material.name}
                      </div>
                      <div className="text-sm font-medium">
                        {material.quantity || 1} {material.unit || 'units'}
                      </div>
                    </div>
                    <div className="flex justify-between items-center text-slate-500 mt-1">
                      {material.type && (
                        <div className="flex items-center">
                          <Package className="h-3 w-3 mr-1" /> 
                          {material.type}
                        </div>
                      )}
                      {material.cost !== null && material.cost !== undefined && Number(material.cost) > 0 && (
                        <div className="flex items-center px-1.5 py-0.5 bg-orange-200 text-orange-900 rounded-full">
                          <DollarSign className="h-3 w-3 mr-1" /> 
                          ${(Number(material.cost) * (material.quantity || 1)).toFixed(2)}
                        </div>
                      )}
                    </div>
                    {material.details && (
                      <div className="text-[10px] mt-1 bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-md">
                        <LinkifiedText text={material.details.substring(0, 100) + (material.details.length > 100 ? '...' : '')} />
                      </div>
                    )}
                  </div>
                ))}
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>

      {/* Material detail popup */}
      {selectedMaterial && (
        <ItemDetailPopup
          item={selectedMaterial}
          itemType="material"
          onClose={() => setSelectedMaterial(null)}
        />
      )}
    </div>
  );
}