import React, { useState } from "react";
import { 
  Card, 
  CardContent,
  CardHeader
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  Phone,
  Mail,
  Building,
  FileText,
  Truck,
  ChevronDown,
  ChevronUp,
  Package
} from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { EnhancedQuoteCard } from "../quotes/EnhancedQuoteCard";

interface Supplier {
  id: number;
  name: string;
  company?: string;
  phone?: string;
  email?: string;
  type: string;
  category: string;
  initials?: string;
}

interface Quote {
  id: number;
  quoteNumber: string;
  quoteDate?: string;
  supplier?: string;
  supplierId?: number;
  materials: any[];
}

export interface EnhancedSupplierCardProps {
  supplier: Supplier;
  showQuotes?: boolean;
  onViewSupplier?: (supplierId: number) => void;
}

export function EnhancedSupplierCard({ supplier, showQuotes = true, onViewSupplier }: EnhancedSupplierCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [, navigate] = useLocation();
  
  // Fetch quotes for this supplier
  const { data: materials = [], isLoading: isLoadingMaterials } = useQuery<any[]>({
    queryKey: ['/api/materials'],
    select: (data) => data.filter(
      (material) => 
        material.supplierId === supplier.id || 
        material.supplier === supplier.name
    )
  });
  
  // Group materials by quote number
  const quoteGroups: Record<string, Quote> = {};
  
  materials.forEach(material => {
    if (material.quoteNumber && material.isQuote) {
      if (!quoteGroups[material.quoteNumber]) {
        quoteGroups[material.quoteNumber] = {
          id: material.id,  // Use first material's ID as the quote ID
          quoteNumber: material.quoteNumber,
          quoteDate: material.quoteDate,
          supplier: material.supplier,
          supplierId: material.supplierId,
          materials: []
        };
      }
      quoteGroups[material.quoteNumber].materials.push(material);
    }
  });
  
  const quotes = Object.values(quoteGroups);
  const quoteCount = quotes.length;
  
  const handleSupplierClick = () => {
    if (onViewSupplier) {
      onViewSupplier(supplier.id);
    }
  };

  return (
    <Collapsible 
      open={isOpen} 
      onOpenChange={setIsOpen}
      className="w-full mb-4"
    >
      <CollapsibleTrigger className="w-full">
        <Card className="bg-white shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer">
          <CardHeader className="p-4 border-b border-slate-200 flex flex-row justify-between items-center">
            <div className="flex items-center">
              <div className="h-10 w-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-medium">
                {supplier.initials || supplier.name.charAt(0)}
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium">{supplier.name}</h3>
                <div className="flex items-center">
                  <p className="text-sm text-slate-500 mr-2">{supplier.company || "Supplier"}</p>
                  {quoteCount > 0 && (
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      {quoteCount} Quote{quoteCount !== 1 ? 's' : ''}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center">
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 mr-2">
                {supplier.category || "Building Materials"}
              </Badge>
              {isOpen ? (
                <ChevronUp className="h-4 w-4 text-slate-400" />
              ) : (
                <ChevronDown className="h-4 w-4 text-slate-400" />
              )}
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              {supplier.phone && (
                <div className="flex items-center">
                  <Phone className="text-slate-400 w-4 h-4 mr-2" />
                  <span className="text-sm">{supplier.phone}</span>
                </div>
              )}
              {supplier.email && (
                <div className="flex items-center">
                  <Mail className="text-slate-400 w-4 h-4 mr-2" />
                  <span className="text-sm">{supplier.email}</span>
                </div>
              )}
              {supplier.company && (
                <div className="flex items-center">
                  <Building className="text-slate-400 w-4 h-4 mr-2" />
                  <span className="text-sm">{supplier.company}</span>
                </div>
              )}
            </div>
            
            <div className="flex gap-2">
              <Button 
                className="flex-1 bg-green-50 text-green-700 hover:bg-green-100 border-green-200"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSupplierClick();
                }}
              >
                <Truck className="mr-2 h-4 w-4" /> View Supplier
              </Button>
              <Button 
                className="flex-1 bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(!isOpen);
                }}
              >
                <FileText className="mr-2 h-4 w-4" /> {quoteCount} Quote{quoteCount !== 1 ? 's' : ''}
              </Button>
            </div>
          </CardContent>
        </Card>
      </CollapsibleTrigger>
      
      {showQuotes && (
        <CollapsibleContent className="mt-2 space-y-4 pl-4 border-l-2 border-green-200">
          {isLoadingMaterials ? (
            <div className="text-center py-4">Loading quotes...</div>
          ) : quotes.length === 0 ? (
            <div className="text-center py-4 text-slate-500">No quotes found for this supplier</div>
          ) : (
            <div>
              <h4 className="text-sm font-medium text-slate-700 mb-2">Quotes from {supplier.name}:</h4>
              {quotes.map((quote) => (
                <EnhancedQuoteCard 
                  key={quote.quoteNumber}
                  quoteNumber={quote.quoteNumber}
                  quoteDate={quote.quoteDate}
                  materials={quote.materials}
                />
              ))}
            </div>
          )}
        </CollapsibleContent>
      )}
    </Collapsible>
  );
}