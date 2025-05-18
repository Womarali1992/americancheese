import React, { useState } from "react";
import { FileText, ChevronDown, ChevronUp, ChevronRight } from "lucide-react";
import { useLocation } from "wouter";
import {
  Card,
  CardContent,
  CardHeader
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { SimplifiedMaterial } from "./MaterialCard";

interface QuoteCardProps {
  quoteNumber: string;
  quoteDate?: string;
  materials: SimplifiedMaterial[];
  onViewMaterial?: (material: SimplifiedMaterial) => void;
}

export function QuoteCard({ quoteNumber, quoteDate, materials, onViewMaterial }: QuoteCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [, navigate] = useLocation();

  // Calculate total quote cost
  const totalCost = materials.reduce((sum, material) => {
    const materialCost = (material.cost || 0) * (material.quantity || 0);
    return sum + materialCost;
  }, 0);

  return (
    <Collapsible 
      open={isOpen} 
      onOpenChange={setIsOpen}
      className="w-full mb-4"
    >
      {/* Quote Card as Collapsible Trigger */}
      <CollapsibleTrigger className="w-full">
        <Card className="overflow-hidden border bg-white shadow-sm hover:shadow-md transition-all duration-200 rounded-xl cursor-pointer relative">
          {/* Status indicator at top-right */}
          <div className="absolute top-0 right-0 mr-4 mt-4">
            <div className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
              Quote
            </div>
          </div>

          {/* Clean, minimal header with quote number */}
          <CardHeader className="bg-blue-50 px-5 py-4 border-b border-blue-100">
            <div className="flex justify-between items-start">
              <div className="flex flex-col">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 rounded-full p-2">
                    <FileText className="h-5 w-5 text-blue-700" />
                  </div>
                  <h3 className="text-sm font-medium">Quote #{quoteNumber.split('-').pop()}</h3>
                </div>
                <div className="mt-1 text-xs text-slate-500 ml-10">
                  {quoteDate ? formatDate(quoteDate) : "No date"} • {materials.length} {materials.length === 1 ? 'item' : 'items'}
                </div>
              </div>
              <div className="flex items-center">
                <div className="px-3 py-1.5 bg-blue-100 rounded-lg">
                  <span className="text-sm font-medium text-blue-700">
                    {formatCurrency(totalCost)}
                  </span>
                </div>
                <div className="ml-2">
                  {isOpen ? (
                    <ChevronUp className="h-5 w-5 text-slate-500" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-slate-500" />
                  )}
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>
      </CollapsibleTrigger>
      
      {/* Collapsible content showing associated materials */}
      <CollapsibleContent className="mt-2 pl-4 border-l-2 border-blue-200">
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-700 mb-2">Materials in this Quote:</p>
          
          {materials.map(material => (
            <Card 
              key={material.id} 
              className="bg-white border border-slate-200 hover:border-blue-300 transition-colors cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                if (onViewMaterial) {
                  onViewMaterial(material);
                }
              }}
            >
              <CardContent className="p-3">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-sm">{material.name}</p>
                    <p className="text-xs text-slate-500">
                      {material.materialSize ? `${material.materialSize} • ` : ''} 
                      {material.quantity} {material.unit || 'units'}
                    </p>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm font-medium mr-2">
                      {formatCurrency((material.cost || 0) * (material.quantity || 0))}
                    </span>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-7 w-7 p-0" 
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onViewMaterial) {
                          onViewMaterial(material);
                        }
                      }}
                    >
                      <ChevronRight className="h-4 w-4 text-blue-500" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}