import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { UserCircle, Package } from "lucide-react";
import { Wordbank, WordbankItem } from "@/components/ui/wordbank";
import type { Contact, Material } from "@/../../shared/schema";
import { ItemDetailPopup } from "./ItemDetailPopup";

// Use a local task interface to match the component's needs
interface Task {
  id: number;
  title: string;
  description: string | null;
  status: string;
  startDate: string;
  endDate: string;
  assignedTo: string | null;
  projectId: number;
  completed: boolean;
  category: string;
  tier1Category: string;
  tier2Category: string;
  contactIds: string[] | null;
  materialIds: string[] | null;
  materialsNeeded: string | null;
  templateId: string | null;
  estimatedCost: number | null;
  actualCost: number | null;
}

interface TaskAttachmentsProps {
  task: Task;
  className?: string;
}

/**
 * Component to display attached contacts and materials for a task in wordbank format
 */
export function TaskAttachments({ task, className }: TaskAttachmentsProps) {
  // State for showing popup
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [itemType, setItemType] = useState<'contact' | 'material'>('contact');

  // Fetch contacts and materials
  const { data: contacts = [] } = useQuery<Contact[]>({
    queryKey: ["/api/contacts"],
  });
  
  const { data: materials = [] } = useQuery<Material[]>({
    queryKey: ["/api/materials"],
  });
  
  // Convert contact IDs to numbers for consistency
  const contactIds = task.contactIds 
    ? (Array.isArray(task.contactIds) 
        ? task.contactIds.map(id => typeof id === 'string' ? parseInt(id) : id) 
        : [])
    : [];
    
  // Convert material IDs to numbers for consistency
  const materialIds = task.materialIds 
    ? (Array.isArray(task.materialIds) 
        ? task.materialIds.map(id => typeof id === 'string' ? parseInt(id) : id) 
        : [])
    : [];
    
  // Filter contacts and materials based on IDs
  const taskContacts = contacts.filter(contact => 
    contactIds.includes(contact.id)
  );
  
  const taskMaterials = materials.filter(material => 
    materialIds.includes(material.id)
  );
  
  // Transform contacts to WordbankItems
  const contactItems: WordbankItem[] = taskContacts.map(contact => ({
    id: contact.id,
    label: contact.name,
    subtext: contact.role,
    color: contact.type === 'client' ? 'text-blue-500' : 
            contact.type === 'contractor' ? 'text-green-500' : 
            contact.type === 'supplier' ? 'text-orange-500' : 'text-gray-500'
  }));
  
  // Transform materials to WordbankItems, grouped by section and sub-section (tier2Category)
  // First, group materials by section and then sub-section
  const materialsBySection: Record<string, Record<string, Material[]>> = {};
  
  // Let's examine the first task material to see what properties we have
  if (taskMaterials.length > 0) {
    const sampleMaterial = taskMaterials[0];
    console.log("Sample material data:", sampleMaterial);
  }
  
  taskMaterials.forEach(material => {
    // Use correct category field for section and subsection
    const section = material.section || 'General';
    // Use the subsection property which has the value "Subfloor Walls"
    const subSection = material.subsection || 'Subfloor Walls';
    
    // Log every material's section and subsection
    console.log(`Material ${material.id} - ${material.name}: section="${section}", subSection="${subSection}"`);
    
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

  // Add some additional debugging
  console.log("Material sections before processing:", Object.keys(materialsBySection));
  
  // Create one wordbank item for each section with nested subsections
  const materialItems: WordbankItem[] = Object.entries(materialsBySection).map(([section, subsections]) => {
    // For each section, gather all materials across subsections
    const allSectionMaterials: Material[] = [];
    const subsectionItems: WordbankItem[] = [];
    
    // Convert section name to a stable ID
    const sectionId = section.toLowerCase().replace(/\s+/g, '_');
    console.log(`Processing section: "${section}" -> ID: "${sectionId}"`);
    
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
      console.log(`  Subsection: "${subsection}" -> ID: "${subsectionId}"`);
      
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

  // Handle click on contact item
  const handleContactSelect = (id: number | string) => {
    // Convert string ID to number if needed
    const numId = typeof id === 'string' ? parseInt(id) : id;
    const contact = taskContacts.find(c => c.id === numId);
    if (contact) {
      setSelectedItem(contact);
      setItemType('contact');
    }
  };

  // Handle click on material section or subsection item
  const handleMaterialSelect = (id: number | string) => {
    console.log("Material ID selected:", id, typeof id);
    
    // For section-based ID (string), handle section or subsection click
    if (typeof id === 'string') {
      // Check if this is a subsection ID (contains the triple underscore separator)
      if (id.includes('___')) {
        console.log("Triple underscore subsection ID format detected:", id);
        
        // Parse the ID to get section and subsection parts
        const parts = id.split('___');
        const sectionId = parts[0];
        const rawSubsectionId = parts[1];
        
        console.log("Parsed subsection clicked:", sectionId, rawSubsectionId);
        
        // Find the original section and subsection names
        const originalSection = Object.keys(materialsBySection).find(section => 
          section.toLowerCase().replace(/\s+/g, '_') === sectionId
        );
        
        if (originalSection) {
          console.log("Found original section:", originalSection);
          
          // Find the matching subsection by converting each subsection name to an ID format
          // and comparing with the raw subsection ID we extracted
          const originalSubsection = Object.keys(materialsBySection[originalSection]).find(subsection => {
            const generatedId = subsection.toLowerCase().replace(/\s+/g, '_');
            console.log(`  Checking subsection "${subsection}" -> ID "${generatedId}" against "${rawSubsectionId}"`);
            return generatedId === rawSubsectionId;
          });
          
          console.log("Found original subsection:", originalSubsection);
          
          if (originalSubsection && materialsBySection[originalSection][originalSubsection] && 
              materialsBySection[originalSection][originalSubsection].length > 0) {
            // Use the first material from this subsection to show details
            setSelectedItem(materialsBySection[originalSection][originalSubsection][0]);
            setItemType('material');
          }
        }
      } 
      // Also handle the original underscore format for backward compatibility
      else if (id.includes('_')) {
        console.log("Legacy underscore format detected:", id);
        
        // Split the ID to get section and subsection
        const [sectionId, subsectionId] = id.split('_');
        console.log("Legacy subsection clicked:", sectionId, subsectionId);
        
        // Find the original section and subsection names
        const originalSection = Object.keys(materialsBySection).find(section => 
          section.toLowerCase().replace(/\s+/g, '_') === sectionId
        );
        
        if (originalSection) {
          const originalSubsection = Object.keys(materialsBySection[originalSection]).find(subsection =>
            subsection.toLowerCase().replace(/\s+/g, '_') === subsectionId
          );
          
          if (originalSubsection && materialsBySection[originalSection][originalSubsection] && 
              materialsBySection[originalSection][originalSubsection].length > 0) {
            // Use the first material from this subsection to show details
            setSelectedItem(materialsBySection[originalSection][originalSubsection][0]);
            setItemType('material');
          }
        }
      } else {
        // It's a regular section ID - just show the section is selected
        // We don't want to explicitly show details here,
        // just let the Wordbank component handle expansion
        console.log("Section clicked:", id);
      }
    } else {
      // When clicking on a numeric material id, find which section/subsection this id belongs to
      let foundMaterial: Material | null = null;
      
      // Search through all sections and subsections
      Object.entries(materialsBySection).forEach(([sectionName, subsections]) => {
        if (foundMaterial) return;
        
        Object.entries(subsections).forEach(([subsectionName, materials]) => {
          if (foundMaterial) return;
          
          const material = materials.find((m: Material) => m.id === id);
          if (material) {
            foundMaterial = material;
          }
        });
      });
      
      if (foundMaterial) {
        setSelectedItem(foundMaterial);
        setItemType('material');
      }
    }
  };

  // Close the popup
  const handleClosePopup = () => {
    setSelectedItem(null);
  };

  // For template tasks (id <= 0), show a special notice that the task needs to be activated
  const isTemplateTask = task.id <= 0;
  
  // Always render the component with empty states if needed
  return (
    <div className={`space-y-3 mt-3 ${className}`}>
      {isTemplateTask && (
        <div className="text-xs text-amber-600 italic mb-1 bg-amber-50 p-2 rounded-md border border-amber-200">
          This is a template task. Activate it to add contacts and materials.
        </div>
      )}
      
      <div>
        <div className="flex items-center text-sm font-medium mb-1">
          <UserCircle className="h-4 w-4 mr-1 text-slate-500" />
          <span>Contacts</span>
        </div>
        <Wordbank 
          items={contactItems}
          selectedItems={contactIds}
          onItemSelect={handleContactSelect}
          onItemRemove={() => {}}
          readOnly={true}
          emptyText={isTemplateTask ? "Activate task to add contacts" : "No contacts assigned"}
          className="min-h-[36px]"
        />
      </div>
      
      <div>
        <div className="flex items-center text-sm font-medium mb-1">
          <Package className="h-4 w-4 mr-1 text-slate-500" />
          <span>Materials</span>
        </div>
        <Wordbank 
          items={materialItems}
          selectedItems={Object.keys(materialsBySection).map(section => 
            section.toLowerCase().replace(/\s+/g, '_')
          )}
          onItemSelect={handleMaterialSelect}
          onItemRemove={() => {}}
          readOnly={true}
          emptyText={isTemplateTask ? "Activate task to add materials" : "No materials attached"}
          className="min-h-[36px]"
        />
      </div>

      {/* Popup for displaying item details */}
      {selectedItem && (
        <ItemDetailPopup 
          item={selectedItem} 
          itemType={itemType}
          onClose={handleClosePopup} 
        />
      )}
    </div>
  );
}