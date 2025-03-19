import { useState, useEffect } from "react";
import { Package, Plus, ShoppingCart, Truck, Warehouse } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { CreateMaterialDialog } from "@/pages/materials/CreateMaterialDialog";

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

interface ResourcesTabProps {
  projectId?: number;
}

export function ResourcesTab({ projectId }: ResourcesTabProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  // Fetch materials
  const { data: materials } = useQuery<Material[]>({
    queryKey: projectId ? ["/api/projects", projectId, "materials"] : ["/api/materials"],
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

  // Enhanced materials data with additional display info
  const enhancedMaterials = materials?.map(material => {
    // Determine unit based on type
    let unit = "pieces";
    if (material.type.toLowerCase().includes("concrete")) unit = "bags";
    else if (material.type.toLowerCase().includes("lumber")) unit = "pieces";
    else if (material.type.toLowerCase().includes("panel") || material.type.toLowerCase().includes("sheet")) unit = "sheets";
    else if (material.type.toLowerCase().includes("wiring") || material.type.toLowerCase().includes("pipe")) unit = "feet";
    
    // Estimate cost based on type (in a real app this would come from the database)
    let cost = 10.0;
    if (material.type.toLowerCase().includes("concrete")) cost = 12.99;
    else if (material.type.toLowerCase().includes("lumber")) cost = 5.75;
    else if (material.type.toLowerCase().includes("drywall")) cost = 15.5;
    else if (material.type.toLowerCase().includes("copper")) cost = 0.89;
    
    // Determine category
    let category = material.type;
    if (material.type.toLowerCase().includes("concrete") || material.type.toLowerCase().includes("brick")) {
      category = "Building Material";
    } else if (material.type.toLowerCase().includes("lumber") || material.type.toLowerCase().includes("wood")) {
      category = "Wood";
    } else if (material.type.toLowerCase().includes("drywall") || material.type.toLowerCase().includes("paint")) {
      category = "Interior";
    } else if (material.type.toLowerCase().includes("electrical") || material.type.toLowerCase().includes("wiring")) {
      category = "Electrical";
    }
    
    return {
      ...material,
      unit,
      cost,
      category
    };
  }) || [];

  // Simulate inventory data for the tab
  const inventory = enhancedMaterials.map(material => {
    // Calculate used amount (50-75% of quantity for this demo)
    const usageRate = 0.5 + Math.random() * 0.25;
    const used = Math.floor(material.quantity * usageRate);
    
    // Calculate delivered amount (75-100% of quantity)
    const deliveryRate = 0.75 + Math.random() * 0.25;
    const delivered = Math.min(Math.floor(material.quantity * deliveryRate), material.quantity);
    
    return {
      id: material.id,
      name: material.name,
      ordered: material.quantity,
      delivered,
      used,
      unit: material.unit
    };
  });

  // Filter materials based on search
  const filteredMaterials = enhancedMaterials.filter(material => {
    if (!searchTerm) return true;
    const searchTermLower = searchTerm.toLowerCase();
    return (
      material.name.toLowerCase().includes(searchTermLower) ||
      material.category?.toLowerCase().includes(searchTermLower) ||
      material.supplier?.toLowerCase().includes(searchTermLower)
    );
  });

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-orange-500">Resources</h1>
        <Button 
          className="bg-orange-500 hover:bg-orange-600" 
          onClick={() => setDialogOpen(true)}
        >
          <Plus className="mr-2 h-4 w-4" /> Add Material
        </Button>
      </div>

      <Input 
        placeholder="Search materials..." 
        className="w-full" 
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      <Tabs defaultValue="materials">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="materials">Materials</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
        </TabsList>
        <TabsContent value="materials" className="space-y-4 mt-4">
          {filteredMaterials.map((material) => (
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
                    <p className="font-medium">{material.supplier || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Cost:</p>
                    <p className="font-medium">
                      ${material.cost?.toFixed(2)}/{material.unit}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Total:</p>
                    <p className="font-medium">${((material.cost || 0) * material.quantity).toFixed(2)}</p>
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
        </TabsContent>
        <TabsContent value="inventory" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Inventory Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {inventory.map((item) => (
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
              ))}
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