import React, { useState, useEffect, useMemo } from "react";
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
  Copy,
  Trash,
  ChevronRight,
  ChevronDown,
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
  Paintbrush,
  Upload,
  FileSpreadsheet,
  Link as LinkIcon,
  ArrowRight,
  Calendar,
  User,
  Filter,
  X,
  Info,
  FileText
} from "lucide-react";

import { getStatusBorderColor, getStatusBgColor, formatTaskStatus, getCategoryColor } from "@/lib/color-utils";
import { formatCurrency, formatDate } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MaterialCard } from "@/components/materials/MaterialCard";
import { SupplierCard } from "@/components/suppliers/SupplierCard";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { CreateMaterialDialog } from "@/pages/materials/CreateMaterialDialog";
import { CreateQuoteDialog } from "@/pages/materials/CreateQuoteDialog";
import { EditMaterialDialog } from "@/pages/materials/EditMaterialDialog";
import { ImportMaterialsDialog } from "@/pages/materials/ImportMaterialsDialog";
import { EditQuoteDialog } from "@/components/materials/EditQuoteDialog";
import { TaskMaterialsView } from "@/components/materials/TaskMaterialsView";
import { TaskMaterials } from "@/components/task/TaskMaterials";
import { LinkSectionToTaskDialog } from "@/components/materials/LinkSectionToTaskDialog";
import { TypeSubtypeFilter } from "@/components/materials/TypeSubtypeFilter";
import { MaterialActionButtons } from "./MaterialListViewButtons";
import { AllQuotesView } from "./AllQuotesView";
import { BulkAssignMaterialDialog } from "@/components/materials/BulkAssignMaterialDialog";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useTier2CategoriesByTier1Name } from "@/hooks/useTemplateCategories";

// Using the SimplifiedMaterial type from MaterialCard
import { SimplifiedMaterial } from "@/components/materials/MaterialCard";
// This represents the Material type from our component's perspective
type Material = SimplifiedMaterial;

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
  hideTopButton?: boolean;
  searchQuery?: string;
}

