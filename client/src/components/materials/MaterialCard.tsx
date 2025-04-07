import React from "react";
import { Edit, MoreHorizontal, Trash, Package } from "lucide-react";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
// Import icons directly since the utility functions are having import issues
import { 
  Building, Cog, PanelTop, Package as PackageIcon, 
  Paintbrush, Construction 
} from "lucide-react";

interface Material {
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
}

interface MaterialCardProps {
  material: Material;
  onEdit: (material: Material) => void;
  onDelete: (materialId: number) => void;
}

// Internal function to get the appropriate icon based on material tier
const getIconForMaterial = (tier: string, className: string = "h-5 w-5") => {
  const lowerCaseTier = (tier || '').toLowerCase();
  
  if (lowerCaseTier === 'structural') {
    return <Building className={`${className} text-orange-600`} />;
  }
  
  if (lowerCaseTier === 'systems') {
    return <Cog className={`${className} text-blue-600`} />;
  }
  
  if (lowerCaseTier === 'sheathing') {
    return <PanelTop className={`${className} text-green-600`} />;
  }
  
  if (lowerCaseTier === 'finishings') {
    return <Paintbrush className={`${className} text-violet-600`} />;
  }
  
  return <PackageIcon className={`${className} text-slate-600`} />;
};

export function MaterialCard({ material, onEdit, onDelete }: MaterialCardProps) {
  return (
    <Card key={material.id}>
      <CardHeader className="p-4 pb-2">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            {getIconForMaterial(material.tier || 'Other', "h-5 w-5")}
            <CardTitle className="text-base">{material.name}</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2 py-1 rounded-full bg-orange-100 text-orange-800">
              {material.category || 'Other'}
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
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
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <p className="text-muted-foreground">Quantity:</p>
            <p className="font-medium">
              {material.quantity} {material.unit}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Supplier:</p>
            <p className="font-medium">{material.supplier || "Not specified"}</p>
          </div>
          {(material.tier2Category || material.subsection) && (
            <div>
              <p className="text-muted-foreground">Details:</p>
              <p className="font-medium">
                {material.tier2Category && material.subsection 
                  ? `${material.tier2Category} — ${material.subsection}`
                  : material.tier2Category || material.subsection}
              </p>
            </div>
          )}
          <div>
            <p className="text-muted-foreground">Cost:</p>
            <p className="font-medium text-[#084f09]">
              {material.cost ? formatCurrency(material.cost) : "$0.00"}/{material.unit}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Total:</p>
            <p className="font-medium text-[#084f09]">
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