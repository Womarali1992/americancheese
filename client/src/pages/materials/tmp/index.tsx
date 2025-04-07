import React from "react";
import { Layout } from "@/components/layout/Layout";
import { MaterialCard } from "@/components/materials/MaterialCard";
import { Button } from "@/components/ui/button";
import { Material } from "@shared/schema";
import { useLocation } from "wouter";

export default function MaterialsCardSample() {
  const [, setLocation] = useLocation();
  
  // Sample materials of different types
  // Make sure the structure matches schema.ts
  const sampleMaterials: Material[] = [
    {
      id: 1,
      name: "2X4X16 KD SYP #2",
      type: "Lumber",
      quantity: 44,
      projectId: 1,
      supplier: "Home Depot",
      status: "ordered",
      unit: "pieces",
      cost: 25.99,
      category: "Lumber",
      tier: "Structural",
      tier2Category: "Framing",
      section: "Lumber",
      subsection: "Wall Studs",
      supplierId: null,
      isQuote: false,
      taskIds: null,
      contactIds: null,
      deliveryDate: null,
      orderDate: null
    },
    {
      id: 2,
      name: "PEX Pipe 3/4\"",
      type: "Plumbing",
      quantity: 200,
      projectId: 1,
      supplier: "Ferguson",
      status: "ordered",
      unit: "feet",
      cost: 0.89,
      category: "Plumbing",
      tier: "Systems",
      tier2Category: "Plumbing",
      section: "Plumbing",
      subsection: "Water Supply",
      supplierId: null,
      isQuote: false,
      taskIds: null,
      contactIds: null,
      deliveryDate: null,
      orderDate: null
    },
    {
      id: 3,
      name: "R-19 Fiberglass Insulation",
      type: "Insulation",
      quantity: 30,
      projectId: 1,
      supplier: "Lowe's",
      status: "ordered",
      unit: "batts",
      cost: 45.99,
      category: "Insulation",
      tier: "Sheathing",
      tier2Category: "Insulation",
      section: "Walls",
      subsection: "Exterior Wall Insulation",
      supplierId: null,
      isQuote: false,
      taskIds: null,
      contactIds: null,
      deliveryDate: null,
      orderDate: null
    },
    {
      id: 4,
      name: "Interior Door - 36\"",
      type: "Doors",
      quantity: 8,
      projectId: 1,
      supplier: "Home Depot",
      status: "ordered",
      unit: "units",
      cost: 129.99,
      category: "Doors",
      tier: "Finishings",
      tier2Category: "Doors",
      section: "Interior",
      subsection: "Bedroom Doors",
      supplierId: null,
      isQuote: false,
      taskIds: null,
      contactIds: null,
      deliveryDate: null,
      orderDate: null
    }
  ];

  // Sample edit and delete handlers
  const handleEdit = (material: Material) => {
    console.log("Edit material:", material);
    alert(`Editing ${material.name}`);
  };
  
  const handleDelete = (materialId: number) => {
    console.log("Delete material ID:", materialId);
    alert(`Deleting material ID: ${materialId}`);
  };

  return (
    <Layout title="Material Card Samples">
      <div className="p-4 space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Material Card Samples</h1>
          <div className="flex space-x-2">
            <Button onClick={() => setLocation("/test-material-card")}>
              View Card Test
            </Button>
            <Button onClick={() => setLocation("/materials")}>
              Back to Materials
            </Button>
          </div>
        </div>
        
        <p className="text-muted-foreground">
          This page demonstrates the new MaterialCard component with proper icons and simplified details display.
          The cards now show a single "[Sub-Type] — [Sub-Section]" format for details instead of separate Type and Section fields.
        </p>
        
        <h2 className="text-xl font-bold mt-6">Material Cards by Category</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {sampleMaterials.map(material => (
            <MaterialCard 
              key={material.id}
              material={material} 
              onEdit={handleEdit} 
              onDelete={handleDelete}
            />
          ))}
        </div>
      </div>
    </Layout>
  );
}