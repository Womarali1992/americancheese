import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Search, 
  Plus, 
  MoreHorizontal,
  Package,
  Settings
} from "lucide-react";

import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CreateMaterialDialog } from "./CreateMaterialDialog";

export default function MaterialsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  // Define interfaces based on schema
  interface Material {
    id: number;
    name: string;
    type: string;
    quantity: number;
    projectId: number;
    supplier?: string;
    status: string;
  }

  interface Project {
    id: number;
    name: string;
    description?: string;
    location?: string;
    startDate: string;
    endDate: string;
    status: string;
    progress?: number;
  }

  const { data: materials, isLoading } = useQuery<Material[]>({
    queryKey: ["/api/materials"],
  });

  const { data: projects } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  // Get project name from project ID
  const getProjectName = (projectId: number) => {
    const project = projects?.find(p => p.id === projectId);
    return project ? project.name : "Unknown Project";
  };

  // Format material type display
  const formatType = (type: string) => {
    return type
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  // Filter materials based on search term
  const filteredMaterials = materials?.filter((material) => {
    if (!searchTerm) return true;
    const searchTermLower = searchTerm.toLowerCase();
    return (
      material.name.toLowerCase().includes(searchTermLower) ||
      formatType(material.type).toLowerCase().includes(searchTermLower) ||
      material.status.toLowerCase().includes(searchTermLower) ||
      (material.supplier && material.supplier.toLowerCase().includes(searchTermLower))
    );
  });

  // Define table columns
  const columns: Array<{
    header: string;
    accessorKey: keyof Material | 'actions';
    cell?: (material: Material) => React.ReactNode;
    className?: string;
  }> = [
    {
      header: "Material",
      accessorKey: "name",
      cell: (material: Material) => (
        <div className="flex items-center gap-2">
          <div className="bg-orange-500 bg-opacity-10 p-2 rounded">
            <Package className="h-4 w-4 text-orange-500" />
          </div>
          <span className="font-medium">{material.name}</span>
        </div>
      ),
    },
    {
      header: "Type",
      accessorKey: "type",
      cell: (material: Material) => formatType(material.type),
    },
    {
      header: "Project",
      accessorKey: "projectId",
      cell: (material: Material) => getProjectName(material.projectId),
    },
    {
      header: "Quantity",
      accessorKey: "quantity",
      cell: (material: Material) => material.quantity,
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: (material: Material) => <StatusBadge status={material.status} />,
    },
    {
      header: "Supplier",
      accessorKey: "supplier",
      cell: (material: Material) => material.supplier || "-",
    },
    {
      header: "",
      accessorKey: "actions" as keyof Material, // Type assertion to fix the issue
      className: "w-10",
      cell: (material: Material) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>View Details</DropdownMenuItem>
            <DropdownMenuItem>Edit</DropdownMenuItem>
            <DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  if (isLoading) {
    return (
      <Layout title="Materials & Inventory">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="w-full max-w-sm relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
              <Input
                placeholder="Search materials..."
                className="pl-8"
                disabled
              />
            </div>
            <Button
              className="bg-orange-500 hover:bg-orange-600 text-white"
              disabled
            >
              <Plus className="mr-2 h-4 w-4" /> Add Material
            </Button>
          </div>

          <Card>
            <CardHeader className="py-4">
              <CardTitle className="text-lg font-medium">Inventory</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {/* Skeleton loading state */}
              <div className="animate-pulse">
                <div className="h-10 bg-slate-100 border-b border-slate-200"></div>
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="h-16 bg-slate-50 border-b border-slate-100"
                  ></div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Materials & Inventory">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="w-full max-w-sm relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
            <Input
              placeholder="Search materials..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button
            className="bg-orange-500 hover:bg-orange-600 text-white"
            onClick={() => setDialogOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" /> Add Material
          </Button>
        </div>

        <Card>
          <CardHeader className="py-4">
            <CardTitle className="text-lg font-medium">Inventory</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <DataTable 
              columns={columns} 
              data={filteredMaterials || []} 
              onRowClick={(row) => console.log("Row clicked:", row)}
            />
          </CardContent>
        </Card>
      </div>

      <CreateMaterialDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </Layout>
  );
}