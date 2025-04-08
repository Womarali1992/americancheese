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
  ClipboardCheck,
  Briefcase,
  Calendar,
  Clock,
  DollarSign
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
  unit?: string | null;
  cost?: number | null;
  category?: string;
  section?: string | null;
  tier?: string;
  tier2Category?: string | null;
}

interface Labor {
  id: number;
  projectId: number;
  taskId?: number | null;
  fullName: string;
  company: string;
  phone?: string | null;
  email?: string | null;
  tier1Category: string;
  tier2Category: string;
  startDate: string;
  endDate: string;
  workDate: string;
  hours?: number | null;
  rate?: number | null;
  totalCost?: number | null;
  status?: string;
  materialIds?: string[] | null;
}

// Props for the ItemDetailPopup component
interface ItemDetailPopupProps {
  item: Contact | Material | Labor;
  itemType: 'contact' | 'material' | 'labor';
  onClose: () => void;
}

export function ItemDetailPopup({ item, itemType, onClose }: ItemDetailPopupProps) {
  // Check what type of item we're displaying
  const isContact = itemType === 'contact';
  const isMaterial = itemType === 'material';
  const isLabor = itemType === 'labor';
  
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
              ) : isMaterial ? (
                <Package className="h-5 w-5 text-orange-500" />
              ) : (
                <Briefcase className="h-5 w-5 text-green-500" />
              )}
              <CardTitle>
                {isContact ? (item as Contact).name : 
                 isMaterial ? (item as Material).name : 
                 (item as Labor).fullName}
              </CardTitle>
            </div>
          </div>
          <CardDescription>
            {isContact ? (item as Contact).role : 
             isMaterial ? (item as Material).type :
             (item as Labor).tier2Category}
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
          ) : isMaterial ? (
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
              {(item as Material).section && (
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-gray-500" />
                  <span>Section: {(item as Material).section}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {/* Log the labor item data for debugging */}
              {console.log("Labor detail popup item:", item)}
              
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4 text-gray-500" />
                <span>{(item as Labor).company || "Unknown Company"}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span>Work Date: {(item as Labor).workDate || "Not specified"}</span>
              </div>
              
              {/* Show task ID if available */}
              {(item as Labor).taskId && (
                <div className="flex items-center gap-2">
                  <ClipboardCheck className="h-4 w-4 text-gray-500" />
                  <span>Task ID: {(item as Labor).taskId}</span>
                </div>
              )}
              
              {(item as Labor).hours && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span>{(item as Labor).hours} hours</span>
                </div>
              )}
              
              {(item as Labor).rate && (
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-gray-500" />
                  <span>Rate: {formatCurrency((item as Labor).rate || 0)}/hour</span>
                </div>
              )}
              
              {(item as Labor).totalCost && (
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-gray-500" />
                  <span>Total: {formatCurrency((item as Labor).totalCost || 0)}</span>
                </div>
              )}
              
              {(item as Labor).status && (
                <div className="flex items-center gap-2">
                  <ClipboardCheck className="h-4 w-4 text-gray-500" />
                  <span className="capitalize">{(item as Labor).status}</span>
                </div>
              )}
              
              {(item as Labor).phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <span>{(item as Labor).phone}</span>
                </div>
              )}
              
              {(item as Labor).email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <span>{(item as Labor).email}</span>
                </div>
              )}
              
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-gray-500" />
                <span>Category: {(item as Labor).tier1Category || "General"}</span>
                {(item as Labor).tier2Category && (
                  <span> - {(item as Labor).tier2Category}</span>
                )}
              </div>
              
              {/* Show date range if available */}
              {((item as Labor).startDate || (item as Labor).endDate) && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span>
                    Period: {(item as Labor).startDate || "Unknown"} to {(item as Labor).endDate || "ongoing"}
                  </span>
                </div>
              )}
              
              {/* Project ID reference */}
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4 text-gray-500" />
                <span>Project ID: {(item as Labor).projectId}</span>
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