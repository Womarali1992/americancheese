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
import { getTier1CategoryColor } from "@/lib/color-utils";
import { CategoryBadge } from "@/components/ui/category-badge";

// Create a type that makes the Material type work with the fields we need
export type SimplifiedMaterial = {
  id: number;
  name: string;
  type: string;
  quantity: number;
  projectId: number;
  supplier?: string;
  supplierId?: number | null;
  status: string;
  unit?: string;
  cost?: number;
  category?: string;
  taskIds?: number[];
  contactIds?: number[];
  tier?: string;
  tier1Category?: string; // Alias for tier
  tier2Category?: string;
  // Category colors from database
  tier1Color?: string | null;
  tier2Color?: string | null;
  section?: string;
  subsection?: string;
  details?: string;
  // Quote related fields
  isQuote?: boolean;
  quoteDate?: string | null;
  quoteNumber?: string | null;  // Custom field for quote identification
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
  
  // Helper function to determine status color
  const getStatusColor = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower.includes('delivered') || statusLower.includes('completed')) {
      return 'bg-green-500';
    } else if (statusLower.includes('ordered') || statusLower.includes('progress')) {
      return 'bg-amber-500';
    } else if (statusLower.includes('pending') || statusLower.includes('quote')) {
      return 'bg-blue-500';
    } else if (statusLower.includes('delayed') || statusLower.includes('issue')) {
      return 'bg-red-500';
    }
    return 'bg-gray-500';
  };

  // Total cost calculation
  const totalCost = material.cost && material.quantity 
    ? material.cost * material.quantity 
    : 0;
    
  // Function to get the appropriate header background based on the material tier
  const getHeaderBackground = (tier: string | undefined): string => {
    const tierLower = (tier || '').toLowerCase();
    
    switch (tierLower) {
      case 'structural':
        return 'bg-green-50'; 
      case 'systems':
        return 'bg-slate-50';
      case 'sheathing':
        return 'bg-red-50';
      case 'finishings':
        return 'bg-amber-50';
      default:
        return 'bg-blue-50';
    }
  };
  
  // Function to get the appropriate header border based on the material tier
  const getHeaderBorder = (tier: string | undefined): string => {
    const tierLower = (tier || '').toLowerCase();
    
    switch (tierLower) {
      case 'structural':
        return 'border-green-100'; 
      case 'systems':
        return 'border-slate-100';
      case 'sheathing':
        return 'border-red-100';
      case 'finishings':
        return 'border-amber-100';
      default:
        return 'border-blue-100';
    }
  };
  
  // Function to get tier2 category style based on material's tier1
  const getTier2CategoryStyle = (tier1: string | undefined, tier2: string): string => {
    const tier1Lower = (tier1 || '').toLowerCase();
    
    // Return appropriate styling based on tier1 category
    switch (tier1Lower) {
      case 'structural':
        return 'bg-green-50 text-green-800 border border-green-100';
      case 'systems':
        return 'bg-slate-50 text-slate-800 border border-slate-100';
      case 'sheathing':
        return 'bg-red-50 text-red-800 border border-red-100';
      case 'finishings':
        return 'bg-amber-50 text-amber-800 border border-amber-100';
      default:
        return 'bg-orange-50 text-orange-800 border border-orange-100';
    }
  };
  
  // Function to get card border style based on tier1
  const getCardBorderStyle = (tier1: string | undefined, isInner: boolean = false): string => {
    const tier1Lower = (tier1 || '').toLowerCase();
    
    // Return appropriate styling based on tier1 category
    switch (tier1Lower) {
      case 'structural':
        return isInner ? 'border-green-100' : 'border border-green-100';
      case 'systems':
        return isInner ? 'border-slate-100' : 'border border-slate-100';
      case 'sheathing':
        return isInner ? 'border-red-100' : 'border border-red-100';
      case 'finishings':
        return isInner ? 'border-amber-100' : 'border border-amber-100';
      default:
        return isInner ? 'border-orange-100' : 'border border-orange-100';
    }
  };
  
  // Function to get card text style based on tier1
  const getCardTextStyle = (tier1: string | undefined): string => {
    const tier1Lower = (tier1 || '').toLowerCase();
    
    // Return appropriate styling based on tier1 category
    switch (tier1Lower) {
      case 'structural':
        return 'text-green-600';
      case 'systems':
        return 'text-slate-600';
      case 'sheathing':
        return 'text-red-600';
      case 'finishings':
        return 'text-amber-600';
      default:
        return 'text-orange-600';
    }
  };
  
  // Function to get card background style based on tier1
  const getCardBackgroundStyle = (tier1: string | undefined): string => {
    const tier1Lower = (tier1 || '').toLowerCase();
    
    // Return appropriate styling based on tier1 category
    switch (tier1Lower) {
      case 'structural':
        return 'bg-green-100/40';
      case 'systems':
        return 'bg-slate-100/40';
      case 'sheathing':
        return 'bg-red-100/40';
      case 'finishings':
        return 'bg-amber-100/40';
      default:
        return 'bg-orange-100/40';
    }
  };
  
  // Function to get icon background style based on tier1
  const getCardIconBgStyle = (tier1: string | undefined): string => {
    const tier1Lower = (tier1 || '').toLowerCase();
    
    // Return appropriate styling based on tier1 category
    switch (tier1Lower) {
      case 'structural':
        return 'bg-green-100';
      case 'systems':
        return 'bg-slate-100';
      case 'sheathing':
        return 'bg-red-100';
      case 'finishings':
        return 'bg-amber-100';
      default:
        return 'bg-orange-100';
    }
  };
  
  // Function to get icon color style based on tier1
  const getCardIconStyle = (tier1: string | undefined): string => {
    const tier1Lower = (tier1 || '').toLowerCase();
    
    // Return appropriate styling based on tier1 category
    switch (tier1Lower) {
      case 'structural':
        return 'text-green-400';
      case 'systems':
        return 'text-slate-400';
      case 'sheathing':
        return 'text-red-400';
      case 'finishings':
        return 'text-amber-400';
      default:
        return 'text-orange-400';
    }
  };

  return (
    <Card 
      key={material.id} 
      className="group overflow-hidden border border-slate-100 bg-white shadow-sm hover:shadow-md transition-all duration-200 rounded-xl relative cursor-pointer"
      onClick={(e) => {
        // Prevent click from triggering when clicking on dropdown menu or buttons inside card
        if ((e.target as HTMLElement).closest('.dropdown-ignore')) {
          return;
        }
        console.log("Card clicked for material:", material.id);
        onEdit(material);
      }}
    >
      {/* Status indicator pill at top-right corner */}
      <div className="absolute top-0 right-0 mr-4 mt-4 z-10">
        <div className={`px-2 py-0.5 rounded-full text-xs font-medium ${
          material.status.toLowerCase().includes('delivered') || material.status.toLowerCase().includes('completed') ? 
            'bg-emerald-50 text-emerald-700 border border-emerald-100' : 
          material.status.toLowerCase().includes('ordered') || material.status.toLowerCase().includes('progress') ? 
            'bg-blue-50 text-blue-700 border border-blue-100' : 
          material.status.toLowerCase().includes('delayed') || material.status.toLowerCase().includes('issue') ?
            'bg-red-50 text-red-700 border border-red-100' :
            'bg-slate-50 text-slate-700 border border-slate-100'
        }`}>
          {material.status}
        </div>
      </div>
      
      {/* Clean, minimal header with material name and icon */}
      <div className={`${getHeaderBackground(material.tier)} pt-5 pb-5 px-5 border-b ${getHeaderBorder(material.tier)} relative overflow-hidden`}>
        
        {/* Material type badge - clean, minimal design */}
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2 mb-1.5">
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
              material.tier?.toLowerCase() === 'structural' ? 'bg-green-100 text-green-700' : 
              material.tier?.toLowerCase() === 'systems' ? 'bg-slate-100 text-slate-700' :
              material.tier?.toLowerCase() === 'sheathing' ? 'bg-red-100 text-red-700' :
              material.tier?.toLowerCase() === 'finishings' ? 'bg-amber-100 text-amber-700' : 
              'bg-blue-100 text-blue-700'
            }`}>
              {material.type || 'Material'}
            </span>
            {material.category && (
              <span className="text-xs font-normal text-slate-500">
                {material.category}
              </span>
            )}
          </div>
          
          {/* Actions dropdown - updated with modern styling */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0 text-slate-500 hover:bg-slate-100 rounded-full dropdown-ignore"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem 
                onClick={() => {
                  console.log("Edit button clicked for material:", material.id);
                  onEdit(material);
                }} 
                className="cursor-pointer text-slate-700"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Material
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  if (window.confirm(`Are you sure you want to delete "${material.name}"?`)) {
                    onDelete(material.id);
                  }
                }}
                className="text-red-600 cursor-pointer"
              >
                <Trash className="h-4 w-4 mr-2" />
                Delete Material
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {/* Material name and icon - clean, minimal design */}
        <div className="mt-3 flex items-center gap-3 relative z-10">
          <div className={`rounded-full p-2 ${
            material.tier?.toLowerCase() === 'structural' ? 'bg-green-100' : 
            material.tier?.toLowerCase() === 'systems' ? 'bg-slate-100' :
            material.tier?.toLowerCase() === 'sheathing' ? 'bg-red-100' :
            material.tier?.toLowerCase() === 'finishings' ? 'bg-amber-100' : 
            'bg-blue-100'
          }`}>
            {getIconForMaterialTier(material.tier || 'structural', `h-5 w-5 ${
              material.tier?.toLowerCase() === 'structural' ? 'text-green-700' : 
              material.tier?.toLowerCase() === 'systems' ? 'text-slate-700' :
              material.tier?.toLowerCase() === 'sheathing' ? 'text-red-700' :
              material.tier?.toLowerCase() === 'finishings' ? 'text-amber-700' : 
              'text-blue-700'
            }`)}
          </div>
          <CardTitle className="card-header leading-tight">
            {material.name}
          </CardTitle>
        </div>
      </div>

      {/* Clean, minimal quantity and cost summary */}
      <div className="flex justify-between mx-5 mt-4 relative z-20">
        <div className="bg-white shadow-sm rounded-lg px-4 py-3 flex-1 flex items-center justify-between border border-slate-100">
          <div>
            <p className="text-xs text-slate-500 font-medium uppercase">Quantity</p>
            <p className="text-sm font-medium text-slate-700">{material.quantity} <span className="text-xs font-normal text-slate-500">{material.unit || 'units'}</span></p>
          </div>
          <div className="border-l border-slate-100 pl-4">
            <p className="text-xs text-slate-500 font-medium uppercase">Total Cost</p>
            <p className="text-sm font-medium text-slate-700">{totalCost ? formatCurrency(totalCost) : '$0.00'}</p>
          </div>
        </div>
      </div>

      {/* Card content with modern, clean layout */}
      <CardContent className="p-5 pt-7">
        {/* Classification tags with updated design using tier-matching colors */}
        {(material.tier2Category || material.section || material.subsection) && (
          <div className="mb-4 flex flex-wrap gap-1.5">
            {/* Display tier1 category badge if tier is available */}
            {material.tier && (
              <CategoryBadge 
                category={material.tier} 
                type="tier1"
                className="text-xs"
                color={null}
              />
            )}
            {/* Display tier2 category badge with colors if available */}
            {material.tier2Category && (
              <CategoryBadge 
                category={material.tier2Category} 
                type="tier2"
                className="text-xs"
                color={null}
              />
            )}
            {material.section && (
              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-slate-50 text-slate-700 border border-slate-100">
                {material.section}
              </span>
            )}
            {material.subsection && (
              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-slate-50 text-slate-700 border border-slate-100">
                {material.subsection}
              </span>
            )}
          </div>
        )}
        
        {/* Material details in a clean, minimal layout */}
        <div className="grid grid-cols-2 gap-4 mb-5">
          <div className="bg-slate-50 border border-slate-100 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1 rounded-full bg-slate-200">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-600">
                  <path d="M5 5.5A3.5 3.5 0 0 1 8.5 2H12v7H8.5A3.5 3.5 0 0 1 5 5.5z" />
                  <path d="M12 2h3.5a3.5 3.5 0 1 1 0 7H12V2z" />
                  <path d="M12 12.5a3.5 3.5 0 1 1 7 0 3.5 3.5 0 1 1-7 0z" />
                  <path d="M5 19.5A3.5 3.5 0 0 1 8.5 16H12v3.5a3.5 3.5 0 1 1-7 0z" />
                  <path d="M12 13.5V19h3.5a3.5 3.5 0 0 0 0-7H12v1.5" />
                </svg>
              </div>
              <p className="text-xs text-slate-500 font-medium">Unit Cost</p>
            </div>
            <p className="text-sm font-medium text-slate-700">
              {material.cost ? formatCurrency(material.cost) : "$0.00"}/{material.unit || 'unit'}
            </p>
          </div>
          
          <div className="bg-slate-50 border border-slate-100 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1 rounded-full bg-slate-200">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-600">
                  <path d="M21 10V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l2-1.14" />
                  <path d="M16.5 9.4 7.55 4.24" />
                  <polyline points="3.29 7 12 12 20.71 7" />
                  <line x1="12" y1="22" x2="12" y2="12" />
                  <circle cx="18.5" cy="15.5" r="2.5" />
                  <path d="M20.27 17.27 22 19" />
                </svg>
              </div>
              <p className="text-xs text-slate-500 font-medium">Supplier</p>
            </div>
            <p className="text-sm font-medium text-slate-700 truncate">
              {material.supplier || "Not specified"}
            </p>
          </div>
        </div>
        
        {/* Status bar with visual indicator - clean, minimal design */}
        <div className="flex items-center justify-between bg-slate-50 px-4 py-3 rounded-lg mb-5 border border-slate-100">
          <span className="text-xs text-slate-500 font-medium">Status</span>
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${
              material.status.toLowerCase().includes('delivered') || material.status.toLowerCase().includes('completed') ? 
                'bg-emerald-500' : 
              material.status.toLowerCase().includes('ordered') || material.status.toLowerCase().includes('progress') ? 
                'bg-blue-500' : 
              material.status.toLowerCase().includes('delayed') || material.status.toLowerCase().includes('issue') ?
                'bg-red-500' :
                'bg-slate-500'
            }`}></span>
            <span className="text-sm font-medium text-slate-700 capitalize">{material.status}</span>
          </div>
        </div>
        
        {/* Clean, minimal collapsible details section */}
        {material.details && (
          <Collapsible 
            open={detailsOpen} 
            onOpenChange={setDetailsOpen}
            className="mt-2 dropdown-ignore"
          >
            <CollapsibleTrigger className="w-full dropdown-ignore">
              <Button 
                variant="outline" 
                size="sm"
                className="w-full flex items-center justify-center text-xs font-medium text-slate-700 border-slate-200 hover:bg-slate-50 dropdown-ignore"
                onClick={(e) => {
                  // Prevent this click from bubbling up to the card
                  e.stopPropagation();
                }}
              >
                {detailsOpen ? "Hide Details" : "Show Details"}
                {detailsOpen ? (
                  <ChevronUp className="h-3.5 w-3.5 ml-1 text-slate-500" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5 ml-1 text-slate-500" />
                )}
              </Button>
            </CollapsibleTrigger>
            
            <CollapsibleContent className="dropdown-ignore">
              <div 
                className="text-sm mt-3 bg-white px-4 py-4 rounded-lg border border-slate-100 dropdown-ignore text-slate-700"
                dangerouslySetInnerHTML={{ __html: detailsHtml }}
                onClick={(e) => {
                  // Prevent this click from bubbling up to the card
                  e.stopPropagation();
                }}
              />
            </CollapsibleContent>
          </Collapsible>
        )}
      </CardContent>
    </Card>
  );
}