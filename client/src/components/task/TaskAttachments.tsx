import { useQuery } from "@tanstack/react-query";
import { UserCircle, Package } from "lucide-react";
import { Wordbank, WordbankItem } from "@/components/ui/wordbank";
import { Contact, Material, Task } from "@/../../shared/schema";

interface TaskAttachmentsProps {
  task: Task;
  className?: string;
}

/**
 * Component to display attached contacts and materials for a task in wordbank format
 */
export function TaskAttachments({ task, className }: TaskAttachmentsProps) {
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

  // Don't render anything if there are no attachments
  if (contactItems.length === 0 && materialItems.length === 0) {
    return null;
  }
  
  return (
    <div className={`space-y-3 mt-3 ${className}`}>
      {contactItems.length > 0 && (
        <div>
          <div className="flex items-center text-sm font-medium mb-1">
            <UserCircle className="h-4 w-4 mr-1 text-slate-500" />
            <span>Contacts</span>
          </div>
          <Wordbank 
            items={contactItems}
            selectedItems={contactIds}
            onItemSelect={() => {}}
            onItemRemove={() => {}}
            readOnly={true}
            emptyText="No contacts assigned"
          />
        </div>
      )}
      
      {materialItems.length > 0 && (
        <div>
          <div className="flex items-center text-sm font-medium mb-1">
            <Package className="h-4 w-4 mr-1 text-slate-500" />
            <span>Materials</span>
          </div>
          <Wordbank 
            items={materialItems}
            selectedItems={materialIds}
            onItemSelect={() => {}}
            onItemRemove={() => {}}
            readOnly={true}
            emptyText="No materials attached"
          />
        </div>
      )}
    </div>
  );
}