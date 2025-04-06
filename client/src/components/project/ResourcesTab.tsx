import React, { useState, useEffect } from "react";
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
  Link as LinkIcon,
  ArrowRight,
  Calendar,
  User
} from "lucide-react";

import { getStatusBorderColor, getStatusBgColor, formatTaskStatus, getCategoryColor } from "@/lib/color-utils";
import { formatCurrency, formatDate } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { CreateMaterialDialog } from "@/pages/materials/CreateMaterialDialog";
import { EditMaterialDialog } from "@/pages/materials/EditMaterialDialog";
import { ImportMaterialsDialog } from "@/pages/materials/ImportMaterialsDialog";
import { TaskMaterialsView } from "@/components/materials/TaskMaterialsView";
import { LinkSectionToTaskDialog } from "@/components/materials/LinkSectionToTaskDialog";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
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
  // Additional fields for display
  unit?: string;
  cost?: number;
  category?: string;
  taskIds?: number[];
  contactIds?: number[];
  // Hierarchical category fields
  tier?: string;
  tier2Category?: string;
  section?: string;
  subsection?: string;
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

interface SectionToLink {
  tier1: string;
  tier2: string;
  section: string;
  materials: Material[];
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
  const [viewMode, setViewMode] = useState<"list" | "categories" | "hierarchy" | "type">("hierarchy");
  const [expandedTaskId, setExpandedTaskId] = useState<number | null>(null);
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
      const materialIds = sectionToLink.materials.map(m => m.id);
      
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
  
  // Hierarchical navigation state (3-tier structure)
  const [selectedTier1, setSelectedTier1] = useState<string | null>(null);
  const [selectedTier2, setSelectedTier2] = useState<string | null>(null);
  
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
  const tier1Categories = ['Structural', 'Systems', 'Sheathing', 'Finishings', 'Other'];
  
  // Define explicit tier2 categories for each tier1, organized according to the requested hierarchy
  const predefinedTier2CategoriesByTier1: Record<string, string[]> = {
    'Structural': ['Foundation', 'Framing', 'Lumber', 'Roofing', 'Shingles'],
    'Systems': ['Electrical', 'Plumbing', 'HVAC'],
    'Sheathing': ['Insulation', 'Drywall', 'Siding', 'Exteriors'],
    'Finishings': ['Windows', 'Doors', 'Cabinets', 'Fixtures', 'Flooring', 'Paint'],
    'Other': ['Permits', 'Other']
  };
  
  // Function to determine tier1 based on task's category, title, or description
  const getTaskTier1 = (task: any): string => {
    // First check if task already has a tier1Category
    if (task.tier1_category || task.tier1Category) {
      // Check with both lowercase and capitalized first letter
      const category = task.tier1_category || task.tier1Category || '';
      const normalizedCategory = category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
      if (tier1Categories.includes(normalizedCategory)) {
        return normalizedCategory;
      }
    }
    
    // Try to determine tier1 from task title or description
    const titleAndDesc = `${task.title || ''} ${task.description || ''}`.toLowerCase();
    
    if (titleAndDesc.includes('foundation') || 
        titleAndDesc.includes('framing') || 
        titleAndDesc.includes('lumber') || 
        titleAndDesc.includes('roof') || 
        titleAndDesc.includes('concrete') ||
        titleAndDesc.includes('structural')) {
      return 'Structural';
    }
    
    if (titleAndDesc.includes('electric') || 
        titleAndDesc.includes('plumbing') || 
        titleAndDesc.includes('hvac') || 
        titleAndDesc.includes('system')) {
      return 'Systems';
    }
    
    if (titleAndDesc.includes('insulation') || 
        titleAndDesc.includes('drywall') || 
        titleAndDesc.includes('siding') || 
        titleAndDesc.includes('exterior') ||
        titleAndDesc.includes('sheath')) {
      return 'Sheathing';
    }
    
    if (titleAndDesc.includes('paint') || 
        titleAndDesc.includes('floor') || 
        titleAndDesc.includes('tile') || 
        titleAndDesc.includes('cabinet') || 
        titleAndDesc.includes('window') || 
        titleAndDesc.includes('door') || 
        titleAndDesc.includes('finish')) {
      return 'Finishings';
    }
    
    // Default to Other if we can't determine
    return 'Other';
  };
  
  // Function to determine tier2 based on task and tier1
  const getTaskTier2 = (task: any, tier1: string): string => {
    // First check if task already has a tier2Category that belongs to the tier1
    if (task.tier2Category) {
      // Normalize the category
      const category = task.tier2Category || '';
      const normalizedCategory = category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
      
      // Check if this category belongs to the tier1
      if (predefinedTier2CategoriesByTier1[tier1]?.some(t => 
          t.toLowerCase() === normalizedCategory.toLowerCase())) {
        return normalizedCategory;
      }
    }
    
    // Try to determine tier2 from task title or description
    const titleAndDesc = `${task.title || ''} ${task.description || ''}`.toLowerCase();
    
    // Find the best match from predefined categories
    if (tier1 === 'Structural') {
      if (titleAndDesc.includes('foundation')) return 'Foundation';
      if (titleAndDesc.includes('framing')) return 'Framing';
      if (titleAndDesc.includes('lumber')) return 'Lumber';
      if (titleAndDesc.includes('roof')) return 'Roofing';
      if (titleAndDesc.includes('shingle')) return 'Shingles';
    }
    
    if (tier1 === 'Systems') {
      if (titleAndDesc.includes('electric')) {
        console.log('Found electrical task:', task.title);
        return 'Electrical';
      }
      if (titleAndDesc.includes('plumbing')) return 'Plumbing';
      if (titleAndDesc.includes('hvac')) return 'HVAC';
    }
    
    if (tier1 === 'Sheathing') {
      // Debug drywall detection - log titles that contain the word drywall
      if (titleAndDesc.includes('drywall')) {
        console.log('Found drywall task:', task.title);
        return 'Drywall';
      }
      if (titleAndDesc.includes('insulation')) return 'Insulation';
      if (titleAndDesc.includes('siding')) return 'Siding';
      if (titleAndDesc.includes('exterior')) return 'Exteriors';
      
      // Additional case for when there's no explicit keyword but task ID hints it's drywall
      if (task.id && task.id.toString().startsWith('DR')) {
        console.log('Found drywall task by ID:', task.id, task.title);
        return 'Drywall';
      }
    }
    
    if (tier1 === 'Finishings') {
      if (titleAndDesc.includes('window')) return 'Windows';
      if (titleAndDesc.includes('door')) return 'Doors';
      if (titleAndDesc.includes('cabinet')) return 'Cabinets';
      if (titleAndDesc.includes('fixture')) return 'Fixtures';
      if (titleAndDesc.includes('floor') || titleAndDesc.includes('tile')) return 'Flooring';
      if (titleAndDesc.includes('paint')) return 'Paint';
    }
    
    if (tier1 === 'Other') {
      if (titleAndDesc.includes('permit')) return 'Permits';
      return 'Other';
    }
    
    // Default to the first category in the predefined list for that tier1
    return predefinedTier2CategoriesByTier1[tier1]?.[0] || 'Other';
  };
  
