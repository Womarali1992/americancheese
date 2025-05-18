import React, { useState } from "react";
import { useParams, useLocation, Link } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { MaterialCard } from "@/components/materials/MaterialCard";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus } from "lucide-react";
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
import { Card, CardContent } from "@/components/ui/card";

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

  // Type assertion to help TypeScript
  const supplierData = supplier || { name: "Loading...", company: "" };

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
        
        {/* Quotes grid */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Quotes</h2>
          {isLoadingQuotes ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-64 bg-slate-200 animate-pulse rounded-md"></div>
              ))}
            </div>
          ) : quotes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {quotes.map((quote: any) => (
                <MaterialCard
                  key={quote.id}
                  material={quote}
                  onEdit={handleEditQuote}
                  onDelete={handleDeleteQuote}
                />
              ))}
            </div>
          ) : (
            <div className="p-8 text-center bg-slate-50 rounded-lg border border-slate-200">
              <p className="text-slate-500">No quotes found for this supplier</p>
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