import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Package,
  Plus,
  Layers,
  Building,
  List,
  FileText,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Upload,
  Hash,
  Filter,
  X,
  Calendar,
  DollarSign,
  Tag,
  Info,
  Ruler,
  BoxSelect,
  Edit,
  Sparkles
} from "lucide-react";

import { getTier1CategoryColor as getCategoryColor } from "@/lib/unified-color-system";
import { getProjectTheme } from "@/lib/project-themes";
import { formatCurrency } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MaterialCard, SimplifiedMaterial } from "@/components/materials/MaterialCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { CreateMaterialDialog } from "@/pages/materials/CreateMaterialDialog";
import { CreateQuoteDialog } from "@/pages/materials/CreateQuoteDialog";
import { EditMaterialDialog } from "@/pages/materials/EditMaterialDialog";
import { ImportMaterialsDialog } from "@/pages/materials/ImportMaterialsDialog";
import { ImportInvoiceDialog } from "@/pages/materials/ImportInvoiceDialog";
import { CreateInvoiceFromMaterials } from "@/components/invoices/CreateInvoiceFromMaterials";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { useTier2CategoriesByTier1Name } from "@/hooks/useTemplateCategories";
import { cn } from "@/lib/utils";

type Material = SimplifiedMaterial;

interface ResourcesTabNewProps {
  projectId?: number;
  searchQuery?: string;
  onCategoryChange?: (tier1: string | null, tier2: string | null) => void;
}

