import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Package, 
  Plus, 
  ShoppingCart, 
  Truck, 
  Warehouse,
  Search,
  Edit,
  MoreHorizontal,
  Hammer,
  Construction,
  HardHat,
  Zap,
  Droplet,
  Building,
  Landmark,
  LayoutGrid,
  FileCheck 
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { CreateMaterialDialog } from "@/pages/materials/CreateMaterialDialog";
import { EditMaterialDialog } from "@/pages/materials/EditMaterialDialog";
import { formatCurrency } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Material {
  id: number;
  name: string;
  type: string;
  quantity: number;
  projectId: number;
  supplier?: string;
  status: string;
  // Additional fields for display
  unit?: string;
  cost?: number;
  category?: string;
  taskIds?: number[];
  contactIds?: number[];
}

// Inventory item interface with usage tracking
interface InventoryItem {
  id: number;
  name: string;
  ordered: number;
  delivered: number;
  used: number;
  unit: string;
}

interface ResourcesTabProps {
  projectId?: number;
}

export function ResourcesTab({ projectId }: ResourcesTabProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "categories">("categories");
  const queryClient = useQueryClient();

  // Fetch materials - either all or filtered by project
  const { data: materials, isLoading } = useQuery<Material[]>({
    queryKey: projectId 
      ? ["/api/projects", projectId, "materials"] 
      : ["/api/materials"],
    queryFn: async () => {
      const url = projectId 
        ? `/api/projects/${projectId}/materials` 
        : "/api/materials";
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch materials");
      }
      return await response.json();
    },
  });

  // Process materials for display (using actual category field from database)
  const processedMaterials = materials?.map(material => ({
    ...material,
    unit: material.unit || "pieces", // Default unit if not provided
    cost: material.cost || 25.00, // Default cost if not provided
    // Use the category field directly, only fall back to derived category if missing
    category: material.category || getCategory(material.type),
  }));

  // Group materials by category
  const materialsByCategory = processedMaterials?.reduce((acc, material) => {
    const category = material.category || 'Other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(material);
    return acc;
  }, {} as Record<string, Material[]>) || {};

  // Filter materials based on search term
  const filteredMaterials = processedMaterials?.filter(material => {
    // If we have a selected category, only show materials from that category
    if (selectedCategory && material.category !== selectedCategory) {
      return false;
    }
    
    if (!searchTerm) return true;
    const searchTermLower = searchTerm.toLowerCase();
    return (
      material.name.toLowerCase().includes(searchTermLower) ||
      material.type.toLowerCase().includes(searchTermLower) ||
      material.status.toLowerCase().includes(searchTermLower) ||
      (material.supplier && material.supplier.toLowerCase().includes(searchTermLower)) ||
      (material.category && material.category.toLowerCase().includes(searchTermLower))
    );
  });

  // Generate inventory data based on materials
  const inventoryItems: InventoryItem[] = processedMaterials?.map(material => ({
    id: material.id,
    name: material.name,
    ordered: material.quantity * 1.5, // Ordered more than needed
    delivered: material.quantity, // All have been delivered
    used: material.quantity * 0.6, // Using 60% as placeholder
    unit: material.unit || "pieces"
  })) || [];

  // Function to determine category based on material type
  function getCategory(type: string): string {
    const typeMap: Record<string, string> = {
      lumber: "Wood",
      concrete: "Building Material",
      paint: "Finishing",
      tools: "Equipment",
      electrical: "Electrical",
      plumbing: "Plumbing",
      metal: "Structural",
      glass: "Interior",
      insulation: "Insulation",
      roofing: "Roofing",
    };
    
    const lowerType = type.toLowerCase();
    for (const [key, value] of Object.entries(typeMap)) {
      if (lowerType.includes(key)) {
        return value;
      }
    }
    return "Other";
  }

  // Get category icon
  const getCategoryIcon = (category: string, className: string = "h-5 w-5") => {
    switch (category.toLowerCase()) {
      case 'concrete':
      case 'building material':
        return <Landmark className={`${className} text-stone-700`} />;
      case 'wood':
        return <Construction className={`${className} text-amber-700`} />;
      case 'electrical':
        return <Zap className={`${className} text-yellow-600`} />;
      case 'plumbing':
        return <Droplet className={`${className} text-blue-600`} />;
      case 'tools':
      case 'equipment':
        return <Hammer className={`${className} text-gray-700`} />;
      case 'metal':
      case 'structural':
        return <Building className={`${className} text-sky-600`} />;
      case 'glass':
      case 'interior':
        return <LayoutGrid className={`${className} text-orange-600`} />;
      case 'finishing':
        return <FileCheck className={`${className} text-indigo-600`} />;
      case 'insulation':
        return <HardHat className={`${className} text-green-600`} />;
      case 'roofing':
        return <Construction className={`${className} text-red-600`} />;
      default:
        return <Package className={`${className} text-slate-700`} />;
    }
  };
  
  // Get category icon background color
  const getCategoryIconBackground = (category: string) => {
    switch (category.toLowerCase()) {
      case 'concrete':
      case 'building material':
        return 'bg-stone-200';
      case 'wood':
        return 'bg-amber-200';
      case 'electrical':
        return 'bg-yellow-200';
      case 'plumbing':
        return 'bg-blue-200';
      case 'tools':
      case 'equipment':
        return 'bg-gray-200';
      case 'metal':
      case 'structural':
        return 'bg-sky-200';
      case 'glass':
      case 'interior':
        return 'bg-orange-200';
      case 'finishing':
        return 'bg-indigo-200';
      case 'insulation':
        return 'bg-green-200';
      case 'roofing':
        return 'bg-red-200';
      default:
        return 'bg-slate-200';
    }
  };
  
  // Get category description
  const getCategoryDescription = (category: string) => {
    switch (category.toLowerCase()) {
      case 'concrete':
      case 'building material':
        return 'Foundation and structural materials';
      case 'wood':
        return 'Lumber and wood-based products';
      case 'electrical':
        return 'Wiring, panels, and lighting';
      case 'plumbing':
        return 'Pipes, fixtures, and fittings';
      case 'tools':
      case 'equipment':
        return 'Tools and construction equipment';
      case 'metal':
      case 'structural':
        return 'Support and framing elements';
      case 'glass':
      case 'interior':
        return 'Interior finishes and materials';
      case 'finishing':
        return 'Paint and decorative finishes';
      case 'insulation':
        return 'Thermal and acoustic insulation';
      case 'roofing':
        return 'Roof covering and materials';
      default:
        return 'Miscellaneous materials';
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-orange-500">Resources</h1>
          <div className="h-10 w-32 bg-orange-100 rounded-md animate-pulse"></div>
        </div>
        <div className="h-10 w-full bg-slate-100 rounded-md animate-pulse"></div>
        <div className="space-y-4 mt-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 w-full bg-slate-50 rounded-md animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-orange-500">Resources</h1>
        <Button 
          className="bg-orange-500 hover:bg-orange-600"
          onClick={() => setCreateDialogOpen(true)}
        >
          <Plus className="mr-2 h-4 w-4" /> Add Material
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
        <Input 
          placeholder="Search materials..." 
          className="pl-8"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <Tabs defaultValue="materials">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="materials">Materials</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
        </TabsList>
        
        <TabsContent value="materials" className="space-y-4 mt-4">
          {/* View Mode Tabs */}
          <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as "list" | "categories")}>
            <TabsList className="grid w-full grid-cols-2 bg-slate-100">
              <TabsTrigger value="categories" className="data-[state=active]:bg-white">Category View</TabsTrigger>
              <TabsTrigger value="list" className="data-[state=active]:bg-white">List View</TabsTrigger>
            </TabsList>
            
            <TabsContent value="categories" className="space-y-4 mt-4">
              {/* Category Cards or Selected Category Materials */}
              {!selectedCategory ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(materialsByCategory || {}).map(([category, materials]) => {
                    const inStock = materials.filter(m => m.status === 'in_stock').length;
                    const ordered = materials.filter(m => m.status === 'ordered').length;
                    const totalValue = materials.reduce((sum, m) => sum + (m.cost || 0) * m.quantity, 0);
                    
                    return (
                      <Card 
                        key={category} 
                        className="rounded-lg border bg-card text-card-foreground shadow-sm h-full transition-all hover:shadow-md cursor-pointer"
                        onClick={() => setSelectedCategory(category)}
                      >
                        <div className={`flex flex-col space-y-1.5 p-6 rounded-t-lg ${getCategoryIconBackground(category)}`}>
                          <div className="flex justify-center py-4">
                            <div className="p-2 rounded-full bg-white bg-opacity-70">
                              {getCategoryIcon(category, "h-8 w-8 text-orange-500")}
                            </div>
                          </div>
                        </div>
                        <div className="p-6 pt-6">
                          <h3 className="text-2xl font-semibold leading-none tracking-tight">
                            {category}
                          </h3>
                          <p className="text-sm text-muted-foreground mt-2">
                            {getCategoryDescription(category)}
                          </p>
                          <div className="mt-4 text-sm text-muted-foreground">
                            <div className="flex justify-between mb-1">
                              <span>{materials.length} materials</span>
                              <span>{formatCurrency(totalValue)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>{inStock} in stock</span>
                              {ordered > 0 && <span>{ordered} ordered</span>}
                            </div>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 mb-4">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setSelectedCategory(null)}
                      className="flex items-center gap-1 text-orange-500 hover:text-orange-600 hover:bg-orange-50"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-left">
                        <path d="m15 18-6-6 6-6"/>
                      </svg>
                      Back to categories
                    </Button>
                    <div className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium flex items-center gap-1">
                      {getCategoryIcon(selectedCategory, "h-4 w-4")}
                      {selectedCategory}
                    </div>
                  </div>

                  <div className="flex justify-between items-center bg-slate-50 p-3 rounded-md mb-2">
                    <span className="text-sm font-medium">Total Value:</span>
                    <span className="text-sm font-medium text-[#084f09]">
                      {formatCurrency(
                        filteredMaterials?.reduce((sum, material) => 
                          sum + (material.cost || 0) * material.quantity, 0) || 0
                      )}
                    </span>
                  </div>
                  
                  {filteredMaterials?.map((material) => (
                    <Card key={material.id}>
                      <CardHeader className="p-4 pb-2">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-base">{material.name}</CardTitle>
                          <div className="flex items-center gap-2">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem 
                                  onClick={() => {
                                    setSelectedMaterial(material);
                                    setEditDialogOpen(true);
                                  }}
                                >
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
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
                </>
              )}
            </TabsContent>
            
            <TabsContent value="list" className="space-y-4 mt-4">
              {filteredMaterials && filteredMaterials.length > 0 ? (
                <>
                  <div className="flex justify-between items-center bg-slate-50 p-3 rounded-md mb-2">
                    <span className="text-sm font-medium">Total Materials Value:</span>
                    <span className="text-sm font-medium text-[#084f09]">
                      {formatCurrency(
                        filteredMaterials.reduce((sum, material) => 
                          sum + (material.cost || 0) * material.quantity, 0)
                      )}
                    </span>
                  </div>
                  {filteredMaterials?.map((material) => (
                    <Card key={material.id}>
                      <CardHeader className="p-4 pb-2">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-base">{material.name}</CardTitle>
                          <div className="flex items-center gap-2">
                            <span className="text-xs px-2 py-1 rounded-full bg-orange-100 text-orange-800">
                              {material.category}
                            </span>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem 
                                  onClick={() => {
                                    setSelectedMaterial(material);
                                    setEditDialogOpen(true);
                                  }}
                                >
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
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
                </>
              ) : (
                <div className="text-center py-8">
                  <Package className="mx-auto h-8 w-8 text-slate-300" />
                  <p className="mt-2 text-slate-500">No materials found</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </TabsContent>
        
        <TabsContent value="inventory" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Inventory Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {inventoryItems.length > 0 ? (
                inventoryItems.map((item) => (
                  <div key={item.id} className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">{item.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {item.used}/{item.delivered} {item.unit} used
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Progress value={(item.used / item.delivered) * 100} className="h-2" />
                      <div className="flex space-x-1 text-xs">
                        <div className="flex items-center">
                          <ShoppingCart className="h-3 w-3 mr-1 text-blue-500" />
                          <span>{item.ordered}</span>
                        </div>
                        <div className="flex items-center">
                          <Truck className="h-3 w-3 mr-1 text-green-500" />
                          <span>{item.delivered}</span>
                        </div>
                        <div className="flex items-center">
                          <Package className="h-3 w-3 mr-1 text-orange-500" />
                          <span>{item.used}</span>
                        </div>
                        <div className="flex items-center">
                          <Warehouse className="h-3 w-3 mr-1 text-purple-500" />
                          <span>{item.delivered - item.used}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Warehouse className="mx-auto h-8 w-8 text-slate-300" />
                  <p className="mt-2 text-slate-500">No inventory data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <CreateMaterialDialog 
        open={createDialogOpen} 
        onOpenChange={setCreateDialogOpen} 
        projectId={projectId}
      />
      
      <EditMaterialDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        material={selectedMaterial}
      />
    </div>
  );
}