  // Group tasks by tier1Category and tier2Category
  const tasksByTier = tasks.reduce((acc, task) => {
    // Get tier1 and capitalize first letter
    const tier1Raw = getTaskTier1(task);
    const tier1 = tier1Raw.charAt(0).toUpperCase() + tier1Raw.slice(1).toLowerCase();
    
    // Get tier2 and capitalize first letter
    const tier2Raw = getTaskTier2(task, tier1);
    const tier2 = tier2Raw.charAt(0).toUpperCase() + tier2Raw.slice(1).toLowerCase();
    
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
    
    // Add console log for debugging tier2 categories for all tier1 categories
    console.log(`Tier2 categories for ${tier1}:`, Object.keys(tier2Tasks || {}));
    
    // Make sure all predefined tier2 categories are included even if there are no tasks
    // This ensures tier2 categories show up even if no tasks exist for them yet
    if (predefinedTier2CategoriesByTier1[tier1]) {
      // Add missing predefined categories if they don't exist in the dynamic list
      predefinedTier2CategoriesByTier1[tier1].forEach(predefinedTier2 => {
        if (!acc[tier1].includes(predefinedTier2)) {
          console.log(`Adding missing tier2 category: ${predefinedTier2} to ${tier1}`);
          acc[tier1].push(predefinedTier2);
        }
      });
    }
    
    return acc;
  }, {} as Record<string, string[]>);

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
      (material.category && material.category.toLowerCase().includes(searchTermLower)) ||
      (material.tier && material.tier.toLowerCase().includes(searchTermLower)) ||
      (material.tier2Category && material.tier2Category.toLowerCase().includes(searchTermLower)) ||
      (material.section && material.section.toLowerCase().includes(searchTermLower)) ||
      (material.subsection && material.subsection.toLowerCase().includes(searchTermLower))
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
  
  // Get tier1 category icon (broad categories)
  const getTier1Icon = (tier1: string, className: string = "h-5 w-5") => {
    const lowerCaseTier1 = (tier1 || '').toLowerCase();
    
    if (lowerCaseTier1 === 'structural') {
      return <Building className={`${className} text-orange-600`} />;
    }
    
    if (lowerCaseTier1 === 'systems') {
      return <Cog className={`${className} text-blue-600`} />;
    }
    
    if (lowerCaseTier1 === 'sheathing') {
      return <PanelTop className={`${className} text-green-600`} />;
    }
    
    if (lowerCaseTier1 === 'finishings') {
      return <Sofa className={`${className} text-violet-600`} />;
    }
    
    if (lowerCaseTier1 === 'other') {
      return <Package className={`${className} text-slate-600`} />;
    }
    
    // Default
    return <Home className={`${className} text-slate-700`} />;
  };
  
  // Get tier2 category icon (specific categories)
  const getTier2Icon = (tier2: string, className: string = "h-5 w-5") => {
    const lowerCaseTier2 = (tier2 || '').toLowerCase();
    
    // Match foundation with concrete
    if (lowerCaseTier2 === 'foundation') {
      return <Landmark className={`${className} text-stone-700`} />;
    }
    
    // Match framing with wood
    if (lowerCaseTier2 === 'framing') {
      return <Construction className={`${className} text-amber-700`} />;
    }
    
    // Roofing
    if (lowerCaseTier2 === 'roofing') {
      return <HardHat className={`${className} text-red-600`} />;
    }
    
    // Match electrical with electrical
    if (lowerCaseTier2 === 'electric' || lowerCaseTier2 === 'electrical') {
      return <Zap className={`${className} text-yellow-600`} />;
    }
    
    // Match plumbing with plumbing
    if (lowerCaseTier2 === 'plumbing') {
      return <Droplet className={`${className} text-blue-600`} />;
    }
    
    // HVAC
    if (lowerCaseTier2 === 'hvac') {
      return <Fan className={`${className} text-sky-700`} />;
    }
    
    // Exteriors
    if (lowerCaseTier2 === 'exteriors') {
      return <Building className={`${className} text-sky-600`} />;
    }
    
    // Windows/doors with glass/interior
    if (lowerCaseTier2 === 'windows') {
      return <LayoutGrid className={`${className} text-orange-600`} />;
    }
    
    // Doors
    if (lowerCaseTier2 === 'doors') {
      return <Mailbox className={`${className} text-amber-700`} />;
    }
    
    // Barriers
    if (lowerCaseTier2 === 'barriers') {
      return <LayoutGrid className={`${className} text-teal-600`} />;
    }
    
    // Drywall with interior finish
    if (lowerCaseTier2 === 'drywall') {
      return <Layers className={`${className} text-neutral-700`} />;
    }
    
    // Cabinets
    if (lowerCaseTier2 === 'cabinets') {
      return <Columns className={`${className} text-purple-600`} />;
    }
    
    // Fixtures
    if (lowerCaseTier2 === 'fixtures') {
      return <Cog className={`${className} text-indigo-600`} />;
    }
    
    // Flooring with finish
    if (lowerCaseTier2 === 'flooring') {
      return <Grid className={`${className} text-amber-600`} />;
    }
    
    // Permits
    if (lowerCaseTier2 === 'permits') {
      return <FileCheck className={`${className} text-indigo-600`} />;
    }
    
    // Default
    return <Package className={`${className} text-slate-700`} />;
  };
  
