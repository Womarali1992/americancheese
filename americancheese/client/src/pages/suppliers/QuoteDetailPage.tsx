import React, { useState } from "react";
import { useParams, useLocation, Link } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Edit, Trash } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { EditMaterialDialog } from "@/components/materials/EditMaterialDialog";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function QuoteDetailPage() {
  const { supplierId, quoteId } = useParams<{ supplierId: string; quoteId: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  const numericSupplierId = parseInt(supplierId);
  const numericQuoteId = parseInt(quoteId);
  
  // Fetch supplier details
  const { data: supplier, isLoading: isLoadingSupplier } = useQuery({
    queryKey: [`/api/contacts/${supplierId}`],
    enabled: numericSupplierId > 0,
  });
  
  // Fetch quote details
  const { data: quote, isLoading: isLoadingQuote } = useQuery({
    queryKey: [`/api/materials/${quoteId}`],
    enabled: numericQuoteId > 0,
  });
  
  // Handle edit click
  const handleEditQuote = () => {
    setIsEditDialogOpen(true);
  };
  
  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    try {
      await apiRequest(`/api/materials/${quoteId}`, 'DELETE');
      
      // Show success toast
      toast({
        title: "Quote deleted",
        description: "Quote has been successfully deleted",
      });
      
      // Navigate back to the quotes list
      navigate(`/suppliers/${supplierId}/quotes`);
    } catch (error) {
      console.error("Error deleting quote:", error);
      toast({
        title: "Error",
        description: "There was an error deleting the quote",
        variant: "destructive",
      });
    }
  };

  // Handle converting quote to order
  const handleConvertToOrder = async () => {
    try {
      await apiRequest(`/api/materials/${quoteId}`, 'PUT', {
        isQuote: false,
        orderDate: new Date().toISOString().split('T')[0],
        status: 'ordered'
      });
      
      // Refresh quote data
      queryClient.invalidateQueries({ queryKey: [`/api/materials/${quoteId}`] });
      
      // Show success toast
      toast({
        title: "Quote converted",
        description: "Quote has been successfully converted to an order",
      });
    } catch (error) {
      console.error("Error converting quote to order:", error);
      toast({
        title: "Error",
        description: "There was an error converting the quote to an order",
        variant: "destructive",
      });
    }
  };

  // Format date function
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  // Calculate total cost
  const calculateTotalCost = () => {
    if (!quote || !quote.cost || !quote.quantity) return '$0.00';
    return formatCurrency(quote.cost * quote.quantity);
  };

  // Type assertions to help TypeScript
  const supplierData = supplier || { name: "Loading...", company: "" };
  const quoteData = quote || {
    name: "Loading...",
    type: "",
    tier: "",
    tier2Category: "",
    status: "",
    quantity: 0,
    unit: "",
    cost: 0,
    quoteNumber: "",
    quoteDate: null,
    orderDate: null,
    isQuote: true
  };
  
  // Render loading states
  if (isLoadingSupplier || isLoadingQuote) {
    return (
      <Layout>
        <div className="container mx-auto p-4">
          <div className="h-8 bg-slate-200 animate-pulse rounded-md w-64 mb-4"></div>
          <div className="h-40 bg-slate-200 animate-pulse rounded-md w-full mb-4"></div>
          <div className="h-60 bg-slate-200 animate-pulse rounded-md w-full"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto p-4 space-y-6">
        {/* Breadcrumb navigation */}
        <div className="mb-6">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/contacts">Contacts</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href={`/contacts/${supplierId}`}>{supplierData.name}</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href={`/suppliers/${supplierId}/quotes`}>Quotes</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{quoteData.name}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        
        {/* Page header with title and action buttons */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate(`/suppliers/${supplierId}/quotes`)}
            className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
          >
            <ArrowLeft className="mr-1 h-4 w-4" /> Back to Quotes
          </Button>
          
          <div className="flex gap-2">
            {quoteData.isQuote && (
              <Button 
                onClick={handleConvertToOrder} 
                className="bg-green-600 hover:bg-green-700"
              >
                Convert to Order
              </Button>
            )}
            <Button 
              variant="outline" 
              onClick={handleEditQuote}
              className="text-blue-600 border-blue-200 hover:bg-blue-50"
            >
              <Edit className="mr-1 h-4 w-4" /> Edit
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setIsDeleteDialogOpen(true)}
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              <Trash className="mr-1 h-4 w-4" /> Delete
            </Button>
          </div>
        </div>
        
        {/* Quote detail card */}
        <Card className="bg-white shadow-sm overflow-hidden">
          <CardHeader className={`bg-${quoteData.tier?.toLowerCase() || 'slate'}-50 border-b border-${quoteData.tier?.toLowerCase() || 'slate'}-100`}>
            <div className="flex justify-between items-center">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                    {quoteData.type || 'Material'}
                  </span>
                  {quoteData.tier2Category && (
                    <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-700 border border-blue-200">
                      {quoteData.tier2Category}
                    </span>
                  )}
                  <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium 
                    ${(quoteData.status || '').toLowerCase().includes('ordered') 
                      ? 'bg-green-100 text-green-700 border border-green-200' 
                      : 'bg-blue-100 text-blue-700 border border-blue-200'}`}>
                    {quoteData.status}
                  </span>
                </div>
                <CardTitle className="text-2xl font-bold">{quoteData.name}</CardTitle>
                <p className="text-slate-500 mt-1">From: {supplierData.name}</p>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Quote details section */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Quote Details</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4 p-4 bg-slate-50 rounded-lg border border-slate-100">
                    <div>
                      <p className="text-xs text-slate-500 font-medium uppercase">Quantity</p>
                      <p className="font-medium text-slate-700">{quoteData.quantity} {quoteData.unit || 'units'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-medium uppercase">Unit Cost</p>
                      <p className="font-medium text-slate-700">{quoteData.cost ? formatCurrency(quoteData.cost) : '$0.00'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-medium uppercase">Total</p>
                      <p className="font-medium text-slate-700">{calculateTotalCost()}</p>
                    </div>
                  </div>
                  
                  {/* Quote number and dates */}
                  <div className="grid grid-cols-2 gap-4">
                    {quoteData.quoteNumber && (
                      <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                        <p className="text-xs text-blue-600 font-medium uppercase">Quote Number</p>
                        <p className="font-medium text-blue-900">{quoteData.quoteNumber}</p>
                      </div>
                    )}
                    {quoteData.quoteDate && (
                      <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                        <p className="text-xs text-blue-600 font-medium uppercase">Quote Date</p>
                        <p className="font-medium text-blue-900">{formatDate(quoteData.quoteDate)}</p>
                      </div>
                    )}
                    {quoteData.orderDate && (
                      <div className="p-4 bg-green-50 rounded-lg border border-green-100">
                        <p className="text-xs text-green-600 font-medium uppercase">Order Date</p>
                        <p className="font-medium text-green-900">{formatDate(quoteData.orderDate)}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Supplier details section */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Supplier Details</h3>
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="h-10 w-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-bold text-lg">
                      {supplierData.name ? supplierData.name.charAt(0) : "S"}
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-800">{supplierData.name}</h4>
                      {supplierData.company && (
                        <p className="text-sm text-slate-500">{supplierData.company}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {supplierData.phone && (
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500">Phone:</span>
                        <span className="text-slate-700">{supplierData.phone}</span>
                      </div>
                    )}
                    {supplierData.email && (
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500">Email:</span>
                        <span className="text-slate-700">{supplierData.email}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Additional Material details section */}
            {quoteData.details && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-4">Additional Details</h3>
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                  <p className="text-slate-700">{quoteData.details}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Edit Dialog */}
        {isEditDialogOpen && (
          <EditMaterialDialog
            open={isEditDialogOpen}
            onOpenChange={(open) => {
              if (!open) {
                setIsEditDialogOpen(false);
                queryClient.invalidateQueries({ queryKey: [`/api/materials/${quoteId}`] });
              }
            }}
            material={quoteData}
          />
        )}
        
        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Quote</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this quote? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={handleDeleteConfirm}>
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
}