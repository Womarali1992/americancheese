import React, { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { MaterialCard } from "@/components/materials/MaterialCard";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { Material } from "@shared/schema"; // Import the Material type

export default function MaterialCardTestPage() {
  // Sample material with all properties for testing
  const sampleMaterial: Material = {
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
    taskIds: ["1", "2"],
    contactIds: ["1"],
    tier: "Structural",
    tier2Category: "Framing",
    section: "Lumber",
    subsection: "Wall Studs",
    supplierId: 1,
    isQuote: false,
    quoteDate: null,
    orderDate: null
  };

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
    <Layout title="Material Card Test">
      <div className="p-4 space-y-4">
        <h1 className="text-2xl font-bold">Material Card Test</h1>
        <p className="text-muted-foreground">Testing the updated Material Card component with proper icons and formatted details.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {/* Test Card - Structural Tier */}
          <MaterialCard 
            material={{...sampleMaterial, tier: "Structural"}} 
            onEdit={handleEdit} 
            onDelete={handleDelete}
          />
          
          {/* Test Card - Systems Tier */}
          <MaterialCard 
            material={{...sampleMaterial, tier: "Systems", tier2Category: "Plumbing"}} 
            onEdit={handleEdit} 
            onDelete={handleDelete}
          />
          
          {/* Test Card - Sheathing Tier */}
          <MaterialCard 
            material={{...sampleMaterial, tier: "Sheathing", tier2Category: "Drywall"}} 
            onEdit={handleEdit} 
            onDelete={handleDelete}
          />
          
          {/* Test Card - Finishings Tier */}
          <MaterialCard 
            material={{...sampleMaterial, tier: "Finishings", tier2Category: "Doors"}} 
            onEdit={handleEdit} 
            onDelete={handleDelete}
          />
          
          {/* Test Card - Without tier2Category */}
          <MaterialCard 
            material={{...sampleMaterial, tier: "Structural", tier2Category: null}} 
            onEdit={handleEdit} 
            onDelete={handleDelete}
          />
          
          {/* Test Card - Without subsection */}
          <MaterialCard 
            material={{...sampleMaterial, tier: "Structural", subsection: null}} 
            onEdit={handleEdit} 
            onDelete={handleDelete}
          />
        </div>
      </div>
    </Layout>
  );
}