  // Get tier1 icon background color
  const getTier1Background = (tier1: string) => {
    switch (tier1.toLowerCase()) {
      case 'structural':
        return 'bg-orange-100';
      case 'systems':
        return 'bg-blue-100';
      case 'sheathing':
        return 'bg-green-100';
      case 'finishings':
        return 'bg-violet-100';
      case 'other':
        return 'bg-slate-100';
      default:
        return 'bg-slate-100';
    }
  };
  
  // Get tier2 icon background color
  const getTier2Background = (tier2: string) => {
    switch (tier2.toLowerCase()) {
      case 'foundation':
        return 'bg-stone-200';
      case 'framing':
        return 'bg-purple-200';
      case 'roofing':
        return 'bg-red-200';
      case 'electric':
      case 'electrical':
        return 'bg-yellow-200';
      case 'plumbing':
        return 'bg-blue-200';
      case 'hvac':
        return 'bg-gray-200';
      case 'barriers':
        return 'bg-teal-200';
      case 'drywall':
        return 'bg-neutral-200';
      case 'exteriors':
        return 'bg-sky-200';
      case 'windows':
        return 'bg-orange-200';
      case 'doors':
        return 'bg-amber-200';
      case 'cabinets':
        return 'bg-purple-200';
      case 'fixtures':
        return 'bg-indigo-200';
      case 'flooring':
        return 'bg-amber-200';
      case 'permits':
        return 'bg-indigo-200';
      default:
        return 'bg-slate-200';
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
        <div className="flex gap-2">
          {projectId && (
            <Button 
              variant="outline"
              className="border-orange-500 text-orange-600 hover:bg-orange-50"
              onClick={() => setImportDialogOpen(true)}
            >
              <FileSpreadsheet className="mr-2 h-4 w-4" /> Import CSV
            </Button>
          )}
          <Button 
            className="bg-orange-500 hover:bg-orange-600"
            onClick={() => setCreateDialogOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" /> Add Material
          </Button>
        </div>
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
          <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as "list" | "categories" | "hierarchy" | "type")}>
            <TabsList className="grid w-full grid-cols-3 bg-slate-100">
              <TabsTrigger value="hierarchy" className="data-[state=active]:bg-white">Hierarchy</TabsTrigger>
              <TabsTrigger value="list" className="data-[state=active]:bg-white">List View</TabsTrigger>
              <TabsTrigger value="type" className="data-[state=active]:bg-white">Type View</TabsTrigger>
            </TabsList>
            
            <TabsContent value="hierarchy" className="space-y-4 mt-4">
              {/* 3-Tier Hierarchical View */}
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
                        className="rounded-lg border bg-card text-card-foreground shadow-sm h-full transition-all hover:shadow-md cursor-pointer"
                        onClick={() => setSelectedTier1(tier1)}
                      >
                        <div className={`flex flex-col space-y-1.5 p-6 rounded-t-lg ${getTier1Background(tier1)}`}>
                          <div className="flex justify-center py-4">
                            <div className="p-3 rounded-full bg-white bg-opacity-70">
                              {getTier1Icon(tier1, "h-10 w-10")}
                            </div>
                          </div>
                        </div>
                        <div className="p-6">
                          <h3 className="text-2xl font-semibold leading-none tracking-tight">
                            {tier1}
                          </h3>
                          <p className="text-sm text-muted-foreground mt-2">
                            {tier1 === 'Structural' && 'Foundation and building structure materials'}
                            {tier1 === 'Systems' && 'Electrical, plumbing, and mechanical systems'}
                            {tier1 === 'Sheathing' && 'Insulation, roofing, and building envelope'}
                            {tier1 === 'Finishings' && 'Interior and exterior finish materials'}
                            {tier1 === 'Other' && 'Permits, miscellaneous, and uncategorized materials'}
                          </p>
                          <div className="mt-4 text-sm text-muted-foreground">
                            <div className="flex justify-between mb-1">
                              <span>{totalMaterials} materials</span>
                              <span>{formatCurrency(totalValue)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>{tier2CategoriesByTier1[tier1]?.length || 0} categories</span>
                            </div>
                          </div>
                        </div>
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
                      Back to main categories
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedTier1(null);
                      }}
                      className={`px-2 py-1 ${getTier1Background(selectedTier1)} rounded-full text-sm font-medium flex items-center gap-1 hover:brightness-95`}
                    >
                      {getTier1Icon(selectedTier1, "h-4 w-4")}
                      {selectedTier1}
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(tier2CategoriesByTier1[selectedTier1] || []).map((tier2) => {
                      // Find tasks in this tier2 category
                      const tasksInCategory = tasksByTier[selectedTier1]?.[tier2] || [];
                      
                      // Count how many materials are related to tasks in this category
                      const materialsForTaskIds = new Set();
                      tasksInCategory.forEach((task: any) => {
                        if (task.materialIds) {
                          (Array.isArray(task.materialIds) ? task.materialIds : []).forEach((id: string | number) => 
                            materialsForTaskIds.add(id)
                          );
                        }
                      });
                      
                      return (
                        <Card 
                          key={tier2} 
                          className="rounded-lg border bg-card text-card-foreground shadow-sm h-full transition-all hover:shadow-md cursor-pointer"
                          onClick={() => setSelectedTier2(tier2)}
                        >
                          <div className={`flex flex-col space-y-1.5 p-4 rounded-t-lg ${getTier2Background(tier2)}`}>
                            <div className="flex justify-center py-3">
                              <div className="p-2 rounded-full bg-white bg-opacity-70">
                                {getTier2Icon(tier2, "h-8 w-8")}
                              </div>
                            </div>
                          </div>
                          <div className="p-4">
                            <h3 className="text-xl font-semibold leading-none tracking-tight">
                              {tier2}
                            </h3>
                            <p className="text-sm text-muted-foreground mt-2">
                              Materials used for {tier2.toLowerCase()} tasks
                            </p>
                            <div className="mt-4 text-sm text-muted-foreground">
                              <div className="flex justify-between">
                                <span>{tasksInCategory.length} tasks</span>
                                <span>{materialsForTaskIds.size} materials</span>
                              </div>
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </>
              ) : (
                // Tier 3 - Materials for selected tier2 category
                <>
                  <div className="flex items-center gap-2 mb-4">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setSelectedTier2(null)}
                      className="flex items-center gap-1 text-slate-500 hover:text-slate-700 hover:bg-slate-100"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Back to {selectedTier1} categories
                    </Button>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedTier1(null);
                        }}
                        className={`px-2 py-1 ${getTier1Background(selectedTier1)} rounded-full text-sm font-medium flex items-center gap-1 hover:brightness-95`}
                      >
                        {getTier1Icon(selectedTier1, "h-4 w-4")}
                        {selectedTier1}
                      </Button>
                      <ChevronRight className="h-4 w-4 text-slate-400" />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedTier2(null);
                        }}
                        className={`px-2 py-1 ${getTier2Background(selectedTier2)} rounded-full text-sm font-medium flex items-center gap-1 hover:brightness-95`}
                      >
                        {getTier2Icon(selectedTier2, "h-4 w-4")}
                        {selectedTier2}
                      </Button>
                    </div>
                  </div>
                  
                  {/* Materials organized by tasks, then section and subsection */}
                  <div className="space-y-6">
                    {/* Organize by tasks first, then section and subsection */}
                    {(() => {
                      // Find all tasks in this tier2 category
                      const tasksInCategory = tasksByTier[selectedTier1]?.[selectedTier2] || [];
                      
                      // Get all material IDs used by tasks in this category
                      const allTaskMaterialIds = new Set<string | number>();
                      tasksInCategory.forEach((task: any) => {
                        if (task.materialIds) {
                          (Array.isArray(task.materialIds) ? task.materialIds : []).forEach((id: string | number) => 
                            allTaskMaterialIds.add(id)
                          );
                        }
                      });
                      
                      // Get all materials that belong to this tier1/tier2 category
                      const categoryMaterials = processedMaterials?.filter(m => 
                        (m.tier?.toLowerCase() === selectedTier1?.toLowerCase() || 
                         m.tier?.toLowerCase() === selectedTier1?.slice(0, -1).toLowerCase()) && // Handle "Finishings" vs "Finishing" 
                        (m.tier2Category?.toLowerCase() === selectedTier2?.toLowerCase()) ||
                        // Also include materials that are linked to tasks in this category
                        allTaskMaterialIds.has(m.id.toString()) || allTaskMaterialIds.has(m.id)
                      ) || [];
                      
                      // No materials found
                      if (categoryMaterials.length === 0) {
                        return (
                          <div className="text-center py-10 bg-white rounded-lg border">
                            <Package className="mx-auto h-12 w-12 text-slate-300" />
                            <h3 className="mt-2 font-medium">No Materials Found</h3>
                            <p className="text-slate-500 mt-1">No materials have been added to the {selectedTier2} category</p>
                          </div>
                        );
                      }
                      
                      // First, show unassigned materials
                      const unlinkedMaterials = categoryMaterials.filter(material => 
                        !material.taskIds || material.taskIds.length === 0
                      );
                      
                      // Group materials by task
                      const materialsByTask: Record<string, Material[]> = {};
                      tasksInCategory.forEach((task: any) => {
                        const taskId = task.id.toString();
                        const taskMaterialIds = Array.isArray(task.materialIds) ? task.materialIds : [];
                        
                        // Get materials for this task
                        const taskMaterials = categoryMaterials.filter(m => 
                          taskMaterialIds.includes(m.id.toString()) || taskMaterialIds.includes(m.id)
                        );
                        
                        if (taskMaterials.length > 0) {
                          materialsByTask[taskId] = taskMaterials;
                        }
                      });
                      
                      return (
                        <>
                          {/* Render unassigned materials first */}
                          {unlinkedMaterials.length > 0 && (
                            <Collapsible className="border rounded-lg overflow-hidden">
                              <CollapsibleTrigger className="w-full text-left">
                                <div className="bg-orange-50 p-3 border-b hover:bg-orange-100 transition-colors flex justify-between items-center">
                                  <h3 className="font-medium text-lg text-orange-700">Unassigned Materials</h3>
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm text-orange-700">
                                      {unlinkedMaterials.length} materials
                                    </span>
                                    <ChevronRight className="h-5 w-5 text-orange-400 transition-transform" />
                                  </div>
                                </div>
                              </CollapsibleTrigger>
                              <CollapsibleContent>
                                <div className="p-4 bg-white">
                                  {/* Group unassigned materials by section and subsection */}
                                  {(() => {
                                    // Group by section
                                    const unlinkedBySection: Record<string, Material[]> = {};
                                    unlinkedMaterials.forEach(material => {
                                      const section = material.section || 'Other';
                                      if (!unlinkedBySection[section]) {
                                        unlinkedBySection[section] = [];
                                      }
                                      unlinkedBySection[section].push(material);
                                    });
                                    
                                    return Object.entries(unlinkedBySection).map(([section, sectionMaterials]) => {
                                      // Group by subsection
                                      const materialsBySubsection: Record<string, Material[]> = {};
                                      sectionMaterials.forEach(material => {
                                        const subsection = material.subsection || 'General';
                                        if (!materialsBySubsection[subsection]) {
                                          materialsBySubsection[subsection] = [];
                                        }
                                        materialsBySubsection[subsection].push(material);
                                      });
                                      
                                      return (
                                        <div key={section} className="mb-4">
                                          <h4 className="font-medium text-md border-b pb-1 mb-3">{section}</h4>
                                          
                                          {Object.entries(materialsBySubsection).map(([subsection, subsectionMaterials]) => (
                                            <Collapsible key={subsection} className="mb-3 border rounded-lg overflow-hidden">
                                              <CollapsibleTrigger className="w-full text-left">
                                                <div className="bg-slate-50 p-2 border-b hover:bg-slate-100 transition-colors flex justify-between items-center">
                                                  <h5 className="font-medium text-sm text-slate-700">{subsection}</h5>
                                                  <div className="flex items-center gap-2">
                                                    <span className="text-xs text-slate-600">
                                                      {subsectionMaterials.length} materials
                                                    </span>
                                                    <ChevronRight className="h-4 w-4 text-slate-400 transition-transform" />
                                                  </div>
                                                </div>
                                              </CollapsibleTrigger>
                                              <CollapsibleContent>
                                                <div className="p-3">
                                                  <div className="grid grid-cols-1 gap-3">
                                                    {subsectionMaterials.map(material => (
                                                      <Card key={material.id}>
                                                        <CardHeader className="p-4 pb-2">
                                                          <div className="flex justify-between items-start">
                                                            <CardTitle className="text-base">{material.name}</CardTitle>
                                                            <div className="flex items-center gap-2">
                                                              {material.tier && (
                                                                <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                                                                  {material.tier}
                                                                </span>
                                                              )}
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
                                                                    onClick={() => {
                                                                      setSelectedMaterial(material);
                                                                      setEditDialogOpen(true);
                                                                    }}
                                                                  >
                                                                    <Edit className="h-4 w-4 mr-2" />
                                                                    Edit
                                                                  </DropdownMenuItem>
                                                                  <DropdownMenuSeparator />
                                                                  <DropdownMenuItem 
                                                                    onClick={() => {
                                                                      if (window.confirm(`Are you sure you want to delete "${material.name}"?`)) {
                                                                        deleteMaterialMutation.mutate(material.id);
                                                                      }
                                                                    }}
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
                                                            {material.tier2Category && (
                                                              <div>
                                                                <p className="text-muted-foreground">Subcategory:</p>
                                                                <p className="font-medium">{material.tier2Category}</p>
                                                              </div>
                                                            )}
                                                            {(material.section || material.subsection) && (
                                                              <div>
                                                                <p className="text-muted-foreground">Section:</p>
                                                                <p className="font-medium">
                                                                  {material.section}{material.subsection ? ` - ${material.subsection}` : ''}
                                                                </p>
                                                              </div>
                                                            )}
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
                                              </CollapsibleContent>
                                            </Collapsible>
                                          ))}
                                        </div>
                                      );
                                    });
                                  })()}
                                </div>
                              </CollapsibleContent>
                            </Collapsible>
                          )}
                          
                          {/* Render materials grouped by task first, then by section and subsection */}
                          {Object.entries(materialsByTask).map(([taskId, taskMaterials]) => {
                            const task = tasksInCategory.find((t: any) => t.id.toString() === taskId);
                            if (!task) return null;
                            
                            // Group materials by section
                            const materialsBySection: Record<string, Material[]> = {};
                            taskMaterials.forEach(material => {
                              const section = material.section || 'Other';
                              if (!materialsBySection[section]) {
                                materialsBySection[section] = [];
                              }
                              materialsBySection[section].push(material);
                            });
                            
                            // Calculate total materials value
                            const totalMaterialsValue = taskMaterials.reduce(
                              (sum, m) => sum + (m.cost || 0) * m.quantity, 0
                            );
                            
                            return (
                              <Collapsible key={task.id} className="border rounded-lg overflow-hidden mb-4">
                                <CollapsibleTrigger 
                                  className="w-full text-left"
                                  onClick={() => setExpandedTaskId(expandedTaskId === task.id ? null : task.id)}
                                >
                                  <div className={`border-l-4 ${task.status === 'completed' ? 'border-green-500' : 
                                    task.status === 'in_progress' ? 'border-blue-500' : 
                                    task.status === 'pending' ? 'border-amber-500' : 'border-gray-300'}`}>
                                    <div className="p-4 flex flex-wrap justify-between items-start gap-2 hover:bg-slate-50">
                                      <div className="flex-grow">
                                        <div className="flex justify-between items-start">
                                          <h3 className="font-semibold text-lg">{task.title}</h3>
                                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                            task.status === 'completed' ? 'bg-green-100 text-green-800' : 
                                            task.status === 'in_progress' ? 'bg-blue-100 text-blue-800' : 
                                            task.status === 'pending' ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-800'
                                          }`}>
                                            {task.status === 'completed' ? 'Completed' : 
                                             task.status === 'in_progress' ? 'In Progress' : 
                                             task.status === 'pending' ? 'Pending' : 'Not Started'}
                                          </span>
                                        </div>
                                        
                                        <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-sm text-slate-600">
                                          <div className="flex items-center gap-1">
                                            <Calendar className="h-4 w-4 text-orange-500" />
                                            <span>
                                              {task.startDate ? new Date(task.startDate).toLocaleDateString() : 'No date'} - 
                                              {task.endDate ? new Date(task.endDate).toLocaleDateString() : 'No date'}
                                            </span>
                                          </div>
                                          <div className="flex items-center gap-1">
                                            <User className="h-4 w-4 text-orange-500" />
                                            <span>{task.assignedTo || "Unassigned"}</span>
                                          </div>
                                        </div>
                                        
                                        {task.category && (
                                          <div className="mt-2">
                                            <span className={`text-xs px-2 py-1 rounded-full ${
                                              task.category.includes('electrical') ? 'bg-blue-100 text-blue-800' :
                                              task.category.includes('plumbing') ? 'bg-cyan-100 text-cyan-800' :
                                              task.category.includes('framing') ? 'bg-amber-100 text-amber-800' :
                                              task.category.includes('drywall') ? 'bg-gray-100 text-gray-800' :
                                              task.category.includes('roofing') ? 'bg-red-100 text-red-800' :
                                              task.category.includes('finish') ? 'bg-emerald-100 text-emerald-800' :
                                              'bg-slate-100 text-slate-800'
                                            }`}>
                                              {task.category.replace(/_/g, ' ')}
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                      
                                      <div className="flex items-center gap-2">
                                        <div className="flex flex-col items-end text-xs">
                                          <span className="text-green-700 font-medium">
                                            {formatCurrency(totalMaterialsValue)}
                                          </span>
                                          <span className="text-slate-500">materials value</span>
                                        </div>
                                        <div className="rounded-full bg-orange-100 px-3 py-1 text-xs font-medium flex items-center text-orange-800">
                                          <Package className="h-3 w-3 mr-1" />
                                          {taskMaterials.length} materials
                                        </div>
                                        <ChevronRight className="h-5 w-5 text-slate-400 transform transition-transform duration-200" 
                                          style={{ transform: expandedTaskId === task.id ? 'rotate(90deg)' : 'rotate(0)' }} />
                                      </div>
                                    </div>
                                  </div>
                                </CollapsibleTrigger>
                                
                                <CollapsibleContent>
                                  <div className="border-t p-4 bg-slate-50">
                                    <div className="flex justify-between items-center mb-3">
                                      <h4 className="font-medium text-orange-700 flex items-center">
                                        <Package className="h-4 w-4 mr-1" /> 
                                        Materials for this Task
                                      </h4>
                                      <Button
                                        size="sm"
                                        className="bg-orange-500 hover:bg-orange-600"
                                        onClick={() => {
                                          setSelectedMaterial(null);
                                          setCreateDialogOpen(true);
                                        }}
                                      >
                                        <Plus className="h-3.5 w-3.5 mr-1" /> Add Material
                                      </Button>
                                    </div>
                                  
                                    {/* Render each section for this task */}
                                    {Object.entries(materialsBySection).map(([section, sectionMaterials]) => {
                                      // Further group by subsection
                                      const materialsBySubsection: Record<string, Material[]> = {};
                                      sectionMaterials.forEach(material => {
                                        const subsection = material.subsection || 'General';
                                        if (!materialsBySubsection[subsection]) {
                                          materialsBySubsection[subsection] = [];
                                        }
                                        materialsBySubsection[subsection].push(material);
                                      });
                                      
                                      return (
                                        <div key={section} className="mb-4">
                                          <h4 className="font-medium text-md border-b pb-1 mb-3">{section}</h4>
                                          
                                          {Object.entries(materialsBySubsection).map(([subsection, subsectionMaterials]) => (
                                            <Collapsible key={subsection} className="mb-3 border rounded-lg overflow-hidden">
                                              <CollapsibleTrigger className="w-full text-left">
                                                <div className="bg-slate-50 p-2 border-b hover:bg-slate-100 transition-colors flex justify-between items-center">
                                                  <h5 className="font-medium text-sm text-slate-700">{subsection}</h5>
                                                  <div className="flex items-center gap-2">
                                                    <span className="text-xs text-slate-600">
                                                      {subsectionMaterials.length} materials
                                                    </span>
                                                    <ChevronRight className="h-4 w-4 text-slate-400 transition-transform" />
                                                  </div>
                                                </div>
                                              </CollapsibleTrigger>
                                              <CollapsibleContent>
                                                <div className="p-3">
                                                  <div className="grid grid-cols-1 gap-3">
                                                    {subsectionMaterials.map(material => (
                                                      <Card key={material.id}>
                                                        <CardHeader className="p-4 pb-2">
                                                          <div className="flex justify-between items-start">
                                                            <CardTitle className="text-base">{material.name}</CardTitle>
                                                            <div className="flex items-center gap-2">
                                                              {material.tier && (
                                                                <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                                                                  {material.tier}
                                                                </span>
                                                              )}
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
                                                                    onClick={() => {
                                                                      setSelectedMaterial(material);
                                                                      setEditDialogOpen(true);
                                                                    }}
                                                                  >
                                                                    <Edit className="h-4 w-4 mr-2" />
                                                                    Edit
                                                                  </DropdownMenuItem>
                                                                  <DropdownMenuSeparator />
                                                                  <DropdownMenuItem 
                                                                    onClick={() => {
                                                                      if (window.confirm(`Are you sure you want to delete "${material.name}"?`)) {
                                                                        deleteMaterialMutation.mutate(material.id);
                                                                      }
                                                                    }}
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
                                                            {material.tier2Category && (
                                                              <div>
                                                                <p className="text-muted-foreground">Subcategory:</p>
                                                                <p className="font-medium">{material.tier2Category}</p>
                                                              </div>
                                                            )}
                                                            {(material.section || material.subsection) && (
                                                              <div>
                                                                <p className="text-muted-foreground">Section:</p>
                                                                <p className="font-medium">
                                                                  {material.section}{material.subsection ? ` - ${material.subsection}` : ''}
                                                                </p>
                                                              </div>
                                                            )}
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
                                              </CollapsibleContent>
                                            </Collapsible>
                                          ))}
                                        </div>
                                      );
                                    })}
                                  </div>
                                </CollapsibleContent>
                              </Collapsible>
                            );
                          })}
                          
                          {/* If no tasks have materials */}
                          {Object.keys(materialsByTask).length === 0 && unlinkedMaterials.length === 0 && (
                            <div className="text-center py-10 bg-white rounded-lg border">
                              <Package className="mx-auto h-12 w-12 text-slate-300" />
                              <h3 className="mt-2 font-medium">No Materials Found</h3>
                              <p className="text-slate-500 mt-1">No materials have been linked to tasks in the {selectedTier2} category</p>
                            </div>
                          )}
                        </>
                      );
                    })()}
                    
                    {/* If no materials found for tasks in this category */}
                    {(() => {
                      // Check if there are task-associated materials
                      const hasTaskMaterials = (tasksByTier[selectedTier1]?.[selectedTier2] || []).some((task: any) => {
                        const taskMaterialIds = Array.isArray(task.materialIds) ? task.materialIds : [];
                        return processedMaterials?.some(m => 
                          taskMaterialIds.includes(m.id.toString()) || taskMaterialIds.includes(m.id)
                        );
                      });
                      
                      // If no task-associated materials, look for direct tier/category matches
                      if (!hasTaskMaterials) {
                        // Find materials by tier1 & tier2 category
                        const matchingMaterials = processedMaterials?.filter(m => {
                          const materialTier1 = (m.tier || '').toLowerCase();
                          const materialTier2 = (m.tier2Category || '').toLowerCase();
                          return materialTier1 === selectedTier1.toLowerCase() && 
                                 materialTier2 === selectedTier2.toLowerCase();
                        }) || [];
                        
                        // If we have matches, group them by section and subsection
                        if (matchingMaterials.length > 0) {
                          // Group materials by section
                          const materialsBySection: Record<string, any[]> = {};
                          
                          // First, organize materials by section
                          matchingMaterials.forEach(material => {
                            const section = material.section || 'Uncategorized';
                            if (!materialsBySection[section]) {
                              materialsBySection[section] = [];
                            }
                            materialsBySection[section].push(material);
                          });
                          
                          return (
                            <div className="space-y-6 mt-4">
                              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                                <h3 className="font-medium">{selectedTier2} Materials (by category)</h3>
                                <p className="text-xs text-slate-500 mt-1">
                                  These materials are categorized as {selectedTier2} in {selectedTier1}
                                </p>
                              </div>
                              
                              {/* Display materials organized by section */}
                              {Object.entries(materialsBySection).map(([section, sectionMaterials]) => {
                                // Further organize by subsection
                                const materialsBySubsection: Record<string, any[]> = {};
                                
                                sectionMaterials.forEach(material => {
                                  const subsection = material.subsection || 'General';
                                  if (!materialsBySubsection[subsection]) {
                                    materialsBySubsection[subsection] = [];
                                  }
                                  materialsBySubsection[subsection].push(material);
                                });
                                
                                // Calculate total value for this section
                                const sectionValue = sectionMaterials.reduce(
                                  (sum, m) => sum + (m.cost || 0) * m.quantity, 0
                                );
                                
                                return (
                                  <div key={section} className="space-y-4">
                                    {/* Section header */}
                                    <div className="flex justify-between items-center bg-slate-100 p-3 rounded-lg">
                                      <div className="flex items-center gap-2">
                                        <Layers className="h-5 w-5 text-orange-500" />
                                        <h3 className="font-medium">{section}</h3>
                                      </div>
                                      <div className="text-sm font-medium text-green-700">
                                        {formatCurrency(sectionValue)}
                                      </div>
                                    </div>
                                    
                                    {/* Subsection organization */}
                                    {Object.entries(materialsBySubsection).map(([subsection, subsectionMaterials]) => (
                                      <div key={`${section}-${subsection}`} className="space-y-3">
                                        {/* Subsection header */}
                                        <div className="flex items-center gap-2 pl-2 border-l-4 border-orange-200">
                                          <ArrowRight className="h-4 w-4 text-orange-400" />
                                          <h4 className="font-medium text-sm">{subsection}</h4>
                                        </div>
                                        
                                        {/* Materials in this subsection */}
                                        <div className="grid grid-cols-1 gap-3 pl-6">
                                          {subsectionMaterials.map(material => (
                                            <Card key={material.id}>
                                              <CardHeader className="p-4 pb-2">
                                                <div className="flex justify-between items-start">
                                                  <CardTitle className="text-base">{material.name}</CardTitle>
                                                  <div className="flex items-center gap-2">
                                                    {material.tier && (
                                                      <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                                                        {material.tier}
                                                      </span>
                                                    )}
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
                                                          onClick={() => {
                                                            setSelectedMaterial(material);
                                                            setEditDialogOpen(true);
                                                          }}
                                                        >
                                                          <Edit className="h-4 w-4 mr-2" />
                                                          Edit
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem 
                                                          onClick={() => {
                                                            if (window.confirm(`Are you sure you want to delete "${material.name}"?`)) {
                                                              deleteMaterialMutation.mutate(material.id);
                                                            }
                                                          }}
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
                                                  {material.tier2Category && (
                                                    <div>
                                                      <p className="text-muted-foreground">Subcategory:</p>
                                                      <p className="font-medium">{material.tier2Category}</p>
                                                    </div>
                                                  )}
                                                  {(material.section || material.subsection) && (
                                                    <div>
                                                      <p className="text-muted-foreground">Section:</p>
                                                      <p className="font-medium">
                                                        {material.section}{material.subsection ? ` - ${material.subsection}` : ''}
                                                      </p>
                                                    </div>
                                                  )}
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
                                    ))}
                                  </div>
                                );
                              })}
                            </div>
                          );
                        }
                      }
                      
                      // If no materials at all, display "no materials" message
                      return (
                        <div className="text-center py-8">
                          <Package className="mx-auto h-8 w-8 text-slate-300" />
                          <p className="mt-2 text-slate-500">No materials associated with this category</p>
                        </div>
                      );
                    })()}
                  </div>
                </>
              )}
            </TabsContent>
            
            <TabsContent value="tasks" className="space-y-4 mt-4">
              {/* Task-based Materials View */}
              <div className="bg-white p-4 rounded-lg">
                <div className="mb-4">
                  <p className="text-slate-500">
                    Click on a task to see all materials associated with it.
                  </p>
                </div>
                
                {/* Import TaskMaterialsView component to show tasks with their materials */}
                <div className="mt-4">
                  <div className="task-materials-container">
                    <TaskMaterialsView />
                  </div>
                </div>
              </div>
            </TabsContent>
            
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
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedCategory(null);
                      }}
                      className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium flex items-center gap-1 hover:brightness-95"
                    >
                      {getCategoryIcon(selectedCategory, "h-4 w-4")}
                      {selectedCategory}
                    </Button>
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
                            {material.tier && (
                              <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                                {material.tier}
                              </span>
                            )}
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
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={() => {
                                    if (window.confirm(`Are you sure you want to delete "${material.name}"?`)) {
                                      deleteMaterialMutation.mutate(material.id);
                                    }
                                  }}
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
                          {material.tier2Category && (
                            <div>
                              <p className="text-muted-foreground">Subcategory:</p>
                              <p className="font-medium">{material.tier2Category}</p>
                            </div>
                          )}
                          {(material.section || material.subsection) && (
                            <div>
                              <p className="text-muted-foreground">Section:</p>
                              <p className="font-medium">
                                {material.section}{material.subsection ? ` - ${material.subsection}` : ''}
                              </p>
                            </div>
                          )}
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
                            {material.tier && (
                              <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                                {material.tier}
                              </span>
                            )}
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
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={() => {
                                    if (window.confirm(`Are you sure you want to delete "${material.name}"?`)) {
                                      deleteMaterialMutation.mutate(material.id);
                                    }
                                  }}
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
                          {material.tier2Category && (
                            <div>
                              <p className="text-muted-foreground">Subcategory:</p>
                              <p className="font-medium">{material.tier2Category}</p>
                            </div>
                          )}
                          {(material.section || material.subsection) && (
                            <div>
                              <p className="text-muted-foreground">Section:</p>
                              <p className="font-medium">
                                {material.section}{material.subsection ? ` - ${material.subsection}` : ''}
                              </p>
                            </div>
                          )}
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
            
            <TabsContent value="type" className="space-y-4 mt-4">
              {/* Material Type View */}
              <div className="bg-white p-4 rounded-lg">
                <div className="mb-4">
                  <p className="text-slate-500">
                    Materials organized by type categories.
                  </p>
                </div>
                
                {processedMaterials && processedMaterials.length > 0 ? (
                  <>
                    <div className="flex justify-between items-center bg-slate-50 p-3 rounded-md mb-4">
                      <span className="text-sm font-medium">Total Materials by Type:</span>
                      <span className="text-sm font-medium text-[#084f09]">
                        {formatCurrency(processedMaterials.reduce((sum, m) => sum + (m.cost || 0) * m.quantity, 0))}
                      </span>
                    </div>
                    
                    {/* Group materials by type */}
                    {(() => {
                      // Group materials by type with proper logging
                      console.log("Grouping materials by type...");
                      
                      // Add a test Glass material if needed (for development testing only)
                      /*
                      // This is commented out but can be used for testing if no glass materials exist
                      if (processedMaterials.length > 0 && !processedMaterials.some(m => m.type === 'Glass')) {
                        // Create a test glass material - USE FOR TESTING ONLY
                        const testGlass = {...processedMaterials[0], id: -999, name: "Test Window Glass", type: "Glass"};
                        processedMaterials.push(testGlass);
                      }
                      */
                      
                      const materialsByType = processedMaterials.reduce((acc, material) => {
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
                        
                        // Log each material's type for debugging
                        console.log(`Material ${material.id} - ${material.name}: type="${type}" (original: "${material.type}")`);
                        
                        // Create the array for this type if it doesn't exist
                        if (!acc[type]) {
                          acc[type] = [];
                        }
                        
                        // Add the material to the appropriate type
                        acc[type].push(material);
                        return acc;
                      }, {} as Record<string, Material[]>);
                      
                      // Log the resulting types for debugging
                      console.log("Material types:", Object.keys(materialsByType));
                      
                      return Object.entries(materialsByType).map(([type, materials]) => {
                        const totalValue = materials.reduce((sum, m) => sum + (m.cost || 0) * m.quantity, 0);
                        
                        return (
                          <Collapsible key={type} className="mb-4 border rounded-lg overflow-hidden">
                            <CollapsibleTrigger className="w-full text-left">
                              <div className="bg-slate-50 hover:bg-slate-100 p-3 border-b flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm">
                                    {type.toLowerCase().includes('building') && <Landmark className="h-4 w-4 text-[#6d4c41]" />}
                                    {type.toLowerCase().includes('electrical') && <Zap className="h-4 w-4 text-[#f9a825]" />}
                                    {type.toLowerCase().includes('plumbing') && <Droplet className="h-4 w-4 text-[#0288d1]" />}
                                    {type.toLowerCase().includes('hvac') && <Fan className="h-4 w-4 text-[#81c784]" />}
                                    {type.toLowerCase().includes('finishes') && <Paintbrush className="h-4 w-4 text-[#ec407a]" />}
                                    {type.toLowerCase().includes('tools') && <Hammer className="h-4 w-4 text-[#455a64]" />}
                                    {type.toLowerCase().includes('safety') && <HardHat className="h-4 w-4 text-[#ef6c00]" />}
                                    {type.toLowerCase().includes('glass') && <LayoutGrid className="h-4 w-4 text-[#03a9f4]" />}
                                    {(!type.toLowerCase().includes('building') && 
                                      !type.toLowerCase().includes('electrical') && 
                                      !type.toLowerCase().includes('plumbing') && 
                                      !type.toLowerCase().includes('hvac') && 
                                      !type.toLowerCase().includes('finishes') && 
                                      !type.toLowerCase().includes('tools') && 
                                      !type.toLowerCase().includes('safety') &&
                                      !type.toLowerCase().includes('glass')) && 
                                      <Package className="h-4 w-4 text-[#78909c]" />}
                                  </div>
                                  <h3 className="font-medium">{type}</h3>
                                </div>
                                <div className="flex items-center gap-4">
                                  <span className="text-sm text-slate-600">{materials.length} items</span>
                                  <span className="text-sm font-medium">{formatCurrency(totalValue)}</span>
                                </div>
                              </div>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                              <div className="p-4 grid grid-cols-1 gap-3">
                                {materials.map((material) => (
                                  <Card key={material.id}>
                                    <CardHeader className="p-4 pb-2">
                                      <div className="flex justify-between items-start">
                                        <CardTitle className="text-base">{material.name}</CardTitle>
                                        <div className="flex items-center gap-2">
                                          {material.tier && (
                                            <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                                              {material.tier}
                                            </span>
                                          )}
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
                                                onClick={() => {
                                                  setSelectedMaterial(material);
                                                  setEditDialogOpen(true);
                                                }}
                                              >
                                                <Edit className="h-4 w-4 mr-2" />
                                                Edit
                                              </DropdownMenuItem>
                                              <DropdownMenuSeparator />
                                              <DropdownMenuItem 
                                                onClick={() => {
                                                  if (window.confirm(`Are you sure you want to delete "${material.name}"?`)) {
                                                    deleteMaterialMutation.mutate(material.id);
                                                  }
                                                }}
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
                                        {material.tier2Category && (
                                          <div>
                                            <p className="text-muted-foreground">Subcategory:</p>
                                            <p className="font-medium">{material.tier2Category}</p>
                                          </div>
                                        )}
                                        {(material.section || material.subsection) && (
                                          <div>
                                            <p className="text-muted-foreground">Section:</p>
                                            <p className="font-medium">
                                              {material.section}{material.subsection ? ` - ${material.subsection}` : ''}
                                            </p>
                                          </div>
                                        )}
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
                            </CollapsibleContent>
                          </Collapsible>
                        );
                      });
                    })()}
                  </>
                ) : (
                  <div className="bg-white rounded-lg border p-6 text-center">
                    <Package className="h-10 w-10 text-slate-300 mx-auto" />
                    <h3 className="mt-2 text-lg font-medium">No Materials Found</h3>
                    <p className="text-slate-500 mt-1">Add materials to this project to see them here.</p>
                    <Button 
                      className="mt-4 bg-orange-500 hover:bg-orange-600" 
                      onClick={() => setCreateDialogOpen(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" /> Add Material
                    </Button>
                  </div>
                )}
              </div>
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
        preselectedTaskId={undefined} // No task preselected when adding material from main materials tab
      />
      
      <EditMaterialDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        material={selectedMaterial}
      />
      
      <ImportMaterialsDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        projectId={projectId}
      />
      
      <LinkSectionToTaskDialog
        open={linkSectionDialogOpen}
        onOpenChange={setLinkSectionDialogOpen}
        projectId={projectId}
        materialIds={sectionToLink?.materials.map(m => m.id) || []}
        onLinkToTask={handleCompleteTaskLinking}
        sectionName={sectionToLink ? `${sectionToLink.tier1} > ${sectionToLink.tier2} > ${sectionToLink.section}` : "Section"}
      />
    </div>
  );
}