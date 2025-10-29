import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Trash2, 
  Save, 
  Eye,
  Package,
  Calculator
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import type { InvoiceData, InvoiceLineItem } from './Invoice';

interface InvoiceEditorProps {
  invoice?: InvoiceData | null;
  projectId?: number;
  onSave: () => void;
  onCancel: () => void;
}

const generateInvoiceNumber = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `INV-${year}${month}-${random}`;
};

export function InvoiceEditor({ invoice, projectId, onSave, onCancel }: InvoiceEditorProps) {
  const queryClient = useQueryClient();
  const isEditing = !!invoice;

  // Form state
  const [formData, setFormData] = useState<Partial<InvoiceData>>({
    invoiceNumber: invoice?.invoiceNumber || generateInvoiceNumber(),
    invoiceDate: invoice?.invoiceDate || new Date().toISOString().split('T')[0],
    dueDate: invoice?.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: invoice?.status || 'draft',
    
    // Company Information - Default values
    companyName: invoice?.companyName || 'Your Company Name',
    companyAddress: invoice?.companyAddress || '123 Business St\nYour City, State 12345',
    companyPhone: invoice?.companyPhone || '(555) 123-4567',
    companyEmail: invoice?.companyEmail || 'info@yourcompany.com',
    
    // Client Information
    clientName: invoice?.clientName || '',
    clientAddress: invoice?.clientAddress || '',
    clientEmail: invoice?.clientEmail || '',
    clientPhone: invoice?.clientPhone || '',
    
    // Project Information
    projectId: invoice?.projectId || projectId,
    projectName: invoice?.projectName || '',
    workPeriod: invoice?.workPeriod || '',
    
    // Financial Details
    taxRate: invoice?.taxRate || 0,
    discountAmount: invoice?.discountAmount || 0,
    discountDescription: invoice?.discountDescription || '',
    
    // Payment Terms
    paymentTerms: invoice?.paymentTerms || 'Net 30 days',
    paymentMethod: invoice?.paymentMethod || '',
    notes: invoice?.notes || '',
  });

  const [lineItems, setLineItems] = useState<InvoiceLineItem[]>(
    invoice?.lineItems || [
      {
        id: '1',
        description: '',
        quantity: 1,
        unit: 'each',
        unitPrice: 0,
        total: 0
      }
    ]
  );

  // Fetch projects for dropdown
  const { data: projects = [] } = useQuery<any[]>({
    queryKey: ['/api/projects'],
  });

  // Fetch materials from selected project to populate line items
  const { data: materials = [] } = useQuery<any[]>({
    queryKey: ['/api/materials', formData.projectId ? { projectId: formData.projectId } : {}],
    enabled: !!formData.projectId
  });

  // Calculate totals
  const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0);
  const taxAmount = subtotal * (formData.taxRate || 0) / 100;
  const total = subtotal + taxAmount - (formData.discountAmount || 0);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (data: InvoiceData) => {
      const url = isEditing ? `/api/invoices/${invoice.id}` : '/api/invoices';
      const method = isEditing ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) throw new Error('Failed to save invoice');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/invoices'] });
      toast({
        title: 'Success',
        description: `Invoice ${isEditing ? 'updated' : 'created'} successfully`,
      });
      onSave();
    },
    onError: () => {
      toast({
        title: 'Error',
        description: `Failed to ${isEditing ? 'update' : 'create'} invoice`,
        variant: 'destructive',
      });
    },
  });

  // Update line item totals when quantity or unit price changes
  useEffect(() => {
    setLineItems(items => items.map(item => ({
      ...item,
      total: item.quantity * item.unitPrice
    })));
  }, []);

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addLineItem = () => {
    const newItem: InvoiceLineItem = {
      id: Date.now().toString(),
      description: '',
      quantity: 1,
      unit: 'each',
      unitPrice: 0,
      total: 0
    };
    setLineItems(prev => [...prev, newItem]);
  };

  const removeLineItem = (id: string) => {
    setLineItems(prev => prev.filter(item => item.id !== id));
  };

  const updateLineItem = (id: string, field: keyof InvoiceLineItem, value: any) => {
    setLineItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      
      const updated = { ...item, [field]: value };
      
      // Recalculate total when quantity or unitPrice changes
      if (field === 'quantity' || field === 'unitPrice') {
        updated.total = updated.quantity * updated.unitPrice;
      }
      
      return updated;
    }));
  };

  const importFromMaterials = () => {
    if (!materials.length) {
      toast({
        title: 'No Materials',
        description: 'No materials found for the selected project',
        variant: 'destructive',
      });
      return;
    }

    const materialItems: InvoiceLineItem[] = materials
      .filter(material => material.cost && material.cost > 0)
      .map((material, index) => ({
        id: `material-${material.id}`,
        description: `${material.name}${material.materialSize ? ` (${material.materialSize})` : ''}`,
        quantity: material.quantity || 1,
        unit: material.unit || 'each',
        unitPrice: material.cost || 0,
        total: (material.quantity || 1) * (material.cost || 0)
      }));

    if (materialItems.length === 0) {
      toast({
        title: 'No Valid Materials',
        description: 'No materials with pricing found for the selected project',
        variant: 'destructive',
      });
      return;
    }

    setLineItems(materialItems);
    toast({
      title: 'Success',
      description: `Imported ${materialItems.length} materials`,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.clientName?.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Client name is required',
        variant: 'destructive',
      });
      return;
    }

    if (lineItems.length === 0 || lineItems.every(item => !item.description?.trim())) {
      toast({
        title: 'Validation Error',
        description: 'At least one line item with description is required',
        variant: 'destructive',
      });
      return;
    }

    const invoiceData: InvoiceData = {
      id: invoice?.id || Date.now().toString(),
      ...formData as Required<typeof formData>,
      lineItems: lineItems.filter(item => item.description?.trim()),
      subtotal,
      taxAmount,
      total,
    };

    saveMutation.mutate(invoiceData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl mx-auto">
      {/* Header Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Invoice Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="invoiceNumber">Invoice Number</Label>
              <Input
                id="invoiceNumber"
                value={formData.invoiceNumber || ''}
                onChange={(e) => updateFormData('invoiceNumber', e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="invoiceDate">Invoice Date</Label>
              <Input
                id="invoiceDate"
                type="date"
                value={formData.invoiceDate || ''}
                onChange={(e) => updateFormData('invoiceDate', e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="date"
                value={formData.dueDate || ''}
                onChange={(e) => updateFormData('dueDate', e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => updateFormData('status', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="projectId">Project</Label>
              <Select 
                value={formData.projectId?.toString() || ''} 
                onValueChange={(value) => updateFormData('projectId', value ? parseInt(value) : null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No project</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id.toString()}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Company and Client Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Company Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                value={formData.companyName || ''}
                onChange={(e) => updateFormData('companyName', e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="companyAddress">Address</Label>
              <Textarea
                id="companyAddress"
                value={formData.companyAddress || ''}
                onChange={(e) => updateFormData('companyAddress', e.target.value)}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="companyPhone">Phone</Label>
                <Input
                  id="companyPhone"
                  value={formData.companyPhone || ''}
                  onChange={(e) => updateFormData('companyPhone', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="companyEmail">Email</Label>
                <Input
                  id="companyEmail"
                  type="email"
                  value={formData.companyEmail || ''}
                  onChange={(e) => updateFormData('companyEmail', e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Client Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="clientName">Client Name *</Label>
              <Input
                id="clientName"
                value={formData.clientName || ''}
                onChange={(e) => updateFormData('clientName', e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="clientAddress">Address</Label>
              <Textarea
                id="clientAddress"
                value={formData.clientAddress || ''}
                onChange={(e) => updateFormData('clientAddress', e.target.value)}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="clientPhone">Phone</Label>
                <Input
                  id="clientPhone"
                  value={formData.clientPhone || ''}
                  onChange={(e) => updateFormData('clientPhone', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="clientEmail">Email</Label>
                <Input
                  id="clientEmail"
                  type="email"
                  value={formData.clientEmail || ''}
                  onChange={(e) => updateFormData('clientEmail', e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Project Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Project Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="projectName">Project Name</Label>
              <Input
                id="projectName"
                value={formData.projectName || ''}
                onChange={(e) => updateFormData('projectName', e.target.value)}
                placeholder="Enter project name"
              />
            </div>
            <div>
              <Label htmlFor="workPeriod">Work Period</Label>
              <Input
                id="workPeriod"
                value={formData.workPeriod || ''}
                onChange={(e) => updateFormData('workPeriod', e.target.value)}
                placeholder="e.g., March 1-15, 2024"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Line Items */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Line Items
            </CardTitle>
            <div className="flex items-center gap-2">
              {formData.projectId && materials.length > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={importFromMaterials}
                  className="flex items-center gap-2"
                >
                  <Package className="h-4 w-4" />
                  Import from Materials
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                onClick={addLineItem}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Item
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {lineItems.map((item, index) => (
              <div key={item.id} className="grid grid-cols-12 gap-2 items-end p-4 border rounded-lg">
                <div className="col-span-5">
                  <Label>Description</Label>
                  <Input
                    value={item.description}
                    onChange={(e) => updateLineItem(item.id, 'description', e.target.value)}
                    placeholder="Item description"
                  />
                </div>
                <div className="col-span-2">
                  <Label>Quantity</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.quantity}
                    onChange={(e) => updateLineItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="col-span-2">
                  <Label>Unit</Label>
                  <Input
                    value={item.unit}
                    onChange={(e) => updateLineItem(item.id, 'unit', e.target.value)}
                    placeholder="each"
                  />
                </div>
                <div className="col-span-2">
                  <Label>Rate</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.unitPrice}
                    onChange={(e) => updateLineItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="col-span-1">
                  <div className="text-sm font-medium text-right">
                    ${item.total.toFixed(2)}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeLineItem(item.id)}
                    className="mt-1 p-1 h-auto text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <Separator className="my-6" />

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-full max-w-md space-y-3">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="font-semibold">${subtotal.toFixed(2)}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 items-end">
                <div>
                  <Label htmlFor="discountAmount">Discount</Label>
                  <Input
                    id="discountAmount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.discountAmount || 0}
                    onChange={(e) => updateFormData('discountAmount', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="text-right text-red-600">
                  -${(formData.discountAmount || 0).toFixed(2)}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 items-end">
                <div>
                  <Label htmlFor="taxRate">Tax Rate (%)</Label>
                  <Input
                    id="taxRate"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={formData.taxRate || 0}
                    onChange={(e) => updateFormData('taxRate', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="text-right">
                  ${taxAmount.toFixed(2)}
                </div>
              </div>

              <Separator />

              <div className="flex justify-between text-lg font-bold">
                <span>Total:</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Terms and Notes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Additional Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="paymentTerms">Payment Terms</Label>
              <Input
                id="paymentTerms"
                value={formData.paymentTerms || ''}
                onChange={(e) => updateFormData('paymentTerms', e.target.value)}
                placeholder="Net 30 days"
              />
            </div>
            <div>
              <Label htmlFor="paymentMethod">Payment Method</Label>
              <Input
                id="paymentMethod"
                value={formData.paymentMethod || ''}
                onChange={(e) => updateFormData('paymentMethod', e.target.value)}
                placeholder="Check, Credit Card, etc."
              />
            </div>
          </div>

          <div>
            <Label htmlFor="discountDescription">Discount Description</Label>
            <Input
              id="discountDescription"
              value={formData.discountDescription || ''}
              onChange={(e) => updateFormData('discountDescription', e.target.value)}
              placeholder="Early payment discount, etc."
            />
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes || ''}
              onChange={(e) => updateFormData('notes', e.target.value)}
              rows={3}
              placeholder="Additional notes or terms"
            />
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-between pt-6">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
        >
          Cancel
        </Button>
        
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-lg px-3 py-1">
            Total: ${total.toFixed(2)}
          </Badge>
          <Button
            type="submit"
            disabled={saveMutation.isPending}
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            {saveMutation.isPending ? 'Saving...' : isEditing ? 'Update Invoice' : 'Create Invoice'}
          </Button>
        </div>
      </div>
    </form>
  );
}