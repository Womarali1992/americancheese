import React from "react";
import { Button } from "@/components/ui/button";
import { Edit, ShoppingCart, Trash } from "lucide-react";
import type { Material } from "@/types";

interface MaterialActionButtonsProps {
  material: Material;
  onEdit: () => void;
  onDelete: () => void;
}

export function MaterialActionButtons({ material, onEdit, onDelete }: MaterialActionButtonsProps) {
  return (
    <div className="flex justify-end gap-2 mt-2">
      <Button 
        variant="outline" 
        size="sm" 
        className="text-blue-500 border-blue-500"
        onClick={onEdit}
      >
        <Edit className="h-4 w-4 mr-1" /> Edit
      </Button>
      <Button 
        variant="outline" 
        size="sm" 
        className="text-red-500 border-red-500"
        onClick={() => {
          if (window.confirm(`Are you sure you want to delete "${material.name}"?`)) {
            onDelete();
          }
        }}
      >
        <Trash className="h-4 w-4 mr-1" /> Delete
      </Button>
      <Button 
        variant="outline" 
        size="sm" 
        className="text-orange-500 border-orange-500"
      >
        <ShoppingCart className="h-4 w-4 mr-1" /> Order
      </Button>
    </div>
  );
}