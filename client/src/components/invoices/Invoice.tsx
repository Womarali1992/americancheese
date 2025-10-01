import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  total: number;
}

export interface InvoiceData {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  
  // Company Information
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  
  // Client Information
  clientName: string;
  clientAddress: string;
  clientEmail?: string;
  clientPhone?: string;
  
  // Project Information
  projectId?: number;
  projectName: string;
  workPeriod?: string;
  
  // Line Items
  lineItems: InvoiceLineItem[];
  
  // Financial Details
  subtotal: number;
  taxRate?: number;
  taxAmount?: number;
  discountAmount?: number;
  discountDescription?: string;
  total: number;
  
  // Payment Terms
  paymentTerms: string;
  paymentMethod?: string;
  notes?: string;
}

interface InvoiceProps {
  invoice: InvoiceData;
  className?: string;
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
};

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const getStatusColor = (status: InvoiceData['status']): string => {
  const colors = {
    draft: 'bg-gray-100 text-gray-800',
    sent: 'bg-blue-100 text-blue-800',
    paid: 'bg-green-100 text-green-800',
    overdue: 'bg-red-100 text-red-800',
    cancelled: 'bg-gray-100 text-gray-800'
  };
  return colors[status];
};

export function Invoice({ invoice, className }: InvoiceProps) {
  return (
    <Card className={`max-w-4xl mx-auto bg-white shadow-lg print:shadow-none ${className}`}>
      <CardContent className="p-8 print:p-6">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-gray-900">INVOICE</h1>
            <div className="text-lg text-gray-600">#{invoice.invoiceNumber}</div>
            <Badge className={getStatusColor(invoice.status)}>
              {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
            </Badge>
          </div>
          
          <div className="text-right space-y-1">
            <div className="text-sm text-gray-600">Invoice Date</div>
            <div className="font-semibold">{formatDate(invoice.invoiceDate)}</div>
            <div className="text-sm text-gray-600 mt-2">Due Date</div>
            <div className="font-semibold">{formatDate(invoice.dueDate)}</div>
          </div>
        </div>

        {/* Company and Client Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* From */}
          <div>
            <h3 className="text-sm font-semibold text-gray-600 mb-3 uppercase tracking-wide">From</h3>
            <div className="space-y-2">
              <div className="font-semibold text-lg">{invoice.companyName}</div>
              <div className="text-gray-600 whitespace-pre-line">{invoice.companyAddress}</div>
              <div className="text-gray-600">{invoice.companyPhone}</div>
              <div className="text-gray-600">{invoice.companyEmail}</div>
            </div>
          </div>

          {/* To */}
          <div>
            <h3 className="text-sm font-semibold text-gray-600 mb-3 uppercase tracking-wide">Bill To</h3>
            <div className="space-y-2">
              <div className="font-semibold text-lg">{invoice.clientName}</div>
              <div className="text-gray-600 whitespace-pre-line">{invoice.clientAddress}</div>
              {invoice.clientPhone && (
                <div className="text-gray-600">{invoice.clientPhone}</div>
              )}
              {invoice.clientEmail && (
                <div className="text-gray-600">{invoice.clientEmail}</div>
              )}
            </div>
          </div>
        </div>

        {/* Project Information */}
        {invoice.projectName && (
          <div className="mb-8 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-semibold text-gray-600 mb-2 uppercase tracking-wide">Project Details</h3>
            <div className="font-semibold">{invoice.projectName}</div>
            {invoice.workPeriod && (
              <div className="text-gray-600 text-sm">Work Period: {invoice.workPeriod}</div>
            )}
          </div>
        )}

        {/* Line Items Table */}
        <div className="mb-8">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-3 px-0 font-semibold text-gray-700 uppercase tracking-wide text-sm">
                    Description
                  </th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700 uppercase tracking-wide text-sm">
                    Qty
                  </th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700 uppercase tracking-wide text-sm">
                    Unit
                  </th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700 uppercase tracking-wide text-sm">
                    Rate
                  </th>
                  <th className="text-right py-3 px-0 font-semibold text-gray-700 uppercase tracking-wide text-sm">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {invoice.lineItems.map((item, index) => (
                  <tr key={item.id} className={index % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                    <td className="py-4 px-0 border-b border-gray-100">
                      <div className="font-medium text-gray-900">{item.description}</div>
                    </td>
                    <td className="py-4 px-4 text-right border-b border-gray-100 text-gray-600">
                      {item.quantity}
                    </td>
                    <td className="py-4 px-4 text-right border-b border-gray-100 text-gray-600">
                      {item.unit}
                    </td>
                    <td className="py-4 px-4 text-right border-b border-gray-100 text-gray-600">
                      {formatCurrency(item.unitPrice)}
                    </td>
                    <td className="py-4 px-0 text-right border-b border-gray-100 font-semibold">
                      {formatCurrency(item.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totals Section */}
        <div className="flex justify-end mb-8">
          <div className="w-full max-w-md space-y-3">
            <div className="flex justify-between py-2">
              <span className="text-gray-600">Subtotal:</span>
              <span className="font-semibold">{formatCurrency(invoice.subtotal)}</span>
            </div>
            
            {invoice.discountAmount && invoice.discountAmount > 0 && (
              <div className="flex justify-between py-2 text-red-600">
                <span>
                  Discount{invoice.discountDescription ? ` (${invoice.discountDescription})` : ''}:
                </span>
                <span className="font-semibold">-{formatCurrency(invoice.discountAmount)}</span>
              </div>
            )}
            
            {invoice.taxAmount && invoice.taxAmount > 0 && (
              <div className="flex justify-between py-2">
                <span className="text-gray-600">
                  Tax{invoice.taxRate ? ` (${invoice.taxRate}%)` : ''}:
                </span>
                <span className="font-semibold">{formatCurrency(invoice.taxAmount)}</span>
              </div>
            )}
            
            <Separator className="my-2" />
            
            <div className="flex justify-between py-3 text-xl">
              <span className="font-bold">Total:</span>
              <span className="font-bold">{formatCurrency(invoice.total)}</span>
            </div>
          </div>
        </div>

        {/* Payment Terms and Notes */}
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-gray-600 mb-2 uppercase tracking-wide">Payment Terms</h3>
            <p className="text-gray-700">{invoice.paymentTerms}</p>
            {invoice.paymentMethod && (
              <p className="text-gray-600 text-sm mt-1">Payment Method: {invoice.paymentMethod}</p>
            )}
          </div>

          {invoice.notes && (
            <div>
              <h3 className="text-sm font-semibold text-gray-600 mb-2 uppercase tracking-wide">Notes</h3>
              <p className="text-gray-700 whitespace-pre-line">{invoice.notes}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-12 pt-6 border-t border-gray-200 text-center text-sm text-gray-500">
          Thank you for your business!
        </div>
      </CardContent>
    </Card>
  );
}