export function ResourcesTabNew({ projectId, searchQuery = "", onCategoryChange }: ResourcesTabNewProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createQuoteDialogOpen, setCreateQuoteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importInvoiceDialogOpen, setImportInvoiceDialogOpen] = useState(false);
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [detailMaterial, setDetailMaterial] = useState<Material | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  // View states
  const [materialsGroupBy, setMaterialsGroupBy] = useState<"category" | "supplier" | "list">("category");
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [selectedTier1, setSelectedTier1] = useState<string | null>(null);
  const [selectedTier2, setSelectedTier2] = useState<string | null>(null);
  const [selectedSupplier, setSelectedSupplier] = useState<string | null>(null);
  const [expandedQuotes, setExpandedQuotes] = useState<Set<string>>(new Set());

  // Filter states
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  // Notify parent when category selection changes
  React.useEffect(() => {
    onCategoryChange?.(selectedTier1, selectedTier2);
  }, [selectedTier1, selectedTier2, onCategoryChange]);

  // Fetch categories - use selectedProject when in global view, otherwise use projectId prop
  const effectiveProjectId = projectId || selectedProject || undefined;
  const { tier1Categories: dbTier1Categories, tier2Categories: dbTier2Categories } = useTier2CategoriesByTier1Name(effectiveProjectId);

  // Fetch materials
  const { data: materials = [], isLoading } = useQuery<Material[]>({
    queryKey: projectId ? ["/api/projects", projectId, "materials"] : ["/api/materials"],
    queryFn: async () => {
      const url = projectId ? `/api/projects/${projectId}/materials` : "/api/materials";
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch materials");
      return await response.json();
    },
  });

  // Fetch contacts for supplier info
  const { data: contacts = [] } = useQuery<any[]>({
    queryKey: ["/api/contacts"],
  });

  // Fetch all projects for category view
  const { data: projects = [] } = useQuery<any[]>({
    queryKey: ["/api/projects"],
    enabled: !projectId, // Only fetch when not in a specific project context
  });

  // Fetch current project when in project context (for theme colors)
  const { data: currentProject } = useQuery<any>({
    queryKey: ["/api/projects", projectId],
    enabled: !!projectId,
  });

  // Create contact map
  const contactMap = useMemo(() => {
    const map: Record<number, any> = {};
    contacts.forEach((contact) => {
      map[contact.id] = contact;
    });
    return map;
  }, [contacts]);

  // Dynamic tier1 categories
  const tier1Categories = dbTier1Categories?.map((cat: any) => cat.name) || [];

  // Build tier2 by tier1
  const tier2ByTier1 = useMemo(() => {
    if (!dbTier1Categories || !dbTier2Categories) return {};
    const result: Record<string, string[]> = {};
    dbTier1Categories.forEach((tier1: any) => {
      result[tier1.name] = dbTier2Categories
        .filter((t2: any) => t2.parentId === tier1.id)
        .map((t2: any) => t2.name);
    });
    return result;
  }, [dbTier1Categories, dbTier2Categories]);

  // Filter materials based on search and status
  const filteredMaterials = useMemo(() => {
    let result = materials;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(m =>
        m.name.toLowerCase().includes(query) ||
        m.type?.toLowerCase().includes(query) ||
        m.supplier?.toLowerCase().includes(query)
      );
    }

    if (statusFilter) {
      result = result.filter(m => m.status === statusFilter);
    }

    return result;
  }, [materials, searchQuery, statusFilter]);

  // Separate materials and quotes
  const regularMaterials = useMemo(() =>
    filteredMaterials.filter(m => !m.isQuote),
    [filteredMaterials]
  );

  const quotes = useMemo(() =>
    filteredMaterials.filter(m => m.isQuote),
    [filteredMaterials]
  );

  // Group materials by project
  const materialsByProject = useMemo(() => {
    const groups: Record<number, Material[]> = {};
    regularMaterials.forEach(m => {
      const projId = m.projectId || 0;
      if (!groups[projId]) groups[projId] = [];
      groups[projId].push(m);
    });
    return groups;
  }, [regularMaterials]);

  // Get materials for the selected project (or all if we're in project context)
  const projectMaterials = useMemo(() => {
    if (projectId) return regularMaterials; // Already filtered by project
    if (selectedProject) return materialsByProject[selectedProject] || [];
    return regularMaterials;
  }, [regularMaterials, projectId, selectedProject, materialsByProject]);

  // Group materials by tier1 (only for selected project or all if in project context)
  const materialsByTier1 = useMemo(() => {
    const groups: Record<string, Material[]> = {};
    projectMaterials.forEach(m => {
      const tier1 = m.tier || m.type || "Other";
      const normalizedTier1 = tier1.charAt(0).toUpperCase() + tier1.slice(1).toLowerCase();
      if (!groups[normalizedTier1]) groups[normalizedTier1] = [];
      groups[normalizedTier1].push(m);
    });
    return groups;
  }, [projectMaterials]);

  // Group materials by supplier
  const materialsBySupplier = useMemo(() => {
    const groups: Record<string, { supplier: any; materials: Material[] }> = {};
    regularMaterials.forEach(m => {
      let key = "unknown";
      let supplierInfo = { name: "Unknown Supplier", initials: "U", company: "" };

      if (m.supplierId && contactMap[m.supplierId]) {
        const contact = contactMap[m.supplierId];
        key = `id-${m.supplierId}`;
        supplierInfo = {
          name: contact.name || "Unknown",
          initials: (contact.name || "U").charAt(0).toUpperCase(),
          company: contact.company || ""
        };
      } else if (m.supplier) {
        key = m.supplier.toLowerCase().replace(/\s+/g, "-");
        supplierInfo = {
          name: m.supplier,
          initials: m.supplier.charAt(0).toUpperCase(),
          company: ""
        };
      }

      if (!groups[key]) groups[key] = { supplier: supplierInfo, materials: [] };
      groups[key].materials.push(m);
    });
    return groups;
  }, [regularMaterials, contactMap]);

  // Group quotes by supplier then quote number
  const quotesBySupplier = useMemo(() => {
    const groups: Record<string, { supplier: any; quoteGroups: Record<string, Material[]> }> = {};

    quotes.forEach(q => {
      let key = "unknown";
      let supplierInfo = { name: "Unknown Supplier", initials: "U", company: "" };

      if (q.supplierId && contactMap[q.supplierId]) {
        const contact = contactMap[q.supplierId];
        key = `id-${q.supplierId}`;
        supplierInfo = {
          name: contact.name || "Unknown",
          initials: (contact.name || "U").charAt(0).toUpperCase(),
          company: contact.company || ""
        };
      } else if (q.supplier) {
        key = q.supplier.toLowerCase().replace(/\s+/g, "-");
        supplierInfo = {
          name: q.supplier,
          initials: q.supplier.charAt(0).toUpperCase(),
          company: ""
        };
      }

      if (!groups[key]) groups[key] = { supplier: supplierInfo, quoteGroups: {} };

      const quoteNum = q.quoteNumber || `ungrouped-${q.id}`;
      if (!groups[key].quoteGroups[quoteNum]) groups[key].quoteGroups[quoteNum] = [];
      groups[key].quoteGroups[quoteNum].push(q);
    });

    return groups;
  }, [quotes, contactMap]);

  // Delete material
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/materials/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete");
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/materials"] });
      if (projectId) queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "materials"] });
      toast({ title: "Material deleted" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete material", variant: "destructive" });
    }
  });

  // Duplicate material handler
  const handleDuplicate = (material: Material) => {
    setSelectedMaterial({
      ...material,
      name: `${material.name} (Copy)`
    });
    setCreateDialogOpen(true);
  };

  // Toggle quote expansion
  const toggleQuote = (key: string) => {
    const newSet = new Set(expandedQuotes);
    if (newSet.has(key)) newSet.delete(key);
    else newSet.add(key);
    setExpandedQuotes(newSet);
  };

  // Format date
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric", month: "short", day: "numeric"
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-500">Loading materials...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main Tabs: Materials | Quotes */}
      {/* Main Tabs: Materials | Quotes */}
      <Tabs defaultValue="materials" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2 bg-slate-100 p-1 rounded-lg">
          <TabsTrigger
            value="materials"
            className="rounded-md data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm transition-all"
          >
            <Package className="h-4 w-4 mr-2" />
            Materials <span className="ml-1.5 text-xs bg-slate-100 px-1.5 py-0.5 rounded-full text-slate-600 group-data-[state=active]:bg-slate-50">{regularMaterials.length}</span>
          </TabsTrigger>
          <TabsTrigger
            value="quotes"
            className="rounded-md data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm transition-all"
          >
            <FileText className="h-4 w-4 mr-2" />
            Quotes <span className="ml-1.5 text-xs bg-slate-100 px-1.5 py-0.5 rounded-full text-slate-600 group-data-[state=active]:bg-slate-50">{quotes.length}</span>
          </TabsTrigger>
        </TabsList>

        {/* Materials Tab */}
        <TabsContent value="materials" className="mt-6 space-y-6">
          {/* Grouping Toggle */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-500 mr-2">Group by:</span>
              <div className="flex bg-slate-100 p-1 rounded-lg">
                <button
                  onClick={() => { setMaterialsGroupBy("category"); setSelectedProject(null); setSelectedTier1(null); setSelectedTier2(null); }}
                  className={cn(
                    "px-3 py-1.5 text-sm font-medium rounded-md transition-all flex items-center gap-2",
                    materialsGroupBy === "category" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                  )}
                >
                  <Layers className="h-4 w-4" />
                  Category
                </button>
                <button
                  onClick={() => { setMaterialsGroupBy("supplier"); setSelectedSupplier(null); }}
                  className={cn(
                    "px-3 py-1.5 text-sm font-medium rounded-md transition-all flex items-center gap-2",
                    materialsGroupBy === "supplier" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                  )}
                >
                  <Building className="h-4 w-4" />
                  Supplier
                </button>
                <button
                  onClick={() => setMaterialsGroupBy("list")}
                  className={cn(
                    "px-3 py-1.5 text-sm font-medium rounded-md transition-all flex items-center gap-2",
                    materialsGroupBy === "list" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                  )}
                >
                  <List className="h-4 w-4" />
                  List
                </button>
              </div>
            </div>

            <Select value={statusFilter || "all"} onValueChange={(v) => setStatusFilter(v === "all" ? null : v)}>
              <SelectTrigger className="w-[160px] h-9 border-slate-200 bg-white">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="ordered">Ordered</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="installed">Installed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Mobile Add Material Button - Full Width */}
          <Button
            onClick={() => setCreateDialogOpen(true)}
            className="w-full mb-4 bg-slate-900 hover:bg-slate-800 sm:hidden"
          >
            <Plus className="h-4 w-4 mr-2" /> Add Material
          </Button>

          {/* Category View */}
          {materialsGroupBy === "category" && (
            <div className="space-y-4">
              {/* If we're in a project context, skip project selection */}
              {projectId ? (
                // Direct tier1 view for project context
                (() => {
                  const projectTheme = currentProject ? getProjectTheme(currentProject.colorTheme, currentProject.id) : null;
                  const themeColors = projectTheme ? [projectTheme.primary, projectTheme.secondary, projectTheme.accent, projectTheme.muted, projectTheme.border] : ['#f97316', '#3b82f6', '#22c55e', '#a855f7', '#64748b'];
                  return !selectedTier1 ? (
                    // Tier 1 Grid
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {tier1Categories.map((tier1: string, index: number) => {
                        const mats = materialsByTier1[tier1] || [];
                        const value = mats.reduce((s, m) => s + (m.cost || 0) * m.quantity, 0);
                        const tier1Color = themeColors[index % themeColors.length];
                        return (
                          <Card
                            key={tier1}
                            className="cursor-pointer hover:shadow-md transition-all border-slate-200 hover:border-slate-300 group overflow-hidden"
                            onClick={() => setSelectedTier1(tier1)}
                          >
                            <div className="flex h-full">
                              {/* Color strip */}
                              <div className="w-1.5 h-full" style={{ backgroundColor: tier1Color }}></div>
                              <div className="p-4 flex-1">
                                <div className="flex justify-between items-start mb-2">
                                  <div className={`p-2 rounded-lg bg-opacity-10`} style={{ backgroundColor: `${tier1Color}20`, color: tier1Color }}>
                                    <Package className="h-5 w-5" />
                                  </div>
                                  <Badge variant="outline" className="font-normal text-slate-500 bg-slate-50">
                                    {mats.length} items
                                  </Badge>
                                </div>
                                <h3 className="font-semibold text-base text-slate-900 mb-1 group-hover:text-amber-600 transition-colors">{tier1}</h3>
                                <p className="text-sm font-medium text-slate-600">{formatCurrency(value)}</p>
                              </div>
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  ) : (
                    // Tier 1 Detail View
                    <div className="space-y-4">
                      <Button variant="ghost" onClick={() => { setSelectedTier1(null); setSelectedTier2(null); }}>
                        <ChevronLeft className="h-4 w-4 mr-1" /> Back to Categories
                      </Button>

                      <div className="p-4 rounded-lg bg-white border border-slate-200 shadow-sm flex items-center gap-4">
                        <div className="h-10 w-10 rounded-lg flex items-center justify-center text-white" style={{ backgroundColor: themeColors[tier1Categories.indexOf(selectedTier1 || '') % themeColors.length] }}>
                          <Package className="h-6 w-6" />
                        </div>
                        <div>
                          <h2 className="text-xl font-semibold text-slate-900">{selectedTier1}</h2>
                          <p className="text-sm text-slate-500">{(materialsByTier1[selectedTier1] || []).length} materials</p>
                        </div>
                      </div>

                      {/* Materials in this tier1 */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {(materialsByTier1[selectedTier1] || []).map(material => (
                          <MaterialCard
                            key={material.id}
                            material={material}
                            onEdit={(m) => { setSelectedMaterial(m as Material); setEditDialogOpen(true); }}
                            onDelete={(id) => deleteMutation.mutate(id)}
                            onDuplicate={(m) => handleDuplicate(m as Material)}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })()
              ) : (
                // Global view: Projects -> Tier1 -> Materials
                !selectedProject ? (
                  // Project Grid
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {projects.length > 0 ? (
                      projects.map((project: any) => {
                        const mats = materialsByProject[project.id] || [];
                        const value = mats.reduce((s, m) => s + (m.cost || 0) * m.quantity, 0);
                        // Get project's theme color - use first tier1 color from its theme
                        const projectTheme = getProjectTheme(project.colorTheme, project.id);
                        const projectColor = projectTheme.primary;
                        return (
                          <Card
                            key={project.id}
                            className="cursor-pointer hover:shadow-md transition-all border-slate-200 hover:border-slate-300 group"
                            onClick={() => setSelectedProject(project.id)}
                          >
                            <div className="flex h-full">
                              <div className="w-1.5 h-full rounded-l-lg" style={{ backgroundColor: projectColor }}></div>
                              <div className="p-4 flex-1">
                                <div className="flex justify-between items-start mb-3">
                                  <div className="p-2 rounded-lg bg-slate-100 text-slate-600 group-hover:bg-slate-200 transition-colors">
                                    <Building className="h-5 w-5" />
                                  </div>
                                  <Badge variant="outline" className="font-normal text-slate-500 bg-slate-50 border-slate-200">
                                    {mats.length} materials
                                  </Badge>
                                </div>
                                <h3 className="font-semibold text-lg text-slate-900 mb-1 group-hover:text-blue-600 transition-colors">{project.name}</h3>
                                <p className="text-sm font-medium text-slate-600">{formatCurrency(value)}</p>
                              </div>
                            </div>
                          </Card>
                        );
                      })
                    ) : (
                      <Card className="col-span-full">
                        <CardContent className="p-8 text-center text-slate-500">
                          No projects found
                        </CardContent>
                      </Card>
                    )}
                  </div>
                ) : !selectedTier1 ? (
                  // Tier 1 Grid for selected project
                  <div className="space-y-4">
                    <Button variant="ghost" onClick={() => { setSelectedProject(null); setSelectedTier1(null); }}>
                      <ChevronLeft className="h-4 w-4 mr-1" /> Back to Projects
                    </Button>

                    {/* Project header */}
                    {(() => {
                      const project = projects.find((p: any) => p.id === selectedProject);
                      if (!project) return null;
                      const projectTheme = getProjectTheme(project.colorTheme, project.id);
                      const projectColor = projectTheme.primary;
                      const themeColors = [projectTheme.primary, projectTheme.secondary, projectTheme.accent, projectTheme.muted, projectTheme.border];
                      return (
                        <>
                          <div className="p-4 rounded-lg bg-white border border-slate-200 shadow-sm flex items-center justify-between mb-6">
                            <div className="flex items-center gap-4">
                              <div className="h-10 w-10 rounded-lg flex items-center justify-center text-white shadow-sm" style={{ backgroundColor: projectColor }}>
                                <Building className="h-6 w-6" />
                              </div>
                              <div>
                                <h2 className="text-xl font-bold text-slate-900">{project.name}</h2>
                                <p className="text-sm text-slate-500 flex items-center gap-2">
                                  <Package className="h-3 w-3" />
                                  {projectMaterials.length} materials
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-xl font-bold text-slate-900">
                                {formatCurrency(projectMaterials.reduce((sum: number, m: any) => sum + (m.cost || 0) * m.quantity, 0))}
                              </div>
                              <div className="text-xs text-slate-500 font-medium bg-slate-100 px-2 py-1 rounded inline-block mt-1">
                                Project Total
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {tier1Categories.map((tier1: string, index: number) => {
                              const mats = materialsByTier1[tier1] || [];
                              const value = mats.reduce((s, m) => s + (m.cost || 0) * m.quantity, 0);
                              const tier1Color = themeColors[index % themeColors.length];
                              return (
                                <Card
                                  key={tier1}
                                  className="cursor-pointer hover:shadow-md transition-all border-[#d2b48c] hover:border-[#8b4513] group overflow-hidden"
                                  onClick={() => setSelectedTier1(tier1)}
                                >
                                  <div className="flex h-full">
                                    <div className="w-1.5 h-full" style={{ backgroundColor: tier1Color }}></div>
                                    <div className="p-4 flex-1">
                                      <div className="flex justify-between items-start mb-2">
                                        <div className={`p-2 rounded-lg bg-opacity-10`} style={{ backgroundColor: `${tier1Color}20`, color: tier1Color }}>
                                          <Package className="h-5 w-5" />
                                        </div>
                                        <Badge variant="outline" className="font-normal text-[#8b4513] bg-[#fdf6e7] border-[#d2b48c]">
                                          {mats.length} items
                                        </Badge>
                                      </div>
                                      <h3 className="font-semibold text-base text-[#8b4513] mb-1 group-hover:text-[#6b3410] transition-colors">{tier1}</h3>
                                      <p className="text-sm font-medium text-[#a0522d]">{formatCurrency(value)}</p>
                                    </div>
                                  </div>
                                </Card>
                              );
                            })}
                          </div>
                        </>
                      );
                    })()}
                  </div>
                ) : (
                  // Tier 1 Detail View (materials for selected tier1 in selected project)
                  <div className="space-y-4">
                    {(() => {
                      const project = projects.find((p: any) => p.id === selectedProject);
                      const projectTheme = project ? getProjectTheme(project.colorTheme, project.id) : null;
                      const themeColors = projectTheme ? [projectTheme.primary, projectTheme.secondary, projectTheme.accent, projectTheme.muted, projectTheme.border] : [];
                      const tier1Index = tier1Categories.indexOf(selectedTier1 || '');
                      const tier1Color = themeColors[tier1Index % themeColors.length] || '#64748b';
                      return (
                        <>
                          <Button variant="ghost" onClick={() => { setSelectedTier1(null); setSelectedTier2(null); }}>
                            <ChevronLeft className="h-4 w-4 mr-1" /> Back to Categories
                          </Button>

                          <div className="p-4 rounded-lg bg-white border border-slate-200 shadow-sm flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="h-10 w-10 rounded-lg flex items-center justify-center text-white shadow-sm" style={{ backgroundColor: tier1Color }}>
                                <Package className="h-6 w-6" />
                              </div>
                              <div>
                                <h2 className="text-xl font-bold text-slate-900">{selectedTier1}</h2>
                                <p className="text-sm text-slate-500">{(materialsByTier1[selectedTier1] || []).length} materials</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-xl font-bold text-slate-900">
                                {formatCurrency((materialsByTier1[selectedTier1] || []).reduce((sum: number, m: any) => sum + (m.cost || 0) * m.quantity, 0))}
                              </div>
                              <div className="text-xs text-slate-500 font-medium bg-slate-100 px-2 py-1 rounded inline-block mt-1">
                                Category Total
                              </div>
                            </div>
                          </div>

                          {/* Materials in this tier1 */}
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {(materialsByTier1[selectedTier1] || []).map(material => (
                              <MaterialCard
                                key={material.id}
                                material={{
                                  ...material,
                                  tier1Color: tier1Color // Explicitly pass the resolved color from the parent view
                                }}
                                onEdit={(m) => { setSelectedMaterial(m as Material); setEditDialogOpen(true); }}
                                onDelete={(id) => deleteMutation.mutate(id)}
                                onDuplicate={(m) => handleDuplicate(m as Material)}
                              />
                            ))}
                          </div>
                        </>
                      );
                    })()}
                  </div>
                )
              )}
            </div>
          )}

          {/* Supplier View */}
          {materialsGroupBy === "supplier" && (
            <div className="space-y-4">
              {!selectedSupplier ? (
                // Supplier Grid
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(materialsBySupplier).map(([key, { supplier, materials: mats }]) => {
                    const value = mats.reduce((s, m) => s + (m.cost || 0) * m.quantity, 0);
                    return (
                      <Card
                        key={key}
                        className="cursor-pointer hover:shadow-md transition-all border-slate-200 hover:border-slate-300 group overflow-hidden"
                        onClick={() => setSelectedSupplier(key)}
                      >
                        <div className="flex h-full">
                          <div className="w-1.5 h-full bg-slate-900"></div>
                          <div className="p-4 flex-1">
                            <div className="flex justify-between items-start mb-3">
                              <div className="h-10 w-10 rounded-lg bg-orange-100 text-orange-700 flex items-center justify-center font-bold text-sm">
                                {supplier.initials}
                              </div>
                              <Badge variant="outline" className="font-normal text-slate-500 bg-slate-50 border-slate-200">
                                {mats.length} items
                              </Badge>
                            </div>
                            <h3 className="font-semibold text-lg text-slate-900 mb-1 group-hover:text-amber-600 transition-colors">{supplier.name}</h3>
                            {supplier.company && <p className="text-sm text-slate-500 mb-1">{supplier.company}</p>}
                            <p className="text-sm font-medium text-slate-900 mt-2">{formatCurrency(value)}</p>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                // Supplier Detail
                <div className="space-y-4">
                  <Button variant="ghost" onClick={() => setSelectedSupplier(null)}>
                    <ChevronLeft className="h-4 w-4 mr-1" /> Back to Suppliers
                  </Button>

                  {materialsBySupplier[selectedSupplier] && (
                    <>
                      <div className="p-4 rounded-lg bg-white border border-slate-200 shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-lg bg-orange-100 text-orange-700 flex items-center justify-center font-bold text-xl">
                            {materialsBySupplier[selectedSupplier].supplier.initials}
                          </div>
                          <div>
                            <h3 className="text-xl font-semibold text-slate-900">{materialsBySupplier[selectedSupplier].supplier.name}</h3>
                            <p className="text-slate-500 text-sm">
                              {materialsBySupplier[selectedSupplier].materials.length} materials
                              {materialsBySupplier[selectedSupplier].supplier.company && ` • ${materialsBySupplier[selectedSupplier].supplier.company}`}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-slate-900">
                            {formatCurrency(materialsBySupplier[selectedSupplier].materials.reduce((s, m) => s + (m.cost || 0) * m.quantity, 0))}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {materialsBySupplier[selectedSupplier].materials.map(material => (
                          <MaterialCard
                            key={material.id}
                            material={material}
                            onEdit={(m) => { setSelectedMaterial(m as Material); setEditDialogOpen(true); }}
                            onDelete={(id) => deleteMutation.mutate(id)}
                            onDuplicate={(m) => handleDuplicate(m as Material)}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* List View */}
          {materialsGroupBy === "list" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {regularMaterials.length > 0 ? (
                regularMaterials.map(material => {
                  // Calculate the correct color for this material based on its category
                  // matching the logic used in the Category View
                  let tier1Color = null;

                  if (material.tier1Category || material.tier) {
                    const categoryName = material.tier1Category || material.tier || '';
                    const project = projects.find((p: any) => p.id === (material.projectId || selectedProject));

                    if (project) {
                      const projectTheme = getProjectTheme(project.colorTheme, project.id);
                      const themeColors = [projectTheme.primary, projectTheme.secondary, projectTheme.accent, projectTheme.muted, projectTheme.border];

                      // Use the project's specific category list if available (best effort since we don't have the full filtered list here easily)
                      // Fallback to the global tier1 list we have
                      const tier1Index = tier1Categories.indexOf(categoryName);
                      if (tier1Index >= 0) {
                        tier1Color = themeColors[tier1Index % themeColors.length];
                      }
                    }
                  }

                  return (
                    <MaterialCard
                      key={material.id}
                      material={{
                        ...material,
                        tier1Color: tier1Color || material.tier1Color // Prefer calculated theme color, fallback to DB color
                      }}
                      onEdit={(m) => { setSelectedMaterial(m as Material); setEditDialogOpen(true); }}
                      onDelete={(id) => deleteMutation.mutate(id)}
                      onDuplicate={(m) => handleDuplicate(m as Material)}
                    />
                  );
                })
              ) : (
                <Card className="col-span-full">
                  <CardContent className="p-8 text-center text-slate-500">
                    No materials found
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>

        {/* Quotes Tab */}
        <TabsContent value="quotes" className="mt-4">
          <div className="space-y-4">
            {/* Quote Actions */}
            {/* Quote Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCreateQuoteDialogOpen(true)}
                  className="bg-white hover:bg-slate-50 text-slate-700"
                >
                  <FileText className="h-4 w-4 mr-1.5" /> Add Quote
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setImportDialogOpen(true)}
                  className="bg-white hover:bg-slate-50 text-slate-700"
                >
                  <Upload className="h-4 w-4 mr-1.5" /> Import CSV
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setImportInvoiceDialogOpen(true)}
                  className="bg-white hover:bg-slate-50 text-slate-700"
                >
                  <Sparkles className="h-4 w-4 mr-1.5 text-amber-500" /> Import Invoice
                </Button>
              </div>
              {quotes.length > 0 && (
                <Button
                  size="sm"
                  onClick={() => setInvoiceDialogOpen(true)}
                  className="bg-slate-900 hover:bg-slate-800"
                >
                  <FileText className="h-4 w-4 mr-2" /> Create Invoice
                </Button>
              )}
            </div>

            {/* Quotes grouped by supplier */}
            {Object.entries(quotesBySupplier).length > 0 ? (
              Object.entries(quotesBySupplier).map(([supplierKey, { supplier, quoteGroups }]) => {
                const allQuotes = Object.values(quoteGroups).flat();
                const totalValue = allQuotes.reduce((s, q) => s + (q.cost || 0) * q.quantity, 0);

                return (
                  <Card key={supplierKey} className="border border-slate-200 shadow-sm overflow-hidden">
                    {/* Supplier Header */}
                    <div className="p-4 bg-slate-50 border-b border-slate-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-lg bg-white border border-slate-200 text-slate-700 flex items-center justify-center font-bold shadow-sm">
                            {supplier.initials}
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg text-slate-900">{supplier.name}</h3>
                            {supplier.company && <p className="text-sm text-slate-500">{supplier.company}</p>}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-bold text-slate-900">{formatCurrency(totalValue)}</div>
                          <div className="text-sm text-slate-500">{Object.keys(quoteGroups).length} quotes • {allQuotes.length} items</div>
                        </div>
                      </div>
                    </div>

                    {/* Quote Groups */}
                    <CardContent className="p-3 space-y-3">
                      {Object.entries(quoteGroups).map(([quoteNum, quoteMaterials]) => {
                        const quoteKey = `${supplierKey}-${quoteNum}`;
                        const isExpanded = expandedQuotes.has(quoteKey);
                        const quoteTotal = quoteMaterials.reduce((s, m) => s + (m.cost || 0) * m.quantity, 0);
                        const firstMat = quoteMaterials[0];
                        const isUngrouped = quoteNum.startsWith("ungrouped-");

                        return (
                          <div key={quoteKey} className="border border-slate-200 rounded-lg overflow-hidden">
                            {/* Quote Header */}
                            <div
                              className="bg-white p-3 cursor-pointer hover:bg-slate-50 transition-colors flex items-center justify-between border-b border-slate-100"
                              onClick={() => toggleQuote(quoteKey)}
                            >
                              <div className="flex items-center gap-3">
                                <div className="h-9 w-9 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
                                  <Hash className="h-5 w-5" />
                                </div>
                                <div>
                                  <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-300 font-medium">
                                    {isUngrouped ? "No Quote #" : quoteNum}
                                  </Badge>
                                  {firstMat.quoteDate && (
                                    <p className="text-xs text-slate-500 mt-1">{formatDate(firstMat.quoteDate)}</p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="text-right">
                                  <div className="font-semibold text-amber-900">{formatCurrency(quoteTotal)}</div>
                                  <div className="text-xs text-amber-700">{quoteMaterials.length} items</div>
                                </div>
                                <ChevronDown className={cn("h-5 w-5 text-amber-600 transition-transform", isExpanded && "rotate-180")} />
                              </div>
                            </div>

                            {/* Quote Materials */}
                            {isExpanded && (
                              <div className="p-3 bg-amber-50/50 grid gap-3">
                                {quoteMaterials.map(m => (
                                  <div
                                    key={m.id}
                                    className="p-3 border border-amber-200 rounded-lg bg-white cursor-pointer hover:bg-amber-50 hover:border-amber-400 transition-colors"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setDetailMaterial(m);
                                      setDetailDialogOpen(true);
                                    }}
                                  >
                                    <div className="flex justify-between items-center">
                                      <span className="font-medium">{m.name}</span>
                                      <Badge className="bg-amber-100 text-amber-800">
                                        {formatCurrency((m.cost || 0) * m.quantity)}
                                      </Badge>
                                    </div>
                                    <div className="text-sm text-slate-500 mt-1">
                                      {m.quantity} {m.unit || "units"} × {formatCurrency(m.cost || 0)}
                                    </div>
                                    <div className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                                      <Info className="h-3 w-3" /> Click for details
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <Card className="border-amber-200">
                <CardContent className="p-8 text-center">
                  <FileText className="h-12 w-12 mx-auto text-amber-300 mb-3" />
                  <p className="text-slate-500">No quotes found. Add a quote to get started.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <CreateMaterialDialog
        open={createDialogOpen}
        onOpenChange={(open) => {
          setCreateDialogOpen(open);
          if (!open) setSelectedMaterial(null);
        }}
        projectId={projectId || selectedProject || 0}
        initialMaterial={selectedMaterial || undefined}
        initialTier1={selectedTier1 || undefined}
        initialTier2={selectedTier2 || undefined}
      />

      <CreateQuoteDialog
        open={createQuoteDialogOpen}
        onOpenChange={setCreateQuoteDialogOpen}
        projectId={projectId || 0}
      />

      {editDialogOpen && selectedMaterial && (
        <EditMaterialDialog
          open={editDialogOpen}
          onOpenChange={(open) => {
            setEditDialogOpen(open);
            if (!open) setSelectedMaterial(null);
          }}
          material={selectedMaterial as any}
        />
      )}

      <ImportMaterialsDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        projectId={projectId || 0}
      />

      <ImportInvoiceDialog
        open={importInvoiceDialogOpen}
        onOpenChange={setImportInvoiceDialogOpen}
        projectId={projectId || 0}
      />

      <CreateInvoiceFromMaterials
        open={invoiceDialogOpen}
        onOpenChange={setInvoiceDialogOpen}
        projectId={projectId || 0}
        preselectedMaterials={quotes}
      />

      {/* Material Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white">
          <DialogHeader className="pb-4 border-b border-gray-100">
            <DialogTitle className="flex items-center gap-3 text-gray-900 text-xl">
              <div className="h-10 w-10 rounded-lg bg-orange-500 flex items-center justify-center">
                <Package className="h-5 w-5 text-white" />
              </div>
              Material Details
            </DialogTitle>
          </DialogHeader>

          {detailMaterial && (
            <div className="space-y-6 pt-2">
              {/* Header - Material Name & Status */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-900">{detailMaterial.name}</h3>
                  {detailMaterial.materialSize && (
                    <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                      <Ruler className="h-4 w-4" /> {detailMaterial.materialSize}
                    </p>
                  )}
                </div>
                <Badge className={cn(
                  "text-sm px-3 py-1.5 capitalize font-medium",
                  detailMaterial.status === "delivered" ? "bg-gray-900 text-white" :
                    detailMaterial.status === "ordered" ? "bg-orange-500 text-white" :
                      detailMaterial.status === "pending" ? "bg-gray-200 text-gray-700" :
                        "bg-gray-100 text-gray-600"
                )}>
                  {detailMaterial.status}
                </Badge>
              </div>

              {/* Pricing Grid - 3 columns */}
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg text-center border-2 border-gray-300">
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">Unit Cost</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(detailMaterial.cost || 0)}
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg text-center border-2 border-gray-300">
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">Quantity</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {detailMaterial.quantity}
                    <span className="text-sm font-normal text-gray-500 ml-1">{detailMaterial.unit || "units"}</span>
                  </p>
                </div>
                <div className="p-4 bg-orange-50 rounded-lg text-center border-2 border-orange-300">
                  <p className="text-xs text-orange-600 font-medium uppercase tracking-wide mb-1">Total</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {formatCurrency((detailMaterial.cost || 0) * detailMaterial.quantity)}
                  </p>
                </div>
              </div>

              {/* Two Column Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                {/* Quote Info */}
                {(detailMaterial.quoteNumber || detailMaterial.quoteDate) && (
                  <div className="p-4 bg-white rounded-lg border-2 border-gray-300">
                    <div className="flex items-center gap-2 mb-2">
                      <Hash className="h-4 w-4 text-orange-500" />
                      <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Quote Info</p>
                    </div>
                    {detailMaterial.quoteNumber && (
                      <p className="text-base font-semibold text-gray-900">#{detailMaterial.quoteNumber}</p>
                    )}
                    {detailMaterial.quoteDate && (
                      <p className="text-sm text-gray-500 mt-0.5">{formatDate(detailMaterial.quoteDate)}</p>
                    )}
                  </div>
                )}

                {/* Order Date */}
                {detailMaterial.orderDate && (
                  <div className="p-4 bg-white rounded-lg border-2 border-gray-300">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="h-4 w-4 text-orange-500" />
                      <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Order Date</p>
                    </div>
                    <p className="text-base font-semibold text-gray-900">{formatDate(detailMaterial.orderDate)}</p>
                  </div>
                )}

                {/* Supplier Info */}
                {detailMaterial.supplier && (
                  <div className="p-4 bg-white rounded-lg border-2 border-gray-300">
                    <div className="flex items-center gap-2 mb-2">
                      <Building className="h-4 w-4 text-orange-500" />
                      <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Supplier</p>
                    </div>
                    <p className="text-base font-semibold text-gray-900">{detailMaterial.supplier}</p>
                  </div>
                )}

                {/* Project & Category Info - Combined */}
                {(() => {
                  // Get project theme for category colors
                  const materialProject = projects.find((p: any) => p.id === detailMaterial.projectId) || currentProject;
                  const materialTheme = materialProject ? getProjectTheme(materialProject.colorTheme, materialProject.id) : null;
                  const projectColor = materialTheme?.primary || '#f97316';
                  const tier1Color = materialTheme?.primary || '#f97316';
                  const tier2Color = materialTheme?.secondary || '#3b82f6';
                  const hasProjectOrCategory = materialProject || detailMaterial.tier || detailMaterial.tier1Category || detailMaterial.tier2Category;

                  return hasProjectOrCategory ? (
                    <div className="p-4 bg-white rounded-lg border-2 border-gray-300">
                      <div className="flex items-center gap-2 mb-3">
                        <Tag className="h-4 w-4 text-orange-500" />
                        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Project & Category</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {/* Project Badge */}
                        {materialProject && (
                          <Badge
                            className="text-xs text-white border-0"
                            style={{ backgroundColor: projectColor }}
                          >
                            {materialProject.name}
                          </Badge>
                        )}
                        {/* Tier 1 Category */}
                        {(detailMaterial.tier || detailMaterial.tier1Category) && (
                          <Badge
                            className="text-xs text-white border-0"
                            style={{ backgroundColor: tier1Color }}
                          >
                            {detailMaterial.tier || detailMaterial.tier1Category}
                          </Badge>
                        )}
                        {/* Tier 2 Category */}
                        {detailMaterial.tier2Category && (
                          <Badge
                            className="text-xs text-white border-0"
                            style={{ backgroundColor: tier2Color }}
                          >
                            {detailMaterial.tier2Category}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ) : null;
                })()}

                {/* Task & Location Information */}
                <div className="p-4 bg-white rounded-lg border-2 border-gray-300">
                  <div className="flex items-center gap-2 mb-3">
                    <Layers className="h-4 w-4 text-orange-500" />
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Task & Location</p>
                  </div>
                  <div className="space-y-2">
                    {(detailMaterial.section || detailMaterial.subsection) ? (
                      <div>
                        <p className="text-xs text-gray-400 uppercase">Section</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {detailMaterial.section}
                          {detailMaterial.subsection && <span className="text-gray-500"> / {detailMaterial.subsection}</span>}
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400 italic">No location assigned</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Notes - Full Width */}
              {detailMaterial.details && (
                <div className="p-4 bg-gray-50 rounded-lg border-2 border-gray-300">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-4 w-4 text-orange-500" />
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Notes</p>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">{detailMaterial.details}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <Button
                  variant="outline"
                  className="flex-1 h-11 border-gray-300 text-gray-700 hover:bg-gray-50"
                  onClick={() => {
                    setDetailDialogOpen(false);
                    setSelectedMaterial(detailMaterial);
                    setEditDialogOpen(true);
                  }}
                >
                  <Edit className="h-4 w-4 mr-2" /> Edit Material
                </Button>
                <Button
                  variant="default"
                  className="flex-1 h-11 bg-orange-500 hover:bg-orange-600 text-white"
                  onClick={() => setDetailDialogOpen(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
