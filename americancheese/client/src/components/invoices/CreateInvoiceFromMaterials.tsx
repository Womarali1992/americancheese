import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  FileText, 
  Package, 
  DollarSign,
  Building
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import type { InvoiceData, InvoiceLineItem } from './Invoice';

interface CreateInvoiceFromMaterialsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId?: number;
  preselectedMaterials?: any[];
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
};

const generateInvoiceNumber = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `INV-${year}${month}-${random}`;
};

export function CreateInvoiceFromMaterials({ 
  open, 
  onOpenChange, 
  projectId,
  preselectedMaterials = []
}: CreateInvoiceFromMaterialsProps) {
  const queryClient = useQueryClient();
  
  const [selectedMaterialIds, setSelectedMaterialIds] = useState<Set<number>>(
    new Set(preselectedMaterials.map(m => m.id))
  );
  
  const [invoiceData, setInvoiceData] = useState({
    invoiceNumber: generateInvoiceNumber(),
    clientName: '',
    clientAddress: '',
    projectName: '',
    companyName: 'Your Company Name',
    companyAddress: '123 Business St\nYour City, State 12345',
    companyPhone: '(555) 123-4567',
    companyEmail: 'info@yourcompany.com',
    paymentTerms: 'Net 30 days',
    notes: ''
  });

  // Fetch materials for the project
  const { data: materials = [] } = useQuery<any[]>({
    queryKey: ['/api/materials', projectId ? { projectId } : {}],
    enabled: !!projectId
  });

  // Fetch project details
  const { data: project } = useQuery<any>({
    queryKey: ['/api/projects', projectId],
    enabled: !!projectId
  });

  // Update project name when project data loads
  React.useEffect(() => {
    if (project && !invoiceData.projectName) {
      setInvoiceData(prev => ({
        ...prev,
        projectName: project.name
      }));
    }
  }, [project, invoiceData.projectName]);

  // Filter materials that have costs and can be invoiced
  const invoiceableMaterials = materials.filter(material => 
    material.cost && material.cost > 0
  );

  const selectedMaterials = invoiceableMaterials.filter(material =>
    selectedMaterialIds.has(material.id)
  );

  const totalAmount = selectedMaterials.reduce((sum, material) => 
    sum + (material.cost * material.quantity), 0
  );

  // Create invoice mutation
  const createInvoiceMutation = useMutation({
    mutationFn: async (invoicePayload: any) => {
      const response = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invoicePayload),
      });
      
      if (!response.ok) throw new Error('Failed to create invoice');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/invoices'] });
      toast({
        title: 'Success',
        description: 'Invoice created successfully from materials',
      });
      onOpenChange(false);
      // Reset form
      setSelectedMaterialIds(new Set());
      setInvoiceData({
        invoiceNumber: generateInvoiceNumber(),
        clientName: '',
        clientAddress: '',
        projectName: project?.name || '',
        companyName: 'Your Company Name',
        companyAddress: '123 Business St\nYour City, State 12345',
        companyPhone: '(555) 123-4567',
        companyEmail: 'info@yourcompany.com',
        paymentTerms: 'Net 30 days',
        notes: ''
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to create invoice',
        variant: 'destructive',
      });
    },
  });

  const handleMaterialToggle = (materialId: number, checked: boolean) => {
    const newSelection = new Set(selectedMaterialIds);
    if (checked) {
      newSelection.add(materialId);
    } else {
      newSelection.delete(materialId);
    }
    setSelectedMaterialIds(newSelection);
  };

  const handleSelectAll = () => {
    if (selectedMaterialIds.size === invoiceableMaterials.length) {
      setSelectedMaterialIds(new Set());
    } else {
      setSelectedMaterialIds(new Set(invoiceableMaterials.map(m => m.id)));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!invoiceData.clientName.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Client name is required',
        variant: 'destructive',
      });
      return;
    }

    if (selectedMaterials.length === 0) {
      toast({
        title: 'Validation Error',
        description: 'Please select at least one material',
        variant: 'destructive',
      });
      return;
    }

    // Convert materials to line items
    const lineItems: InvoiceLineItem[] = selectedMaterials.map(material => ({
      id: material.id.toString(),
      description: `${material.name}${material.materialSize ? ` (${material.materialSize})` : ''}${material.supplier ? ` - ${material.supplier}` : ''}`,
      quantity: material.quantity,
      unit: material.unit || 'each',
      unitPrice: material.cost,
      total: material.quantity * material.cost
    }));

    const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0);

    const invoice: Omit<InvoiceData, 'id'> = {
      invoiceNumber: invoiceData.invoiceNumber,
      invoiceDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'draft',
      
      companyName: invoiceData.companyName,
      companyAddress: invoiceData.companyAddress,
      companyPhone: invoiceData.companyPhone,
      companyEmail: invoiceData.companyEmail,
      
      clientName: invoiceData.clientName,
      clientAddress: invoiceData.clientAddress,
      
      projectId,
      projectName: invoiceData.projectName,
      
      lineItems,
      subtotal,
      total: subtotal,
      
      paymentTerms: invoiceData.paymentTerms,
      notes: invoiceData.notes
    };

    createInvoiceMutation.mutate(invoice);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Create Invoice from Materials
          </DialogTitle>
          <DialogDescription>
            Select materials to convert into an invoice. Only materials with pricing are shown.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Invoice Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Invoice Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="invoiceNumber">Invoice Number</Label>
                  <Input
                    id="invoiceNumber"
                    value={invoiceData.invoiceNumber}
                    onChange={(e) => setInvoiceData(prev => ({ ...prev, invoiceNumber: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="projectName">Project Name</Label>
                  <Input
                    id="projectName"
                    value={invoiceData.projectName}
                    onChange={(e) => setInvoiceData(prev => ({ ...prev, projectName: e.target.value }))}
                    placeholder="Project name"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="clientName">Client Name *</Label>
                  <Input
                    id="clientName"
                    value={invoiceData.clientName}
                    onChange={(e) => setInvoiceData(prev => ({ ...prev, clientName: e.target.value }))}
                    required
                    placeholder="Client name"
                  />
                </div>
                <div>
                  <Label htmlFor="paymentTerms">Payment Terms</Label>
                  <Input
                    id="paymentTerms"
                    value={invoiceData.paymentTerms}
                    onChange={(e) => setInvoiceData(prev => ({ ...prev, paymentTerms: e.target.value }))}
                    placeholder="Net 30 days"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="clientAddress">Client Address</Label>
                <Textarea
                  id="clientAddress"
                  value={invoiceData.clientAddress}
                  onChange={(e) => setInvoiceData(prev => ({ ...prev, clientAddress: e.target.value }))}
                  rows={2}
                  placeholder="Client address"
                />
              </div>
            </CardContent>
          </Card>

          {/* Material Selection */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Select Materials ({selectedMaterials.length} selected)
                </CardTitle>
                <div className="flex items-center gap-4">
                  <div className="text-sm text-gray-600">
                    Total: {formatCurrency(totalAmount)}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleSelectAll}
                  >
                    {selectedMaterialIds.size === invoiceableMaterials.length ? 'Deselect All' : 'Select All'}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {invoiceableMaterials.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No materials with pricing found for this project.
                </div>
              ) : (
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {invoiceableMaterials.map((material) => {
                    const isSelected = selectedMaterialIds.has(material.id);
                    const itemTotal = material.quantity * material.cost;
                    
                    return (
                      <div 
                        key={material.id} 
                        className={`flex items-center gap-4 p-3 border rounded-lg ${
                          isSelected ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
                        }`}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) => handleMaterialToggle(material.id, checked === true)}
                        />
                        
                        <div className="flex-1">
                          <div className="font-medium">{material.name}</div>
                          <div className="text-sm text-gray-600 space-x-2">
                            <span>{material.quantity} {material.unit || 'each'}</span>
                            {material.materialSize && <span>• {material.materialSize}</span>}
                            {material.supplier && <span>• {material.supplier}</span>}
                            {material.tier && <span>• {material.tier}</span>}
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="font-semibold">{formatCurrency(itemTotal)}</div>
                          <div className="text-sm text-gray-600">{formatCurrency(material.cost)}/each</div>
                        </div>
                        
                        {material.quoteNumber && (
                          <Badge variant="outline" className="text-xs">
                            Quote #{material.quoteNumber}
                          </Badge>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Additional Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={invoiceData.notes}
                onChange={(e) => setInvoiceData(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
                placeholder="Any additional notes or terms"
              />
            </CardContent>
          </Card>

          {/* Summary and Actions */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="text-lg font-semibold flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Total: {formatCurrency(totalAmount)}
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={createInvoiceMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createInvoiceMutation.isPending || selectedMaterials.length === 0}
              >
                {createInvoiceMutation.isPending ? 'Creating...' : `Create Invoice (${selectedMaterials.length} items)`}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}