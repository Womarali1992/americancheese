import { useQuery } from "@tanstack/react-query";
import { Package } from "lucide-react";
import { Wordbank, WordbankItem } from "@/components/ui/wordbank";
import type { Material } from "@/../../shared/schema";
import { ItemDetailPopup } from "@/components/task/ItemDetailPopup";
import { useState } from "react";

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

  if (taskMaterials.length === 0 && compact) {
    return (
      <div className={`flex items-center text-sm text-muted-foreground mt-1 ${className}`}>
        <Package className="h-4 w-4 mr-1" />
        <span>No materials</span>
      </div>
    );
  }

  // For compact mode, just show a summary
  if (compact) {
    return (
      <div className={`flex items-center text-sm text-muted-foreground mt-1 ${className}`}>
        <Package className="h-4 w-4 mr-1" />
        <span>{taskMaterials.length} materials</span>
      </div>
    );
  }

  // Full view mode
  return (
    <div className={`space-y-1 mt-1 ${className}`}>
      {isTemplateTask && (
        <div className="text-xs text-amber-600 italic mb-1 bg-amber-50 p-2 rounded-md border border-amber-200">
          This is a template task. Activate it to add materials.
        </div>
      )}
      
      <div>
        <div className="flex items-center text-sm font-medium mb-1">
          <Package className="h-4 w-4 mr-1 text-slate-500" />
          <span>Materials</span>
        </div>
        <Wordbank 
          items={materialItems}
          selectedItems={materialItems.map(item => item.id)}
          onItemSelect={handleMaterialSelect}
          onItemRemove={() => {}}
          readOnly={true}
          emptyText={isTemplateTask ? "Activate task to add materials" : "No materials attached"}
          className="min-h-[36px]"
        />
      </div>

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