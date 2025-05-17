import React, { useState } from "react";
import { 
  Card, 
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Phone,
  Mail,
  Building,
  FileText,
  Edit,
  Truck
} from "lucide-react";
import { useLocation } from "wouter";

export interface SupplierCardProps {
  supplier: {
    id: number;
    name: string;
    company?: string;
    phone?: string;
    email?: string;
    type?: string;
    category?: string;
    initials?: string;
  };
  compact?: boolean;
  onEdit?: () => void;
  onViewQuotes?: (supplierId: number) => void;
}

export function SupplierCard({ supplier, compact = false, onEdit, onViewQuotes }: SupplierCardProps) {
  const [, navigate] = useLocation();
  
  // Compact view for dashboard integration
  if (compact) {
    return (
      <Card className="bg-white shadow-sm overflow-hidden hover:shadow-md transition-shadow">
        <div className="p-3 border-b border-slate-200 flex justify-between items-center">
          <div className="flex items-center">
            <div className="h-8 w-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-medium">
              {supplier.initials || supplier.name.charAt(0)}
            </div>
            <div className="ml-2">
              <h3 className="text-sm font-medium">{supplier.name}</h3>
              <p className="text-xs text-slate-500">{supplier.company || "Supplier"}</p>
            </div>
          </div>
          {supplier.category && (
            <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
              {supplier.category}
            </Badge>
          )}
        </div>
        <CardContent className="p-2">
          <div className="grid grid-cols-2 gap-1 text-xs">
            {supplier.phone && (
              <div className="flex items-center">
                <Phone className="text-slate-400 w-3 h-3 mr-1" />
                <span className="truncate">{supplier.phone}</span>
              </div>
            )}
            {supplier.email && (
              <div className="flex items-center">
                <Mail className="text-slate-400 w-3 h-3 mr-1" />
                <span className="truncate">{supplier.email}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Standard view (for supplier pages)
  return (
    <Card className="bg-white shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      <div className="p-4 border-b border-slate-200 flex justify-between items-center">
        <div className="flex items-center">
          <div className="h-10 w-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-medium">
            {supplier.initials || supplier.name.charAt(0)}
          </div>
          <div className="ml-3">
            <h3 className="text-lg font-medium">{supplier.name}</h3>
            <p className="text-sm text-slate-500">{supplier.company || "Supplier"}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {onEdit && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-slate-500 hover:text-slate-700"
              onClick={onEdit}
            >
              <Edit className="h-4 w-4" />
            </Button>
          )}
          {supplier.category && (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              {supplier.category}
            </Badge>
          )}
        </div>
      </div>
      <CardContent className="p-4">
        <div className="flex flex-col gap-2 text-sm">
          {supplier.phone && (
            <div className="flex items-center">
              <Phone className="text-slate-400 w-5 h-4 mr-1" />
              <span>{supplier.phone}</span>
            </div>
          )}
          {supplier.email && (
            <div className="flex items-center">
              <Mail className="text-slate-400 w-5 h-4 mr-1" />
              <span>{supplier.email}</span>
            </div>
          )}
          {supplier.company && (
            <div className="flex items-center">
              <Building className="text-slate-400 w-5 h-4 mr-1" />
              <span>{supplier.company}</span>
            </div>
          )}
        </div>
        
        <div className="mt-4 flex gap-2">
          {onViewQuotes && (
            <Button 
              variant="outline"
              className="flex-1 bg-green-50 text-green-700 hover:bg-green-100 border-green-200"
              onClick={() => onViewQuotes(supplier.id)}
            >
              <FileText className="mr-1 h-4 w-4" /> View Quotes
            </Button>
          )}
          <Button 
            variant="outline"
            className="flex-1 bg-slate-100 text-slate-600 hover:bg-slate-200"
            onClick={() => navigate(`/contacts/suppliers`)}
          >
            <Truck className="mr-1 h-4 w-4" /> All Suppliers
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}