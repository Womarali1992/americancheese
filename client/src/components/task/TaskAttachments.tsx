import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { UserCircle, Package } from "lucide-react";
import { Wordbank, WordbankItem } from "@/components/ui/wordbank";
import { Contact, Material } from "@/../../shared/schema";
import { ItemDetailPopup } from "./ItemDetailPopup";

// Use a local task interface to match the component's needs
interface Task {
  id: number;
  title: string;
  description?: string;
  status: string;
  startDate: string;
  endDate: string;
  assignedTo?: string;
  projectId: number;
  completed?: boolean;
  category?: string;
  contactIds?: string[] | number[];
  materialIds?: string[] | number[];
  materialsNeeded?: string;
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
  const [selectedItem, setSelectedItem] = useState<Contact | Material | null>(null);
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
  
  // Transform materials to WordbankItems
  const materialItems: WordbankItem[] = taskMaterials.map(material => ({
    id: material.id,
    label: material.name,
    subtext: material.type,
    color: material.status === 'delivered' ? 'text-green-500' :
            material.status === 'ordered' ? 'text-orange-500' :
            material.status === 'used' ? 'text-blue-500' : 'text-gray-500'
  }));

  // Handle click on contact item
  const handleContactSelect = (id: number) => {
    const contact = taskContacts.find(c => c.id === id);
    if (contact) {
      setSelectedItem(contact);
      setItemType('contact');
    }
  };

  // Handle click on material item
  const handleMaterialSelect = (id: number) => {
    const material = taskMaterials.find(m => m.id === id);
    if (material) {
      setSelectedItem(material);
      setItemType('material');
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
          selectedItems={materialIds}
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