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
    
  // Function to get the appropriate header gradient based on the material tier
  const getHeaderGradient = (tier: string | undefined): string => {
    const tierLower = (tier || '').toLowerCase();
    
    switch (tierLower) {
      case 'structural':
        return 'from-green-600 to-green-700'; // Olive green for structural
      case 'systems':
        return 'from-slate-600 to-slate-700'; // Blue steel for systems
      case 'sheathing':
        return 'from-red-600 to-red-700'; // Brick red for sheathing
      case 'finishings':
        return 'from-amber-600 to-amber-700'; // Saddle brown for finishings
      default:
        return 'from-orange-600 to-amber-500'; // Default orange-amber gradient
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
      className="group overflow-hidden border bg-white shadow-sm hover:shadow-lg transition-all duration-200 rounded-xl relative cursor-pointer"
      onClick={(e) => {
        // Prevent click from triggering when clicking on dropdown menu or buttons inside card
        if ((e.target as HTMLElement).closest('.dropdown-ignore')) {
          return;
        }
        console.log("Card clicked for material:", material.id);
        onEdit(material);
      }}
    >
      {/* Status indicator at top-right corner */}
      <div className="absolute top-0 right-0 mr-3 mt-3 z-10">
        <div className={`w-2.5 h-2.5 rounded-full ${getStatusColor(material.status)}`} />
      </div>
      
      {/* Modern gradient header with material name and icon - using tier-specific colors */}
      <div className={`bg-gradient-to-r ${getHeaderGradient(material.tier)} pt-5 pb-8 px-5 text-white relative overflow-hidden`}>
        {/* Background pattern */}
        <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="currentColor">
            <path d="M0 0h20v20H0zm25 0h20v20H25zm25 0h20v20H50zm25 0h20v20H75zM0 25h20v20H0zm25 25h20v20H25zm25 0h20v20H50zm25 0h20v20H75zM0 50h20v20H0zm25 25h20v20H25zm25 0h20v20H50zm25 0h20v20H75zM0 75h20v20H0z" />
          </svg>
        </div>
        
        {/* Material type badge */}
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-sm text-xs font-medium">
              {material.type || 'Material'}
            </span>
            {material.category && (
              <span className="text-[10px] font-medium text-white/80">
                {material.category}
              </span>
            )}
          </div>
          
          {/* Actions dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0 text-white hover:bg-white/20 rounded-full dropdown-ignore"
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
                className="cursor-pointer"
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
        
        {/* Material name and icon */}
        <div className="mt-3 flex items-center gap-3 relative z-10">
          <div className="bg-white/10 rounded-full p-2">
            {getIconForMaterialTier(material.tier || 'structural', "h-6 w-6 text-white")}
          </div>
          <CardTitle className="text-xl font-semibold text-white leading-tight">
            {material.name}
          </CardTitle>
        </div>
      </div>

      {/* Elevated quantity and cost summary - applying tier colors */}
      <div className="flex justify-between mx-5 -mt-4 relative z-20">
        <div className={`bg-white shadow-md rounded-lg px-3 py-2 flex-1 flex items-center justify-between ${getCardBorderStyle(material.tier)}`}>
          <div>
            <p className={`text-[10px] ${getCardTextStyle(material.tier)} font-semibold uppercase`}>Quantity</p>
            <p className="text-sm font-bold">{material.quantity} <span className={`text-xs font-normal ${getCardTextStyle(material.tier)}`}>{material.unit || 'units'}</span></p>
          </div>
          <div className={`border-l ${getCardBorderStyle(material.tier, true)} pl-3`}>
            <p className={`text-[10px] ${getCardTextStyle(material.tier)} font-semibold uppercase`}>Total Cost</p>
            <p className={`text-sm font-bold ${getCardTextStyle(material.tier)}`}>{totalCost ? formatCurrency(totalCost) : '$0.00'}</p>
          </div>
        </div>
      </div>

      {/* Card content with modern, clean layout */}
      <CardContent className="p-5 pt-7">
        {/* Classification tags with updated design using tier-matching colors */}
        {(material.tier2Category || material.section || material.subsection) && (
          <div className="mb-4 flex flex-wrap gap-1.5">
            {material.tier2Category && (
              <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${getTier2CategoryStyle(material.tier, material.tier2Category)}`}>
                {material.tier2Category}
              </span>
            )}
            {material.section && (
              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-teal-50 text-teal-800 border border-teal-100">
                {material.section}
              </span>
            )}
            {material.subsection && (
              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-800 border border-blue-100">
                {material.subsection}
              </span>
            )}
          </div>
        )}
        
        {/* Material details in an attractive layout - using tier-specific colors */}
        <div className="grid grid-cols-2 gap-4 mb-3">
          <div className={`${getCardBackgroundStyle(material.tier)} p-3 rounded-lg`}>
            <div className="flex items-center gap-2 mb-1">
              <div className={`p-1 rounded-full ${getCardIconBgStyle(material.tier)}`}>
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={getCardIconStyle(material.tier)}>
                  <path d="M5 5.5A3.5 3.5 0 0 1 8.5 2H12v7H8.5A3.5 3.5 0 0 1 5 5.5z" />
                  <path d="M12 2h3.5a3.5 3.5 0 1 1 0 7H12V2z" />
                  <path d="M12 12.5a3.5 3.5 0 1 1 7 0 3.5 3.5 0 1 1-7 0z" />
                  <path d="M5 19.5A3.5 3.5 0 0 1 8.5 16H12v3.5a3.5 3.5 0 1 1-7 0z" />
                  <path d="M12 13.5V19h3.5a3.5 3.5 0 0 0 0-7H12v1.5" />
                </svg>
              </div>
              <p className="text-xs text-gray-600 font-medium">Unit Cost</p>
            </div>
            <p className={`text-sm font-bold ${getCardTextStyle(material.tier)}`}>
              {material.cost ? formatCurrency(material.cost) : "$0.00"}/{material.unit || 'unit'}
            </p>
          </div>
          
          <div className={`${getCardBackgroundStyle(material.tier)} p-3 rounded-lg`}>
            <div className="flex items-center gap-2 mb-1">
              <div className={`p-1 rounded-full ${getCardIconBgStyle(material.tier)}`}>
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={getCardIconStyle(material.tier)}>
                  <path d="M21 10V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l2-1.14" />
                  <path d="M16.5 9.4 7.55 4.24" />
                  <polyline points="3.29 7 12 12 20.71 7" />
                  <line x1="12" y1="22" x2="12" y2="12" />
                  <circle cx="18.5" cy="15.5" r="2.5" />
                  <path d="M20.27 17.27 22 19" />
                </svg>
              </div>
              <p className="text-xs text-gray-600 font-medium">Supplier</p>
            </div>
            <p className="text-sm font-medium truncate">
              {material.supplier || "Not specified"}
            </p>
          </div>
        </div>
        
        {/* Status bar with visual indicator - using tier-specific colors */}
        <div className={`flex items-center justify-between ${getCardBackgroundStyle(material.tier)} px-3 py-2 rounded-lg mb-4`}>
          <span className="text-xs text-gray-600 font-medium">Status</span>
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${getStatusColor(material.status)}`}></span>
            <span className="text-sm font-medium capitalize">{material.status}</span>
          </div>
        </div>
        
        {/* Improved collapsible additional details section - with tier colors */}
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
                className={`w-full flex items-center justify-center text-xs font-medium ${getCardTextStyle(material.tier)} ${getCardBorderStyle(material.tier, true)} hover:${getCardBackgroundStyle(material.tier)} dropdown-ignore`}
                onClick={(e) => {
                  // Prevent this click from bubbling up to the card
                  e.stopPropagation();
                }}
              >
                {detailsOpen ? "Hide Details" : "Show Details"}
                {detailsOpen ? (
                  <ChevronUp className="h-3.5 w-3.5 ml-1" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5 ml-1" />
                )}
              </Button>
            </CollapsibleTrigger>
            
            <CollapsibleContent className="dropdown-ignore">
              <div 
                className={`text-sm mt-3 ${getCardBackgroundStyle(material.tier)} px-3 py-2 rounded-lg ${getCardBorderStyle(material.tier)} dropdown-ignore`}
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