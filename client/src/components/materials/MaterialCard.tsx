import React, { useState } from "react";
import { ChevronDown, ChevronUp, Edit, MoreHorizontal, Trash, ChevronRight } from "lucide-react";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils";
import { getIconForMaterialTier } from "@/components/project/iconUtils";
import { Material } from "@shared/schema";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { getTier1CategoryColor } from "@/lib/color-utils";
import { CategoryBadge } from "@/components/ui/category-badge";

// Create a type that makes the Material type work with the fields we need
export type SimplifiedMaterial = {
  id: number;
  name: string;
  materialSize?: string | null; // New field for material size - can be null from DB
  type: string;
  quantity: number;
  projectId: number;
  supplier?: string;
  supplierId?: number | null;
  status: string;
  unit?: string;
  cost?: number;
  category?: string;
  taskIds?: number[] | string[] | null; // Can be null from DB
  contactIds?: number[] | null;
  tier?: string;
  tier1Category?: string; // Alias for tier
  tier2Category?: string | null; // Can be null from DB
  // Category colors from database
  tier1Color?: string | null;
  tier2Color?: string | null;
  section?: string | null; // Can be null from DB
  subsection?: string | null; // Can be null from DB
  details?: string | null; // Can be null from DB
  // Quote related fields
  isQuote?: boolean;
  quoteDate?: string | null;
  quoteNumber?: string | null;  // Custom field for quote identification
  orderDate?: string | null; // For order tracking
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
    
    // Return a CSS class with a custom property for background
    return `material-header-bg material-header-bg-${tierLower}`;
  };
  
  // Function to get the appropriate header border based on the material tier
  const getHeaderBorder = (tier: string | undefined): string => {
    const tierLower = (tier || '').toLowerCase();
    
    // Return a CSS class with a custom property for border
    return `material-header-border material-header-border-${tierLower}`;
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
    
    // Return a CSS class with custom property for border
    return isInner 
      ? `material-border-inner material-border-inner-${tier1Lower}` 
      : `border material-border material-border-${tier1Lower}`;
  };
  
  // Function to get card text style based on tier1
  const getCardTextStyle = (tier1: string | undefined): string => {
    const tier1Lower = (tier1 || '').toLowerCase();
    
    // Return a CSS class with custom property for text color
    return `material-text material-text-${tier1Lower}`;
  };
  
  // Function to get card background style based on tier1
  const getCardBackgroundStyle = (tier1: string | undefined): string => {
    const tier1Lower = (tier1 || '').toLowerCase();
    
    // Return a CSS class with custom property for background
    return `material-bg material-bg-${tier1Lower}`;
  };
  
  // Function to get icon background style based on tier1
  const getCardIconBgStyle = (tier1: string | undefined): string => {
    const tier1Lower = (tier1 || '').toLowerCase();
    
    // Return a CSS class with custom property for icon background
    return `material-icon-bg material-icon-bg-${tier1Lower}`;
  };
  
  // Function to get icon color style based on tier1
  const getCardIconStyle = (tier1: string | undefined): string => {
    const tier1Lower = (tier1 || '').toLowerCase();
    
    // Return a CSS class with custom property for icon color
    return `material-icon material-icon-${tier1Lower}`;
  };

  return (
    <Card 
      key={material.id} 
      className="overflow-hidden border bg-white shadow-sm hover:shadow-md transition-all duration-200 rounded-xl cursor-pointer relative"
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
      
      {/* Show a purchased badge for quotes that have been ordered */}
      {material.isQuote && material.status === 'ordered' && (
        <div className="absolute top-0 left-0 ml-4 mt-4 z-10">
          <div className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-100">
            Purchased
          </div>
        </div>
      )}
      
      {/* Clean, minimal header with material name and icon - styled like labor card */}
      <div className={`bg-${material.tier?.toLowerCase() || 'slate'}-50 px-5 py-4 border-b border-${material.tier?.toLowerCase() || 'slate'}-100`}>
        <div className="flex justify-between items-start">
          <div className="flex flex-col">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-white text-foreground border">
                {material.type || 'Material'}
              </span>
              {material.tier2Category && (
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                  {material.tier2Category}
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-3">
              <div className={`rounded-full p-2 ${
                material.tier?.toLowerCase() === 'structural' ? 'bg-orange-100' : 
                material.tier?.toLowerCase() === 'systems' ? 'bg-blue-100' :
                material.tier?.toLowerCase() === 'sheathing' ? 'bg-green-100' :
                material.tier?.toLowerCase() === 'finishings' ? 'bg-violet-100' : 
                'bg-slate-100'
              }`}>
                {getIconForMaterialTier(material.tier || 'structural', `h-5 w-5 ${
                  material.tier?.toLowerCase() === 'structural' ? 'text-orange-700' : 
                  material.tier?.toLowerCase() === 'systems' ? 'text-blue-700' :
                  material.tier?.toLowerCase() === 'sheathing' ? 'text-green-700' :
                  material.tier?.toLowerCase() === 'finishings' ? 'text-violet-700' : 
                  'text-slate-700'
                }`)}
              </div>
              
              <div className="flex flex-col">
                {/* Material Size is now prominently displayed */}
                {material.materialSize ? (
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                      {material.materialSize}
                    </span>
                  </div>
                ) : null}
                {/* Material Name is the main title */}
                <CardTitle className="card-header leading-tight mt-1">
                  {material.name}
                </CardTitle>
              </div>
            </div>
            
            {material.supplier && (
              <div className="mt-1 text-sm text-slate-500 ml-10">
                {material.supplier}
              </div>
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
      </div>

      {/* Card content with clean, minimal layout - similar to labor card */}
      <CardContent className="p-6">
        {/* Time and quantity info in a clean, minimal format - similar to labor card */}
        <div className="flex items-center justify-between mb-5 bg-slate-50 p-4 rounded-lg border border-slate-100">
          <div className="flex flex-col items-center">
            <p className="text-xs text-slate-500 font-medium uppercase">Quantity</p>
            <p className="font-medium text-slate-700">{material.quantity} <span className="text-xs">{material.unit || 'units'}</span></p>
          </div>
          <div className="h-6 border-r border-slate-200"></div>
          <div className="flex flex-col items-center">
            <p className="text-xs text-slate-500 font-medium uppercase">Unit Cost</p>
            <p className="font-medium text-slate-700">{material.cost ? formatCurrency(material.cost) : "$0.00"}</p>
          </div>
          <div className="h-6 border-r border-slate-200"></div>
          <div className="flex flex-col items-center">
            <p className="text-xs text-slate-500 font-medium uppercase">Total</p>
            <p className="font-medium text-slate-700">{totalCost ? formatCurrency(totalCost) : '$0.00'}</p>
          </div>
        </div>
        
        {/* Material category and details in modern grid layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
          {material.type && (
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1 rounded-full bg-slate-200">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-600">
                    <rect width="18" height="18" x="3" y="3" rx="2" />
                    <path d="M3 9h18" />
                    <path d="M9 21V9" />
                  </svg>
                </div>
                <p className="text-xs text-slate-500 font-medium">Material Type</p>
              </div>
              <p className="text-sm text-slate-700">{material.type}</p>
            </div>
          )}
          
          {(material.tier || material.tier2Category) && (
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1 rounded-full bg-slate-200">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-600">
                    <path d="M12 22v-8" />
                    <path d="M5.7 11.9a9 9 0 0 1 12.6 0" />
                    <path d="M2.1 8.4a14 14 0 0 1 19.8 0" />
                    <circle cx="12" cy="12" r="1" />
                  </svg>
                </div>
                <p className="text-xs text-slate-500 font-medium">Category</p>
              </div>
              <p className="text-sm text-slate-700">
                {material.tier || "Not specified"} {material.tier2Category ? `• ${material.tier2Category}` : ""}
              </p>
            </div>
          )}
        </div>
        
        {/* Section and subsection info */}
        {(material.section || material.subsection) && (
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 mb-5">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1 rounded-full bg-slate-200">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-600">
                  <path d="M21 7v6h-6" />
                  <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7" />
                </svg>
              </div>
              <p className="text-xs text-slate-500 font-medium">Location</p>
            </div>
            <p className="text-sm text-slate-700">
              {material.section} {material.subsection ? `• ${material.subsection}` : ""}
            </p>
          </div>
        )}
        
        {/* Quote information section - shown only for quotes */}
        {material.isQuote && (
          <div className="mb-5 bg-blue-50 border border-blue-100 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1 rounded-full bg-blue-100">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600">
                  <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                  <polyline points="14 2 14 8 20 8" />
                  <path d="M16 13H8" />
                  <path d="M16 17H8" />
                  <path d="M10 9H8" />
                </svg>
              </div>
              <p className="text-xs text-blue-700 font-medium">Quote Information</p>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-blue-600">Quote Number</p>
                <p className="text-sm font-medium text-slate-700">{material.quoteNumber || "Not assigned"}</p>
              </div>
              <div>
                <p className="text-xs text-blue-600">Quote Date</p>
                <p className="text-sm font-medium text-slate-700">{material.quoteDate ? formatDate(material.quoteDate) : "Not specified"}</p>
              </div>
              {material.orderDate && (
                <div className="col-span-2">
                  <p className="text-xs text-blue-600">Order Date</p>
                  <p className="text-sm font-medium text-slate-700">{formatDate(material.orderDate)}</p>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Clean, minimal collapsible details section */}
        {material.details && (
          <Collapsible 
            open={detailsOpen} 
            onOpenChange={setDetailsOpen}
            className="mt-3"
          >
            <CollapsibleTrigger 
              className="flex items-center justify-center w-full bg-slate-50 hover:bg-slate-100 text-slate-700 py-2.5 px-4 rounded-md transition-colors duration-200 border border-slate-100 dropdown-ignore"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center">
                <span className="text-sm">View Details</span>
                {detailsOpen ? (
                  <ChevronUp className="h-4 w-4 ml-2 text-slate-500" />
                ) : (
                  <ChevronDown className="h-4 w-4 ml-2 text-slate-500" />
                )}
              </div>
            </CollapsibleTrigger>
            
            <CollapsibleContent className="mt-4">
              <div 
                className="text-sm bg-white border border-slate-100 p-5 rounded-lg text-slate-700 dropdown-ignore"
                onClick={(e) => e.stopPropagation()}
                dangerouslySetInnerHTML={{ __html: detailsHtml }}
              />
            </CollapsibleContent>
          </Collapsible>
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
          
          <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1 rounded-full bg-blue-200">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600">
                  <path d="M21 10V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l2-1.14" />
                  <path d="M16.5 9.4 7.55 4.24" />
                  <polyline points="3.29 7 12 12 20.71 7" />
                  <line x1="12" y1="22" x2="12" y2="12" />
                  <circle cx="18.5" cy="15.5" r="2.5" />
                  <path d="M20.27 17.27 22 19" />
                </svg>
              </div>
              <p className="text-xs text-blue-700 font-medium">Supplier</p>
            </div>
            <div className="flex flex-col">
              <p className="text-sm font-medium text-slate-700 truncate">
                {material.supplier || "Not specified"}
              </p>
              {material.supplierId && (
                <div className="mt-1 flex items-center">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                    Supplier ID: {material.supplierId}
                  </span>
                </div>
              )}
            </div>
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