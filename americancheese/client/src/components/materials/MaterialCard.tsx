import React from "react";
import { useLocation } from "wouter";
import { Edit, MoreHorizontal, Trash, Copy, Users } from "lucide-react";
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
import { getTier1CategoryColor } from "@/lib/unified-color-system";
import { CategoryBadge } from "@/components/ui/category-badge";
import { LinkifiedText } from "@/lib/linkUtils";
import { useCategoryNameMapping } from "@/hooks/useCategoryNameMapping";

// Create a type that makes the Material type work with the fields we need
export type SimplifiedMaterial = {
  id: number;
  name: string;
  materialSize?: string | null; // New field for material size - can be null from DB
  type: string;
  quantity: number;
  projectId: number;
  supplier?: string | null; // Changed to match database schema
  supplierId?: number | null;
  status: string;
  unit?: string | null; // Changed to match database schema
  cost?: number | null;
  category?: string;
  taskIds?: number[] | string[] | null; // Can be null from DB
  contactIds?: number[] | string[] | null;
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
  isQuote?: boolean | null;
  quoteDate?: string | null;
  quoteNumber?: string | null;  // Custom field for quote identification
  orderDate?: string | null; // For order tracking
};

interface MaterialCardProps {
  material: Material | SimplifiedMaterial;
  onEdit: (material: Material | SimplifiedMaterial) => void;
  onDelete: (materialId: number) => void;
  onDuplicate: (material: Material | SimplifiedMaterial) => void;
  onBulkAssign?: (material: Material | SimplifiedMaterial) => void;
}



