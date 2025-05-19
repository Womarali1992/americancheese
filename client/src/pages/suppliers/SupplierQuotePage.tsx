import React, { useState } from "react";
import { useParams, useLocation, Link } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { MaterialCard } from "@/components/materials/MaterialCard";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, ChevronDown, FileText, Plus } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";

export default function SupplierQuotePage() {
  const { supplierId } = useParams<{ supplierId: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddQuoteOpen, setIsAddQuoteOpen] = useState(false);
  const numericSupplierId = parseInt(supplierId);

  // Fetch supplier details
  const { data: supplier, isLoading: isLoadingSupplier } = useQuery({
    queryKey: [`/api/contacts/${supplierId}`],
    enabled: numericSupplierId > 0,
  });

  // Fetch quotes for this supplier (materials with isQuote=true)
  const { data: quotes = [], isLoading: isLoadingQuotes } = useQuery({
    queryKey: [`/api/materials`, { isQuote: true, supplierId: numericSupplierId }],
    enabled: numericSupplierId > 0,
  });

  // State for edit dialog
  const [editingQuoteId, setEditingQuoteId] = useState<number | null>(null);
  const [selectedQuote, setSelectedQuote] = useState<any>(null);

  // Handle edit click
  const handleEditQuote = (quote: any) => {
    setSelectedQuote(quote);
    setEditingQuoteId(quote.id);
  };

  // Handle delete click
  const handleDeleteQuote = async (quoteId: number) => {
    if (window.confirm("Are you sure you want to delete this quote?")) {
      try {
        await apiRequest(`/api/materials/${quoteId}`, 'DELETE');
        
        // Refresh the quotes list
        queryClient.invalidateQueries({ queryKey: [`/api/materials`] });
        
        toast({
          title: "Quote deleted",
          description: "The quote has been successfully deleted",
        });
      } catch (error) {
        console.error("Error deleting quote:", error);
        toast({
          title: "Error",
          description: "There was an error deleting the quote",
          variant: "destructive",
        });
      }
    }
  };

  // Format date function
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'No date';
    return format(new Date(dateString), 'MMM d, yyyy');
  };

  // Group quotes by quote number
  const groupQuotesByNumber = (quotes: any[]) => {
    const quoteGroups: Record<string, any[]> = {};
    
    quotes.forEach(quote => {
      // Use the actual quote number or generate one based on ID
      const quoteNumber = quote.quoteNumber || `Quote #${quote.id}`;
      
      if (!quoteGroups[quoteNumber]) {
        quoteGroups[quoteNumber] = [];
      }
      
      quoteGroups[quoteNumber].push(quote);
    });
    
    return quoteGroups;
  };

  // Type assertion to help TypeScript
  const supplierData = supplier || { name: "Loading...", company: "" };

  // Group quotes by quote number
  const quoteGroups = groupQuotesByNumber(quotes as any[]);

  // Render loading states
  if (isLoadingSupplier) {
    return (
      <Layout>
        <div className="container mx-auto p-4">
          <div className="h-8 bg-slate-200 animate-pulse rounded-md w-64 mb-4"></div>
          <div className="h-40 bg-slate-200 animate-pulse rounded-md w-full"></div>
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
                <BreadcrumbPage>Quotes</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        
        {/* Page header with title and action buttons */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/contacts")}
            className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
          >
            <ArrowLeft className="mr-1 h-4 w-4" /> Back to Contacts
          </Button>
          
          <Button 
            onClick={() => setIsAddQuoteOpen(true)} 
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="mr-1 h-4 w-4" /> Add Quote
          </Button>
        </div>
        
        {/* Supplier info card */}
        <Card className="mb-6 bg-white shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-bold text-lg">
                {supplierData.name ? supplierData.name.charAt(0) : "S"}
              </div>
              <div>
                <h2 className="text-xl font-semibold">{supplierData.name}</h2>
                {supplierData.company && (
                  <p className="text-gray-500">{supplierData.company}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Quotes grid - Now grouped by quoteNumber */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Quotes</h2>
          {isLoadingQuotes ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-64 bg-slate-200 animate-pulse rounded-md"></div>
              ))}
            </div>
          ) : Object.keys(quoteGroups).length > 0 ? (
            <div className="space-y-4">
              {Object.entries(quoteGroups).map(([quoteNumber, materials]) => {
                const quoteDate = materials[0]?.quoteDate || null;
                const totalValue = materials.reduce((sum, m) => 
                  sum + ((m.cost || 0) * (m.quantity || 0)), 0);
                
                return (
                  <Collapsible key={quoteNumber} className="w-full">
                    <Card className="border border-blue-200 overflow-hidden">
                      <CollapsibleTrigger className="w-full text-left cursor-pointer">
                        <CardHeader className="bg-blue-50 border-b border-blue-100 p-4">
                          <div className="flex justify-between items-center">
                            <div>
                              <Badge className="mb-2 bg-blue-100 text-blue-800 hover:bg-blue-200 border border-blue-200">
                                {quoteNumber}
                              </Badge>
                              <CardTitle className="text-lg font-medium">
                                {`${materials.length} ${materials.length === 1 ? 'item' : 'items'}`}
                              </CardTitle>
                              <CardDescription>
                                {quoteDate ? formatDate(quoteDate) : 'No date'}
                              </CardDescription>
                            </div>
                            <div className="flex flex-col items-end">
                              <span className="text-sm font-medium text-blue-600">Total Value</span>
                              <span className="text-lg font-bold">{formatCurrency(totalValue)}</span>
                              <ChevronDown className="h-5 w-5 text-blue-500 mt-1" />
                            </div>
                          </div>
                        </CardHeader>
                      </CollapsibleTrigger>
                      
                      <CollapsibleContent>
                        <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 bg-blue-50/50 rounded-b-lg border-x border-b border-blue-100">
                          {materials.map((material) => (
                            <Card 
                              key={material.id} 
                              className="overflow-hidden border bg-white shadow-sm hover:shadow-md transition-all duration-200 rounded-lg"
                            >
                              <CardHeader className="p-3 border-b">
                                <div className="flex justify-between items-start">
                                  <CardTitle className="text-md font-medium">{material.name}</CardTitle>
                                  <Badge className="bg-green-100 text-green-800 hover:bg-green-200 border border-green-200">
                                    {formatCurrency((material.cost || 0) * (material.quantity || 0))}
                                  </Badge>
                                </div>
                                <CardDescription className="text-xs mt-1">
                                  {material.type || 'Material'} • {material.quantity} {material.unit || 'units'}
                                </CardDescription>
                              </CardHeader>
                              <CardContent className="p-3">
                                <div className="flex justify-end gap-2 mt-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 px-2 text-blue-600"
                                    onClick={() => handleEditQuote(material)}
                                  >
                                    Edit
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </CollapsibleContent>
                    </Card>
                  </Collapsible>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center bg-slate-50 rounded-lg border border-slate-200">
              <FileText className="mx-auto h-8 w-8 text-slate-300" />
              <p className="mt-2 text-slate-500">No quotes found for this supplier</p>
              <Button 
                variant="outline" 
                onClick={() => setIsAddQuoteOpen(true)}
                className="mt-4"
              >
                <Plus className="h-4 w-4 mr-1" /> Add a quote
              </Button>
            </div>
          )}
        </div>
        
        {/* Edit Quote Dialog */}
        {editingQuoteId && (
          <EditMaterialDialog
            open={editingQuoteId !== null}
            onOpenChange={(open) => {
              if (!open) {
                setEditingQuoteId(null);
                queryClient.invalidateQueries({ queryKey: [`/api/materials`] });
              }
            }}
            material={selectedQuote}
          />
        )}
      </div>
    </Layout>
  );
}