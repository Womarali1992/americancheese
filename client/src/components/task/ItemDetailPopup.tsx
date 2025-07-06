import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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
  DollarSign,
  Edit,
  Save,
  X
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { LinkifiedText } from '@/lib/linkUtils';

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
  details?: string | null;
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
  taskDescription?: string | null;
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
  
  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(item);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Close when clicking outside the popup
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };
  
  // Mutation for updating items
  const updateMutation = useMutation({
    mutationFn: async (updatedItem: any) => {
      const endpoint = isContact ? 'contacts' : isMaterial ? 'materials' : 'labor';
      const response = await fetch(`/api/${endpoint}/${item.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedItem)
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Updated successfully',
        description: `${isContact ? 'Contact' : isMaterial ? 'Material' : 'Labor'} has been updated.`
      });
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['/api/contacts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/materials'] });
      queryClient.invalidateQueries({ queryKey: ['/api/labor'] });
      setIsEditing(false);
      onClose();
    },
    onError: (error) => {
      toast({
        title: 'Error updating item',
        description: 'Please try again.',
        variant: 'destructive'
      });
    }
  });
  
  const handleSave = () => {
    updateMutation.mutate(editData);
  };
  
  const handleCancel = () => {
    setEditData(item);
    setIsEditing(false);
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
            <div className="flex gap-2">
              {!isEditing && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  className="h-8 w-8 p-0"
                >
                  <Edit className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
          <CardDescription>
            {isContact ? (item as Contact).role : 
             isMaterial ? (item as Material).type :
             (item as Labor).tier2Category}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <div className="space-y-4">
              {/* Edit Form */}
              {isContact ? (
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={(editData as Contact).name}
                      onChange={(e) => setEditData({...editData, name: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="role">Role</Label>
                    <Input
                      id="role"
                      value={(editData as Contact).role}
                      onChange={(e) => setEditData({...editData, role: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="company">Company</Label>
                    <Input
                      id="company"
                      value={(editData as Contact).company || ''}
                      onChange={(e) => setEditData({...editData, company: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={(editData as Contact).phone || ''}
                      onChange={(e) => setEditData({...editData, phone: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={(editData as Contact).email || ''}
                      onChange={(e) => setEditData({...editData, email: e.target.value})}
                    />
                  </div>
                </div>
              ) : isMaterial ? (
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={(editData as Material).name}
                      onChange={(e) => setEditData({...editData, name: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="details">Details</Label>
                    <Textarea
                      id="details"
                      value={(editData as Material).details || ''}
                      onChange={(e) => setEditData({...editData, details: e.target.value})}
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input
                      id="quantity"
                      type="number"
                      value={(editData as Material).quantity}
                      onChange={(e) => setEditData({...editData, quantity: parseInt(e.target.value) || 0})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="cost">Cost per unit</Label>
                    <Input
                      id="cost"
                      type="number"
                      step="0.01"
                      value={(editData as Material).cost || ''}
                      onChange={(e) => setEditData({...editData, cost: parseFloat(e.target.value) || null})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="supplier">Supplier</Label>
                    <Input
                      id="supplier"
                      value={(editData as Material).supplier || ''}
                      onChange={(e) => setEditData({...editData, supplier: e.target.value})}
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      value={(editData as Labor).fullName}
                      onChange={(e) => setEditData({...editData, fullName: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="taskDescription">Task Description</Label>
                    <Textarea
                      id="taskDescription"
                      value={(editData as Labor).taskDescription || ''}
                      onChange={(e) => setEditData({...editData, taskDescription: e.target.value})}
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="company">Company</Label>
                    <Input
                      id="company"
                      value={(editData as Labor).company}
                      onChange={(e) => setEditData({...editData, company: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={(editData as Labor).phone || ''}
                      onChange={(e) => setEditData({...editData, phone: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={(editData as Labor).email || ''}
                      onChange={(e) => setEditData({...editData, email: e.target.value})}
                    />
                  </div>
                </div>
              )}
              
              {/* Edit Action Buttons */}
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  disabled={updateMutation.isPending}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={updateMutation.isPending}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {updateMutation.isPending ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </div>
          ) : (
            <div>
              {/* Display View */}
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
                  {(item as Material).details && (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <LinkifiedText 
                        text={(item as Material).details!} 
                        className="text-sm text-gray-700"
                      />
                    </div>
                  )}
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
                  {(item as Labor).taskDescription && (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <LinkifiedText 
                        text={(item as Labor).taskDescription!} 
                        className="text-sm text-gray-700"
                      />
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-gray-500" />
                    <span>{(item as Labor).company || "Unknown Company"}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span>Work Date: {(item as Labor).workDate || "Not specified"}</span>
                  </div>
                  
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
                  
                  {((item as Labor).startDate || (item as Labor).endDate) && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span>
                        Period: {(item as Labor).startDate || "Unknown"} to {(item as Labor).endDate || "ongoing"}
                      </span>
                    </div>
                  )}
                  
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
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}