export function ResourcesTab({ projectId, hideTopButton = false, searchQuery = "" }: ResourcesTabProps) {
  // Use external searchQuery instead of internal searchTerm
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createQuoteDialogOpen, setCreateQuoteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editQuoteDialogOpen, setEditQuoteDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [linkSectionDialogOpen, setLinkSectionDialogOpen] = useState(false);
  const [sectionToLink, setSectionToLink] = useState<SectionToLink | null>(null);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [selectedQuoteMaterials, setSelectedQuoteMaterials] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "categories" | "hierarchy" | "type" | "supplier">("list");
  const [expandedTaskId, setExpandedTaskId] = useState<number | null>(null);
  const [bulkAssignDialogOpen, setBulkAssignDialogOpen] = useState(false);
  const [materialForBulkAssign, setMaterialForBulkAssign] = useState<Material | null>(null);
  const [selectedTaskForMaterial, setSelectedTaskForMaterial] = useState<any | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Fetch categories from admin panel
  const { data: tier2ByTier1Name, tier1Categories: dbTier1Categories, tier2Categories: dbTier2Categories } = useTier2CategoriesByTier1Name(projectId);
  
  // State for the enhanced Materials List View
  const [selectedTaskFilter, setSelectedTaskFilter] = useState<string | null>(null);
  const [selectedSupplierFilter, setSelectedSupplierFilter] = useState<string | null>(null);
  const [selectedMaterialIds, setSelectedMaterialIds] = useState<number[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  
  // State for type/subtype/section/subsection filtering
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedSubtype, setSelectedSubtype] = useState<string | null>(null);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [selectedSubsection, setSelectedSubsection] = useState<string | null>(null);
  
  // Handler for editing a quote with all its materials
  const handleEditQuote = (materials: any[]) => {
    if (materials.length === 0) {
      toast({
        title: "No materials in quote",
        description: "This quote has no materials to edit.",
        variant: "destructive",
      });
      return;
    }
    
    // Store the materials from this quote for editing
    setSelectedQuoteMaterials(materials);
    setEditQuoteDialogOpen(true);
  };

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
      // Find the material before deleting it to check its task IDs
      const materialToDelete = processedMaterials?.find(m => m.id === materialId);
      console.log('Deleting material with task IDs:', materialToDelete?.taskIds);
      
      // Perform the deletion
      const response = await fetch(`/api/materials/${materialId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete material');
      }
      
      // Return both the ID and the task IDs for reference
      return {
        materialId,
        taskIds: materialToDelete?.taskIds || []
      };
    },
    onSuccess: (result) => {
      // Invalidate material queries to refresh the list
      queryClient.invalidateQueries({ queryKey: ['/api/materials'] });
      if (projectId) {
        queryClient.invalidateQueries({ queryKey: ['/api/projects', projectId, 'materials'] });
      }
      
      console.log('Successfully deleted material ID:', result.materialId);
      console.log('Task IDs that might need refresh:', result.taskIds);
      
      // This will force React to re-fetch data and update our filters
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      
      // Show success toast
      toast({
        title: 'Material deleted',
        description: 'The material has been deleted successfully.'
      });
    },
    onError: (error) => {
      console.error('Error deleting material:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete material. Please try again.',
        variant: 'destructive',
      });
    }
  });
  
  // Handler for bulk assignment of material to tier 2 category
  const handleBulkAssignToCategory = (material: Material) => {
    setMaterialForBulkAssign(material);
    setBulkAssignDialogOpen(true);
  };
  
  // Bulk Delete materials mutation with enhanced filter handling
  const bulkDeleteMaterialsMutation = useMutation({
    mutationFn: async (materialIds: number[]) => {
      // Collect task IDs from all materials being deleted for filtering updates
      const affectedTaskIds: number[] = [];
      const materialsToDelete = processedMaterials?.filter(m => materialIds.includes(m.id)) || [];
      
      console.log(`Preparing to delete ${materialIds.length} materials`);
      
      // Get affected task IDs before deletion
      materialsToDelete.forEach(material => {
        if (material.taskIds && material.taskIds.length > 0) {
          material.taskIds.forEach(taskId => {
            const numTaskId = Number(taskId);
            if (!affectedTaskIds.includes(numTaskId)) {
              affectedTaskIds.push(numTaskId);
            }
          });
        }
      });
      
      console.log('Bulk deletion affects task IDs:', affectedTaskIds);
      
      // Process each deletion sequentially
      const results = [];
      for (const id of materialIds) {
        try {
          const response = await fetch(`/api/materials/${id}`, {
            method: 'DELETE',
          });
          
          if (!response.ok) {
            throw new Error(`Failed to delete material ${id}`);
          }
          
          results.push(id);
        } catch (error) {
          console.error(`Error deleting material ${id}:`, error);
        }
      }
      
      return {
        deletedIds: results,
        affectedTaskIds
      };
    },
    onSuccess: (result) => {
      // Log details for debugging
      console.log(`Successfully deleted ${result.deletedIds.length} materials`);
      console.log('Affected task IDs:', result.affectedTaskIds);
      
      // Check if the selected task filter is in the affected task IDs
      if (selectedTaskFilter && result.affectedTaskIds.includes(Number(selectedTaskFilter))) {
        console.log('Selected task filter was affected by deletion:', selectedTaskFilter);
      }
      
      // Invalidate material queries to refresh the list
      queryClient.invalidateQueries({ queryKey: ['/api/materials'] });
      if (projectId) {
        queryClient.invalidateQueries({ queryKey: ['/api/projects', projectId, 'materials'] });
      }
      
      // Also refresh tasks to update our filters
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      
      // Clear selected materials after successful deletion
      setSelectedMaterialIds([]);
      
      // Show success message
      toast({
        title: "Materials Deleted",
        description: `Successfully deleted ${result.deletedIds.length} materials.`,
      });
    },
    onError: (error) => {
      console.error('Error in bulk delete:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete some materials. Please try again.',
        variant: 'destructive',
      });
    }
  });

  // Process materials for display (using actual category field from database)
  // Use useMemo to recalculate processed materials only when materials array changes
  const processedMaterials = useMemo(() => {
    return materials?.map(material => ({
      ...material,
      unit: material.unit || "pieces", // Default unit if not provided
      cost: material.cost || 25.00, // Default cost if not provided
      // Use the category field directly, only fall back to derived category if missing
      category: material.category || getCategory(material.type),
    }));
  }, [materials]);

  // Group materials by category - updates when processedMaterials changes
  const materialsByCategory = useMemo(() => {
    return processedMaterials?.reduce((acc, material) => {
      const category = material.category || 'Other';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(material);
      return acc;
    }, {} as Record<string, Material[]>) || {};
  }, [processedMaterials]);
  
  // Function to get supplier info from material
  const getSupplierForMaterial = (material: Material) => {
    if (!material) return null;
    
    // If material has a direct supplier attribute
    if (material.supplier) {
      return {
        id: material.supplierId || 0,
        name: material.supplier,
        company: material.supplier,
        category: material.type || 'Building Material',
        initials: material.supplier?.charAt(0),
      };
    }
    
    // If material only has supplierId but not supplier name
    if (material.supplierId && !material.supplier) {
      return {
        id: material.supplierId,
        name: `Supplier ${material.supplierId}`,
        company: `ID: ${material.supplierId}`,
        category: material.type || 'Building Material',
        initials: 'S',
      };
    }
    
    return null;
  };
  
  // Group materials by supplier - updates when processed materials changes
  const materialsBySupplier = useMemo(() => {
    if (!processedMaterials) return {};
    
    const supplierGroups: Record<string, {
      supplier: {
        id: number;
        name: string;
        company?: string;
        category?: string;
        initials?: string;
      } | null;
      materials: Material[];
    }> = {};
    
    processedMaterials.forEach(material => {
      // Generate a unique key for the supplier
      const supplierKey = material.supplier || material.supplierId?.toString() || 'unknown';
      
      // Initialize the group if needed
      if (!supplierGroups[supplierKey]) {
        const supplierInfo = getSupplierForMaterial(material);
        supplierGroups[supplierKey] = {
          supplier: supplierInfo,
          materials: []
        };
      }
      
      // Add the material to the group
      supplierGroups[supplierKey].materials.push(material);
    });
    
    return supplierGroups;
  }, [processedMaterials]);
  
  // Group materials by type
  const materialsByType = useMemo(() => {
    return processedMaterials?.reduce((acc, material) => {
      const type = material.type || 'Other';
      if (!acc[type]) {
        acc[type] = [];
      }
      acc[type].push(material);
      return acc;
    }, {} as Record<string, Material[]>) || {};
  }, [processedMaterials]);
  
  // Helper function to get subtypes for a type
  const getSubtypesForType = (type: string, materialsByType: Record<string, Material[]>): string[] => {
    const materialsOfType = materialsByType[type] || [];
    
    // Get all unique categories (subtypes) that exist in the materials
    const subtypes = Array.from(new Set(materialsOfType
      .map(m => m.category)
      .filter((category): category is string => Boolean(category))
    ));
    
    return subtypes;
  };
  
  // Helper function to get sections based on selected filters
  const getSections = (materials: Material[] | undefined, selectedType: string | null, selectedSubtype: string | null): string[] => {
    if (!materials) return [];
    
    // Filter materials by type and subtype
    let filtered = [...materials];
    
    if (selectedType) {
      filtered = filtered.filter(m => m.type === selectedType);
    }
    
    if (selectedSubtype) {
      filtered = filtered.filter(m => m.category === selectedSubtype);
    }
    
    // Get all unique sections that exist in the materials
    const sections = Array.from(new Set(filtered
      .map(m => m.section)
      .filter((section): section is string => Boolean(section))
    ));
    
    return sections;
  };
  
  // Helper function to get subsections for a section
  const getSubsections = (materials: Material[] | undefined, selectedSection: string): string[] => {
    if (!materials) return [];
    
    // Filter materials by section
    const filtered = materials.filter(m => m.section === selectedSection);
    
    // Get all unique subsections that exist in the materials
    const subsections = Array.from(new Set(filtered
      .map(m => m.subsection)
      .filter((subsection): subsection is string => Boolean(subsection))
    ));
    
    return subsections;
  };
  
  // Use dynamic tier1 categories from admin panel, fallback to hardcoded if not loaded
  const tier1Categories = dbTier1Categories?.map(cat => cat.name) || ['Structural', 'Systems', 'Sheathing', 'Finishings', 'Other'];

  // Helper function to handle material duplication
  const handleDuplicateMaterial = (material: Material | SimplifiedMaterial) => {
    console.log("Duplicating material with all fields:", material);
    
    // Create a copy of the material without the ID to force creating a new one
    const duplicatedMaterial = {
      ...material,
      name: `${material.name} (Copy)`,
      // Explicitly preserve all important fields
      type: material.type,
      category: material.category,
      tier: material.tier || material.tier1Category,
      tier1Category: material.tier || material.tier1Category,
      tier2Category: material.tier2Category,
      section: material.section,
      subsection: material.subsection,
      quantity: material.quantity,
      supplier: material.supplier,
      supplierId: material.supplierId,
      status: material.status,
      unit: material.unit,
      cost: material.cost,
      details: material.details, // This preserves the description/details
      materialSize: material.materialSize,
      taskIds: material.taskIds,
      contactIds: material.contactIds,
      isQuote: material.isQuote,
      quoteDate: material.quoteDate,
      quoteNumber: material.quoteNumber,
      orderDate: material.orderDate,
      projectId: material.projectId,
      // Remove ID so it creates a new material
      id: undefined
    };
    
    console.log("Duplicated material data:", duplicatedMaterial);
    setSelectedMaterial(duplicatedMaterial);
    setSelectedTaskForMaterial(null); // Clear task selection for material duplication
    setCreateDialogOpen(true);
  };
  
  // Use dynamic tier2 categories from admin panel, fallback to hardcoded if not loaded
  const predefinedTier2CategoriesByTier1: Record<string, string[]> = tier2ByTier1Name || {
    'structural': ['foundation', 'framing', 'roofing'],
    'systems': ['electrical', 'plumbing', 'hvac'],
    'sheathing': ['insulation', 'drywall', 'siding'],
    'finishings': ['windows', 'doors', 'cabinets', 'fixtures', 'flooring'],
    'other': ['permits', 'other']
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
    // Check for both camelCase and snake_case field names
    if (task.tier2_category || task.tier2Category) {
      // Normalize the category
      const category = task.tier2_category || task.tier2Category || '';
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
  
  // Map materials to their appropriate tier1 category - updates when processedMaterials changes
  const materialsByTier1 = useMemo(() => {
    return processedMaterials?.reduce((acc, material) => {
      const tier1 = getMaterialTier1(material);
      
      if (!acc[tier1]) {
        acc[tier1] = [];
      }
      
      acc[tier1].push(material);
      return acc;
    }, {} as Record<string, Material[]>) || {};
  }, [processedMaterials]);

  // Get all unique suppliers for filter options
  // Use useMemo to recalculate unique suppliers when processedMaterials changes
  const uniqueSuppliers = useMemo(() => {
    return Array.from(new Set(
      processedMaterials?.map(m => m.supplier || "unknown") || []
    )).filter(supplier => supplier !== "unknown").sort();
  }, [processedMaterials]);
  
  // Update selected supplier filter when suppliers change
  useEffect(() => {
    // If the selected supplier no longer exists in any materials, reset it
    if (selectedSupplierFilter && 
        selectedSupplierFilter !== "unknown" && 
        !uniqueSuppliers.includes(selectedSupplierFilter)) {
      console.log('Resetting supplier filter because selected supplier no longer exists in materials');
      setSelectedSupplierFilter(null);
    }
  }, [uniqueSuppliers, selectedSupplierFilter]);

  // We don't need a separate materialsWithTaskIds variable since we're processing all materials directly
  
  // Track task IDs found in materials
  // This approach uses the direct task IDs from materials rather than a derived set
  const [availableTaskIds, setAvailableTaskIds] = useState<number[]>([]);
  
  // Update available task IDs whenever materials change
  useEffect(() => {
    if (!processedMaterials) return;
    
    // Collect all task IDs from all materials
    const allIds: number[] = [];
    processedMaterials.forEach(material => {
      if (material.taskIds && material.taskIds.length > 0) {
        material.taskIds.forEach(id => {
          const numId = Number(id);
          if (!allIds.includes(numId)) {
            allIds.push(numId);
          }
        });
      }
    });
    
    // Sort the IDs for easier comparison
    allIds.sort((a, b) => a - b);
    
    console.log('Available task IDs from materials:', allIds.join(','));
    
    // Update state with the new IDs
    setAvailableTaskIds(allIds);
    
    // Reset the task filter if it's no longer in the available task IDs
    if (selectedTaskFilter && !allIds.includes(Number(selectedTaskFilter))) {
      console.log('Resetting task filter because selected task no longer exists in materials:', selectedTaskFilter);
      setSelectedTaskFilter(null);
    }
  }, [processedMaterials, selectedTaskFilter]);
  
  // Create a Set from the array for faster lookups in other functions
  const allTaskIds = useMemo(() => new Set(availableTaskIds), [availableTaskIds]);
  
  // Create task lookup for filter dropdown - updates when tasks or allTaskIds changes
  const taskLookup = useMemo(() => {
    const lookup: Record<number, string> = {};
    tasks.forEach(task => {
      if (allTaskIds.has(task.id)) {
        lookup[task.id] = task.title;
      }
    });
    return lookup;
  }, [allTaskIds, tasks]); // Recalculate when taskIds or tasks change
  
  // Sort task IDs by title for the dropdown - updates when allTaskIds or taskLookup changes
  const sortedTaskIds = useMemo(() => {
    return Array.from(allTaskIds).sort((a, b) => {
      const titleA = taskLookup[a] || '';
      const titleB = taskLookup[b] || '';
      return titleA.localeCompare(titleB);
    });
  }, [allTaskIds, taskLookup]); // Recalculate when taskIds or lookups change
  
  // DEBUGGING FUNCTION - log material task details for a specific task ID
  useEffect(() => {
    if (selectedTaskFilter) {
      const targetTaskId = Number(selectedTaskFilter);
      const materialsWithThisTask = processedMaterials?.filter(m => 
        m.taskIds && m.taskIds.includes(targetTaskId)
      ) || [];
      
      console.log(`Filtered Materials with Task ID ${targetTaskId}:`, 
        materialsWithThisTask.map(m => ({ id: m.id, name: m.name, taskIds: m.taskIds }))
      );
    }
  }, [selectedTaskFilter, processedMaterials]);
  
  // Enhanced approach to filtering materials with type, subtype, section, subsection support
  const filteredMaterials = useMemo(() => {
    if (!processedMaterials) return [];
    
    // Start with all materials
    let filtered = [...processedMaterials];
    
    // Apply type filter if selected
    if (selectedType) {
      filtered = filtered.filter(m => m.type === selectedType);
    }
    
    // Apply subtype (category) filter if selected
    if (selectedSubtype) {
      filtered = filtered.filter(m => m.category === selectedSubtype);
    } else if (selectedCategory) {
      // Legacy category filter (keep for backward compatibility)
      filtered = filtered.filter(m => m.category === selectedCategory);
    }
    
    // Apply section filter if selected
    if (selectedSection) {
      filtered = filtered.filter(m => m.section === selectedSection);
    }
    
    // Apply subsection filter if selected
    if (selectedSubsection) {
      filtered = filtered.filter(m => m.subsection === selectedSubsection);
    }
    
    // Apply task filter if selected (not "all_tasks")
    if (selectedTaskFilter) {
      const taskId = Number(selectedTaskFilter);
      console.log(`Applying task filter for task ID: ${taskId}`);
      
      filtered = filtered.filter(material => {
        // Check if material has taskIds array and if it includes the selected task
        const hasTask = material.taskIds && 
                       Array.isArray(material.taskIds) && 
                       material.taskIds.some(id => Number(id) === taskId);
        
        // Debug output for each material
        if (hasTask) {
          console.log(`Material ${material.id} (${material.name}) passed task filter for task ${taskId}`);
        }
        
        return hasTask;
      });
      
      console.log(`After task filter, ${filtered.length} materials remain`);
    }
    
    // Apply supplier filter if selected (not "all_suppliers")
    if (selectedSupplierFilter) {
      if (selectedSupplierFilter === "unknown") {
        // Special case for "unknown" supplier
        filtered = filtered.filter(m => !m.supplier || m.supplier === "");
      } else {
        // Normal supplier matching
        filtered = filtered.filter(m => m.supplier === selectedSupplierFilter);
      }
    }
    
    // Apply search query filter if present
    if (searchQuery) {
      const searchQueryLower = searchQuery.toLowerCase();
      filtered = filtered.filter(material => (
        material.name.toLowerCase().includes(searchQueryLower) ||
        material.type.toLowerCase().includes(searchQueryLower) ||
        material.status.toLowerCase().includes(searchQueryLower) ||
        (material.supplier && material.supplier.toLowerCase().includes(searchQueryLower)) ||
        (material.category && material.category.toLowerCase().includes(searchQueryLower)) ||
        (material.tier && material.tier.toLowerCase().includes(searchQueryLower)) ||
        (material.tier2Category && material.tier2Category.toLowerCase().includes(searchQueryLower)) ||
        (material.section && material.section.toLowerCase().includes(searchQueryLower)) ||
        (material.subsection && material.subsection.toLowerCase().includes(searchQueryLower))
      ));
    }
    
    return filtered;
  }, [
    processedMaterials, 
    selectedType,
    selectedSubtype,
    selectedSection,
    selectedSubsection,
    selectedCategory, 
    selectedTaskFilter, 
    selectedSupplierFilter,
    searchQuery
  ]);

  // Generate inventory data based on materials - recalculate when processedMaterials changes
  const inventoryItems = useMemo(() => {
    return processedMaterials?.map(material => ({
      id: material.id,
      name: material.name,
      ordered: material.quantity * 1.5, // Ordered more than needed
      delivered: material.quantity, // All have been delivered
      used: material.quantity * 0.6, // Using 60% as placeholder
      unit: material.unit || "pieces"
    })) || [];
  }, [processedMaterials]);

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
        return 'bg-gradient-to-r from-stone-500 to-stone-600';
      case 'wood':
        return 'bg-gradient-to-r from-amber-500 to-amber-600';
      case 'electrical':
        return 'bg-gradient-to-r from-blue-500 to-blue-600';
      case 'plumbing':
        return 'bg-gradient-to-r from-cyan-500 to-cyan-600';
      case 'tools':
      case 'equipment':
        return 'bg-gradient-to-r from-gray-500 to-gray-600';
      case 'metal':
      case 'structural':
        return 'bg-gradient-to-r from-orange-500 to-orange-600';
      case 'glass':
      case 'interior':
        return 'bg-gradient-to-r from-orange-500 to-orange-600';
      case 'finishing':
      case 'finishings':
        return 'bg-gradient-to-r from-purple-500 to-purple-600';
      case 'insulation':
      case 'sheathing':
        return 'bg-gradient-to-r from-green-500 to-green-600';
      case 'roofing':
        return 'bg-gradient-to-r from-red-500 to-red-600';
      case 'hvac':
      case 'systems':
        return 'bg-gradient-to-r from-blue-500 to-blue-600';
      default:
        return 'bg-gradient-to-r from-slate-500 to-slate-600';
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
  
  // Get tier1 color from admin panel data
  const getTier1Color = (tier1: string) => {
    if (!tier1 || !dbTier1Categories) return '#6B7280'; // gray-500 fallback
    
    const category = dbTier1Categories.find((cat: any) => 
      cat.name.toLowerCase() === tier1.toLowerCase()
    );
    
    return category?.color || '#6B7280';
  };

  // Get tier1 icon background color - using admin panel colors
  const getTier1Background = (tier1: string) => {
    // Return the actual color from admin panel for inline styling
    return getTier1Color(tier1);
  };
  
  // Get tier2 icon background color using Tailwind classes
  const getTier2Background = (tier2: string) => {
    if (!tier2) return 'bg-slate-200';
    
    const lowerTier2 = tier2.toLowerCase();
    
    // Use specific Tailwind background colors based on tier2 category
    switch (lowerTier2) {
      case 'foundation':
        return 'bg-amber-100';
      case 'roofing':
        return 'bg-red-100';
      case 'framing':
        return 'bg-yellow-100';
      case 'lumber':
        return 'bg-orange-100';
      case 'shingles':
        return 'bg-rose-100';
      case 'plumbing':
        return 'bg-cyan-100';
      case 'electrical':
        return 'bg-blue-100';
      case 'hvac':
        return 'bg-sky-100';
      case 'drywall':
        return 'bg-neutral-100';
      case 'insulation':
        return 'bg-emerald-100';
      case 'exteriors':
        return 'bg-lime-100';
      case 'siding':
        return 'bg-green-100';
      case 'windows':
        return 'bg-indigo-100';
      case 'cabinets':
        return 'bg-violet-100';
      case 'flooring':
        return 'bg-purple-100';
      case 'doors':
        return 'bg-fuchsia-100';
      case 'fixtures':
        return 'bg-pink-100';
      case 'paint':
        return 'bg-teal-100';
      default:
        return 'bg-slate-100';
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
          {[1, 2, 3].map((i: number) => (
            <div key={i} className="h-40 w-full bg-slate-50 rounded-md animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {/* Action Buttons */}
        <div className="flex justify-end gap-2 mb-4">
          {projectId && (
            <Button 
              variant="outline"
              className="border-amber-500 text-amber-600 hover:bg-amber-50"
              onClick={() => setImportDialogOpen(true)}
            >
              <FileSpreadsheet className="mr-2 h-4 w-4" /> Import CSV
            </Button>
          )}
          {!hideTopButton && (
            <>
              <Button 
                id="create-quote-btn"
                className="bg-blue-500 hover:bg-blue-600"
                onClick={() => setCreateQuoteDialogOpen(true)}
              >
                <FileText className="mr-2 h-4 w-4" /> Add Quote
              </Button>
              <Button 
                id="create-material-btn"
                className="bg-amber-500 hover:bg-amber-600"
                onClick={() => {
                  setSelectedTaskForMaterial(null); // Clear task selection for general material creation
                  setCreateDialogOpen(true);
                }}
              >
                <Plus className="mr-2 h-4 w-4" /> Add Material
              </Button>
            </>
          )}
      </div>

      {/* Search functionality moved to page header */}

      {/* Main Tabs */}
      <Tabs defaultValue="materials">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="materials">Materials</TabsTrigger>
          <TabsTrigger value="all-quotes">All Quotes View</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
        </TabsList>

        <TabsContent value="materials" className="mt-4">
          <div className="space-y-4">
            {/* View Mode Tabs */}
            <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as "list" | "categories" | "hierarchy" | "supplier")}>
              <TabsList className="grid w-full grid-cols-3 bg-orange-50/50 border-orange-300">
                <TabsTrigger 
                  value="hierarchy" 
                  className="data-[state=active]:bg-white data-[state=active]:text-orange-700"
                >
                  Hierarchy
                </TabsTrigger>
                <TabsTrigger 
                  value="list" 
                  className="data-[state=active]:bg-white data-[state=active]:text-orange-700"
                >
                  List View
                </TabsTrigger>
                <TabsTrigger 
                  value="supplier" 
                  className="data-[state=active]:bg-white data-[state=active]:text-orange-700"
                >
                  Supplier View
                </TabsTrigger>
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
                        <div 
                          className="flex flex-col space-y-1.5 p-6 rounded-t-lg"
                          style={{ backgroundColor: getTier1Background(tier1) }}
                        >
                          <div className="flex justify-center py-4">
                            <div className="p-3 rounded-full bg-white/20">
                              {getTier1Icon(tier1, "h-10 w-10 text-white")}
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
                      className="px-2 py-1 rounded-full text-sm font-medium flex items-center gap-1 hover:brightness-95 text-white"
                      style={{ backgroundColor: getTier1Background(selectedTier1) }}
                    >
                      {getTier1Icon(selectedTier1, "h-4 w-4 text-white")}
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

                      // Calculate total cost of materials for this tier2 category
                      const totalMaterialsCost = processedMaterials?.reduce((sum, material) => {
                        // Check if this material belongs to tasks in this category
                        const isLinkedToCategory = materialsForTaskIds.has(material.id.toString()) || 
                                                 materialsForTaskIds.has(material.id) ||
                                                 // Also include materials that match tier/category directly
                                                 ((material.tier?.toLowerCase() === selectedTier1?.toLowerCase() || 
                                                   material.tier?.toLowerCase() === selectedTier1?.slice(0, -1).toLowerCase()) && 
                                                  material.tier2Category?.toLowerCase() === tier2?.toLowerCase());
        
                        if (isLinkedToCategory) {
                          return sum + (material.cost || 0) * (material.quantity || 0);
                        }
                        return sum;
                      }, 0) || 0;
                      
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
                              <div className="mt-2 flex justify-between items-center">
                                <span className="text-sm font-medium text-slate-600">Total Cost:</span>
                                <span className="text-sm font-semibold text-green-700">
                                  {formatCurrency(totalMaterialsCost)}
                                </span>
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
                        className="px-2 py-1 rounded-full text-sm font-medium flex items-center gap-1 hover:brightness-95 text-white"
                        style={{ backgroundColor: getTier1Background(selectedTier1) }}
                      >
                        {getTier1Icon(selectedTier1, "h-4 w-4 text-white")}
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
                      // Track seen templates to avoid duplicates
                      const templatesSeen = new Set();
                      
                      // Process tasks and gather material IDs
                      tasksInCategory.forEach((task: any) => {
                        // Check for both material_ids (snake_case from DB) and materialIds (camelCase in JS)
                        const materialIds = task.material_ids || task.materialIds;
                        if (materialIds) {
                          (Array.isArray(materialIds) ? materialIds : []).forEach((id: string | number) => {
                            console.log(`Adding material ID ${id} from task ${task.id} (${task.title})`);
                            allTaskMaterialIds.add(id);
                          });
                        }
                      });
                      
                      // Debug log to make sure we found all material IDs
                      console.log(`Found ${allTaskMaterialIds.size} material IDs for tasks in ${selectedTier1} > ${selectedTier2}`);
                      
                      // Get all materials that belong to this tier1/tier2 category
                      const categoryMaterials = processedMaterials?.filter(m => 
                        (m.tier?.toLowerCase() === selectedTier1?.toLowerCase() || 
                         m.tier?.toLowerCase() === selectedTier1?.slice(0, -1).toLowerCase()) && // Handle "Finishings" vs "Finishing" 
                        (m.tier2Category?.toLowerCase() === selectedTier2?.toLowerCase()) ||
                        // Also include materials that are linked to tasks in this category
                        allTaskMaterialIds.has(m.id.toString()) || allTaskMaterialIds.has(m.id)
                      ) || [];
                      
                      // Even if no materials are found, we'll still display tasks
                      if (categoryMaterials.length === 0 && tasksInCategory.length === 0) {
                        return (
                          <div className="text-center py-10 bg-white rounded-lg border">
                            <Package className="mx-auto h-12 w-12 text-slate-300" />
                            <h3 className="mt-2 font-medium">No Materials or Tasks Found</h3>
                            <p className="text-slate-500 mt-1">No materials or tasks have been added to the {selectedTier2} category</p>
                          </div>
                        );
                      }
                      
                      // First, show unassigned materials
                      const unlinkedMaterials = categoryMaterials.filter(material => 
                        !material.taskIds || material.taskIds.length === 0
                      );
                      
                      // Group materials by task
                      const materialsByTask: Record<string, Material[]> = {};
                      
                      // Share the previously created template tracking
                      
                      // Always include ALL tasks in the category, even if they have no materials yet
                      tasksInCategory.forEach((task: any) => {
                        const taskId = task.id.toString();
                        
                        // Skip if we've already processed this template
                        const templateId = task.templateId || task.template_id;
                        if (templateId && templatesSeen.has(templateId)) {
                          console.log(`Skipping duplicate template task ${templateId} with ID ${task.id}`);
                          return;
                        }
                        
                        // Mark this template as seen
                        if (templateId) {
                          templatesSeen.add(templateId);
                        }
                        
                        // Check both material_ids (snake_case) and materialIds (camelCase)
                        const taskMaterialIds = Array.isArray(task.material_ids) ? task.material_ids : 
                                              (Array.isArray(task.materialIds) ? task.materialIds : []);
                        
                        console.log(`Task ${taskId} (${task.title}) has material IDs:`, taskMaterialIds);
                        
                        // Get materials for this task
                        const taskMaterials = categoryMaterials.filter(m => {
                          const isLinkedToTask = taskMaterialIds.includes(m.id.toString()) || 
                                               taskMaterialIds.includes(m.id);
                          
                          if (isLinkedToTask) {
                            console.log(`Material ${m.id} (${m.name}) is linked to task ${taskId}`);
                          }
                          
                          return isLinkedToTask;
                        });
                        
                        // Always add the task, even if it has no materials
                        materialsByTask[taskId] = taskMaterials;
                        console.log(`Added ${taskMaterials.length} materials to task ${taskId}`);
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
                                                      <MaterialCard 
  key={material.id}
  material={material}
  onEdit={(mat) => {
    setSelectedMaterial(mat);
    setEditDialogOpen(true);
  }}
  onDelete={(materialId) => {
    if (window.confirm(`Are you sure you want to delete this material?`)) {
      deleteMaterialMutation.mutate(materialId);
    }
  }}
/>
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
                              <div key={task.id} className="border rounded-lg overflow-hidden mb-4">
                                {/* Task Header - Always Visible */}
                                <div className={`border-l-4 ${task.status === 'completed' ? 'border-green-500' : 
                                  task.status === 'in_progress' ? 'border-blue-500' : 
                                  task.status === 'pending' ? 'border-amber-500' : 'border-gray-300'}`}>
                                  <div className="p-4 flex flex-wrap justify-between items-start gap-2 bg-white">
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
                                      
                                      {/* Show task description - Collapsible */}
                                      {task.description && (
                                        <div className="mt-3">
                                          <Collapsible>
                                            <CollapsibleTrigger className="w-full text-left">
                                              <div className="flex items-center text-sm text-blue-700">
                                                <ChevronRight className="h-4 w-4 mr-1 transition-transform duration-200 group-data-[state=open]:rotate-90" />
                                                <span className="font-medium">Description</span>
                                              </div>
                                            </CollapsibleTrigger>
                                            <CollapsibleContent>
                                              <div className="mt-2 p-3 bg-slate-50 text-sm text-slate-700 rounded-md border border-slate-200">
                                                {task.description.split('\n').map((line: string, i: number) => (
                                                  <p key={i} className={i > 0 ? 'mt-2' : ''}>{line}</p>
                                                ))}
                                              </div>
                                            </CollapsibleContent>
                                          </Collapsible>
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
                                    </div>
                                  </div>
                                </div>

                                {/* Task Materials - Always Expanded */}
                                <div className="border-t p-4 bg-slate-50">
                                  <div className="flex justify-between items-center mb-3">
                                    <h4 className="font-medium text-orange-700 flex items-center">
                                      <Package className="h-4 w-4 mr-1" /> 
                                      Materials for this Task
                                    </h4>
                                    <Button
                                      size="sm"
                                      className="hover:bg-orange-600 text-white bg-[#c2410c]"
                                      onClick={() => {
                                        setSelectedMaterial(null);
                                        setSelectedTaskForMaterial(task);
                                        setCreateDialogOpen(true);
                                      }}
                                    >
                                      <Plus className="h-3.5 w-3.5 mr-1" /> Add Material to Task
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
                                                      <MaterialCard 
  key={material.id}
  material={material}
  onEdit={(mat) => {
    setSelectedMaterial(mat);
    setEditDialogOpen(true);
  }}
  onDelete={(materialId) => {
    if (window.confirm(`Are you sure you want to delete this material?`)) {
      deleteMaterialMutation.mutate(materialId);
    }
  }}
/>
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
                              </div>
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
                                            <MaterialCard 
  key={material.id}
  material={material}
  onEdit={(mat) => {
    setSelectedMaterial(mat);
    setEditDialogOpen(true);
  }}
  onDelete={(materialId) => {
    if (window.confirm(`Are you sure you want to delete this material?`)) {
      deleteMaterialMutation.mutate(materialId);
    }
  }}
/>
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
                    {/* Use TaskMaterials for consistent orange styling */}
                    <TaskMaterials taskId={Number(selectedTaskFilter)} compact={false} />
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
                            <div className="p-3 rounded-full bg-white/20">
                              {getCategoryIcon(category, "h-8 w-8 text-white")}
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
                  
                  {/* Group materials by supplier with collapsible supplier cards */}
                  {(() => {
                    // If no materials, display a message
                    if (!filteredMaterials || filteredMaterials.length === 0) {
                      return (
                        <div className="text-center py-6">
                          <Package className="h-12 w-12 mx-auto text-slate-300 mb-2" />
                          <h3 className="text-sm font-medium text-slate-700">No Materials</h3>
                          <p className="text-xs text-slate-500 mt-1">No materials found with the current filters.</p>
                        </div>
                      );
                    }
                    
                    // Filter our materialsBySupplier to only include the filtered materials
                    const filteredIds = new Set(filteredMaterials.map(m => m.id));
                    const filteredSupplierGroups: Record<string, {
                      supplier: any;
                      materials: Material[];
                    }> = {};
                    
                    // Recreate the supplier groups with only the filtered materials
                    filteredMaterials.forEach(material => {
                      const supplierKey = material.supplier || material.supplierId?.toString() || 'unknown';
                      
                      if (!filteredSupplierGroups[supplierKey]) {
                        const supplierInfo = getSupplierForMaterial(material);
                        filteredSupplierGroups[supplierKey] = {
                          supplier: supplierInfo,
                          materials: []
                        };
                      }
                      
                      filteredSupplierGroups[supplierKey].materials.push(material);
                    });
                    
                    // Return supplier cards with collapsible material sections
                    return (
                      <div className="space-y-4">
                        {Object.entries(filteredSupplierGroups).map(([key, group]) => {
                          const supplierName = group.supplier?.name || 'Unknown Supplier';
                          const materialCount = group.materials.length;
                          const totalValue = group.materials.reduce((sum, m) => sum + (m.cost || 0) * m.quantity, 0);
                          
                          return (
                            <Collapsible key={key} className="w-full">
                              {/* Supplier Card as Collapsible Trigger */}
                              <CollapsibleTrigger className="w-full">
                                <Card className="bg-white shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
                                  <div className="p-3 border-b border-slate-200 flex justify-between items-center">
                                    <div className="flex items-center">
                                      <div className="h-9 w-9 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-medium">
                                        {group.supplier?.initials || supplierName.charAt(0)}
                                      </div>
                                      <div className="ml-3">
                                        <h3 className="text-sm font-medium">{supplierName}</h3>
                                        <p className="text-xs text-slate-500">
                                          {materialCount} {materialCount === 1 ? 'material' : 'materials'} • {formatCurrency(totalValue)}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {group.supplier?.category && (
                                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                          {group.supplier.category}
                                        </Badge>
                                      )}
                                      <ChevronRight className="h-5 w-5 text-slate-400 transition-transform" />
                                    </div>
                                  </div>
                                </Card>
                              </CollapsibleTrigger>
                              
                              {/* Material Cards inside Collapsible Content */}
                              <CollapsibleContent>
                                <div className="pl-3 pr-1 pt-2 space-y-2">
                                  {group.materials.map((material) => (
                                    <MaterialCard 
                                      key={material.id}
                                      material={material}
                                      onEdit={(mat) => {
                                        setSelectedMaterial(mat);
                                        setEditDialogOpen(true);
                                      }}
                                      onDelete={(materialId) => {
                                        if (window.confirm(`Are you sure you want to delete this material?`)) {
                                          deleteMaterialMutation.mutate(materialId);
                                        }
                                      }}
                                    />
                                  ))}
                                </div>
                              </CollapsibleContent>
                            </Collapsible>
                          );
                        })}
                      </div>
                    );
                  })()}
                </>
              )}
            </TabsContent>
            
            <TabsContent value="list" className="space-y-4 mt-4">
              {/* Filter and bulk action controls */}
              <div className="flex justify-between items-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-1"
                >
                  <Filter className="h-4 w-4" />
                  {showFilters ? "Hide Filters" : "Show Filters"}
                </Button>
                
                {selectedMaterialIds.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-600">
                      {selectedMaterialIds.length} selected
                    </span>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        if (window.confirm(`Are you sure you want to delete ${selectedMaterialIds.length} materials?`)) {
                          bulkDeleteMaterialsMutation.mutate(selectedMaterialIds);
                        }
                      }}
                    >
                      <Trash className="h-4 w-4 mr-1" /> Bulk Delete
                    </Button>
                  </div>
                )}
              </div>
              
              {/* Filter panel */}
              {showFilters && (
                <div className="bg-slate-50 p-4 rounded-md space-y-3">
                  <h3 className="font-medium text-sm mb-2">Filter Materials</h3>
                  
                  {/* Type/Subtype/Section/Subsection Filters */}
                  <div className="mb-4 p-4 bg-white rounded-lg border border-slate-200 relative">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-medium text-sm">Material Classification</h4>
                      {selectedSection === "Dimensional Lumber" && (
                        <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full font-medium">
                          Dimensional Lumber
                        </span>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      {/* Type Selection Dropdown */}
                      <div className="space-y-1">
                        <label className="text-sm text-slate-500">Material Type</label>
                        <Select
                          value={selectedType || "all_types"}
                          onValueChange={(value) => {
                            setSelectedType(value === "all_types" ? null : value);
                            setSelectedSubtype(null); // Reset subtype when type changes
                            setSelectedSection(null); // Reset section
                            setSelectedSubsection(null); // Reset subsection
                          }}
                        >
                          <SelectTrigger className="rounded-md">
                            <SelectValue placeholder="Select a material type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all_types">All Types</SelectItem>
                            {Object.keys(materialsByType || {}).map(type => (
                              <SelectItem key={type} value={type}>{type}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      {/* Subtype Selection Dropdown - Only shown when a type is selected */}
                      <div className="space-y-1">
                        <label className="text-sm text-slate-500">Material Subtype</label>
                        <Select
                          value={selectedSubtype || "all_subtypes"}
                          onValueChange={(value) => {
                            setSelectedSubtype(value === "all_subtypes" ? null : value);
                            setSelectedSection(null); // Reset section when subtype changes
                            setSelectedSubsection(null); // Reset subsection when subtype changes
                          }}
                          disabled={!selectedType}
                        >
                          <SelectTrigger className="rounded-md">
                            <SelectValue placeholder="Select a material subtype" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all_subtypes">All Subtypes</SelectItem>
                            {selectedType && getSubtypesForType(selectedType, materialsByType).map(subtype => (
                              <SelectItem key={subtype} value={subtype}>{subtype}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Section Selection */}
                      <div className="space-y-1">
                        <label className="text-sm text-slate-500">Section</label>
                        <Select
                          value={selectedSection || "all_sections"}
                          onValueChange={(value) => {
                            setSelectedSection(value === "all_sections" ? null : value);
                            setSelectedSubsection(null); // Reset subsection when section changes
                          }}
                        >
                          <SelectTrigger className="rounded-md">
                            <SelectValue placeholder="Select a section" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all_sections">All Sections</SelectItem>
                            {getSections(processedMaterials, selectedType, selectedSubtype).map(section => (
                              <SelectItem key={section} value={section}>{section}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      {/* Subsection Selection - Only shown when a section is selected */}
                      <div className="space-y-1">
                        <label className="text-sm text-slate-500">Subsection</label>
                        <Select
                          value={selectedSubsection || "all_subsections"}
                          onValueChange={(value) => setSelectedSubsection(value === "all_subsections" ? null : value)}
                          disabled={!selectedSection}
                        >
                          <SelectTrigger className="rounded-md">
                            <SelectValue placeholder="Select a subsection" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all_subsections">All Subsections</SelectItem>
                            {selectedSection && getSubsections(processedMaterials, selectedSection).map(subsection => (
                              <SelectItem key={subsection} value={subsection}>{subsection}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Task filter */}
                    <div className="space-y-1">
                      <label className="text-sm text-slate-500">By Task</label>
                      <div className="relative">
                        <Select
                          value={selectedTaskFilter || "all_tasks"}
                          onValueChange={(value) => {
                            console.log('Changing task filter to:', value);
                            setSelectedTaskFilter(value === "all_tasks" ? null : value);
                            
                            // This will help debug why the filter isn't working
                            if (value !== "all_tasks") {
                              const taskId = Number(value);
                              const materialsWithThisTask = processedMaterials?.filter(m => 
                                m.taskIds && Array.isArray(m.taskIds) && m.taskIds.some(id => Number(id) === taskId)
                              ) || [];
                              
                              console.log(`Materials with Task ID ${taskId}:`, 
                                materialsWithThisTask.map(m => ({ id: m.id, name: m.name, taskIds: m.taskIds }))
                              );
                            }
                          }}
                        >
                          <SelectTrigger className="pr-8 rounded-md">
                            <SelectValue placeholder="All Tasks">
                              {selectedTaskFilter && taskLookup[Number(selectedTaskFilter)] 
                                ? taskLookup[Number(selectedTaskFilter)] 
                                : "All Tasks"}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all_tasks">All Tasks</SelectItem>
                            {sortedTaskIds.length > 0 ? (
                              sortedTaskIds.map((taskId) => (
                                <SelectItem key={taskId} value={taskId.toString()}>
                                  {taskLookup[taskId] || `Task ${taskId}`}
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="no_tasks_available" disabled>No tasks available</SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                        
                        {/* Clear button */}
                        {selectedTaskFilter && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-10 w-10 text-slate-400 hover:text-slate-600"
                            onClick={(e) => {
                              e.stopPropagation();
                              console.log('Clearing task filter');
                              setSelectedTaskFilter(null);
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      
                      {/* Debug task filter */}
                      {selectedTaskFilter && (
                        <div className="text-xs text-blue-600 p-1 rounded bg-blue-50 border border-blue-200 mt-1">
                          <Info className="h-3 w-3 inline-block mr-1" />
                          Task ID: {selectedTaskFilter} {availableTaskIds.includes(Number(selectedTaskFilter)) 
                            ? "✓ (available in materials)" 
                            : "⚠️ (not found in materials)"}
                        </div>
                      )}
                    </div>
                    
                    {/* Supplier filter */}
                    <div className="space-y-1">
                      <label className="text-sm text-slate-500">By Supplier</label>
                      <div className="relative">
                        <Select
                          value={selectedSupplierFilter || "all_suppliers"}
                          onValueChange={(value) => {
                            console.log('Changing supplier filter to:', value);
                            setSelectedSupplierFilter(value === "all_suppliers" ? null : value);
                            
                            // Debug supplier filter
                            if (value !== "all_suppliers") {
                              const materialsWithThisSupplier = processedMaterials?.filter(m => 
                                value === "unknown" 
                                  ? (!m.supplier || m.supplier === "")
                                  : m.supplier === value
                              ) || [];
                              
                              console.log(`Materials with Supplier "${value}":`, 
                                materialsWithThisSupplier.length
                              );
                            }
                          }}
                        >
                          <SelectTrigger className="pr-8 rounded-md">
                            <SelectValue placeholder="All Suppliers">
                              {selectedSupplierFilter === "unknown" 
                                ? "Unknown" 
                                : (selectedSupplierFilter || "All Suppliers")}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all_suppliers">All Suppliers</SelectItem>
                            <SelectItem value="unknown">Unknown</SelectItem>
                            {uniqueSuppliers.length > 0 ? (
                              uniqueSuppliers.map((supplier) => (
                                <SelectItem key={supplier} value={supplier}>
                                  {supplier}
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="no_suppliers_available" disabled>No suppliers available</SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                        
                        {/* Clear button */}
                        {selectedSupplierFilter && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-10 w-10 text-slate-400 hover:text-slate-600"
                            onClick={(e) => {
                              e.stopPropagation();
                              console.log('Clearing supplier filter');
                              setSelectedSupplierFilter(null);
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {filteredMaterials && filteredMaterials.length > 0 ? (
                <>
                  <div className="flex justify-between items-center bg-slate-50 p-3 rounded-md mb-2">
                    <div className="flex items-center gap-2">
                      <Checkbox 
                        id="select-all"
                        checked={
                          filteredMaterials.length > 0 && 
                          selectedMaterialIds.length === filteredMaterials.length
                        }
                        onCheckedChange={(checked) => {
                          if (checked) {
                            // Select all materials
                            setSelectedMaterialIds(filteredMaterials.map(m => m.id));
                          } else {
                            // Deselect all materials
                            setSelectedMaterialIds([]);
                          }
                        }}
                      />
                      <label 
                        htmlFor="select-all" 
                        className="text-sm font-medium cursor-pointer select-none"
                      >
                        Select All
                      </label>
                    </div>
                    <span className="text-sm font-medium text-[#084f09]">
                      {formatCurrency(
                        filteredMaterials.reduce((sum, material) => 
                          sum + (material.cost || 0) * material.quantity, 0)
                      )}
                    </span>
                  </div>
                  
                  {/* Group materials by supplier, then quotes, then individual materials */}
                  {(() => {
                    // Group materials by supplier
                    const supplierGroups: Record<string, {
                      supplier: any;
                      materials: Material[];
                    }> = {};
                    
                    // Organize materials by supplier
                    filteredMaterials.forEach(material => {
                      const supplierKey = material.supplier || material.supplierId?.toString() || 'unknown';
                      
                      if (!supplierGroups[supplierKey]) {
                        const supplierInfo = getSupplierForMaterial(material);
                        supplierGroups[supplierKey] = {
                          supplier: supplierInfo,
                          materials: []
                        };
                      }
                      
                      supplierGroups[supplierKey].materials.push(material);
                    });
                    
                    return (
                      <div className="space-y-4">
                        {Object.entries(supplierGroups).map(([key, group]) => {
                          const supplierName = group.supplier?.name || 'Unknown Supplier';
                          const materialCount = group.materials.length;
                          const totalValue = group.materials.reduce((sum, m) => sum + (m.cost || 0) * m.quantity, 0);
                          
                          // Group materials by quote
                          const quoteGroups: Record<string, {
                            quoteNumber: string;
                            quoteDate: string | null;
                            materials: Material[];
                          }> = {};
                          
                          // Group "No Quote" materials separately
                          const nonQuoteMaterials: Material[] = [];
                          
                          // Organize materials by quote
                          group.materials.forEach(material => {
                            // Generate a quote number if none exists
                            // We'll use a combination of quoteDate and material properties to group quotes
                            const quoteNumber = material.quoteNumber || 
                              (material.isQuote ? `Q-${material.quoteDate || 'Unknown'}-${material.id}` : null);
                            
                            if (quoteNumber) {
                              // If material has a quote number, include it in the quote group regardless of isQuote status
                              if (!quoteGroups[quoteNumber]) {
                                quoteGroups[quoteNumber] = {
                                  quoteNumber,
                                  quoteDate: material.quoteDate || null,
                                  materials: []
                                };
                              }
                              
                              quoteGroups[quoteNumber].materials.push(material);
                            } else {
                              // Only materials without a quote number go to the separate array
                              nonQuoteMaterials.push(material);
                            }
                          });
                          
                          return (
                            <Collapsible key={key} className="w-full">
                              {/* Supplier Card as Collapsible Trigger */}
                              <CollapsibleTrigger className="w-full">
                                <Card className="bg-white shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
                                  <div className="p-3 border-b border-slate-200 flex justify-between items-center">
                                    <div className="flex items-center">
                                      <div className="h-9 w-9 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-medium">
                                        {group.supplier?.initials || supplierName.charAt(0)}
                                      </div>
                                      <div className="ml-3">
                                        <h3 className="text-sm font-medium">{supplierName}</h3>
                                        <p className="text-xs text-slate-500">
                                          {materialCount} {materialCount === 1 ? 'material' : 'materials'} • {formatCurrency(totalValue)}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {group.supplier?.category && (
                                        <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                                          {group.supplier.category}
                                        </Badge>
                                      )}
                                      <ChevronDown className="h-4 w-4 text-slate-400" />
                                    </div>
                                  </div>
                                </Card>
                              </CollapsibleTrigger>
                              
                              {/* Quote Groups and Material Cards inside Collapsible Content */}
                              <CollapsibleContent>
                                <div className="p-3 pt-4 space-y-4">
                                  {/* Quote Groups */}
                                  {Object.values(quoteGroups).map((quoteGroup) => {
                                    const quoteDate = quoteGroup.quoteDate 
                                      ? new Date(quoteGroup.quoteDate).toLocaleDateString()
                                      : 'No date';
                                    const quoteTotalValue = quoteGroup.materials.reduce(
                                      (sum, m) => sum + (m.cost || 0) * m.quantity, 0
                                    );
                                    
                                    return (
                                      <Collapsible key={quoteGroup.quoteNumber} className="w-full">
                                        {/* Quote Card as Collapsible Trigger */}
                                        <CollapsibleTrigger className="w-full">
                                          <Card className="overflow-hidden border bg-white shadow-sm hover:shadow-md transition-all duration-200 rounded-xl cursor-pointer relative">
                                            {/* Status indicator at top-right */}
                                            <div className="absolute top-0 right-0 mr-4 mt-4">
                                              <div className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                                                Quote
                                              </div>
                                            </div>

                                            {/* Clean, minimal header with quote number */}
                                            <div className="bg-orange-50 px-5 py-4 border-b border-orange-100">
                                              <div className="flex justify-between items-start">
                                                <div className="flex flex-col">
                                                  <div className="flex items-center gap-3">
                                                    <div className="bg-orange-100 rounded-full p-2">
                                                      <FileText className="h-5 w-5 text-orange-700" />
                                                    </div>
                                                    <h3 className="text-sm font-medium">Quote #{quoteGroup.quoteNumber.split('-').pop()}</h3>
                                                  </div>
                                                  <div className="mt-1 text-xs text-slate-500 ml-10">
                                                    {quoteDate} • {quoteGroup.materials.length} {quoteGroup.materials.length === 1 ? 'item' : 'items'}
                                                  </div>
                                                </div>

                                                <div className="flex items-center">
                                                  {/* Edit Quote Button */}
                                                  <Button 
                                                    variant="ghost" 
                                                    size="sm" 
                                                    className="h-8 w-8 p-0 text-slate-500 hover:bg-orange-100 hover:text-orange-700 rounded-full dropdown-ignore"
                                                    onClick={(e) => {
                                                      e.stopPropagation(); // Prevent collapsible from triggering
                                                      handleEditQuote(quoteGroup.materials);
                                                    }}
                                                  >
                                                    <Edit className="h-4 w-4" />
                                                  </Button>
                                                  <ChevronDown className="h-4 w-4 text-slate-400 ml-1" />
                                                </div>
                                              </div>
                                            </div>
                                            
                                            {/* Quote summary info */}
                                            <div className="p-5">
                                              <div className="flex items-center justify-between mb-3 bg-slate-50 p-4 rounded-lg border border-slate-100">
                                                <div className="flex flex-col items-center">
                                                  <p className="text-xs text-slate-500 font-medium uppercase">Items</p>
                                                  <p className="font-medium text-slate-700">{quoteGroup.materials.length}</p>
                                                </div>
                                                <div className="h-6 border-r border-slate-200"></div>
                                                <div className="flex flex-col items-center">
                                                  <p className="text-xs text-slate-500 font-medium uppercase">Total Value</p>
                                                  <p className="font-medium text-slate-700">{formatCurrency(quoteTotalValue)}</p>
                                                </div>
                                              </div>
                                            </div>
                                          </Card>
                                        </CollapsibleTrigger>
                                        
                                        {/* Materials for this Quote */}
                                        <CollapsibleContent>
                                          <div className="p-3 pt-4 grid grid-cols-1 md:grid-cols-2 gap-4 bg-orange-50/50 rounded-b-lg border-x border-b border-orange-100">
                                            {quoteGroup.materials.map((material) => (
                                              <div 
                                                key={material.id}
                                                className={`relative ${selectedMaterialIds.includes(material.id) ? "border border-orange-300 rounded-lg shadow-sm" : ""}`}
                                              >
                                                {/* Checkbox overlay */}
                                                <div className="absolute left-3 top-4 z-10">
                                                  <Checkbox 
                                                    id={`select-material-${material.id}`}
                                                    checked={selectedMaterialIds.includes(material.id)}
                                                    onCheckedChange={(checked) => {
                                                      if (checked) {
                                                        setSelectedMaterialIds([...selectedMaterialIds, material.id]);
                                                      } else {
                                                        setSelectedMaterialIds(selectedMaterialIds.filter(id => id !== material.id));
                                                      }
                                                    }}
                                                  />
                                                </div>
                                                {/* Padding div to create space for checkbox */}
                                                <div className="pl-8">
                                                  <MaterialCard
                                                    material={material}
                                                    onEdit={(mat) => {
                                                      setSelectedMaterial(mat);
                                                      setEditDialogOpen(true);
                                                    }}
                                                    onDelete={(materialId) => {
                                                      if (window.confirm(`Are you sure you want to delete this material?`)) {
                                                        deleteMaterialMutation.mutate(materialId);
                                                      }
                                                    }}
                                                    onBulkAssign={handleBulkAssignToCategory}
                                                  />
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        </CollapsibleContent>
                                      </Collapsible>
                                    );
                                  })}
                                  
                                  {/* Non-Quote Materials (if any) */}
                                  {nonQuoteMaterials.length > 0 && (
                                    <div className="mt-4">
                                      <h3 className="text-sm font-medium mb-3 px-1">Materials Not in Quotes</h3>
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {nonQuoteMaterials.map((material) => (
                                          <div 
                                            key={material.id}
                                            className={`relative ${selectedMaterialIds.includes(material.id) ? "border border-orange-300 rounded-lg shadow-sm" : ""}`}
                                          >
                                            {/* Checkbox overlay */}
                                            <div className="absolute left-3 top-4 z-10">
                                              <Checkbox 
                                                id={`select-material-${material.id}`}
                                                checked={selectedMaterialIds.includes(material.id)}
                                                onCheckedChange={(checked) => {
                                                  if (checked) {
                                                    setSelectedMaterialIds([...selectedMaterialIds, material.id]);
                                                  } else {
                                                    setSelectedMaterialIds(selectedMaterialIds.filter(id => id !== material.id));
                                                  }
                                                }}
                                              />
                                            </div>
                                            {/* Padding div to create space for checkbox */}
                                            <div className="pl-8">
                                              <MaterialCard
                                                material={material}
                                                onEdit={(mat) => {
                                                  setSelectedMaterial(mat);
                                                  setEditDialogOpen(true);
                                                }}
                                                onDelete={(materialId) => {
                                                  if (window.confirm(`Are you sure you want to delete this material?`)) {
                                                    deleteMaterialMutation.mutate(materialId);
                                                  }
                                                }}
                                                onBulkAssign={handleBulkAssignToCategory}
                                              />
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                      

                                    </div>
                                  )}
                                </div>
                              </CollapsibleContent>
                            </Collapsible>
                          );
                        })}
                      </div>
                    );
                  })()}
                </>
              ) : (
                <div className="text-center py-8">
                  <Package className="mx-auto h-8 w-8 text-slate-300" />
                  <p className="mt-2 text-slate-500">No materials found</p>
                </div>
              )}
              
              {/* Floating Action Bar for Selected Materials */}
              {selectedMaterialIds.length > 0 && (
                <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
                  <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-4 flex items-center gap-3">
                    <span className="text-sm text-slate-600">
                      {selectedMaterialIds.length} material{selectedMaterialIds.length > 1 ? 's' : ''} selected
                    </span>
                    <div className="h-4 w-px bg-slate-300" />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        // Duplicate first selected material
                        const firstSelectedId = selectedMaterialIds[0];
                        const materialToDuplicate = processedMaterials.find(m => m.id === firstSelectedId);
                        if (materialToDuplicate) {
                          handleDuplicateMaterial(materialToDuplicate);
                        }
                      }}
                    >
                      <Copy className="h-4 w-4 mr-1" />
                      Duplicate
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        if (window.confirm(`Are you sure you want to delete ${selectedMaterialIds.length} selected material${selectedMaterialIds.length > 1 ? 's' : ''}?`)) {
                          selectedMaterialIds.forEach(id => {
                            deleteMaterialMutation.mutate(id);
                          });
                          setSelectedMaterialIds([]);
                        }
                      }}
                    >
                      <Trash className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setSelectedMaterialIds([])}
                    >
                      Clear
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="supplier" className="space-y-4 mt-4">
              {/* Supplier View */}
              {processedMaterials && processedMaterials.length > 0 ? (
                <>
                  {/* Supplier Grid View */}
                  <div className="bg-white p-4 rounded-lg">
                    <div className="mb-4 flex justify-between items-center">
                      <h3 className="text-lg font-medium">Suppliers</h3>
                      <p className="text-sm text-slate-500">
                        Click on a supplier to view associated quotes and materials
                      </p>
                    </div>
                    
                    {/* Grid of suppliers */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(materialsBySupplier).map(([key, { supplier, materials }]) => (
                        <div 
                          key={key} 
                          onClick={() => {
                            setSelectedSupplierFilter(supplier?.name || 'unknown');
                          }}
                        >
                          <Card 
                            className="cursor-pointer border border-slate-200 hover:shadow-md transition-shadow"
                          >
                          <CardHeader className="p-4 pb-2 bg-gradient-to-r from-green-600 to-green-500">
                            <div className="flex items-center">
                              <div className="h-10 w-10 rounded-full bg-white text-green-600 flex items-center justify-center font-medium mr-3">
                                {supplier?.initials || 'S'}
                              </div>
                              <div>
                                <CardTitle className="text-white text-lg">{supplier?.name || "Unknown Supplier"}</CardTitle>
                                <CardDescription className="text-green-100">
                                  {supplier?.company || supplier?.category || "Building Materials"}
                                </CardDescription>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="p-4">
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="text-sm font-medium">{materials.length} Materials</p>
                                <p className="text-xs text-slate-500">
                                  {materials.filter(m => m.isQuote === true).length} Quotes
                                </p>
                              </div>
                              <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
                                {formatCurrency(materials.reduce((sum, m) => sum + (m.cost || 0) * m.quantity, 0))}
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                        </div>
                      ))}
                    </div>
                    
                    {/* Selected Supplier View - Show if a supplier is selected */}
                    {selectedSupplierFilter && selectedSupplierFilter !== "all_suppliers" && (
                      <div className="mt-6">
                        <div className="flex items-center mb-4">
                          <Button 
                            variant="ghost" 
                            className="h-8 mr-2 text-slate-600"
                            onClick={() => setSelectedSupplierFilter(null)}
                          >
                            <ChevronLeft className="h-4 w-4 mr-1" />
                            Back to Suppliers
                          </Button>
                          <h3 className="text-lg font-medium">
                            {selectedSupplierFilter === "unknown" ? "Unknown Supplier" : selectedSupplierFilter}
                          </h3>
                        </div>
                        
                        {/* Quotes Section */}
                        <div className="mb-6">
                          <h4 className="text-md font-medium mb-3 border-b pb-1">Quotes</h4>
                          {/* Filtered materials to only show quotes for selected supplier */}
                          {(() => {
                            const quotes = processedMaterials.filter(m => 
                              m.isQuote === true && 
                              (m.supplier === selectedSupplierFilter || 
                               (selectedSupplierFilter === "unknown" && (!m.supplier || m.supplier === "unknown")))
                            );
                            
                            if (quotes.length === 0) {
                              return (
                                <div className="text-center py-6 bg-slate-50 rounded-lg">
                                  <FileText className="mx-auto h-8 w-8 text-slate-300" />
                                  <p className="mt-2 text-slate-500">No quotes found for this supplier</p>
                                </div>
                              );
                            }
                            
                            return (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {quotes.map(quote => (
                                  <Card 
                                    key={quote.id} 
                                    className="cursor-pointer hover:shadow-md transition-shadow border border-orange-200"
                                    onClick={() => setSelectedMaterial(quote)}
                                  >
                                    <CardHeader className="p-3 bg-orange-50">
                                      <div className="flex justify-between">
                                        <CardTitle className="text-md font-medium">{quote.name}</CardTitle>
                                        <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-200">
                                          {formatCurrency(quote.cost * quote.quantity)}
                                        </Badge>
                                      </div>
                                      <CardDescription className="text-xs">
                                        Quote #{quote.id} - {quote.orderDate || 'No date'}
                                      </CardDescription>
                                    </CardHeader>
                                    <CardContent className="p-3">
                                      <p className="text-sm text-slate-600 line-clamp-2">{quote.details || "No details provided"}</p>
                                    </CardContent>
                                  </Card>
                                ))}
                              </div>
                            );
                          })()}
                        </div>
                        
                        {/* Materials Section */}
                        <div>
                          <h4 className="text-md font-medium mb-3 border-b pb-1">Materials</h4>
                          {/* Filtered materials to show non-quotes for selected supplier */}
                          {(() => {
                            const materials = processedMaterials.filter(m => 
                              (!m.isQuote || m.isQuote === false) && 
                              (m.supplier === selectedSupplierFilter || 
                               (selectedSupplierFilter === "unknown" && (!m.supplier || m.supplier === "unknown")))
                            );
                            
                            if (materials.length === 0) {
                              return (
                                <div className="text-center py-6 bg-slate-50 rounded-lg">
                                  <Package className="mx-auto h-8 w-8 text-slate-300" />
                                  <p className="mt-2 text-slate-500">No materials found for this supplier</p>
                                </div>
                              );
                            }
                            
                            return (
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {materials.map(material => (
                                  <MaterialCard 
                                    key={material.id} 
                                    material={material} 
                                    onEdit={(mat) => {
                                      setSelectedMaterial(mat);
                                      setEditDialogOpen(true);
                                    }}
                                    onDelete={() => deleteMaterialMutation.mutate(material.id)}
                                    onBulkAssign={handleBulkAssignToCategory}
                                  />
                                ))}
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <Package className="mx-auto h-8 w-8 text-slate-300" />
                  <p className="mt-2 text-slate-500">No materials found</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="supplier" className="space-y-4 mt-4">
              {/* Supplier View */}
              {processedMaterials && processedMaterials.length > 0 ? (
                <>
                  {/* Supplier Grid View */}
                  <div className="bg-white p-4 rounded-lg">
                    <div className="mb-4 flex justify-between items-center">
                      <h3 className="text-lg font-medium">Suppliers</h3>
                      <p className="text-sm text-slate-500">
                        Click on a supplier to view associated quotes and materials
                      </p>
                    </div>
                    
                    {/* Grid of suppliers */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(materialsBySupplier).map(([key, { supplier, materials }]) => (
                        <div 
                          key={key} 
                          onClick={() => {
                            setSelectedSupplierFilter(supplier?.name || 'unknown');
                          }}
                        >
                          <Card className="cursor-pointer border border-slate-200 hover:shadow-md transition-shadow">
                            <CardHeader className="p-4 pb-2 bg-gradient-to-r from-green-600 to-green-500">
                              <div className="flex items-center">
                                <div className="h-10 w-10 rounded-full bg-white text-green-600 flex items-center justify-center font-medium mr-3">
                                  {supplier?.initials || 'S'}
                                </div>
                                <div>
                                  <CardTitle className="text-white text-lg">{supplier?.name || "Unknown Supplier"}</CardTitle>
                                  <CardDescription className="text-green-100">
                                    {supplier?.company || supplier?.category || "Building Materials"}
                                  </CardDescription>
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent className="p-4">
                              <div className="flex justify-between items-center">
                                <div>
                                  <p className="text-sm font-medium">{materials.length} Materials</p>
                                  <p className="text-xs text-slate-500">
                                    {materials.filter(m => m.isQuote === true).length} Quotes
                                  </p>
                                </div>
                                <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
                                  {formatCurrency(materials.reduce((sum, m) => sum + (m.cost || 0) * m.quantity, 0))}
                                </Badge>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      ))}
                    </div>
                    
                    {/* Selected Supplier View - Show if a supplier is selected */}
                    {selectedSupplierFilter && selectedSupplierFilter !== "all_suppliers" && (
                      <div className="mt-6">
                        <div className="flex items-center mb-4">
                          <Button 
                            variant="ghost" 
                            className="h-8 mr-2 text-slate-600"
                            onClick={() => setSelectedSupplierFilter(null)}
                          >
                            <ChevronLeft className="h-4 w-4 mr-1" />
                            Back to Suppliers
                          </Button>
                          <h3 className="text-lg font-medium">
                            {selectedSupplierFilter === "unknown" ? "Unknown Supplier" : selectedSupplierFilter}
                          </h3>
                        </div>
                        
                        {/* Quotes Section */}
                        <div className="mb-6">
                          <h4 className="text-md font-medium mb-3 border-b pb-1">Quotes</h4>
                          {(() => {
                            const quotes = processedMaterials.filter(m => 
                              m.isQuote === true && 
                              (m.supplier === selectedSupplierFilter || 
                               (selectedSupplierFilter === "unknown" && (!m.supplier || m.supplier === "unknown")))
                            );
                            
                            if (quotes.length === 0) {
                              return (
                                <div className="text-center py-6 bg-slate-50 rounded-lg">
                                  <FileText className="mx-auto h-8 w-8 text-slate-300" />
                                  <p className="mt-2 text-slate-500">No quotes found for this supplier</p>
                                </div>
                              );
                            }
                            
                            // Group quotes by quote number
                            const quoteGroups: Record<string, Material[]> = {};
                            quotes.forEach(quote => {
                              const quoteNumber = quote.quoteNumber || `unknown-${quote.id}`;
                              if (!quoteGroups[quoteNumber]) {
                                quoteGroups[quoteNumber] = [];
                              }
                              quoteGroups[quoteNumber].push(quote);
                            });
                            
                            return (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {Object.entries(quoteGroups).map(([quoteNumber, items]) => {
                                  const totalCost = items.reduce((sum, item) => sum + (item.cost || 0) * item.quantity, 0);
                                  const firstItem = items[0]; // Use the first item for display purposes
                                  
                                  return (
                                    <Card 
                                      key={quoteNumber} 
                                      className="cursor-pointer hover:shadow-md transition-shadow border border-orange-200"
                                      onClick={() => setSelectedMaterial(firstItem)}
                                    >
                                      <CardHeader className="p-3 bg-orange-50">
                                        <div className="flex justify-between">
                                          <CardTitle className="text-md font-medium">Quote #{quoteNumber}</CardTitle>
                                          <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-200">
                                            {formatCurrency(totalCost)}
                                          </Badge>
                                        </div>
                                        <CardDescription className="text-xs">
                                          {items.length} item{items.length !== 1 ? 's' : ''} - {firstItem.quoteDate || firstItem.orderDate || 'No date'}
                                        </CardDescription>
                                      </CardHeader>
                                      <CardContent className="p-3">
                                        <p className="text-sm text-slate-600 line-clamp-2">
                                          {firstItem.supplier} - {items.length} building materials
                                        </p>
                                      </CardContent>
                                    </Card>
                                  );
                                })}
                              </div>
                            );
                          })()}
                        </div>
                        
                        {/* Materials Section */}
                        <div>
                          <h4 className="text-md font-medium mb-3 border-b pb-1">Materials</h4>
                          {(() => {
                            const materials = processedMaterials.filter(m => 
                              (!m.isQuote || m.isQuote === false) && 
                              (m.supplier === selectedSupplierFilter || 
                               (selectedSupplierFilter === "unknown" && (!m.supplier || m.supplier === "unknown")))
                            );
                            
                            if (materials.length === 0) {
                              return (
                                <div className="text-center py-6 bg-slate-50 rounded-lg">
                                  <Package className="mx-auto h-8 w-8 text-slate-300" />
                                  <p className="mt-2 text-slate-500">No materials found for this supplier</p>
                                </div>
                              );
                            }
                            
                            return (
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {materials.map(material => (
                                  <MaterialCard 
                                    key={material.id} 
                                    material={material}
                                    onDelete={() => deleteMaterialMutation.mutate(material.id)}
                                  />
                                ))}
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <Package className="mx-auto h-8 w-8 text-slate-300" />
                  <p className="mt-2 text-slate-500">No materials found</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="type" className="space-y-4 mt-4 hidden">
              {/* Material Type View - Hidden as requested */}
              <div className="bg-white p-4 rounded-lg">
                <div className="mb-4">
                  <p className="text-slate-500">
                    Materials organized by type and subtype categories.
                  </p>
                </div>
                
                {processedMaterials && processedMaterials.length > 0 ? (
                  <>
                    <div className="flex justify-between items-center bg-slate-50 p-3 rounded-md mb-4">
                      <span className="text-sm font-medium">Total Materials:</span>
                      <span className="text-sm font-medium text-[#084f09]">
                        {formatCurrency(processedMaterials.reduce((sum, m) => sum + (m.cost || 0) * m.quantity, 0))}
                      </span>
                    </div>
                    
                    {/* Type and Subtype Filters */}
                    <TypeSubtypeFilter 
                      materials={processedMaterials} 
                      onMaterialAction={(material, action) => {
                        if (action === 'edit') {
                          setSelectedMaterial(material);
                          setEditDialogOpen(true);
                        } else if (action === 'delete') {
                          if (window.confirm(`Are you sure you want to delete "${material.name}"?`)) {
                            deleteMaterialMutation.mutate(material.id);
                          }
                        }
                      }}
                    />
                  </>
                ) : (
                  <div className="bg-white rounded-lg border p-6 text-center">
                    <Package className="h-10 w-10 text-slate-300 mx-auto" />
                    <h3 className="mt-2 text-lg font-medium">No Materials Found</h3>
                    <p className="text-slate-500 mt-1">Add materials to this project to see them here.</p>
                    {!hideTopButton && (
                      <Button 
                        className="mt-4 bg-orange-500 hover:bg-orange-600" 
                        onClick={() => {
                          setSelectedTaskForMaterial(null); // Clear task selection for general material creation
                          setCreateDialogOpen(true);
                        }}
                      >
                        <Plus className="h-4 w-4 mr-2" /> Add Material
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
          </div>
        </TabsContent>

        <TabsContent value="all-quotes" className="mt-4">
          <AllQuotesView projectId={projectId || 6} />
        </TabsContent>

        <TabsContent value="inventory" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Inventory Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {processedMaterials && processedMaterials.length > 0 ? (
                processedMaterials.map((material) => (
                  <div key={material.id} className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">{material.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {Math.floor(material.quantity * 0.6)}/{material.quantity} {material.unit} used
                      </span>
                    </div>
                    <Progress value={(material.quantity * 0.6 / material.quantity) * 100} className="h-2" />
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Warehouse className="mx-auto h-8 w-8 text-slate-300" />
                  <p className="mt-2 text-slate-500">No inventory items found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>

      <CreateMaterialDialog 
        open={createDialogOpen} 
        onOpenChange={(open) => {
          setCreateDialogOpen(open);
          if (!open) {
            setSelectedTaskForMaterial(null); // Clear selected task when dialog closes
          }
        }}
        projectId={projectId}
        preselectedTaskId={selectedTaskForMaterial?.id}
        initialTier1={selectedTaskForMaterial?.tier1Category}
        initialTier2={selectedTaskForMaterial?.tier2Category}
      />
      
      <EditMaterialDialog
        open={editDialogOpen}
        onOpenChange={(open) => {
          setEditDialogOpen(open);
          // If the dialog is closing and a material was being edited, refresh the materials list
          if (!open && selectedMaterial) {
            console.log("Dialog closed, refreshing materials");
            // Invalidate both the general materials query and project-specific query
            queryClient.invalidateQueries({ queryKey: ["/api/materials"] });
            if (projectId) {
              queryClient.invalidateQueries({ 
                queryKey: ["/api/projects", projectId, "materials"] 
              });
            }
          }
        }}
        material={selectedMaterial}
      />
      
      <ImportMaterialsDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        projectId={projectId}
      />
      
      <CreateQuoteDialog
        open={createQuoteDialogOpen}
        onOpenChange={setCreateQuoteDialogOpen}
        projectId={projectId || 0}
      />
      
      <LinkSectionToTaskDialog
        open={linkSectionDialogOpen}
        onOpenChange={setLinkSectionDialogOpen}
        projectId={projectId}
        materialIds={sectionToLink?.materials.map(m => m.id) || []}
        onLinkToTask={handleCompleteTaskLinking}
        sectionName={sectionToLink ? `${sectionToLink.tier1} > ${sectionToLink.tier2} > ${sectionToLink.section}` : "Section"}
      />
      
      <EditQuoteDialog
        open={editQuoteDialogOpen}
        onOpenChange={(open) => {
          setEditQuoteDialogOpen(open);
          // If dialog is closing, refresh materials data
          if (!open && selectedQuoteMaterials.length > 0) {
            queryClient.invalidateQueries({ queryKey: ['/api/materials'] });
            if (projectId) {
              queryClient.invalidateQueries({ 
                queryKey: ['/api/projects', projectId, 'materials'] 
              });
            }
            // Clear selected materials
            setSelectedQuoteMaterials([]);
          }
        }}
        materials={selectedQuoteMaterials}
        projectId={projectId}
      />
      
      <BulkAssignMaterialDialog
        open={bulkAssignDialogOpen}
        onOpenChange={setBulkAssignDialogOpen}
        materialId={materialForBulkAssign?.id || 0}
        materialName={materialForBulkAssign?.name || ""}
        projectId={projectId}
      />
    </>
  );
}