import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Package, 
  Plus, 
  ShoppingCart, 
  Truck, 
  Warehouse,
  Search 
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { CreateMaterialDialog } from "@/pages/materials/CreateMaterialDialog";
import { formatCurrency } from "@/lib/utils";

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
  const [dialogOpen, setDialogOpen] = useState(false);
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

  // Process materials for display (adding placeholder values for new fields)
  const processedMaterials = materials?.map(material => ({
    ...material,
    unit: material.unit || "pieces", // Default unit if not provided
    cost: material.cost || 25.00, // Default cost if not provided
    category: material.category || getCategory(material.type), // Default category based on type
  }));

  // Filter materials based on search term
  const filteredMaterials = processedMaterials?.filter(material => {
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
          onClick={() => setDialogOpen(true)}
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
          {filteredMaterials && filteredMaterials.length > 0 ? (
            filteredMaterials.map((material) => (
              <Card key={material.id}>
                <CardHeader className="p-4 pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-base">{material.name}</CardTitle>
                    <span className="text-xs px-2 py-1 rounded-full bg-orange-100 text-orange-800">
                      {material.category}
                    </span>
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
                      <p className="font-medium">
                        {material.cost ? formatCurrency(material.cost) : "$0.00"}/{material.unit}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Total:</p>
                      <p className="font-medium">
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
            ))
          ) : (
            <div className="text-center py-8">
              <Package className="mx-auto h-8 w-8 text-slate-300" />
              <p className="mt-2 text-slate-500">No materials found</p>
            </div>
          )}
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
        open={dialogOpen} 
        onOpenChange={setDialogOpen} 
        projectId={projectId}
      />
    </div>
  );
}