export function MaterialCard({ material, onEdit, onDelete, onDuplicate, onBulkAssign }: MaterialCardProps) {
  const [, navigate] = useLocation();

  // Get category name mapping for this project
  const { mapTier1CategoryName, mapTier2CategoryName } = useCategoryNameMapping(material.projectId);

  // Handle card click to navigate to quote detail page if this is a quote
  const handleCardClick = () => {
    if (material.isQuote && material.supplierId) {
      navigate(`/suppliers/${material.supplierId}/quotes/${material.id}`);
    }
  };

  // Helper function to determine status color
  const getStatusColor = (status: string) => {
    const statusLower = (status || '').toLowerCase();
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

  // Helper to get hex colors for tiers
  const getTierColorHex = (tier: string | undefined) => {
    switch (tier?.toLowerCase()) {
      case 'structural': return '#f97316'; // orange-500
      case 'systems': return '#3b82f6'; // blue-500
      case 'sheathing': return '#22c55e'; // green-500
      case 'finishings': return '#8b5cf6'; // violet-500
      default: return '#64748b'; // slate-500
    }
  };

  // Use tier1Color from DB if available, otherwise fallback to hardcoded map or unified system
  const tierColor = material.tier1Color || getTier1CategoryColor(material.tier) || getTierColorHex(material.tier);

  return (
    <Card
      key={material.id}
      className="overflow-hidden border shadow-sm hover:shadow-md transition-all duration-200 rounded-lg cursor-pointer relative group"
      style={{
        backgroundColor: `${tierColor}14`, // ~8% opacity (hex 14 is 20/255 approx 8%)
        borderColor: `${tierColor}20`     // slightly stronger border
      }}
      onClick={(e) => {
        // Prevent click from triggering when clicking on dropdown menu or buttons inside card
        if ((e.target as HTMLElement).closest('.dropdown-ignore')) {
          return;
        }
        console.log("Card clicked for material:", material.id);
        onEdit(material);
      }}
    >
      <div className="flex flex-col h-full">
        {/* Header Section */}
        <div
          className="px-4 py-3 border-b flex justify-between items-start"
          style={{
            backgroundColor: `${tierColor}1f`, // ~12% opacity
            borderColor: `${tierColor}40`      // ~25% opacity
          }}
        >
          <div className="flex-1 min-w-0 pr-4">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              {/* Status Pill - styled with minimal white background to stand out on color */}
              <div className={`px-1.5 py-0.5 rounded text-[10px] font-medium border uppercase tracking-wide bg-white/50 border-white/50 text-slate-700`}>
                {material.status}
              </div>

              {material.tier2Category && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-white/40 border border-white/40 text-slate-700 uppercase tracking-wide">
                  {mapTier2CategoryName(material.tier2Category)}
                </span>
              )}
            </div>

            <div className="flex items-start gap-3">
              <div
                className="mt-0.5 shrink-0 rounded-sm w-3 h-3"
                style={{ backgroundColor: tierColor }}
              ></div>

              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base font-semibold text-slate-900 truncate leading-tight group-hover:text-slate-700 transition-colors">
                    {material.name}
                  </h3>
                  {material.materialSize && (
                    <span
                      className="text-xs font-medium px-1.5 py-0 rounded"
                      style={{ backgroundColor: `${tierColor}26`, color: '#334155' }} // ~15% opacity
                    >
                      {material.materialSize}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-slate-600 font-medium">
                    {material.type || 'Material'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Actions dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-slate-500 hover:text-slate-700 hover:bg-black/5 rounded-md dropdown-ignore shrink-0"
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
              <DropdownMenuItem
                onClick={() => {
                  console.log("Duplicate button clicked for material:", material.id);
                  onDuplicate(material);
                }}
                className="cursor-pointer text-slate-700"
              >
                <Copy className="h-4 w-4 mr-2" />
                Duplicate Material
              </DropdownMenuItem>
              {onBulkAssign && (
                <DropdownMenuItem
                  onClick={() => {
                    console.log("Bulk assign button clicked for material:", material.id);
                    onBulkAssign(material);
                  }}
                  className="cursor-pointer text-slate-700"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Assign to Category
                </DropdownMenuItem>
              )}
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

        {/* Card Content */}
        <CardContent className="p-4 flex-1 flex flex-col pt-3">
          {/* Quantity, Cost Grid - Clean tabular look with semi-transparent background */}
          <div
            className="grid grid-cols-3 gap-0 border rounded-md overflow-hidden mb-3 text-center"
            style={{
              backgroundColor: `${tierColor}14`, // ~8% opacity
              borderColor: `${tierColor}26`      // ~15% opacity
            }}
          >
            <div className="p-2 border-r" style={{ borderColor: `${tierColor}26` }}>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">Qty</p>
              <p className="font-semibold text-slate-700 text-sm mt-0.5">{material.quantity} <span className="text-[10px] font-normal text-slate-500">{material.unit || 'u'}</span></p>
            </div>
            <div className="p-2 border-r" style={{ borderColor: `${tierColor}26` }}>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">Cost</p>
              <p className="font-semibold text-slate-700 text-sm mt-0.5">{material.cost ? formatCurrency(material.cost) : "-"}</p>
            </div>
            <div className="p-2" style={{ backgroundColor: `${tierColor}1f` }}>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">Total</p>
              <p className="font-bold text-slate-900 text-sm mt-0.5">{totalCost ? formatCurrency(totalCost) : '-'}</p>
            </div>
          </div>

          {material.details && (
            <div className="mb-3 text-sm text-slate-600 line-clamp-2 pl-2 border-l-2" style={{ borderColor: tierColor }}>
              <LinkifiedText text={material.details} />
            </div>
          )}

          {/* Related Tasks Link */}
          {material.taskIds && Array.isArray(material.taskIds) && material.taskIds.length > 0 && (
            <div className="mt-auto pt-2 flex flex-wrap gap-1 border-t" style={{ borderColor: `${tierColor}26` }}>
              <span className="text-xs text-slate-500 mr-1 flex items-center">
                Tasks:
              </span>
              {material.taskIds.map((taskId, index) => (
                <button
                  key={index}
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/tasks/${taskId}`);
                  }}
                  className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium hover:opacity-80 transition-opacity cursor-pointer dropdown-ignore"
                  style={{ backgroundColor: `${tierColor}26`, color: '#334155' }}
                >
                  #{taskId}
                </button>
              ))}
            </div>
          )}

          {/* Quote specific info */}
          {material.isQuote && (
            <div className="mt-2 pt-2 border-t text-xs text-slate-500 flex gap-3" style={{ borderColor: `${tierColor}26` }}>
              {material.quoteNumber && <span>Ref: {material.quoteNumber}</span>}
              {material.quoteDate && <span>Date: {formatDate(material.quoteDate)}</span>}
            </div>
          )}
        </CardContent>
      </div>
    </Card>
  );
}