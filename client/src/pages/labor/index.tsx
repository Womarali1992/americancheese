import React, { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { LaborCard } from "@/components/labor/LaborCard";
import { Button } from "@/components/ui/button";
import { Labor } from "@shared/schema";
import { Plus, Filter, FileText, User, BuildingIcon, Hammer, Construction, Briefcase, Grid3X3, List } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { CreateLaborDialog } from "./CreateLaborDialog";
import { EditLaborDialog } from "./EditLaborDialog";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function LaborPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedLabor, setSelectedLabor] = useState<Labor | null>(null);
  const [editingLaborId, setEditingLaborId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"cards" | "grouped">("cards");
  
  // Read project ID from URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const projectParam = urlParams.get('project');
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(
    projectParam ? parseInt(projectParam) : null
  );
  
  // Query for labor data
  const { data: laborRecords = [], isLoading: isLoadingLabor } = useQuery<Labor[]>({
    queryKey: ["/api/labor"],
  });
  
  // Query for projects to populate the filter dropdown
  const { data: projects = [] } = useQuery<any[]>({
    queryKey: ["/api/projects"],
  });
  
  // Group labor entries by project
  const laborByProject = laborRecords.reduce((acc: Record<number, Labor[]>, labor) => {
    if (!acc[labor.projectId]) {
      acc[labor.projectId] = [];
    }
    acc[labor.projectId].push(labor);
    return acc;
  }, {});

  // Filter labor records based on search term, status, and category
  const filteredLabor = laborRecords.filter((labor) => {
    const matchesSearch = searchTerm 
      ? labor.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        labor.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (labor.taskDescription && labor.taskDescription.toLowerCase().includes(searchTerm.toLowerCase()))
      : true;
    
    const matchesStatus = statusFilter === "all" ? true : labor.status === statusFilter;
    
    const matchesCategory = categoryFilter === "all" 
      ? true 
      : labor.tier1Category.toLowerCase() === categoryFilter.toLowerCase();
    
    const matchesProject = selectedProjectId === null ? true : labor.projectId === selectedProjectId;
    
    return matchesSearch && matchesStatus && matchesCategory && matchesProject;
  });

  // Delete mutation
  const deleteLaborMutation = useMutation({
    mutationFn: async (laborId: number) => {
      return apiRequest(`/api/labor/${laborId}`, 'DELETE');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/labor'] });
      toast({
        title: "Success",
        description: "Labor record deleted successfully",
      });
    },
    onError: (error) => {
      console.error("Error deleting labor record:", error);
      toast({
        title: "Error",
        description: "Could not delete labor record. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Handle edit click
  const handleEditLabor = (labor: Labor | any) => {
    setEditingLaborId(labor.id);
  };

  // Handle delete click
  const handleDeleteLabor = (laborId: number) => {
    deleteLaborMutation.mutate(laborId);
  };

  // Group labor by tier1 and tier2 categories for selected project
  const groupedLabor = selectedProjectId ? 
    filteredLabor.reduce((acc: Record<string, Record<string, Labor[]>>, labor) => {
      const tier1 = labor.tier1Category || 'Other';
      const tier2 = labor.tier2Category || 'General';
      
      if (!acc[tier1]) {
        acc[tier1] = {};
      }
      if (!acc[tier1][tier2]) {
        acc[tier1][tier2] = [];
      }
      acc[tier1][tier2].push(labor);
      return acc;
    }, {}) : {};

  // Calculate total costs for tier1 and tier2 categories
  const calculateTier1Cost = (tier1: string) => {
    if (!selectedProjectId) return 0;
    
    return filteredLabor
      .filter(labor => (labor.tier1Category || '').toLowerCase() === tier1.toLowerCase())
      .reduce((total, labor) => total + (labor.laborCost || 0), 0);
  };

  const calculateTier2Cost = (tier1: string, tier2: string) => {
    if (!selectedProjectId) return 0;
    
    return filteredLabor
      .filter(labor => 
        (labor.tier1Category || '').toLowerCase() === tier1.toLowerCase() &&
        (labor.tier2Category || '').toLowerCase() === tier2.toLowerCase()
      )
      .reduce((total, labor) => total + (labor.laborCost || 0), 0);
  };

  // Format category names
  const formatCategoryName = (category: string) => {
    return category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
  };

  // Get style object for tier1 categories using theme colors
  const getTier1Style = (tier1: string) => {
    const lowerTier1 = tier1.toLowerCase();
    
    // Map tier1 categories to their CSS variables
    const tier1VarMap: Record<string, string> = {
      structural: '--tier1-structural',
      systems: '--tier1-systems',
      sheathing: '--tier1-sheathing',
      finishings: '--tier1-finishings',
    };

    const cssVar = tier1VarMap[lowerTier1];
    
    if (cssVar) {
      return {
        backgroundColor: `var(${cssVar})`,
        borderColor: `var(${cssVar})`,
        opacity: 0.9,
      };
    }
    
    // Default fallback
    return {
      backgroundColor: '#64748b',
      borderColor: '#64748b',
      opacity: 0.9,
    };
  };

  // Get style object for tier2 categories using theme colors
  const getTier2Style = (tier2: string) => {
    const lowerTier2 = tier2.toLowerCase();
    
    // Map tier2 categories to their CSS variables
    const tier2VarMap: Record<string, string> = {
      foundation: '--tier2-foundation',
      framing: '--tier2-framing',
      roofing: '--tier2-roofing',
      lumber: '--tier2-lumber',
      shingles: '--tier2-shingles',
      electrical: '--tier2-electrical',
      plumbing: '--tier2-plumbing',
      hvac: '--tier2-hvac',
      barriers: '--tier2-barriers',
      drywall: '--tier2-drywall',
      exteriors: '--tier2-exteriors',
      siding: '--tier2-siding',
      insulation: '--tier2-insulation',
      windows: '--tier2-windows',
      doors: '--tier2-doors',
      cabinets: '--tier2-cabinets',
      fixtures: '--tier2-fixtures',
      flooring: '--tier2-flooring',
      paint: '--tier2-paint',
    };

    const cssVar = tier2VarMap[lowerTier2];
    
    if (cssVar) {
      return {
        backgroundColor: `var(${cssVar})`,
        borderColor: `var(${cssVar})`,
        opacity: 0.8,
      };
    }
    
    // Default fallback
    return {
      backgroundColor: '#64748b',
      borderColor: '#64748b',
      opacity: 0.8,
    };
  };

  // Extract unique statuses and categories for filters
  const uniqueStatuses = new Set<string>();
  laborRecords.forEach(labor => uniqueStatuses.add(labor.status));
  const statuses = ["all", ...Array.from(uniqueStatuses)];
  
  const uniqueCategories = new Set<string>();
  laborRecords.forEach(labor => uniqueCategories.add(labor.tier1Category.toLowerCase()));
  const categories = ["all", ...Array.from(uniqueCategories)];

  return (
    <Layout title="Labor">
      <div className="p-4 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold mb-1">Labor Management</h1>
            <p className="text-muted-foreground">Track and manage worker hours, tasks, and productivity</p>
          </div>
          <div className="flex items-center gap-3">
            <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as "cards" | "grouped")}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="cards" className="flex items-center gap-1">
                  <Grid3X3 className="h-4 w-4" />
                  Cards
                </TabsTrigger>
                <TabsTrigger value="grouped" className="flex items-center gap-1">
                  <List className="h-4 w-4" />
                  Categories
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <Button onClick={() => setCreateDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="mr-1 h-4 w-4" /> Add Labor
            </Button>
          </div>
        </div>

        {/* Filters section */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <label htmlFor="searchTerm" className="text-sm font-medium mb-1 block">Search</label>
                <div className="relative">
                  <Input
                    id="searchTerm"
                    placeholder="Search by name, company, or description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                  <Filter className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                </div>
              </div>
              
              <div className="w-full md:w-48">
                <label htmlFor="statusFilter" className="text-sm font-medium mb-1 block">Status</label>
                <Select
                  value={statusFilter}
                  onValueChange={setStatusFilter}
                >
                  <SelectTrigger id="statusFilter">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statuses.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status === "all" ? "All Statuses" : status.replace("_", " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="w-full md:w-48">
                <label htmlFor="categoryFilter" className="text-sm font-medium mb-1 block">Category</label>
                <Select
                  value={categoryFilter}
                  onValueChange={setCategoryFilter}
                >
                  <SelectTrigger id="categoryFilter">
                    <SelectValue placeholder="Filter by category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category === "all" ? "All Categories" : 
                          category.charAt(0).toUpperCase() + category.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="w-full md:w-48">
                <label htmlFor="projectFilter" className="text-sm font-medium mb-1 block">Project</label>
                <Select
                  value={selectedProjectId?.toString() || "all"}
                  onValueChange={(value) => setSelectedProjectId(value === "all" ? null : parseInt(value))}
                >
                  <SelectTrigger id="projectFilter">
                    <SelectValue placeholder="Filter by project" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Projects</SelectItem>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id.toString()}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Labor display section */}
        {isLoadingLabor ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700 mx-auto"></div>
            <p className="mt-4 text-lg text-muted-foreground">Loading labor records...</p>
          </div>
        ) : filteredLabor.length === 0 ? (
          <div className="text-center py-8 border rounded-lg bg-gray-50">
            <Hammer className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <h3 className="text-lg font-medium mb-1">No labor records found</h3>
            <p className="text-gray-500 mb-4">
              {searchTerm || statusFilter !== "all" || categoryFilter !== "all" || selectedProjectId
                ? "Try adjusting your filters or search term"
                : "Get started by adding your first labor record"}
            </p>
            <Button onClick={() => setCreateDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="mr-1 h-4 w-4" /> Add Labor Record
            </Button>
          </div>
        ) : viewMode === "cards" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
            {filteredLabor.map((labor) => (
              <LaborCard
                key={labor.id}
                labor={labor}
                onEdit={handleEditLabor}
                onDelete={handleDeleteLabor}
              />
            ))}
          </div>
        ) : (
          /* Grouped Categories View */
          selectedProjectId && Object.keys(groupedLabor).length > 0 ? (
            <div className="space-y-6">
              {Object.entries(groupedLabor).map(([tier1, tier2Groups]) => (
                <div key={tier1} className="space-y-4">
                  {/* Tier 1 Header */}
                  <div 
                    className="p-4 rounded-lg"
                    style={getTier1Style(tier1)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="bg-white bg-opacity-90 px-3 py-1 rounded-lg">
                        <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-800">
                          <Construction className="h-5 w-5" />
                          {formatCategoryName(tier1)}
                        </h3>
                      </div>
                      <div className="text-right bg-white bg-opacity-90 px-3 py-1 rounded-lg">
                        <div className="text-sm text-gray-600">Total Cost</div>
                        <div className="text-xl font-bold text-gray-800">
                          ${calculateTier1Cost(tier1).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Tier 2 Sections */}
                  {Object.entries(tier2Groups).map(([tier2, laborItems]) => (
                    <div key={tier2} className="ml-6 space-y-3">
                      {/* Tier 2 Header */}
                      <div 
                        className="p-3 rounded-md"
                        style={getTier2Style(tier2)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="bg-white bg-opacity-90 px-2 py-1 rounded-md">
                            <h4 className="font-medium flex items-center gap-2 text-gray-800">
                              <Briefcase className="h-4 w-4" />
                              {formatCategoryName(tier2)}
                              <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                                {(laborItems as Labor[]).length} {(laborItems as Labor[]).length === 1 ? 'record' : 'records'}
                              </span>
                            </h4>
                          </div>
                          <div className="text-right bg-white bg-opacity-90 px-2 py-1 rounded-md">
                            <div className="text-xs text-gray-600">Cost</div>
                            <div className="text-lg font-semibold text-gray-800">
                              ${calculateTier2Cost(tier1, tier2).toFixed(2)}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Labor Items in this Tier 2 Category */}
                      <div className="ml-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {(laborItems as Labor[]).map((labor) => (
                          <LaborCard
                            key={labor.id}
                            labor={labor}
                            onEdit={handleEditLabor}
                            onDelete={handleDeleteLabor}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 border rounded-lg bg-gray-50">
              <List className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <h3 className="text-lg font-medium mb-1">Select a project to view categorized labor</h3>
              <p className="text-gray-500 mb-4">
                Choose a project from the filter above to see labor records organized by categories
              </p>
            </div>
          )
        )}
        
        {/* Create Labor Dialog */}
        <CreateLaborDialog
          open={createDialogOpen}
          onOpenChange={(open) => {
            setCreateDialogOpen(open);
            if (!open) setSelectedLabor(null);
          }}
          projectId={selectedLabor?.projectId}
          preselectedTaskId={selectedLabor?.taskId || undefined}
          preselectedContactId={selectedLabor?.contactId || undefined}
        />
        
        {/* Edit Labor Dialog */}
        {editingLaborId && (
          <EditLaborDialog
            open={true}
            onOpenChange={(open) => {
              if (!open) setEditingLaborId(null);
            }}
            laborId={editingLaborId}
            onSuccess={() => {
              queryClient.invalidateQueries({ queryKey: ["/api/labor"] });
              toast({
                title: "Success",
                description: "Labor record updated successfully",
              });
            }}
          />
        )}
      </div>
    </Layout>
  );
}