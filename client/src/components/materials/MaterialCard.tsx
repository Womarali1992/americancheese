import React, { useState } from "react";
import { useLocation } from "wouter";
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
import { LinkifiedText } from "@/lib/linkUtils";

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



export function MaterialCard({ material, onEdit, onDelete }: MaterialCardProps) {
  // State for collapsible details section
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [, navigate] = useLocation();

  // Handle card click to navigate to quote detail page if this is a quote
  const handleCardClick = () => {
    if (material.isQuote && material.supplierId) {
      navigate(`/suppliers/${material.supplierId}/quotes/${material.id}`);
    }
  };
  
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
    
  // Format date function
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
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
      <div className={`px-5 py-4 border-b ${
        material.tier?.toLowerCase() === 'structural' ? 'material-header-bg-structural material-header-border-structural' : 
        material.tier?.toLowerCase() === 'systems' ? 'material-header-bg-systems material-header-border-systems' :
        material.tier?.toLowerCase() === 'sheathing' ? 'material-header-bg-sheathing material-header-border-sheathing' :
        material.tier?.toLowerCase() === 'finishings' ? 'material-header-bg-finishings material-header-border-finishings' : 
        'bg-slate-50 border-slate-100'
      }`}>
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

      {/* Card content with improved sizing and layout */}
      <CardContent className="p-4">
        {/* Quantity, cost info in a more compact format */}
        <div className="flex items-center justify-between mb-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
          <div className="flex flex-col items-center min-w-0 flex-1">
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Quantity</p>
            <p className="font-semibold text-slate-700 text-sm">{material.quantity} <span className="text-xs font-normal">{material.unit || 'units'}</span></p>
          </div>
          <div className="h-4 border-r border-slate-200 mx-2"></div>
          <div className="flex flex-col items-center min-w-0 flex-1">
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Unit Cost</p>
            <p className="font-semibold text-slate-700 text-sm">{material.cost ? formatCurrency(material.cost) : "$0.00"}</p>
          </div>
          <div className="h-4 border-r border-slate-200 mx-2"></div>
          <div className="flex flex-col items-center min-w-0 flex-1">
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Total</p>
            <p className="font-semibold text-slate-700 text-sm">{totalCost ? formatCurrency(totalCost) : '$0.00'}</p>
          </div>
        </div>

        {/* Task IDs Section - Clickable badges */}
        {material.taskIds && Array.isArray(material.taskIds) && material.taskIds.length > 0 && (
          <div className="mb-4 p-3 bg-orange-50 rounded-lg border border-orange-100">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1 rounded-full bg-orange-200">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-orange-600">
                  <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
                  <path d="M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6z"/>
                </svg>
              </div>
              <p className="text-xs text-orange-700 font-medium">Related Tasks</p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {material.taskIds.map((taskId, index) => (
                <button
                  key={index}
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/tasks/${taskId}`);
                  }}
                  className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-orange-100 text-orange-800 border border-orange-200 hover:bg-orange-200 hover:border-orange-300 transition-colors cursor-pointer dropdown-ignore"
                >
                  Task #{taskId}
                </button>
              ))}
            </div>
          </div>
        )}
        
        {/* Material category and details in more compact grid layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          {material.type && (
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="p-1 rounded-full bg-slate-200">
                  <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-600">
                    <rect width="18" height="18" x="3" y="3" rx="2" />
                    <path d="M3 9h18" />
                    <path d="M9 21V9" />
                  </svg>
                </div>
                <p className="text-xs text-slate-500 font-medium">Material Type</p>
              </div>
              <p className="text-sm text-slate-700 font-medium">{material.type}</p>
            </div>
          )}
          
          {(material.tier || material.tier2Category) && (
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="p-1 rounded-full bg-slate-200">
                  <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-600">
                    <path d="M12 22v-8" />
                    <path d="M5.7 11.9a9 9 0 0 1 12.6 0" />
                    <path d="M2.1 8.4a14 14 0 0 1 19.8 0" />
                    <circle cx="12" cy="12" r="1" />
                  </svg>
                </div>
                <p className="text-xs text-slate-500 font-medium">Category</p>
              </div>
              <p className="text-sm text-slate-700 font-medium">
                {material.tier || "Not specified"} {material.tier2Category ? `• ${material.tier2Category}` : ""}
              </p>
            </div>
          )}
        </div>
        
        {/* Quote Information (if it's a quote) */}
        {material.isQuote && (
          <div className="mb-4">
            <div className="bg-orange-50 p-3 rounded-lg border border-orange-100">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1 rounded-full bg-orange-200">
                  <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-orange-600">
                    <path d="M5 3a2 2 0 0 0-2 2" />
                    <path d="M19 3a2 2 0 0 1 2 2" />
                    <path d="M21 19a2 2 0 0 1-2 2" />
                    <path d="M5 21a2 2 0 0 1-2-2" />
                    <path d="M9 3h6" />
                    <path d="M3 9v6" />
                    <path d="M21 9v6" />
                    <path d="M9 21h6" />
                    <path d="M14 12a2 2 0 0 1-2 2a2 2 0 0 1-2-2a2 2 0 0 1 2-2a2 2 0 0 1 2 2Z" />
                  </svg>
                </div>
                <p className="text-xs text-orange-700 font-medium">Quote Information</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {material.quoteNumber && (
                  <div>
                    <p className="text-xs text-orange-600 mb-1">Quote Number</p>
                    <p className="text-sm text-orange-900 font-medium">{material.quoteNumber}</p>
                  </div>
                )}
                {material.quoteDate && (
                  <div>
                    <p className="text-xs text-orange-600 mb-1">Quote Date</p>
                    <p className="text-sm text-orange-900 font-medium">{formatDate(material.quoteDate)}</p>
                  </div>
                )}
                {material.orderDate && (
                  <div>
                    <p className="text-xs text-orange-600 mb-1">Order Date</p>
                    <p className="text-sm text-orange-900 font-medium">{formatDate(material.orderDate)}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Optional category badges showing tier, tier2, section, subsection */}
        {(material.tier || material.tier2Category || material.section || material.subsection) && (
          <div className="flex flex-wrap items-center gap-1.5 mb-3">
            {/* Display tier category badge with colors if available */}
            {material.tier && (
              <CategoryBadge 
                category={material.tier || ''} 
                type="tier1"
                className="text-xs bg-white text-foreground border"
                color={null}
              />
            )}
            {/* Display tier2 category badge with colors if available */}
            {material.tier2Category && (
              <CategoryBadge 
                category={material.tier2Category} 
                type="tier2"
                className="text-xs bg-white text-foreground border"
                color={null}
              />
            )}
            {material.section && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-slate-50 text-slate-700 border border-slate-100">
                {material.section}
              </span>
            )}
            {material.subsection && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-slate-50 text-slate-700 border border-slate-100">
                {material.subsection}
              </span>
            )}
          </div>
        )}
        
        {/* Material details section - collapsible */}
        {material.details && (
          <Collapsible
            open={detailsOpen}
            onOpenChange={setDetailsOpen}
            className="border-t border-slate-100 pt-3"
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded-full bg-slate-200">
                  <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-600">
                    <path d="M14 3v4a1 1 0 0 0 1 1h4" />
                    <path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2z" />
                    <path d="M9 9h1" />
                    <path d="M9 13h6" />
                    <path d="M9 17h6" />
                  </svg>
                </div>
                <p className="text-xs text-slate-700 font-medium">Additional Details</p>
              </div>
              <CollapsibleTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-6 h-6 p-0 rounded-full dropdown-ignore hover:bg-slate-100"
                >
                  {detailsOpen ? (
                    <ChevronUp className="h-3 w-3 text-slate-500" />
                  ) : (
                    <ChevronDown className="h-3 w-3 text-slate-500" />
                  )}
                </Button>
              </CollapsibleTrigger>
            </div>
            <CollapsibleContent className="mt-2 dropdown-ignore">
              <div 
                className="text-sm mt-2 bg-white px-3 py-3 rounded-lg border border-slate-100 dropdown-ignore text-slate-700"
                onClick={(e) => {
                  // Prevent this click from bubbling up to the card
                  e.stopPropagation();
                }}
              >
                <LinkifiedText text={material.details || ""} />
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}
      </CardContent>
    </Card>
  );
}