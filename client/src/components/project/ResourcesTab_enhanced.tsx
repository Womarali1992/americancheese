import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Package, 
  Plus, 
  ShoppingCart, 
  Truck, 
  Warehouse,
  Search,
  Edit,
  X,
  MoreHorizontal,
  Hammer,
  Construction,
  HardHat,
  Zap,
  Droplet,
  Building,
  Landmark,
  LayoutGrid,
  FileCheck,
  Cog,
  PanelTop,
  Sofa,
  Home,
  Fan,
  Mailbox,
  Layers,
  Columns,
  Grid,
  ChevronLeft,
  ChevronRight,
  Paintbrush,
  Upload,
  FileSpreadsheet,
  Trash,
  Link as LinkIcon
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { CreateMaterialDialog } from "@/pages/materials/CreateMaterialDialog";
import { EditMaterialDialog } from "@/pages/materials/EditMaterialDialog";
import { ImportMaterialsDialog } from "@/pages/materials/ImportMaterialsDialog";
import { TaskMaterialsView } from "@/components/materials/TaskMaterialsView";
import { LinkSectionToTaskDialog } from "@/components/materials/LinkSectionToTaskDialog";
import { formatCurrency } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

// Import directly from the types file
import { Material } from "../../types";

// Inventory item interface with usage tracking
interface InventoryItem {
  id: number;
  name: string;
  ordered: number;
  delivered: number;
  used: number;
  unit: string;
}

interface SectionToLink {
  tier1: string;
  tier2: string;
  section: string;
  materials?: Material[];
  materialIds?: number[];
}

interface ResourcesTabProps {
  projectId?: number;
}

