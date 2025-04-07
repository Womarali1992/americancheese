import React from "react";
import { Edit, MoreHorizontal, Trash } from "lucide-react";
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
};

interface MaterialCardProps {
  material: Material | SimplifiedMaterial;
  onEdit: (material: Material | SimplifiedMaterial) => void;
  onDelete: (materialId: number) => void;
}

export function MaterialCard({ material, onEdit, onDelete }: MaterialCardProps) {
  return (
    <Card key={material.id} className="overflow-hidden border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      {/* Grey header with orange border all around and material name */}
      <div className="bg-gray-50 px-4 py-3 border-2 border-orange-500 rounded-t-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getIconForMaterialTier(material.tier, "h-7 w-7")}
            <CardTitle className="text-base font-bold text-gray-800 font-sans">{material.name}</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2 py-1 rounded-full bg-orange-500 text-white font-medium">
              {material.category || 'Other'}
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-600 hover:bg-gray-200">
                  <MoreHorizontal className="h-5 w-5" />
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
      </CardContent>
    </Card>
  );
}