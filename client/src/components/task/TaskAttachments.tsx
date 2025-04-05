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
  
  // Transform materials to WordbankItems, grouped by section
  // First, group materials by section
  const materialsBySection: Record<string, Material[]> = {};
  taskMaterials.forEach(material => {
    const section = material.section || 'General';
    if (!materialsBySection[section]) {
      materialsBySection[section] = [];
    }
    materialsBySection[section].push(material);
  });

  // Create one wordbank item for each section
  const materialItems: WordbankItem[] = Object.entries(materialsBySection).map(([section, sectionMaterials]) => {
    // Create a mapping of material IDs to names and quantities for display in expanded view
    const materialNames: Record<number, string> = {};
    const materialQuantities: Record<number, string> = {};
    const materialUnits: Record<number, string> = {};
    
    sectionMaterials.forEach(material => {
      materialNames[material.id] = material.name;
      materialQuantities[material.id] = material.quantity?.toString() || '0';
      materialUnits[material.id] = material.unit || 'units';
    });
    
    return {
      id: section.toLowerCase().replace(/\s+/g, '_'), // Create a unique string ID for the section
      label: section,
      subtext: `${sectionMaterials.length} material${sectionMaterials.length !== 1 ? 's' : ''}`,
      color: 'text-slate-600',
      metadata: {
        materialIds: sectionMaterials.map(material => material.id),
        materialNames, // Add material names for the expanded view
        materialQuantities, // Add quantities
        materialUnits // Add units
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

  // Handle click on material section item
  const handleMaterialSelect = (id: number | string) => {
    // For section-based ID (string), find which section this belongs to
    if (typeof id === 'string') {
      // The id is the section name converted to lowercase with spaces replaced by underscores
      // Convert it back to original format by finding matching section name
      const originalSection = Object.keys(materialsBySection).find(section => 
        section.toLowerCase().replace(/\s+/g, '_') === id
      );
      
      if (originalSection && materialsBySection[originalSection].length > 0) {
        // Use the first material from this section to show details
        setSelectedItem(materialsBySection[originalSection][0]);
        setItemType('material');
      }
    } else {
      // When clicking on a numeric id, find which section this id belongs to
      const sectionEntry = Object.entries(materialsBySection).find(([_, materials]) => 
        materials.some(m => m.id === id)
      );
      
      if (sectionEntry) {
        // Use the first material from this section to show details
        const [sectionName, sectionMaterials] = sectionEntry;
        if (sectionMaterials.length > 0) {
          setSelectedItem(sectionMaterials[0]);
          setItemType('material');
        }
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