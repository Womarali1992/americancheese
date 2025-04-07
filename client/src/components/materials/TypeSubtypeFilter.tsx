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
import { MaterialCard } from "@/components/materials/MaterialCard";

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
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [selectedSubsection, setSelectedSubsection] = useState<string | null>(null);
  
  // Get all available types 
  const availableTypes = Object.keys(materialsByType);
  
  // Function to get subtypes for a given type
  const getSubtypesForType = (type: string): string[] => {
    if (!type || type === "all_types" || !materialTypeCategories[type]) return [];
    
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
  
  // Function to get all available sections
  const getSections = (filteredByType: Material[]): string[] => {
    // Get all unique sections that exist in the materials
    const sections = Array.from(new Set(filteredByType
      .map(m => m.section)
      .filter((section): section is string => Boolean(section))
    ));
    
    return sections;
  };
  
  // Function to get all available subsections for a given section
  const getSubsections = (filteredByTypeAndSection: Material[]): string[] => {
    // Get all unique subsections that exist in the materials
    const subsections = Array.from(new Set(filteredByTypeAndSection
      .map(m => m.subsection)
      .filter((subsection): subsection is string => Boolean(subsection))
    ));
    
    return subsections;
  };
  
  // Function to filter materials by type, subtype, section, and subsection
  const getFilteredMaterials = () => {
    // Step 1: Filter by type
    let filteredByType: Material[];
    if (!selectedType || selectedType === "all_types") {
      // No type selected or "All Types" selected, use all materials
      filteredByType = Object.values(materialsByType).flat();
    } else {
      // Filter by selected type
      filteredByType = materialsByType[selectedType] || [];
    }
    
    // Step 2: Filter by subtype if selected
    let filteredBySubtype: Material[];
    if (!selectedSubtype || selectedSubtype === "all_subtypes") {
      // No subtype selected or "All Subtypes" selected, use materials filtered by type
      filteredBySubtype = filteredByType;
    } else {
      // Filter by selected subtype
      filteredBySubtype = filteredByType.filter(m => m.category === selectedSubtype);
    }
    
    // Step 3: Filter by section if selected
    let filteredBySection: Material[];
    if (!selectedSection || selectedSection === "all_sections") {
      // No section selected or "All Sections" selected, use materials filtered by subtype
      filteredBySection = filteredBySubtype;
    } else {
      // Filter by selected section
      filteredBySection = filteredBySubtype.filter(m => m.section === selectedSection);
    }
    
    // Step 4: Filter by subsection if selected
    let filteredBySubsection: Material[];
    if (!selectedSubsection || selectedSubsection === "all_subsections") {
      // No subsection selected or "All Subsections" selected, use materials filtered by section
      filteredBySubsection = filteredBySection;
    } else {
      // Filter by selected subsection
      filteredBySubsection = filteredBySection.filter(m => m.subsection === selectedSubsection);
    }
    
    return filteredBySubsection;
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
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          {/* Type Selection Dropdown */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Material Type
            </label>
            <Select
              value={selectedType || "all_types"}
              onValueChange={(value) => {
                setSelectedType(value === "all_types" ? null : value);
                setSelectedSubtype(null); // Reset subtype when type changes
                setSelectedSection(null); // Reset section
                setSelectedSubsection(null); // Reset subsection
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a material type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all_types">All Types</SelectItem>
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
                value={selectedSubtype || "all_subtypes"}
                onValueChange={(value) => {
                  setSelectedSubtype(value === "all_subtypes" ? null : value);
                  setSelectedSection(null); // Reset section when subtype changes
                  setSelectedSubsection(null); // Reset subsection when subtype changes
                }}
                disabled={!selectedType}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a material subtype" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all_subtypes">All Subtypes</SelectItem>
                  {getSubtypesForType(selectedType).map(subtype => (
                    <SelectItem key={subtype} value={subtype}>{subtype}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        
        {/* Section and Subsection Row */}
        <div className="flex flex-col md:flex-row gap-4">
          {/* Section Selection */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Section
            </label>
            <Select
              value={selectedSection || "all_sections"}
              onValueChange={(value) => {
                setSelectedSection(value === "all_sections" ? null : value);
                setSelectedSubsection(null); // Reset subsection when section changes
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a section" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all_sections">All Sections</SelectItem>
                {getSections(selectedSubtype ? filteredMaterials : []).map(section => (
                  <SelectItem key={section} value={section}>{section}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Subsection Selection - Only shown when a section is selected */}
          {selectedSection && (
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Subsection
              </label>
              <Select
                value={selectedSubsection || "all_subsections"}
                onValueChange={(value) => setSelectedSubsection(value === "all_subsections" ? null : value)}
                disabled={!selectedSection}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a subsection" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all_subsections">All Subsections</SelectItem>
                  {getSubsections(filteredMaterials.filter(m => m.section === selectedSection)).map(subsection => (
                    <SelectItem key={subsection} value={subsection}>{subsection}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        
        {/* Summary of filtered materials with visual breadcrumb */}
        <div className="space-y-3">
          {/* Breadcrumb navigation */}
          <div className="flex items-center flex-wrap gap-2 bg-slate-100 p-3 rounded-md">
            <span className={`px-2 py-1 rounded ${!selectedType ? 'bg-blue-100 text-blue-800 font-medium' : 'bg-slate-200 text-slate-700 hover:bg-slate-300 cursor-pointer'}`} 
                  onClick={() => {
                    setSelectedType(null);
                    setSelectedSubtype(null);
                    setSelectedSection(null);
                    setSelectedSubsection(null);
                  }}>
              All Types
            </span>
            
            {selectedType && (
              <>
                <span className="text-slate-400">→</span>
                <span className={`px-2 py-1 rounded ${!selectedSubtype ? 'bg-blue-100 text-blue-800 font-medium' : 'bg-slate-200 text-slate-700 hover:bg-slate-300 cursor-pointer'}`}
                      onClick={() => {
                        setSelectedSubtype(null);
                        setSelectedSection(null);
                        setSelectedSubsection(null);
                      }}>
                  {selectedType}
                </span>
              </>
            )}
            
            {selectedType && selectedSubtype && (
              <>
                <span className="text-slate-400">→</span>
                <span className={`px-2 py-1 rounded ${!selectedSection ? 'bg-blue-100 text-blue-800 font-medium' : 'bg-slate-200 text-slate-700 hover:bg-slate-300 cursor-pointer'}`}
                      onClick={() => {
                        setSelectedSection(null);
                        setSelectedSubsection(null);
                      }}>
                  {selectedSubtype}
                </span>
              </>
            )}
            
            {selectedType && selectedSubtype && selectedSection && (
              <>
                <span className="text-slate-400">→</span>
                <span className={`px-2 py-1 rounded ${!selectedSubsection ? 'bg-blue-100 text-blue-800 font-medium' : 'bg-slate-200 text-slate-700 hover:bg-slate-300 cursor-pointer'}`}
                      onClick={() => {
                        setSelectedSubsection(null);
                      }}>
                  {selectedSection}
                </span>
              </>
            )}
            
            {selectedType && selectedSubtype && selectedSection && selectedSubsection && (
              <>
                <span className="text-slate-400">→</span>
                <span className="px-2 py-1 rounded bg-blue-100 text-blue-800 font-medium">
                  {selectedSubsection}
                </span>
              </>
            )}
          </div>
          
          {/* Summary stats */}
          <div className="flex justify-between items-center bg-slate-50 p-3 rounded-md">
            <span className="text-sm font-medium">
              Filter Results:
            </span>
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-600">{filteredMaterials.length} items</span>
              <span className="text-sm font-medium">{formatCurrency(totalFilteredValue)}</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Display filtered materials */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredMaterials.map((material) => (
          <div key={material.id}>
            <MaterialCard
              material={material}
              onEdit={(mat) => onMaterialAction(mat as Material, 'edit')}
              onDelete={(materialId) => onMaterialAction(
                filteredMaterials.find(m => m.id === materialId) as Material, 
                'delete'
              )}
            />
          </div>
        ))}
      </div>
    </div>
  );
}