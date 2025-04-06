import React, { useState, useEffect } from "react";
import {
  Package,
  ShoppingCart,
  Truck,
  Warehouse,
  MoreHorizontal,
  Edit,
  Trash,
  Landmark,
  Zap,
  Droplet,
  Building,
  Fan,
  Paintbrush,
  Hammer,
  HardHat,
  LayoutGrid
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

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

interface TypeSubtypeFilterProps {
  materials: Material[];
  onMaterialAction: (material: Material, action: 'edit' | 'delete') => void;
}

export function TypeSubtypeFilter({ materials, onMaterialAction }: TypeSubtypeFilterProps) {
  // Material type categories mapping (subtypes by type)
  const materialTypeCategories: Record<string, string[]> = {
    "Building Materials": [
      "Lumber & Composites",
      "Concrete, Cement & Masonry",
      "Decking",
      "Fencing",
      "Moulding & Millwork",
      "Insulation",
      "Drywall",
      "Roofing",
      "Gutter Systems",
      "Plywood",
      "Boards, Planks & Panels",
      "Siding",
      "Ladders",
      "Dimensional Lumber",
      "Building Hardware",
      "Ventilation"
    ],
    "Appliances": [
      "Kitchen Appliance Packages",
      "Refrigerators",
      "Ranges",
      "Dishwashers",
      "Microwaves",
      "Over-the-Range Microwaves",
      "Range Hoods",
      "Freezers",
      "Wall Ovens",
      "Cooktops",
      "Beverage Coolers",
      "Mini Fridges"
    ],
    "Electrical": [
      "Conduit & Fittings",
      "Electrical Boxes & Brackets",
      "Weatherproof Boxes",
      "Circuit Breakers",
      "Breaker Boxes",
      "Safety Switches",
      "Electrical Tools",
      "Electric Testers",
      "Wire",
      "Wiring Devices & Light Controls",
      "Wall Plates",
      "Extension Cords & Surge Protectors",
      "Smoke Detectors & Fire Safety",
      "Commercial Lighting"
    ],
    "Plumbing": [
      "Pipe & Fittings",
      "Valves",
      "Water Heaters",
      "Pumps",
      "Water Filtration",
      "Plumbing Tools",
      "Drain Cleaning"
    ],
    "HVAC": [
      "Air Conditioners",
      "Heaters",
      "Air Purifiers",
      "Ventilation",
      "Thermostats",
      "HVAC Tools"
    ],
    "Tools": [
      "Hand Tools",
      "Power Tools",
      "Tool Storage",
      "Measuring Tools",
      "Safety Equipment"
    ],
    "Safety Equipment": [
      "Personal Protective Equipment",
      "First Aid",
      "Construction Safety"
    ],
    "Glass": [
      "Window Glass",
      "Shower Glass",
      "Mirrors",
      "Glass Panels"
    ]
  };

  // Group materials by type
  const materialsByType = materials.reduce((acc, material) => {
    // Normalize type to make sure we standardize type names
    let type = material.type || 'Other';
    
    // Make sure all types are case-standardized for consistency
    if (type.toLowerCase().includes('glass')) {
      type = 'Glass';
    } else if (type.toLowerCase().includes('building')) {
      type = 'Building Materials';
    } else if (type.toLowerCase().includes('electrical')) {
      type = 'Electrical';
    } else if (type.toLowerCase().includes('plumbing')) {
      type = 'Plumbing';
    } else if (type.toLowerCase().includes('hvac')) {
      type = 'HVAC';
    } else if (type.toLowerCase().includes('finishes')) {
      type = 'Finishes';
    } else if (type.toLowerCase().includes('tools')) {
      type = 'Tools';
    } else if (type.toLowerCase().includes('safety')) {
      type = 'Safety Equipment';
    } else if (type === 'Other') {
      // Already "Other", no change needed
    }
    
    // Create the array for this type if it doesn't exist
    if (!acc[type]) {
      acc[type] = [];
    }
    
    // Add the material to the appropriate type
    acc[type].push(material);
    return acc;
  }, {} as Record<string, Material[]>);

  // State for selection
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedSubtype, setSelectedSubtype] = useState<string | null>(null);
  
  // Get all available types 
  const availableTypes = Object.keys(materialsByType);
  
  // Function to get subtypes for a given type
  const getSubtypesForType = (type: string): string[] => {
    if (!type || !materialTypeCategories[type]) return [];
    
    // Get all materials of this type
    const materialsOfType = materialsByType[type] || [];
    
    // Get all unique categories (subtypes) that exist in the materials
    const existingSubtypes = Array.from(new Set(materialsOfType
      .map(m => m.category)
      .filter((category): category is string => Boolean(category))
    ));
    
    // Combine with predefined subtypes for this type
    const allSubtypes = Array.from(new Set([
      ...existingSubtypes,
      ...materialTypeCategories[type]
    ]));
    
    return allSubtypes;
  };
  
  // Function to filter materials by type and subtype
  const getFilteredMaterials = () => {
    if (!selectedType) {
      // No type selected, return all materials
      return Object.values(materialsByType).flat();
    }
    
    const materialsOfType = materialsByType[selectedType] || [];
    
    if (!selectedSubtype) {
      // Type selected but no subtype, return all materials of that type
      return materialsOfType;
    }
    
    // Both type and subtype selected, filter by subtype
    return materialsOfType.filter(m => 
      m.category === selectedSubtype
    );
  };
  
  const filteredMaterials = getFilteredMaterials();
  const totalFilteredValue = filteredMaterials.reduce(
    (sum, m) => sum + (m.cost || 0) * m.quantity, 0
  );
  
  // Get type icon based on material type
  const getTypeIcon = (type: string) => {
    if (type.toLowerCase().includes('building')) return <Landmark className="h-4 w-4 text-[#6d4c41]" />;
    if (type.toLowerCase().includes('electrical')) return <Zap className="h-4 w-4 text-[#f9a825]" />;
    if (type.toLowerCase().includes('plumbing')) return <Droplet className="h-4 w-4 text-[#0288d1]" />;
    if (type.toLowerCase().includes('hvac')) return <Fan className="h-4 w-4 text-[#81c784]" />;
    if (type.toLowerCase().includes('finishes')) return <Paintbrush className="h-4 w-4 text-[#ec407a]" />;
    if (type.toLowerCase().includes('tools')) return <Hammer className="h-4 w-4 text-[#455a64]" />;
    if (type.toLowerCase().includes('safety')) return <HardHat className="h-4 w-4 text-[#ef6c00]" />;
    if (type.toLowerCase().includes('glass')) return <LayoutGrid className="h-4 w-4 text-[#03a9f4]" />;
    return <Package className="h-4 w-4 text-[#78909c]" />;
  };

  return (
    <div>
      {/* Type and Subtype Selection Controls */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Type Selection Dropdown */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Material Type
            </label>
            <Select
              value={selectedType || ""}
              onValueChange={(value) => {
                setSelectedType(value || null);
                setSelectedSubtype(null); // Reset subtype when type changes
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a material type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Types</SelectItem>
                {availableTypes.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Subtype Selection Dropdown - Only shown when a type is selected */}
          {selectedType && (
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Material Subtype
              </label>
              <Select
                value={selectedSubtype || ""}
                onValueChange={(value) => setSelectedSubtype(value || null)}
                disabled={!selectedType}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a material subtype" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Subtypes</SelectItem>
                  {getSubtypesForType(selectedType).map(subtype => (
                    <SelectItem key={subtype} value={subtype}>{subtype}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        
        {/* Summary of filtered materials */}
        <div className="flex justify-between items-center bg-slate-50 p-3 rounded-md">
          <span className="text-sm font-medium">
            {selectedType 
              ? (selectedSubtype 
                ? `${selectedType} > ${selectedSubtype}`
                : selectedType)
              : "All Types"}:
          </span>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-600">{filteredMaterials.length} items</span>
            <span className="text-sm font-medium">{formatCurrency(totalFilteredValue)}</span>
          </div>
        </div>
      </div>
      
      {/* Display filtered materials */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredMaterials.map((material) => (
          <Card key={material.id} className="overflow-hidden">
            <CardHeader className="p-4 pb-2">
              <div className="flex justify-between items-start">
                <div className="flex items-start gap-2">
                  <div className="w-8 h-8 bg-slate-50 rounded-full flex items-center justify-center mt-0.5">
                    {getTypeIcon(material.type)}
                  </div>
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
                      <DropdownMenuItem 
                        onClick={() => onMaterialAction(material, 'edit')}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => onMaterialAction(material, 'delete')}
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
            <CardContent className="p-4 pt-2">
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
                <div>
                  <p className="text-muted-foreground">Cost:</p>
                  <p className="font-medium text-[#084f09]">
                    {material.cost ? formatCurrency(material.cost) : "$0.00"}/{material.unit}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Total:</p>
                  <p className="font-medium text-[#084f09]">
                    {material.cost 
                      ? formatCurrency(material.cost * material.quantity) 
                      : "$0.00"}
                  </p>
                </div>
              </div>
              <div className="flex justify-end mt-2">
                <Button variant="outline" size="sm" className="text-orange-500 border-orange-500">
                  <ShoppingCart className="h-4 w-4 mr-1" /> Order
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}