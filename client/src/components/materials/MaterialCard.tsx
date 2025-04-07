import React, { useState } from "react";
import { ChevronDown, ChevronUp, Edit, MoreHorizontal, Trash } from "lucide-react";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { getIconForMaterialTier } from "@/components/project/iconUtils";
import { Material } from "@shared/schema";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

// Create a type that makes the Material type work with the fields we need
export type SimplifiedMaterial = {
  id: number;
  name: string;
  type: string;
  quantity: number;
  projectId: number;
  supplier?: string;
  status: string;
  unit?: string;
  cost?: number;
  category?: string;
  taskIds?: number[];
  contactIds?: number[];
  tier?: string;
  tier2Category?: string;
  section?: string;
  subsection?: string;
  details?: string;
};

interface MaterialCardProps {
  material: Material | SimplifiedMaterial;
  onEdit: (material: Material | SimplifiedMaterial) => void;
  onDelete: (materialId: number) => void;
}

// Utility function to convert URLs in text to clickable links
const convertLinksToHtml = (text: string) => {
  if (!text) return "";
  
  // URL regex pattern
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  
  // Replace URLs with clickable links
  return text.replace(urlRegex, (url) => {
    return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline">${url}</a>`;
  });
};

export function MaterialCard({ material, onEdit, onDelete }: MaterialCardProps) {
  // State for collapsible details section
  const [detailsOpen, setDetailsOpen] = useState(false);
  
  // Convert details text to HTML with clickable links
  const detailsHtml = material.details ? convertLinksToHtml(material.details) : "";
  
  return (
    <Card key={material.id} className="overflow-hidden border-2 border-gray-300 shadow-sm hover:shadow-md transition-shadow rounded-lg">
      {/* Grey header with orange border top and material name */}
      <div className="bg-gray-50 px-4 py-3 border-t-4 border-orange-500 rounded-t-lg">
        <div className="flex flex-col">
          <div className="flex justify-between mb-1">
            <span className="text-xs px-1.5 py-0.5 rounded-full bg-orange-500 text-white font-medium text-[10px]">
              {material.category || 'Other'}
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-gray-600 hover:bg-gray-200">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(material)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    if (window.confirm(`Are you sure you want to delete "${material.name}"?`)) {
                      onDelete(material.id);
                    }
                  }}
                  className="text-red-600"
                >
                  <Trash className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="flex items-center gap-3 mt-1">
            {getIconForMaterialTier(material.tier, "h-12 w-12")}
            <CardTitle className="text-base font-bold text-gray-800 font-sans">{material.name}</CardTitle>
          </div>
        </div>
      </div>

      {/* Card content with simplified and improved layout */}
      <CardContent className="p-4 pt-3">
        {/* Classification section with bubble tags */}
        {(material.tier2Category || material.subsection || material.section) && (
          <div className="mb-3 border-b pb-2">
            <p className="text-muted-foreground mb-1 font-medium text-xs uppercase">Classification</p>
            <div className="flex flex-wrap gap-1">
              {material.tier2Category && (
                <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-800">
                  {material.tier2Category}
                </span>
              )}
              {material.section && (
                <span className="text-xs px-2 py-1 rounded-full bg-teal-100 text-teal-800">
                  {material.section}
                </span>
              )}
              {material.subsection && (
                <span className="text-xs px-2 py-1 rounded-full bg-indigo-100 text-indigo-800">
                  {material.subsection}
                </span>
              )}
            </div>
          </div>
        )}
        
        {/* Material details in grid layout */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-muted-foreground font-medium text-xs uppercase">Quantity</p>
            <p className="font-medium mt-1 font-sans">
              {material.quantity} {material.unit}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground font-medium text-xs uppercase">Supplier</p>
            <p className="font-medium mt-1 font-sans">{material.supplier || "Not specified"}</p>
          </div>
          <div>
            <p className="text-muted-foreground font-medium text-xs uppercase">Unit Cost</p>
            <p className="font-medium mt-1 text-emerald-700 font-sans">
              {material.cost ? formatCurrency(material.cost) : "$0.00"}/{material.unit}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground font-medium text-xs uppercase">Total Cost</p>
            <p className="font-medium mt-1 text-emerald-700 font-sans">
              {material.cost && material.quantity
                ? formatCurrency(material.cost * material.quantity)
                : "$0.00"}
            </p>
          </div>
        </div>
        
        {/* Collapsible additional details section */}
        {material.details && (
          <Collapsible 
            open={detailsOpen} 
            onOpenChange={setDetailsOpen}
            className="mt-3 pt-3 border-t"
          >
            <CollapsibleTrigger asChild>
              <div className="flex items-center justify-between cursor-pointer hover:bg-gray-50 rounded-md px-1">
                <p className="text-muted-foreground font-medium text-xs capitalize mb-1">Additional details</p>
                {detailsOpen ? (
                  <ChevronUp className="h-3.5 w-3.5 text-gray-500" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5 text-gray-500" />
                )}
              </div>
            </CollapsibleTrigger>
            
            <CollapsibleContent>
              <div 
                className="text-sm mt-2 px-1"
                dangerouslySetInnerHTML={{ __html: detailsHtml }}
              />
            </CollapsibleContent>
          </Collapsible>
        )}
      </CardContent>
    </Card>
  );
}