export function ResourcesTab({ projectId }: ResourcesTabProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [linkSectionDialogOpen, setLinkSectionDialogOpen] = useState(false);
  const [sectionToLink, setSectionToLink] = useState<SectionToLink | null>(null);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "categories" | "hierarchy" | "tasks">("tasks");
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Handler for linking a section to a task
  const handleLinkSectionToTask = (tier1: string, tier2: string, section: string, materials: Material[]) => {
    if (materials.length === 0) {
      toast({
        title: "No materials to link",
        description: "This section has no materials to link to a task.",
        variant: "destructive",
      });
      return;
    }
    
    setSectionToLink({
      tier1,
      tier2,
      section,
      materials
    });
    setLinkSectionDialogOpen(true);
  };
  
  // Handler for completing the task linking
  const handleCompleteTaskLinking = async (taskId: number) => {
    if (!sectionToLink) return;
    
    try {
      // Ensure materials exists and get IDs
      const materialIds = (sectionToLink.materials && Array.isArray(sectionToLink.materials)) 
                            ? sectionToLink.materials.map(m => m.id) 
                            : (sectionToLink.materialIds || []);
      
      // Update the task with the materials
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          materialIds
        })
      });
      
      if (!response.ok) {
        throw new Error("Failed to link materials to task");
      }
      
      // Show success toast
      toast({
        title: "Materials linked to task",
        description: `Linked ${materialIds.length} materials to the selected task.`,
      });
      
      // Invalidate task queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      if (projectId) {
        queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/tasks`] });
      }
      
      // Refresh materials too
      queryClient.invalidateQueries({ queryKey: ['/api/materials'] });
      if (projectId) {
        queryClient.invalidateQueries({ queryKey: ['/api/projects', projectId, 'materials'] });
      }
    } catch (error) {
      console.error("Error linking materials to task:", error);
      toast({
        title: "Error linking materials",
        description: "There was a problem linking the materials to the task.",
        variant: "destructive",
      });
    }
  };
  
  // Enhanced Hierarchical navigation state (5-tier structure)
  const [selectedTier1, setSelectedTier1] = useState<string | null>(null);
  const [selectedTier2, setSelectedTier2] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<any | null>(null);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [selectedSubsection, setSelectedSubsection] = useState<string | null>(null);
  
  // Also fetch tasks to show relations in tier 2
  const { data: tasks = [] } = useQuery<any[]>({
    queryKey: ["/api/tasks"],
  });

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
  
  // Delete material mutation
  const deleteMaterialMutation = useMutation({
    mutationFn: async (materialId: number) => {
      const response = await fetch(`/api/materials/${materialId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete material');
      }
      
      return materialId;
    },
    onSuccess: (_, materialId) => {
      // Invalidate material queries to refresh the list
      queryClient.invalidateQueries({ queryKey: ['/api/materials'] });
      if (projectId) {
        queryClient.invalidateQueries({ queryKey: ['/api/projects', projectId, 'materials'] });
      }
    }
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
  
  // Define tier1 categories (main construction phases)
  const tier1Categories = ['Structural', 'Systems', 'Sheathing', 'Finishings'];
  
  // Group tasks by tier1Category and tier2Category
  const tasksByTier = tasks.reduce((acc, task) => {
    const tier1 = task.tier1Category || 'Uncategorized';
    const tier2 = task.tier2Category || 'Other';
    
    if (!acc[tier1]) {
      acc[tier1] = {};
    }
    
    if (!acc[tier1][tier2]) {
      acc[tier1][tier2] = [];
    }
    
    acc[tier1][tier2].push(task);
    return acc;
  }, {} as Record<string, Record<string, any[]>>);
  
  // Get unique tier2 categories for each tier1
  const tier2CategoriesByTier1 = Object.entries(tasksByTier).reduce((acc, [tier1, tier2Tasks]) => {
    acc[tier1] = Object.keys(tier2Tasks || {});
    return acc;
  }, {} as Record<string, string[]>);
  
  // Define explicit tier2 categories for each tier1, organized according to the requested hierarchy
  const predefinedTier2CategoriesByTier1: Record<string, string[]> = {
    'Structural': ['Foundation', 'Framing', 'Lumber', 'Roofing', 'Shingles'],
    'Systems': ['Electrical', 'Plumbing', 'HVAC'],
    'Sheathing': ['Insulation', 'Drywall', 'Siding', 'Exteriors'],
    'Finishings': ['Windows', 'Doors', 'Cabinets', 'Fixtures', 'Flooring', 'Paint']
  };

  // Helper function to map a material to a tier1 category based on tier field or type/category
  const getMaterialTier1 = (material: Material): string => {
    // First prioritize the tier field if it exists and matches our tier1 categories
    if (material.tier) {
      const tierUpper = material.tier.charAt(0).toUpperCase() + material.tier.slice(1).toLowerCase();
      
      // Check if it's one of our tier1 categories
      if (tier1Categories.includes(tierUpper)) {
        return tierUpper;
      }
      
      // Handle special cases to map to our tier1 categories
      if (tierUpper === 'Structural' || tierUpper === 'Structure') {
        return 'Structural';
      } else if (tierUpper === 'System' || tierUpper === 'Systems') {
        return 'Systems';
      } else if (tierUpper === 'Sheath' || tierUpper === 'Sheathing') {
        return 'Sheathing';
      } else if (tierUpper === 'Finishing' || tierUpper === 'Finishings' || tierUpper === 'Finish') {
        return 'Finishings';
      }
    }
    
    // If tier field doesn't help, fall back to type and category analysis
    const type = material.type.toLowerCase();
    const category = material.category?.toLowerCase() || '';
    
    // Structural materials
    if (
      type.includes('concrete') || 
      type.includes('foundation') || 
      type.includes('framing') || 
      type.includes('lumber') || 
      type.includes('wood') || 
      type.includes('metal') || 
      type.includes('roof') || 
      type.includes('shingle') ||
      category.includes('concrete') ||
      category.includes('lumber') ||
      category.includes('structural')
    ) {
      return 'Structural';
    }
    
    // Systems materials
    if (
      type.includes('electrical') || 
      type.includes('wiring') || 
      type.includes('plumbing') || 
      type.includes('pipe') || 
      type.includes('hvac')
    ) {
      return 'Systems';
    }
    
    // Sheathing materials
    if (
      type.includes('insulation') || 
      type.includes('drywall') || 
      type.includes('siding') || 
      type.includes('exterior')
    ) {
      return 'Sheathing';
    }
    
    // Finishing materials
    if (
      type.includes('paint') || 
      type.includes('floor') || 
      type.includes('tile') || 
      type.includes('cabinet') || 
      type.includes('fixture') ||
      type.includes('window') ||
      type.includes('door') ||
      type.includes('trim')
    ) {
      return 'Finishings';
    }
    
    return 'Other';
  };
  
  // Map materials to their appropriate tier1 category
  const materialsByTier1 = processedMaterials?.reduce((acc, material) => {
    const tier1 = getMaterialTier1(material);
    
    if (!acc[tier1]) {
      acc[tier1] = [];
    }
    
    acc[tier1].push(material);
    return acc;
  }, {} as Record<string, Material[]>) || {};

  // Group materials by section within tier2
  const materialsByTier2Section = processedMaterials?.reduce((acc, material) => {
    // Skip if no tier2Category or missing required fields
    if (!material.tier2Category) return acc;
    
    const tier1 = getMaterialTier1(material);
    const tier2 = material.tier2Category;
    const section = material.section || 'Uncategorized';
    
    if (!acc[tier1]) {
      acc[tier1] = {};
    }
    
    if (!acc[tier1][tier2]) {
      acc[tier1][tier2] = {};
    }
    
    if (!acc[tier1][tier2][section]) {
      acc[tier1][tier2][section] = [];
    }
    
    acc[tier1][tier2][section].push(material);
    return acc;
  }, {} as Record<string, Record<string, Record<string, Material[]>>>) || {};

  // Group materials by subsection within section
  const materialsBySubsection = processedMaterials?.reduce((acc, material) => {
    // Skip if no tier2Category or section
    if (!material.tier2Category || !material.section) return acc;
    
    const tier1 = getMaterialTier1(material);
    const tier2 = material.tier2Category;
    const section = material.section;
    const subsection = material.subsection || 'General';
    
    if (!acc[tier1]) {
      acc[tier1] = {};
    }
    
    if (!acc[tier1][tier2]) {
      acc[tier1][tier2] = {};
    }
    
    if (!acc[tier1][tier2][section]) {
      acc[tier1][tier2][section] = {};
    }
    
    if (!acc[tier1][tier2][section][subsection]) {
      acc[tier1][tier2][section][subsection] = [];
    }
    
    acc[tier1][tier2][section][subsection].push(material);
    return acc;
  }, {} as Record<string, Record<string, Record<string, Record<string, Material[]>>>>) || {};

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
        return 'Lumber and wooden construction items';
      case 'electrical':
        return 'Electrical components and wiring';
      case 'plumbing':
        return 'Pipes, fixtures, and plumbing supplies';
      case 'tools':
      case 'equipment':
        return 'Construction tools and equipment';
      case 'metal':
      case 'structural':
        return 'Metal framing and structural elements';
      case 'glass':
      case 'interior':
        return 'Glass, windows, and interior finishes';
      case 'finishing':
        return 'Paint, trim, and finishing materials';
      case 'insulation':
        return 'Thermal and acoustic insulation';
      case 'roofing':
        return 'Roofing materials and supplies';
      default:
        return 'Miscellaneous construction materials';
    }
  };
  
  // Get tier1 icon for nav
  const getTier1Icon = (tier: string, className: string = "h-6 w-6") => {
    switch (tier) {
      case 'Structural':
        return <Building className={`${className} text-sky-600`} />;
      case 'Systems':
        return <Cog className={`${className} text-indigo-600`} />;
      case 'Sheathing':
        return <PanelTop className={`${className} text-amber-600`} />;
      case 'Finishings':
        return <Sofa className={`${className} text-rose-600`} />;
      default:
        return <Package className={`${className} text-slate-600`} />;
    }
  };
  
  // Get tier1 background
  const getTier1Background = (tier: string) => {
    switch (tier) {
      case 'Structural':
        return 'bg-sky-100 text-sky-900 hover:bg-sky-200';
      case 'Systems':
        return 'bg-indigo-100 text-indigo-900 hover:bg-indigo-200';
      case 'Sheathing':
        return 'bg-amber-100 text-amber-900 hover:bg-amber-200';
      case 'Finishings':
        return 'bg-rose-100 text-rose-900 hover:bg-rose-200';
      default:
        return 'bg-slate-100 text-slate-900 hover:bg-slate-200';
    }
  };
  
  // Get tier2 icon based on category
  const getTier2Icon = (tier2: string, className: string = "h-5 w-5") => {
    switch (tier2.toLowerCase()) {
      case 'foundation':
        return <Landmark className={`${className} text-stone-700`} />;
      case 'framing':
        return <Building className={`${className} text-sky-600`} />;
      case 'lumber':
        return <Construction className={`${className} text-amber-700`} />;
      case 'roofing':
      case 'shingles':
        return <Home className={`${className} text-slate-700`} />;
      case 'electrical':
        return <Zap className={`${className} text-yellow-600`} />;
      case 'plumbing':
        return <Droplet className={`${className} text-blue-600`} />;
      case 'hvac':
        return <Fan className={`${className} text-emerald-600`} />;
      case 'insulation':
        return <HardHat className={`${className} text-green-600`} />;
      case 'drywall':
        return <PanelTop className={`${className} text-amber-600`} />;
      case 'siding':
      case 'exteriors':
        return <Layers className={`${className} text-teal-600`} />;
      case 'windows':
        return <Grid className={`${className} text-blue-500`} />;
      case 'doors':
        return <Mailbox className={`${className} text-amber-600`} />;
      case 'cabinets':
      case 'fixtures':
        return <Columns className={`${className} text-slate-600`} />;
      case 'flooring':
        return <Grid className={`${className} text-lime-600`} />;
      case 'paint':
        return <Paintbrush className={`${className} text-indigo-600`} />;
      default:
        return <Package className={`${className} text-slate-600`} />;
    }
  };
  
  // Get tier2 background color
  const getTier2Background = (tier2: string) => {
    switch (tier2.toLowerCase()) {
      case 'foundation':
        return 'bg-stone-100';
      case 'framing':
        return 'bg-sky-100';
      case 'lumber':
        return 'bg-amber-100';
      case 'roofing':
      case 'shingles': 
        return 'bg-slate-100';
      case 'electrical':
        return 'bg-yellow-100';
      case 'plumbing':
        return 'bg-blue-100';
      case 'hvac':
        return 'bg-emerald-100';
      case 'insulation':
        return 'bg-green-100';
      case 'drywall':
        return 'bg-amber-100';
      case 'siding':
      case 'exteriors':
        return 'bg-teal-100';
      case 'windows':
        return 'bg-blue-100';
      case 'doors':
        return 'bg-amber-100';
      case 'cabinets':
      case 'fixtures':
        return 'bg-slate-100';
      case 'flooring':
        return 'bg-lime-100';
      case 'paint':
        return 'bg-indigo-100';
      default:
        return 'bg-slate-100';
    }
  };
  
  // Handle clicking the "Back" button in task view
  const handleBackFromTask = () => {
    if (selectedSubsection) {
      setSelectedSubsection(null);
    } else if (selectedSection) {
      setSelectedSection(null);
    } else if (selectedTask) {
      setSelectedTask(null);
    } else if (selectedTier2) {
      setSelectedTier2(null);
    } else if (selectedTier1) {
      setSelectedTier1(null);
    }
  };

  // Get all sections in a tier2 category (unique section names)
  const getSectionsForTier2 = (tier1: string, tier2: string): string[] => {
    // First check if we have materials with this tier2 category
    const materialsInTier = processedMaterials?.filter(m => 
      getMaterialTier1(m) === tier1 && 
      m.tier2Category?.toLowerCase() === tier2.toLowerCase()
    ) || [];
    
    // Collect unique section names
    const sections = new Set<string>();
    materialsInTier.forEach(material => {
      if (material.section) {
        sections.add(material.section);
      }
    });
    
    return Array.from(sections).sort();
  };
  
  // Get all subsections in a section (unique subsection names)
  const getSubsectionsForSection = (tier1: string, tier2: string, section: string): string[] => {
    // Find materials in this section
    const materialsInSection = processedMaterials?.filter(m => 
      getMaterialTier1(m) === tier1 && 
      m.tier2Category?.toLowerCase() === tier2.toLowerCase() &&
      m.section === section
    ) || [];
    
    // Collect unique subsection names
    const subsections = new Set<string>();
    materialsInSection.forEach(material => {
      if (material.subsection) {
        subsections.add(material.subsection);
      } else {
        subsections.add('General'); // Default subsection
      }
    });
    
    return Array.from(subsections).sort();
  };
  
  // Get materials for a specific subsection
  const getMaterialsForSubsection = (tier1: string, tier2: string, section: string, subsection: string): Material[] => {
    return processedMaterials?.filter(m => 
      getMaterialTier1(m) === tier1 && 
      m.tier2Category?.toLowerCase() === tier2.toLowerCase() &&
      m.section === section &&
      (m.subsection === subsection || (!m.subsection && subsection === 'General'))
    ) || [];
  };

  // Get materials for a specific task
  const getMaterialsForTask = (task: any): Material[] => {
    if (!task || !task.materialIds) return [];
    
    const taskMaterialIds = Array.isArray(task.materialIds) ? task.materialIds : [];
    return processedMaterials?.filter(m => 
      taskMaterialIds.includes(m.id.toString()) || taskMaterialIds.includes(m.id)
    ) || [];
  };
  
  // Get tasks for a specific tier2 category
  const getTasksForTier2 = (tier1: string, tier2: string): any[] => {
    return tasksByTier[tier1]?.[tier2] || [];
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-0">
          <div className="flex items-center justify-between">
            <CardTitle>Project Resources</CardTitle>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setImportDialogOpen(true)}
                className="flex items-center gap-1"
              >
                <Upload className="h-4 w-4" />
                Import
              </Button>
              <Button 
                variant="default" 
                size="sm" 
                onClick={() => setCreateDialogOpen(true)}
                className="flex items-center gap-1"
              >
                <Plus className="h-4 w-4" />
                Add Material
              </Button>
            </div>
          </div>
          <CardDescription>Manage all construction materials and inventory for this project</CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="materials">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="materials">Materials</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
        </TabsList>
        
        <TabsContent value="materials" className="space-y-4 mt-4">
          {/* View Mode Tabs */}
          <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as "list" | "tasks" | "hierarchy")}>
            <TabsList className="grid w-full grid-cols-3 bg-slate-100">
              <TabsTrigger value="hierarchy" className="data-[state=active]:bg-white">Hierarchy</TabsTrigger>
              <TabsTrigger value="tasks" className="data-[state=active]:bg-white">Task View</TabsTrigger>
              <TabsTrigger value="list" className="data-[state=active]:bg-white">List View</TabsTrigger>
            </TabsList>
            
            <TabsContent value="hierarchy" className="space-y-4 mt-4">
              {/* 5-Tier Hierarchical View */}
              {!selectedTier1 ? (
                // Tier 1 Categories (Main Construction Phases)
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {tier1Categories.map((tier1) => {
                    const materialsInTier1 = materialsByTier1[tier1] || [];
                    const totalValue = materialsInTier1.reduce((sum, m) => sum + (m.cost || 0) * m.quantity, 0);
                    const totalMaterials = materialsInTier1.length;
                    
                    return (
                      <Card 
                        key={tier1} 
                        className="overflow-hidden border border-slate-200 shadow-sm hover:shadow transition-all cursor-pointer"
                        onClick={() => setSelectedTier1(tier1)}
                      >
                        <div className={`p-6 ${getCategoryIconBackground(tier1)} flex justify-center items-center`}>
                          <div className="p-3 rounded-full bg-white bg-opacity-80 shadow-sm">
                            {getTier1Icon(tier1, "h-10 w-10")}
                          </div>
                        </div>
                        <CardContent className="p-5">
                          <h3 className="text-lg font-semibold mb-1">{tier1}</h3>
                          <p className="text-sm text-slate-600 mb-4">
                            {tier1 === 'Structural' && 'Foundation, framing, roofing materials'}
                            {tier1 === 'Systems' && 'Electrical, plumbing, HVAC materials'}
                            {tier1 === 'Sheathing' && 'Insulation, drywall, siding materials'}
                            {tier1 === 'Finishings' && 'Windows, doors, fixtures, flooring'}
                            {tier1 === 'Other' && 'Miscellaneous project materials'}
                          </p>
                          <div className="flex justify-between items-center">
                            <div className="text-sm font-medium">
                              {totalMaterials} materials
                            </div>
                            <div className="text-sm font-medium text-green-600">
                              {formatCurrency(totalValue)}
                            </div>
                          </div>
                          <Progress 
                            value={totalMaterials > 0 ? 100 : 0} 
                            className="h-1 mt-2" 
                          />
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : !selectedTier2 ? (
                // Tier 2 Categories (Specific Construction Categories)
                <>
                  <div className="flex items-center gap-2 mb-4">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setSelectedTier1(null)}
                      className="flex items-center gap-1 text-slate-500 hover:text-slate-700 hover:bg-slate-100"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Back to Main Categories
                    </Button>
                    <div className={`px-2 py-1 ${getTier1Background(selectedTier1)} rounded-full text-sm font-medium flex items-center gap-1`}>
                      {getTier1Icon(selectedTier1, "h-4 w-4")}
                      {selectedTier1}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Use the explicit predefined tier2 categories for consistent display */}
                    {(predefinedTier2CategoriesByTier1[selectedTier1] || []).map(tier2 => {
                      // Count materials that fall into this category (either by tier2Category or derived)
                      const materialsInTier2 = processedMaterials?.filter(m => 
                        getMaterialTier1(m) === selectedTier1 && 
                        (m.tier2Category?.toLowerCase() === tier2.toLowerCase() || 
                         (!m.tier2Category && tierMatchesType(tier2, m.type))
                        )
                      ) || [];
                      
                      // Calculate total cost for these materials
                      const totalValue = materialsInTier2.reduce((sum, m) => sum + (m.cost || 0) * m.quantity, 0);
                      
                      // Get tasks in this category
                      const tasksInCategory = tasksByTier[selectedTier1]?.[tier2] || [];
                      
                      // Count how many materials are related to tasks in this category
                      const materialsForTaskIds = new Set();
                      tasksInCategory.forEach((task: any) => {
                        if (task.materialIds) {
                          task.materialIds.forEach((id: any) => materialsForTaskIds.add(id));
                        }
                      });
                      
                      return (
                        <Card 
                          key={tier2}
                          className="rounded-lg border bg-card text-card-foreground shadow-sm h-full transition-all hover:shadow-md cursor-pointer"
                          onClick={() => setSelectedTier2(tier2)}
                        >
                          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-base font-medium">{tier2}</CardTitle>
                            <div className={`rounded-full p-1.5 ${getTier2Background(tier2)}`}>
                              {getTier2Icon(tier2)}
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="grid gap-1">
                              <div className="text-xs text-muted-foreground">
                                {materialsInTier2.length} materials · {tasksInCategory.length} tasks · {formatCurrency(totalValue)}
                              </div>
                              <Progress 
                                value={materialsInTier2.length > 0 ? 100 : 0} 
                                className="h-1" 
                              />
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </>
              ) : !selectedTask ? (
                // Tier 3 - Tasks in the selected tier2 category
                <>
                  <div className="flex items-center gap-2 mb-4">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setSelectedTier2(null)}
                      className="flex items-center gap-1 text-slate-500 hover:text-slate-700 hover:bg-slate-100"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Back to {selectedTier1} Categories
                    </Button>
                    <div 
                      className={`px-2 py-1 ${getTier1Background(selectedTier1)} rounded-full text-sm font-medium flex items-center gap-1 hover:brightness-95`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTier2(null);
                      }}
                    >
                      {getTier1Icon(selectedTier1, "h-4 w-4")}
                      {selectedTier1}
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                    <div 
                      className={`px-2 py-1 ${getTier2Background(selectedTier2)} rounded-full text-sm font-medium flex items-center gap-1 hover:brightness-95`}
                    >
                      {getTier2Icon(selectedTier2, "h-4 w-4")}
                      {selectedTier2}
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    {/* Find tasks in this tier2 category */}
                    {getTasksForTier2(selectedTier1, selectedTier2).length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {getTasksForTier2(selectedTier1, selectedTier2).map((task: any) => {
                          // Count materials for this task
                          const taskMaterials = getMaterialsForTask(task);
                          const taskMaterialsTotal = taskMaterials.reduce(
                            (sum, m) => sum + (m.cost || 0) * m.quantity, 0
                          );
                          
                          return (
                            <Card 
                              key={task.id}
                              className="rounded-lg border bg-card text-card-foreground shadow-sm h-full transition-all hover:shadow-md cursor-pointer"
                              onClick={() => setSelectedTask(task)}
                            >
                              <CardHeader className="pb-2">
                                <CardTitle className="text-base font-medium">{task.title}</CardTitle>
                                <CardDescription className="text-xs line-clamp-2">{task.description}</CardDescription>
                              </CardHeader>
                              <CardContent>
                                <div className="grid gap-1">
                                  <div className="text-xs text-muted-foreground">
                                    {taskMaterials.length} materials · {formatCurrency(taskMaterialsTotal)}
                                  </div>
                                  <Progress 
                                    value={task.progress || 0} 
                                    className="h-1" 
                                  />
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <FileCheck className="mx-auto h-8 w-8 text-slate-300" />
                        <p className="mt-2 text-slate-500">No tasks found in this category</p>
                        <p className="text-sm text-slate-400">Add tasks to this category to organize materials</p>
                      </div>
                    )}
                  </div>
                </>
              ) : !selectedSection ? (
                // Tier 4 - Materials for selected task and sections
                <>
                  <div className="flex flex-wrap items-center gap-2 mb-4">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={handleBackFromTask}
                      className="flex items-center gap-1 text-slate-500 hover:text-slate-700 hover:bg-slate-100"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Back to Tasks
                    </Button>
                    <div 
                      className={`px-2 py-1 ${getTier1Background(selectedTier1)} rounded-full text-sm font-medium flex items-center gap-1 hover:brightness-95 cursor-pointer`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTier2(null);
                        setSelectedTask(null);
                      }}
                    >
                      {getTier1Icon(selectedTier1, "h-4 w-4")}
                      {selectedTier1}
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                    <div 
                      className={`px-2 py-1 ${getTier2Background(selectedTier2)} rounded-full text-sm font-medium flex items-center gap-1 hover:brightness-95 cursor-pointer`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTask(null);
                      }}
                    >
                      {getTier2Icon(selectedTier2, "h-4 w-4")}
                      {selectedTier2}
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                    <div className="px-2 py-1 bg-slate-100 rounded-full text-sm font-medium flex items-center gap-1">
                      <FileCheck className="h-4 w-4 text-slate-600" />
                      {selectedTask.title}
                    </div>
                  </div>
                  
                  {/* Task materials view */}
                  <div className="mb-6">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg font-medium">{selectedTask.title}</CardTitle>
                        <CardDescription>{selectedTask.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-slate-500">Status:</span> {selectedTask.status || 'Not Started'}
                          </div>
                          <div>
                            <span className="text-slate-500">Due:</span> {selectedTask.dueDate ? new Date(selectedTask.dueDate).toLocaleDateString() : 'Not set'}
                          </div>
                          <div>
                            <span className="text-slate-500">Progress:</span> {selectedTask.progress || 0}%
                          </div>
                          <div>
                            <span className="text-slate-500">Materials:</span> {getMaterialsForTask(selectedTask).length}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  {/* Sections list */}
                  <h3 className="text-lg font-medium mb-4">Sections</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {getSectionsForTier2(selectedTier1, selectedTier2).map(section => {
                      // Count materials in this section
                      const materialsInSection = processedMaterials?.filter(m => 
                        getMaterialTier1(m) === selectedTier1 && 
                        m.tier2Category?.toLowerCase() === selectedTier2.toLowerCase() &&
                        m.section === section
                      ) || [];
                      
                      // Calculate total cost for these materials
                      const totalValue = materialsInSection.reduce((sum, m) => sum + (m.cost || 0) * m.quantity, 0);
                      
                      return (
                        <Card 
                          key={section}
                          className="rounded-lg border bg-card text-card-foreground shadow-sm h-full transition-all hover:shadow-md cursor-pointer"
                          onClick={() => setSelectedSection(section)}
                        >
                          <CardHeader className="pb-2">
                            <CardTitle className="text-base font-medium">{section}</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="grid gap-1">
                              <div className="text-xs text-muted-foreground">
                                {materialsInSection.length} materials · {formatCurrency(totalValue)}
                              </div>
                              <Progress 
                                value={materialsInSection.length > 0 ? 100 : 0} 
                                className="h-1" 
                              />
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </>
              ) : !selectedSubsection ? (
                // Tier 5 - Subsections within the selected section
                <>
                  <div className="flex flex-wrap items-center gap-2 mb-4">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={handleBackFromTask}
                      className="flex items-center gap-1 text-slate-500 hover:text-slate-700 hover:bg-slate-100"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Back to Sections
                    </Button>
                    <div 
                      className={`px-2 py-1 ${getTier1Background(selectedTier1)} rounded-full text-sm font-medium flex items-center gap-1 hover:brightness-95 cursor-pointer`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTier2(null);
                        setSelectedTask(null);
                        setSelectedSection(null);
                      }}
                    >
                      {getTier1Icon(selectedTier1, "h-4 w-4")}
                      {selectedTier1}
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                    <div 
                      className={`px-2 py-1 ${getTier2Background(selectedTier2)} rounded-full text-sm font-medium flex items-center gap-1 hover:brightness-95 cursor-pointer`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTask(null);
                        setSelectedSection(null);
                      }}
                    >
                      {getTier2Icon(selectedTier2, "h-4 w-4")}
                      {selectedTier2}
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                    <div 
                      className="px-2 py-1 bg-slate-100 rounded-full text-sm font-medium flex items-center gap-1 hover:brightness-95 cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedSection(null);
                      }}
                    >
                      <FileCheck className="h-4 w-4 text-slate-600" />
                      {selectedTask.title}
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                    <div className="px-2 py-1 bg-blue-100 rounded-full text-sm font-medium flex items-center gap-1">
                      <Layers className="h-4 w-4 text-blue-600" />
                      {selectedSection}
                    </div>
                  </div>
                  
                  {/* Subsections list */}
                  <h3 className="text-lg font-medium mb-4">Subsections in {selectedSection}</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {getSubsectionsForSection(selectedTier1, selectedTier2, selectedSection).map(subsection => {
                      // Get materials in this subsection
                      const materialsInSubsection = getMaterialsForSubsection(
                        selectedTier1, selectedTier2, selectedSection, subsection
                      );
                      
                      // Calculate total cost for these materials
                      const totalValue = materialsInSubsection.reduce((sum, m) => sum + (m.cost || 0) * m.quantity, 0);
                      
                      return (
                        <Card 
                          key={subsection}
                          className="rounded-lg border bg-card text-card-foreground shadow-sm h-full transition-all hover:shadow-md cursor-pointer"
                          onClick={() => setSelectedSubsection(subsection)}
                        >
                          <CardHeader className="pb-2">
                            <CardTitle className="text-base font-medium">{subsection}</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="grid gap-1">
                              <div className="text-xs text-muted-foreground">
                                {materialsInSubsection.length} materials · {formatCurrency(totalValue)}
                              </div>
                              <Progress 
                                value={materialsInSubsection.length > 0 ? 100 : 0} 
                                className="h-1" 
                              />
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </>
              ) : (
                // Tier 6 - Materials within the selected subsection
                <>
                  <div className="flex flex-wrap items-center gap-2 mb-4">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={handleBackFromTask}
                      className="flex items-center gap-1 text-slate-500 hover:text-slate-700 hover:bg-slate-100"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Back to Subsections
                    </Button>
                    <div 
                      className={`px-2 py-1 ${getTier1Background(selectedTier1)} rounded-full text-sm font-medium flex items-center gap-1 hover:brightness-95 cursor-pointer`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTier2(null);
                        setSelectedTask(null);
                        setSelectedSection(null);
                        setSelectedSubsection(null);
                      }}
                    >
                      {getTier1Icon(selectedTier1, "h-4 w-4")}
                      {selectedTier1}
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                    <div 
                      className={`px-2 py-1 ${getTier2Background(selectedTier2)} rounded-full text-sm font-medium flex items-center gap-1 hover:brightness-95 cursor-pointer`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTask(null);
                        setSelectedSection(null);
                        setSelectedSubsection(null);
                      }}
                    >
                      {getTier2Icon(selectedTier2, "h-4 w-4")}
                      {selectedTier2}
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                    <div 
                      className="px-2 py-1 bg-slate-100 rounded-full text-sm font-medium flex items-center gap-1 hover:brightness-95 cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedSection(null);
                        setSelectedSubsection(null);
                      }}
                    >
                      <FileCheck className="h-4 w-4 text-slate-600" />
                      {selectedTask.title}
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                    <div 
                      className="px-2 py-1 bg-blue-100 rounded-full text-sm font-medium flex items-center gap-1 hover:brightness-95 cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedSubsection(null);
                      }}
                    >
                      <Layers className="h-4 w-4 text-blue-600" />
                      {selectedSection}
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                    <div className="px-2 py-1 bg-green-100 rounded-full text-sm font-medium flex items-center gap-1">
                      <Package className="h-4 w-4 text-green-600" />
                      {selectedSubsection}
                    </div>
                  </div>
                  
                  {/* Materials list */}
                  <h3 className="text-lg font-medium mb-4">Materials in {selectedSubsection}</h3>
                  
                  {/* Materials grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {getMaterialsForSubsection(
                      selectedTier1, selectedTier2, selectedSection, selectedSubsection
                    ).map(material => (
                      <Card 
                        key={material.id}
                        className="overflow-hidden border-slate-200 shadow-sm hover:shadow transition-all"
                      >
                        <div className="bg-slate-50 border-b p-3 flex justify-between items-center">
                          <div>
                            <h4 className="font-medium text-slate-800">{material.name}</h4>
                            <div className="text-xs text-slate-500 mt-1">{material.type}</div>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-sm px-2 py-1 rounded-full bg-green-50 text-green-700 font-medium">
                              {formatCurrency(material.cost || 0)}
                            </span>
                          </div>
                        </div>

                        <div className="p-3">
                          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                            <div className="flex items-center gap-2">
                              <Package className="h-4 w-4 text-blue-500" />
                              <span><span className="font-medium">Qty:</span> {material.quantity} {material.unit}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <ShoppingCart className="h-4 w-4 text-orange-500" /> 
                              <span><span className="font-medium">Status:</span> {material.status}</span>
                            </div>
                            <div className="flex items-center gap-2 col-span-2">
                              <Warehouse className="h-4 w-4 text-purple-500" />
                              <span><span className="font-medium">Supplier:</span> {material.supplier || 'Not specified'}</span>
                            </div>
                            <div className="flex items-center gap-2 col-span-2">
                              <Truck className="h-4 w-4 text-green-500" />
                              <span><span className="font-medium">Total:</span> {formatCurrency((material.cost || 0) * material.quantity)}</span>
                            </div>
                          </div>
                          
                          {/* Display hierarchy information */}
                          <div className="border-t border-slate-100 mt-3 pt-3 text-xs text-slate-600 grid grid-cols-2 gap-2">
                            <div className="flex items-center gap-1">
                              <span className="font-medium">Tier:</span> {material.tier}
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="font-medium">Category:</span> {material.tier2Category}
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="font-medium">Section:</span> {material.section}
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="font-medium">Subsection:</span> {material.subsection}
                            </div>
                          </div>
                          
                          <div className="mt-4 flex justify-end gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedMaterial(material);
                                setEditDialogOpen(true);
                              }}
                            >
                              <Edit className="h-4 w-4 mr-1" /> Edit
                            </Button>
                            
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="secondary" size="sm">
                                  <MoreHorizontal className="h-4 w-4 mr-1" /> More
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    // Open the "Link to Task" dialog with the current material
                                    setSectionToLink({
                                      tier1: material.tier || '',
                                      tier2: material.tier2Category || '',
                                      section: material.section || '',
                                      materials: [material]
                                    });
                                    setLinkSectionDialogOpen(true);
                                  }}
                                >
                                  <LinkIcon className="mr-2 h-4 w-4" />
                                  Link to Task
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (confirm("Are you sure you want to delete this material?")) {
                                      deleteMaterialMutation.mutate(material.id);
                                    }
                                  }}
                                  className="text-red-600"
                                >
                                  <Trash className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </>
              )}
            </TabsContent>
            
            <TabsContent value="tasks" className="space-y-8 mt-4">
              <TaskMaterialsView 
                projectId={projectId} 
                handleEditMaterial={(material) => {
                  // Cast the material to match our internal Material type
                  setSelectedMaterial(material as any);
                  setEditDialogOpen(true);
                }}
              />
            </TabsContent>
            
            <TabsContent value="list" className="mt-4">
              <div className="mb-4 flex items-center gap-2">
                <Search className="text-slate-400 h-4 w-4" />
                <Input
                  placeholder="Search materials..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1"
                />
                {selectedCategory && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedCategory(null)}
                    className="gap-1"
                  >
                    {selectedCategory}
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
              
              <div className="overflow-auto rounded-lg border">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Category
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Quantity
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cost
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="relative px-4 py-3">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredMaterials?.map((material) => (
                      <tr key={material.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0">
                              <div className={`h-8 w-8 rounded-full flex items-center justify-center ${getCategoryIconBackground(material.category || '')}`}>
                                {getCategoryIcon(material.category || '')}
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{material.name}</div>
                              <div className="text-sm text-gray-500">{material.type}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap">
                          <span 
                            className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 cursor-pointer"
                            onClick={() => setSelectedCategory(material.category || null)}
                          >
                            {material.category || "Uncategorized"}
                          </span>
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                          {material.quantity} {material.unit}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                          {formatCurrency(material.cost || 0)}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(material.status)}`}>
                            {material.status}
                          </span>
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => {
                                setSelectedMaterial(material);
                                setEditDialogOpen(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
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
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => {
                                    if (confirm("Are you sure you want to delete this material?")) {
                                      deleteMaterialMutation.mutate(material.id);
                                    }
                                  }}
                                  className="text-red-600"
                                >
                                  <Trash className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {filteredMaterials?.length === 0 && (
                  <div className="text-center py-8">
                    <Package className="mx-auto h-8 w-8 text-slate-300" />
                    <p className="mt-2 text-slate-500">No materials found</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </TabsContent>
        
        <TabsContent value="inventory" className="space-y-4 mt-4">
          {inventoryItems.length > 0 ? (
            <>
              <div className="mb-4 flex items-center gap-2">
                <Search className="text-slate-400 h-4 w-4" />
                <Input
                  placeholder="Search inventory..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1"
                />
              </div>
              
              <div className="overflow-auto rounded-lg border">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Material
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ordered
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Delivered
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Used
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Remaining
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {inventoryItems.filter(item => 
                      !searchTerm || item.name.toLowerCase().includes(searchTerm.toLowerCase())
                    ).map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{item.name}</div>
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                          {item.ordered} {item.unit}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                          {item.delivered} {item.unit}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                          {item.used} {item.unit}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="text-sm text-gray-900 mr-2">
                              {(item.delivered - item.used).toFixed(1)} {item.unit}
                            </div>
                            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-blue-500 rounded-full" 
                                style={{ width: `${(1 - (item.used / item.delivered)) * 100}%` }}
                              ></div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <Warehouse className="mx-auto h-8 w-8 text-slate-300" />
              <p className="mt-2 text-slate-500">No inventory data available</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      {/* Dialogs */}
      {createDialogOpen && (
        <CreateMaterialDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          projectId={projectId}
        />
      )}
      
      {editDialogOpen && selectedMaterial && (
        <EditMaterialDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          material={selectedMaterial}
        />
      )}
      
      {importDialogOpen && (
        <ImportMaterialsDialog
          open={importDialogOpen}
          onOpenChange={setImportDialogOpen}
          projectId={projectId}
        />
      )}
      
      {linkSectionDialogOpen && sectionToLink && (
        <LinkSectionToTaskDialog 
          open={linkSectionDialogOpen}
          onOpenChange={setLinkSectionDialogOpen}
          materialIds={
            (sectionToLink.materials && Array.isArray(sectionToLink.materials))
              ? sectionToLink.materials.map(m => m.id) 
              : (sectionToLink.materialIds || [])
          }
          onLinkToTask={handleCompleteTaskLinking}
          sectionName={sectionToLink.section}
          projectId={projectId}
          tier1={sectionToLink.tier1}
          tier2={sectionToLink.tier2}
          section={sectionToLink.section}
          materialCount={
            (sectionToLink.materials && Array.isArray(sectionToLink.materials))
              ? sectionToLink.materials.length
              : (sectionToLink.materialIds?.length || 0)
          }
          onComplete={handleCompleteTaskLinking}
        />
      )}
    </div>
  );
}

// Helper function to check if a tier matches a material type (for materials without tier2Category)
function tierMatchesType(tier2: string, type: string): boolean {
  if (!type) return false;
  
  const lowerType = type.toLowerCase();
  const lowerTier = tier2.toLowerCase();
  
  switch (lowerTier) {
    case 'foundation':
      return lowerType.includes('concrete') || lowerType.includes('foundation');
    case 'framing':
      return lowerType.includes('framing') || lowerType.includes('frame');
    case 'lumber':
      return lowerType.includes('lumber') || lowerType.includes('wood');
    case 'roofing':
      return lowerType.includes('roof');
    case 'shingles':
      return lowerType.includes('shingle');
    case 'electrical':
      return lowerType.includes('electrical') || lowerType.includes('wiring');
    case 'plumbing':
      return lowerType.includes('plumbing') || lowerType.includes('pipe');
    case 'hvac':
      return lowerType.includes('hvac') || lowerType.includes('ventilation');
    case 'insulation':
      return lowerType.includes('insulation');
    case 'drywall':
      return lowerType.includes('drywall') || lowerType.includes('gypsum');
    case 'siding':
      return lowerType.includes('siding');
    case 'exteriors':
      return lowerType.includes('exterior');
    case 'windows':
      return lowerType.includes('window');
    case 'doors':
      return lowerType.includes('door');
    case 'cabinets':
      return lowerType.includes('cabinet');
    case 'fixtures':
      return lowerType.includes('fixture');
    case 'flooring':
      return lowerType.includes('floor') || lowerType.includes('tile');
    case 'paint':
      return lowerType.includes('paint');
    default:
      return false;
  }
}

// Helper function to get status class for material status
function getStatusClass(status: string): string {
  switch (status.toLowerCase()) {
    case 'ordered':
      return 'bg-yellow-100 text-yellow-800';
    case 'delivered':
      return 'bg-green-100 text-green-800';
    case 'used':
      return 'bg-blue-100 text-blue-800';
    case 'pending':
      return 'bg-orange-100 text-orange-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}