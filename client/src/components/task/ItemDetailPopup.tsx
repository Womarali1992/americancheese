import React from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Package, 
  UserCircle, 
  Phone, 
  Mail, 
  Building, 
  Tag, 
  ShoppingCart, 
  Store, 
  ClipboardCheck 
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

// Types for the items
interface Contact {
  id: number;
  name: string;
  role: string;
  company?: string | null;
  phone?: string | null;
  email?: string | null;
  type: string;
  initials?: string | null;
}

interface Material {
  id: number;
  name: string;
  type: string;
  quantity: number;
  projectId: number;
  supplier?: string | null;
  status: string;
  unit?: string;
  cost?: number;
  category?: string;
}

// Props for the ItemDetailPopup component
interface ItemDetailPopupProps {
  item: Contact | Material;
  itemType: 'contact' | 'material';
  onClose: () => void;
}

export function ItemDetailPopup({ item, itemType, onClose }: ItemDetailPopupProps) {
  // Check if the item is a contact or material
  const isContact = itemType === 'contact';
  
  // Close when clicking outside the popup
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" 
      onClick={handleBackdropClick}
    >
      <Card className="w-full max-w-md">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isContact ? (
                <UserCircle className="h-5 w-5 text-blue-500" />
              ) : (
                <Package className="h-5 w-5 text-orange-500" />
              )}
              <CardTitle>
                {isContact ? (item as Contact).name : (item as Material).name}
              </CardTitle>
            </div>
          </div>
          <CardDescription>
            {isContact ? (item as Contact).role : (item as Material).type}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isContact ? (
            <div className="space-y-3">
              {(item as Contact).company && (
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-gray-500" />
                  <span>{(item as Contact).company}</span>
                </div>
              )}
              {(item as Contact).phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <span>{(item as Contact).phone}</span>
                </div>
              )}
              {(item as Contact).email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <span>{(item as Contact).email}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-gray-500" />
                <span className="capitalize">{(item as Contact).type}</span>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-4 w-4 text-gray-500" />
                <span>{(item as Material).quantity} {(item as Material).unit || 'units'}</span>
              </div>
              {(item as Material).cost && (
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-gray-500" />
                  <span>{formatCurrency((item as Material).cost || 0)} per unit</span>
                </div>
              )}
              {(item as Material).supplier && (
                <div className="flex items-center gap-2">
                  <Store className="h-4 w-4 text-gray-500" />
                  <span>{(item as Material).supplier}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <ClipboardCheck className="h-4 w-4 text-gray-500" />
                <span className="capitalize">{(item as Material).status}</span>
              </div>
            </div>
          )}
          <div className="mt-4 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800"
            >
              Close
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}