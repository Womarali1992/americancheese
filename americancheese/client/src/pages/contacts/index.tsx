import React, { useState, useMemo, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { ProjectSelector } from "@/components/project/ProjectSelector";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/utils";
import { 
  Search, 
  Plus, 
  Phone, 
  Mail, 
  Building, 
  MessageSquare,
  User,
  Hammer,
  Truck,
  Database,
  UserCog,
  HardHat,
  Briefcase,
  Lightbulb,
  Construction,
  Users,
  Edit,
  PenSquare,
  FileText,
  ClipboardList,
  ChevronRight,
  ChevronDown,
  FolderOpen,
  Folder,
  X,
  Filter,
  Upload,
  List
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useNavPills } from "@/hooks/useNavPills";
import { CreateContactDialog } from "./CreateContactDialog";
import { Labor } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { formatCategoryName as centralizedFormatCategoryName } from "@/lib/unified-color-system";
import { CreateLaborDialog } from "@/pages/labor/CreateLaborDialog";
import { EditLaborDialog } from "@/pages/labor/EditLaborDialog";
import ImportLaborDialog from "@/components/labor/ImportLaborDialog";

// Project Labor View Component
function ProjectLaborView() {
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [, navigate] = useLocation();
  
  const { data: projects = [] } = useQuery<any[]>({
    queryKey: ["/api/projects"],
  });

  const { data: laborRecords = [] } = useQuery<any[]>({
    queryKey: ["/api/labor"],
  });

  // Group labor records by project
  const laborByProject = laborRecords?.reduce((acc, labor) => {
    const projectId = labor.projectId;
    if (!acc[projectId]) {
      acc[projectId] = [];
    }
    acc[projectId].push(labor);
    return acc;
  }, {} as Record<number, any[]>) || {};

  // Group labor by tier1 and tier2 categories for selected project
  const groupedLabor = selectedProject ? 
    laborByProject[selectedProject]?.reduce((acc, labor) => {
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
    }, {} as Record<string, Record<string, any[]>>) || {} : {};

  const formatCategoryName = (category: string) => {
    return category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
  };

  const getTier1Color = (tier1: string) => {
    switch (tier1.toLowerCase()) {
      case 'structural': 
        return 'border-2 text-white';
      case 'systems': 
        return 'border-2 text-white';
      case 'sheathing': 
        return 'border-2 text-white';
      case 'finishings': 
        return 'border-2 text-white';
      default: 
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getTier1Style = (tier1: string) => {
    switch (tier1.toLowerCase()) {
      case 'structural':
        return {
          background: 'linear-gradient(135deg, var(--tier1-structural) 0%, rgba(var(--tier1-structural-rgb), 0.7) 100%)',
          borderColor: 'var(--tier1-structural)',
        };
      case 'systems':
        return {
          background: 'linear-gradient(135deg, var(--tier1-systems) 0%, rgba(var(--tier1-systems-rgb), 0.7) 100%)',
          borderColor: 'var(--tier1-systems)',
        };
      case 'sheathing':
        return {
          background: 'linear-gradient(135deg, var(--tier1-sheathing) 0%, rgba(var(--tier1-sheathing-rgb), 0.7) 100%)',
          borderColor: 'var(--tier1-sheathing)',
        };
      case 'finishings':
        return {
          background: 'linear-gradient(135deg, var(--tier1-finishings) 0%, rgba(var(--tier1-finishings-rgb), 0.7) 100%)',
          borderColor: 'var(--tier1-finishings)',
        };
      default:
        return {};
    }
  };

  const getTier2Color = (tier2: string) => {
    return 'border text-white';
  };

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
        background: `linear-gradient(135deg, var(${cssVar}) 0%, var(${cssVar})80 100%)`,
        borderColor: `var(${cssVar})`,
      };
    }
    
    // Default fallback
    return {
      background: 'linear-gradient(135deg, #64748b 0%, #64748b80 100%)',
      borderColor: '#64748b',
    };
  };

  // Calculate total costs for tier1 and tier2 categories
  const calculateTier1Cost = (tier1: string) => {
    if (!selectedProject || !laborByProject[selectedProject]) return 0;
    
    return laborByProject[selectedProject]
      .filter(labor => (labor.tier1Category || '').toLowerCase() === tier1.toLowerCase())
      .reduce((total, labor) => total + (labor.hoursWorked * labor.hourlyRate), 0);
  };

  const calculateTier2Cost = (tier1: string, tier2: string) => {
    if (!selectedProject || !laborByProject[selectedProject]) return 0;
    
    return laborByProject[selectedProject]
      .filter(labor => 
        (labor.tier1Category || '').toLowerCase() === tier1.toLowerCase() &&
        (labor.tier2Category || '').toLowerCase() === tier2.toLowerCase()
      )
      .reduce((total, labor) => total + (labor.hoursWorked * labor.hourlyRate), 0);
  };

  if (!selectedProject) {
    return (
      <div className="space-y-4">
        <div className="text-center py-8">
          <h3 className="text-lg font-semibold mb-2">Select a Project</h3>
          <p className="text-gray-600 mb-6">Choose a project to view its labor records organized by category</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map(project => {
            const projectLaborCount = laborByProject[project.id]?.length || 0;
            return (
              <Card 
                key={project.id}
                className="cursor-pointer hover:shadow-md transition-all border-slate-300"
                onClick={() => setSelectedProject(project.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <FolderOpen className="h-5 w-5 text-slate-600" />
                    <CardTitle className="text-lg">{project.name}</CardTitle>
                  </div>
                  <CardDescription>{project.location}</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      {projectLaborCount} labor {projectLaborCount === 1 ? 'record' : 'records'}
                    </span>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  const selectedProjectData = projects.find(p => p.id === selectedProject);
  const projectLaborRecords = laborByProject[selectedProject] || [];

  return (
    <div className="space-y-6">
      {/* Header with back button */}
      <div className="flex items-center gap-3">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setSelectedProject(null)}
          className="flex items-center gap-1 text-slate-600 hover:text-slate-700 hover:bg-slate-100"
        >
          <ChevronRight className="h-4 w-4 rotate-180" />
          Back to Projects
        </Button>
        <div className="flex items-center gap-2">
          <Folder className="h-5 w-5 text-slate-600" />
          <h2 className="text-xl font-semibold">{selectedProjectData?.name}</h2>
          <span className="px-2 py-1 bg-slate-200 text-slate-700 rounded-full text-xs font-medium">
            {projectLaborRecords.length} records
          </span>
        </div>
      </div>

      {projectLaborRecords.length === 0 ? (
        <div className="text-center py-12">
          <ClipboardList className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">No Labor Records</h3>
          <p className="mt-2 text-sm text-gray-500">No labor records found for this project</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedLabor).map(([tier1, tier2Groups]) => (
            <div key={tier1} className="space-y-4">
              {/* Tier 1 Header */}
              <div 
                className={`p-4 rounded-lg ${getTier1Color(tier1)}`}
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
                    className={`p-3 rounded-md ${getTier2Color(tier2)}`}
                    style={getTier2Style(tier2)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="bg-white bg-opacity-90 px-2 py-1 rounded-md">
                        <h4 className="font-medium flex items-center gap-2 text-gray-800">
                          <Briefcase className="h-4 w-4" />
                          {formatCategoryName(tier2)}
                          <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                            {laborItems.length} {laborItems.length === 1 ? 'record' : 'records'}
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

                  {/* Labor Cards */}
                  <div className="ml-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {laborItems.map(labor => (
                      <Card 
                        key={labor.id} 
                        className="border-slate-200 hover:shadow-md transition-all cursor-pointer hover:border-slate-400"
                        onClick={() => {
                          if (labor.contactId) {
                            navigate(`/contacts/${labor.contactId}/labor`);
                          }
                        }}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-slate-200 text-slate-600 text-xs">
                                {labor.fullName?.split(' ').map((n: string) => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <CardTitle className="text-sm">{labor.fullName}</CardTitle>
                              <CardDescription className="text-xs">{labor.role}</CardDescription>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0 space-y-2">
                          <div className="text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Date:</span>
                              <span>{formatDate(labor.date)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Hours:</span>
                              <span className="font-medium">{labor.hoursWorked}h</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Rate:</span>
                              <span>${labor.hourlyRate}/hr</span>
                            </div>
                            <div className="flex justify-between font-semibold border-t pt-1 mt-2">
                              <span>Total:</span>
                              <span className="text-green-600">${(labor.hoursWorked * labor.hourlyRate).toFixed(2)}</span>
                            </div>
                          </div>
                          {labor.taskDescription && (
                            <div className="text-xs text-gray-600 border-t pt-2">
                              <p className="line-clamp-2 whitespace-pre-wrap">{labor.taskDescription}</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Labor Management Component
function LaborManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [selectedLabor, setSelectedLabor] = useState<Labor | null>(null);
  const [editingLaborId, setEditingLaborId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

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

  // Delete labor mutation
  const deleteLaborMutation = useMutation({
    mutationFn: async (laborId: number) => {
      await apiRequest(`/api/labor/${laborId}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/labor"] });
      toast({
        title: "Success",
        description: "Labor entry deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete labor entry",
        variant: "destructive",
      });
    },
  });

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
    
    const matchesProject = selectedProjectId 
      ? labor.projectId === selectedProjectId 
      : true;
    
    return matchesSearch && matchesStatus && matchesCategory && matchesProject;
  });

  // Handle edit click
  const handleEditLabor = (labor: Labor | any) => {
    setEditingLaborId(labor.id);
    setEditDialogOpen(true);
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

  // Format category names using project-specific names
  const formatCategoryName = (category: string) => {
    return centralizedFormatCategoryName(category, selectedProjectId);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Labor Management</h2>
        <div className="flex gap-2">
          <Button
            onClick={() => setImportDialogOpen(true)}
            variant="outline"
            className="bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200"
          >
            <Upload className="mr-2 h-4 w-4" />
            Import CSV
          </Button>
          <Button
            onClick={() => setCreateDialogOpen(true)}
            className="bg-slate-600 text-white hover:bg-slate-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Labor Entry
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center p-4 bg-gray-50 rounded-lg">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search labor entries..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="on_hold">On Hold</SelectItem>
          </SelectContent>
        </Select>

        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="structural">Structural</SelectItem>
            <SelectItem value="systems">Systems</SelectItem>
            <SelectItem value="sheathing">Sheathing</SelectItem>
            <SelectItem value="finishings">Finishings</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex-1 min-w-[200px]">
          <ProjectSelector
            selectedProjectId={selectedProjectId}
            onChange={(projectId) => setSelectedProjectId(projectId === "all" ? null : Number(projectId))}
            includeAllOption={true}
            theme="slate"
          />
        </div>
      </div>

      {/* Labor Records */}
      {isLoadingLabor ? (
        <div className="text-center py-8">Loading labor records...</div>
      ) : filteredLabor.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No labor records found</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredLabor.map((labor) => (
            <LaborCard
              key={labor.id}
              labor={labor}
              onEdit={handleEditLabor}
              onDelete={handleDeleteLabor}
            />
          ))}
        </div>
      )}

      {/* Dialogs */}
      <CreateLaborDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
      
      <EditLaborDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        laborId={editingLaborId}
      />
      
      <ImportLaborDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
      />
    </div>
  );
}

import { EditContactDialog } from "./EditContactDialog";
import { SuppliersView, SupplierQuotes } from "./SuppliersView";
import { AddLaborFromContactDialog } from "./AddLaborFromContactDialog";
import { ViewContactLaborDialog } from "./ViewContactLaborDialog";
import { LaborCard } from "@/components/labor/LaborCard";

interface ContactLaborSectionProps {
  contactId: number;
}

// Compact Labor Card component for use in the Contact Labor Section
function CompactLaborCard({ labor }: { labor: any }) {
  const [, navigate] = useLocation();
  
  const handleLaborClick = () => {
    if (labor.contactId) {
      navigate(`/contacts/${labor.contactId}/labor/${labor.id}`);
    }
  };
  
  return (
    <div 
      className="p-3 bg-white rounded-md border border-slate-200 hover:shadow-sm cursor-pointer transition-shadow"
      onClick={handleLaborClick}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs px-1.5 py-0.5 rounded-full bg-slate-200 text-slate-700 font-medium">
          {labor.tier2Category || 'Other'}
        </span>
        <span className="text-xs font-medium text-slate-500">
          {formatDate(labor.workDate)}
        </span>
      </div>
      <div className="flex justify-between items-center">
        <div className="flex-1">
          <h4 className="font-medium text-sm">{labor.areaOfWork || "General Work"}</h4>
          <p className="text-xs text-slate-600 truncate mt-0.5">
            {labor.totalHours ? `${labor.totalHours} hrs` : "Hours not specified"}
          </p>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-7 w-7 p-0"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/contacts/${labor.contactId}/labor/${labor.id}`);
          }}
        >
          <ChevronRight className="h-4 w-4 text-slate-500" />
        </Button>
      </div>
    </div>
  );
}

function ContactLaborSection({ contactId }: ContactLaborSectionProps) {
  const [isAddLaborOpen, setIsAddLaborOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const { data: laborRecords = [], isLoading } = useQuery<any[]>({
    queryKey: [`/api/contacts/${contactId}/labor`],
  });
  
  // Handle labor dialog close with refresh
  const handleLaborDialogChange = (open: boolean) => {
    setIsAddLaborOpen(open);
    if (!open) {
      // Refresh labor records when dialog closes
      queryClient.invalidateQueries({ queryKey: [`/api/contacts/${contactId}/labor`] });
    }
  };

  const handleAddLaborClick = () => {
    setIsAddLaborOpen(true);
  };
  
  const handleViewAllLabor = () => {
    navigate(`/contacts/${contactId}/labor`);
  };

  if (isLoading) {
    return (
      <div className="ml-6 border-l-2 border-slate-300 pl-4 py-2 space-y-2">
        <div className="animate-pulse bg-slate-200 h-16 rounded"></div>
        <div className="animate-pulse bg-slate-200 h-16 rounded"></div>
      </div>
    );
  }

  return (
    <>
      <div className="ml-6 border-l-2 border-slate-300 pl-4 py-2 space-y-2">
        {/* Section Header */}
        <div className="flex justify-between items-center mb-2">
          <div className="text-sm font-medium text-slate-600 flex items-center">
            <ClipboardList className="mr-1 h-4 w-4" />
            Labor Records
          </div>
          <div className="flex gap-1">
            <Button 
              size="sm" 
              variant="outline" 
              className="h-8 text-xs bg-slate-100 text-slate-600 hover:bg-slate-200"
              onClick={handleAddLaborClick}
            >
              <Plus className="mr-1 h-3 w-3" /> Add
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              className="h-8 text-xs bg-slate-100 text-slate-600 hover:bg-slate-200"
              onClick={handleViewAllLabor}
            >
              <ClipboardList className="mr-1 h-3 w-3" /> View All
            </Button>
          </div>
        </div>
        
        {/* Labor Records List with Single Collapsible Section */}
        {laborRecords?.length === 0 ? (
          <div className="text-center py-4 text-sm text-slate-500">
            No labor records found for this contractor
          </div>
        ) : (
          <div className="space-y-2">
            {/* All labor records in one collapsible section */}
            <Collapsible 
              open={isExpanded}
              onOpenChange={setIsExpanded}
              className="border rounded-md overflow-hidden"
            >
              <CollapsibleTrigger className="w-full text-left">
                <div className="bg-slate-50 p-2 border-b hover:bg-slate-100 transition-colors flex justify-between items-center">
                  <h5 className="font-medium text-sm text-slate-700">Labor Records</h5>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-600">
                      {laborRecords.length} records
                    </span>
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-slate-400" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-slate-400" />
                    )}
                  </div>
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="p-3 space-y-2">
                  {laborRecords.map((labor: any) => (
                    <CompactLaborCard key={labor.id} labor={labor} />
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
            
            {/* View all link at the bottom */}
            {laborRecords.length > 5 && !isExpanded && (
              <div className="text-center pt-1">
                <Button 
                  variant="link" 
                  className="text-xs text-slate-600 hover:text-slate-800 p-0 h-auto"
                  onClick={handleViewAllLabor}
                >
                  View all {laborRecords.length} labor records
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Add Labor Dialog */}
      <AddLaborFromContactDialog 
        open={isAddLaborOpen}
        onOpenChange={handleLaborDialogChange}
        contactId={contactId}
      />
    </>
  );
}


interface ContactCardProps {
  contact: {
    id: number;
    name: string;
    role: string;
    company?: string;
    phone?: string;
    email?: string;
    type: string;
    initials?: string;
  };
  isExpanded?: boolean;
  onToggleExpand?: (contactId: number) => void;
}

function ContactCard({ 
  contact, 
  isExpanded = false, 
  onToggleExpand = () => {}
}: ContactCardProps) {
  const [isEditContactOpen, setIsEditContactOpen] = useState(false);
  const [isViewingQuotes, setIsViewingQuotes] = useState(false);
  const [isAddLaborOpen, setIsAddLaborOpen] = useState(false);
  const [, navigate] = useLocation();
  
  // Make the entire card clickable for contractors to navigate to labor list
  const handleCardClick = () => {
    if (contact.type === "contractor") {
      navigate(`/contacts/${contact.id}/labor`);
    }
  };
  
  const getInitialsColor = (type: string) => {
    switch (type) {
      case "contractor":
        return "bg-slate-200 text-slate-700";
      case "supplier":
        return "bg-slate-300 text-slate-700";
      case "consultant":
        return "bg-slate-200 text-slate-600";
      default:
        return "bg-slate-500 text-white";
    }
  };
  
  // Get specialty badge color based on role for contractors
  const getSpecialtyBadge = (role: string) => {
    if (!role) return null;
    
    const specialty = role.toLowerCase();
    
    let bgColor = "bg-slate-100";
    let textColor = "text-slate-600";
    let icon = null;
    
    if (specialty.includes("electrical")) {
      bgColor = "bg-slate-200";
      textColor = "text-slate-700";
      icon = <Construction className="h-3 w-3 mr-1 text-slate-500" />;
    } else if (specialty.includes("plumbing")) {
      bgColor = "bg-slate-300";
      textColor = "text-slate-700";
      icon = <Construction className="h-3 w-3 mr-1 text-slate-500" />;
    } else if (specialty.includes("carpentry")) {
      bgColor = "bg-slate-200";
      textColor = "text-slate-700";
      icon = <Construction className="h-3 w-3 mr-1 text-slate-500" />;
    } else if (specialty.includes("masonry")) {
      bgColor = "bg-slate-300";
      textColor = "text-slate-700";
      icon = <Construction className="h-3 w-3 mr-1 text-slate-500" />;
    } else if (specialty.includes("roofing")) {
      bgColor = "bg-slate-200";
      textColor = "text-slate-700";
      icon = <Construction className="h-3 w-3 mr-1 text-slate-500" />;
    } else if (specialty.includes("hvac")) {
      bgColor = "bg-slate-300";
      textColor = "text-slate-700";
      icon = <Construction className="h-3 w-3 mr-1 text-slate-500" />;
    }
    
    if (contact.type === "contractor") {
      return (
        <div className={`text-xs ${bgColor} ${textColor} py-1 px-2 rounded-full flex items-center`}>
          {icon}
          <span>{role}</span>
        </div>
      );
    }
    
    return null;
  };

  const handleEditClick = () => {
    setIsEditContactOpen(true);
  };

  return (
    <>
      <Card 
        className={`bg-white shadow-sm overflow-hidden hover:shadow-md transition-shadow ${contact.type === "contractor" ? 'border-l-4 border-l-slate-500 hover:bg-slate-50 cursor-pointer' : ''}`}
        onClick={handleCardClick}>
        <div className="p-4 border-b border-slate-200 flex justify-between items-start">
          <div className="flex items-center">
            <div className={`h-10 w-10 rounded-full ${getInitialsColor(contact.type)} flex items-center justify-center font-medium`}>
              {contact.initials || contact.name.charAt(0)}
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-medium">{contact.name}</h3>
              {contact.type === "contractor" ? (
                <p className="text-sm text-slate-500">{contact.role}</p>
              ) : contact.type !== "contractor" && (
                <p className="text-sm text-slate-500">{contact.role}</p>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <StatusBadge status={contact.type} />
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-slate-500 hover:text-slate-700 mt-1"
              onClick={(e) => {
                // Stop event propagation to prevent card click
                e.stopPropagation();
                handleEditClick();
              }}
            >
              <PenSquare className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <CardContent className="p-5">
          <div className="flex flex-col gap-2 text-sm">
            {contact.phone && (
              <div className="flex">
                <a 
                  href={`tel:${contact.phone}`}
                  className="flex items-center px-3 py-1.5 rounded-md text-slate-600 hover:text-slate-800 hover:bg-slate-100 border border-slate-300 break-all w-full"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Phone className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span className="break-all">{contact.phone}</span>
                </a>
              </div>
            )}
            {contact.email && (
              <div className="flex mt-2">
                <a 
                  href={`mailto:${contact.email}`}
                  className="flex items-center px-3 py-1.5 rounded-md text-slate-600 hover:text-slate-800 hover:bg-slate-100 border border-slate-300 break-all w-full"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Mail className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span className="break-all">{contact.email}</span>
                </a>
              </div>
            )}
            {contact.company && (
              <div className="flex mt-2">
                <div className="flex items-center px-3 py-1.5 rounded-md text-slate-700 bg-slate-50 border border-slate-200 w-full">
                  <Building className="w-4 h-4 mr-2 text-slate-500 flex-shrink-0" />
                  <span className="break-all">{contact.company}</span>
                </div>
              </div>
            )}
            
            {/* Removed specialty badge since it's now under the name */}
          </div>
          
          <div className="mt-4 flex gap-2">
            {contact.type === "supplier" ? (
              <div className="w-full">
                <Button 
                  variant="outline"
                  className="w-full bg-green-50 text-green-700 hover:bg-green-100 border-green-200"
                  onClick={(e) => {
                    e.stopPropagation();
                    // Navigate to the new supplier quotes page
                    navigate(`/suppliers/${contact.id}/quotes`);
                  }}
                >
                  <FileText className="mr-1 h-4 w-4" /> View Quotes
                </Button>
              </div>
            ) : contact.type === "contractor" ? (
              <div className="w-full">
                <Button 
                  variant="outline"
                  className="w-full bg-slate-200 text-slate-700 hover:bg-slate-300 border-slate-300"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsAddLaborOpen(true);
                  }}
                >
                  <Plus className="mr-1 h-4 w-4" /> Add Labor Record
                </Button>
              </div>
            ) : (
              <div className="flex gap-2 w-full">
                <div className="flex-1">
                  <Button 
                    variant="outline"
                    className="w-full bg-contact bg-opacity-10 text-contact hover:bg-opacity-20"
                  >
                    <MessageSquare className="mr-1 h-4 w-4" /> Message
                  </Button>
                </div>
                <div className="flex-1">
                  <Button 
                    variant="outline"
                    className="w-full bg-slate-100 text-slate-600 hover:bg-slate-200"
                  >
                    <Phone className="mr-1 h-4 w-4" /> Call
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Edit Contact Dialog */}
      <EditContactDialog
        open={isEditContactOpen}
        onOpenChange={setIsEditContactOpen}
        contactId={contact.id}
      />

      {/* Supplier Quotes View */}
      {isViewingQuotes && (
        <div 
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center overflow-auto p-4"
          onClick={(e) => {
            // Close when clicking the backdrop (outside the dialog)
            if (e.target === e.currentTarget) {
              setIsViewingQuotes(false);
            }
          }}
        >
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-auto relative">
            <button
              className="absolute top-2 right-2 p-1 rounded-full bg-gray-100 hover:bg-gray-200 z-10"
              onClick={() => setIsViewingQuotes(false)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x">
                <path d="M18 6 6 18"></path>
                <path d="m6 6 12 12"></path>
              </svg>
            </button>
            <SupplierQuotes 
              supplierId={contact.id} 
              onClose={() => setIsViewingQuotes(false)} 
            />
          </div>
        </div>
      )}
      
      {/* Add Labor Dialog for Contractors */}
      <AddLaborFromContactDialog
        open={isAddLaborOpen}
        onOpenChange={setIsAddLaborOpen}
        contactId={contact.id}
      />
    </>
  );
}

export default function ContactsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [projectFilter, setProjectFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("recent");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "categories">("categories");
  const [contractorSpecialty, setContractorSpecialty] = useState("all");
  const [isCreateContactOpen, setIsCreateContactOpen] = useState(false);
  const [expandedContactId, setExpandedContactId] = useState<number | null>(null);
  const [hoveredFolderId, setHoveredFolderId] = useState<number | null>(null);
  const [searchExpanded, setSearchExpanded] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Inject nav pills for TopNav
  useNavPills("contacts");

  const { data: contacts = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/contacts"],
  });

  const { data: projects = [] } = useQuery<any[]>({
    queryKey: ["/api/projects"],
  });

  const { data: projectFolders = [] } = useQuery<any[]>({
    queryKey: ["/api/project-folders"],
  });

  // Group contacts by type
  const contactsByType = contacts?.reduce((acc, contact) => {
    const type = contact.type || 'other';
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(contact);
    return acc;
  }, {} as Record<string, any[]>) || {};

  // Filter contacts based on search query, type, and project
  const filteredContacts = contacts?.filter(contact => {
    // If we have a selected category, only show contacts from that category
    if (selectedCategory && contact.type !== selectedCategory) {
      return false;
    }

    // Filter by project if one is selected
    const matchesProject = projectFilter === "all" || 
                          (contact.projectId && contact.projectId === Number(projectFilter));
    
    const matchesSearch = contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          contact.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (contact.company && contact.company.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesType = typeFilter === "all" || contact.type === typeFilter;
    
    // Only apply contractor specialty filter when type is contractor or typeFilter is specifically contractor
    const isContractorView = contact.type === 'contractor' || typeFilter === 'contractor';
    const matchesSpecialty = contractorSpecialty === "all" || 
                            !isContractorView || 
                            (contact.role && contact.role.toLowerCase().includes(contractorSpecialty.toLowerCase()));
    
    return matchesSearch && matchesType && matchesSpecialty && matchesProject;
  });

  // Sort contacts based on selected order
  const sortedContacts = [...(filteredContacts || [])].sort((a, b) => {
    if (sortOrder === "name_asc") {
      return a.name.localeCompare(b.name);
    } else if (sortOrder === "name_desc") {
      return b.name.localeCompare(a.name);
    }
    // Default to most recent (by ID for demo)
    return b.id - a.id;
  });

  // Get category icon by contact type
  const getTypeIcon = (type: string, className: string = "h-5 w-5") => {
    switch (type) {
      case 'contractor':
        return <Hammer className={className} />;
      case 'supplier':
        return <Truck className={className} />;
      case 'consultant':
        return <Briefcase className={className} />;
      case 'architect':
        return <Lightbulb className={className} />;
      case 'engineer':
        return <HardHat className={className} />;
      case 'project_manager':
        return <UserCog className={className} />;
      case 'client':
        return <User className={className} />;
      case 'vendor':
        return <Database className={className} />;
      default:
        return <Users className={className} />;
    }
  };
  
  // Get category icon background color
  const getTypeIconBackground = (type: string) => {
    switch (type) {
      case 'contractor':
        return 'bg-slate-200';
      case 'supplier':
        return 'bg-slate-300';
      case 'consultant':
        return 'bg-slate-200';
      case 'architect':
        return 'bg-slate-300';
      case 'engineer':
        return 'bg-slate-200';
      case 'project_manager':
        return 'bg-slate-300';
      case 'client':
        return 'bg-slate-400';
      case 'vendor':
        return 'bg-slate-100';
      default:
        return 'bg-slate-100';
    }
  };
  
  // Get category description
  const getTypeDescription = (type: string) => {
    switch (type) {
      case 'contractor':
        return 'Construction and trade professionals';
      case 'supplier':
        return 'Material and equipment providers';
      case 'consultant':
        return 'Specialized advisors and experts';
      case 'architect':
        return 'Design and planning professionals';
      case 'engineer':
        return 'Technical specialists';
      case 'project_manager':
        return 'Project coordination and oversight';
      case 'client':
        return 'Project owners and stakeholders';
      case 'vendor':
        return 'Service and equipment providers';
      default:
        return 'Other contacts and stakeholders';
    }
  };

  // Format type names for display
  const formatTypeName = (type: string): string => {
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="space-y-6">
          <div className="flex justify-between items-start">
            <h2 className="page-header hidden md:block">Contacts</h2>
            <div className="flex flex-col items-end gap-2">
              <Button 
                className="bg-slate-600 hover:bg-slate-700"
                onClick={() => setIsCreateContactOpen(true)}
              >
                <Plus className="mr-1 h-4 w-4" />
                Add Contact
              </Button>
              <div className="h-10 bg-slate-200 rounded w-[180px]"></div>
            </div>
          </div>
          
          {/* Create Contact Dialog */}
          <CreateContactDialog 
            open={isCreateContactOpen} 
            onOpenChange={setIsCreateContactOpen}
          />

          <Card className="animate-pulse">
            <CardContent className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="h-10 bg-slate-200 rounded w-full md:w-1/2"></div>
              <div className="flex gap-2 w-full md:w-auto">
                <div className="h-10 bg-slate-200 rounded w-28"></div>
                <div className="h-10 bg-slate-200 rounded w-28"></div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="animate-pulse">
                <div className="p-4 border-b border-slate-200 flex items-center">
                  <div className="h-10 w-10 rounded-full bg-slate-200"></div>
                  <div className="ml-3 space-y-2">
                    <div className="h-5 bg-slate-200 rounded w-24"></div>
                    <div className="h-4 bg-slate-200 rounded w-32"></div>
                  </div>
                </div>
                <CardContent className="p-4 space-y-4">
                  <div className="space-y-2">
                    <div className="h-4 bg-slate-200 rounded w-full"></div>
                    <div className="h-4 bg-slate-200 rounded w-full"></div>
                    <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <div className="h-10 bg-slate-200 rounded w-1/2"></div>
                    <div className="h-10 bg-slate-200 rounded w-1/2"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-3 w-full min-w-0">
        {/* Unified Header Card */}
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm w-full min-w-0 overflow-x-hidden"
          onMouseLeave={() => setHoveredFolderId(null)}
        >
          {/* Row 1: Title + Folder badges + Controls */}
          <div className="flex items-center gap-2 sm:gap-3 px-3 py-2 sm:px-4 sm:py-2.5 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-[#64748b] to-[#475569] bg-clip-text text-transparent flex-shrink-0">Contacts</h1>

            {/* Folder badges */}
            <div className="flex items-center gap-1.5 flex-wrap flex-1 min-w-0">
              {projectFolders.map((folder: any) => {
                const folderProjectCount = projects.filter((p: any) => p.folderId === folder.id).length;
                const isHovered = hoveredFolderId === folder.id;
                const hasSelectedProject = projectFilter !== "all" && projects.find((p: any) => p.id === Number(projectFilter))?.folderId === folder.id;
                return (
                  <div
                    key={folder.id}
                    className="relative"
                    onMouseEnter={() => setHoveredFolderId(folder.id)}
                  >
                    <button
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
                        hasSelectedProject
                          ? 'bg-slate-600 text-white border-slate-600'
                          : isHovered
                            ? 'bg-slate-50 text-slate-600 border-slate-600'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-slate-600 hover:text-slate-600'
                      }`}
                    >
                      <Folder className="h-3 w-3" />
                      {folder.name}
                      <span className="opacity-60">({folderProjectCount})</span>
                    </button>
                  </div>
                );
              })}
              {/* Unfiled projects badge */}
              {(() => {
                const unfiledCount = projects.filter((p: any) => !p.folderId).length;
                if (unfiledCount === 0) return null;
                const isHovered = hoveredFolderId === -1;
                const hasSelectedProject = projectFilter !== "all" && !projects.find((p: any) => p.id === Number(projectFilter))?.folderId;
                return (
                  <div
                    className="relative"
                    onMouseEnter={() => setHoveredFolderId(-1)}
                  >
                    <button
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
                        hasSelectedProject
                          ? 'bg-slate-600 text-white border-slate-600'
                          : isHovered
                            ? 'bg-slate-50 text-slate-600 border-slate-600'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-slate-600 hover:text-slate-600'
                      }`}
                    >
                      Unfiled
                      <span className="opacity-60">({unfiledCount})</span>
                    </button>
                  </div>
                );
              })()}

              {projectFilter !== "all" && (
                <button
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-slate-500 hover:text-slate-600 hover:bg-slate-50 transition-colors"
                  onClick={() => setProjectFilter("all")}
                >
                  <X className="h-3 w-3" />
                  Clear
                </button>
              )}
            </div>

            {/* Right-side controls */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {/* Search */}
              {!searchExpanded ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 rounded-md hover:bg-slate-100 text-slate-600"
                  onClick={() => setSearchExpanded(true)}
                >
                  <Search className="h-4 w-4" />
                </Button>
              ) : (
                <div className="relative w-44 sm:w-56">
                  <Search className="absolute left-3 top-2 h-4 w-4 text-slate-600" />
                  <Input
                    placeholder="Search contacts..."
                    className="w-full pl-9 pr-9 border-slate-300 focus:border-slate-600 focus:ring-slate-600 rounded-lg h-8 text-sm"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onBlur={() => { if (!searchQuery) setSearchExpanded(false); }}
                    autoFocus
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-0.5 h-7 w-7 rounded-md hover:bg-slate-100"
                    onClick={() => { setSearchQuery(""); setSearchExpanded(false); }}
                  >
                    <X className="h-3.5 w-3.5 text-slate-500" />
                  </Button>
                </div>
              )}

              {/* Type filter */}
              <div className="min-w-0 max-w-[120px] sm:max-w-[140px]">
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-full !bg-transparent border-0 rounded-none focus:ring-0 min-w-0 h-8 hover:bg-slate-100 text-slate-600">
                    <SelectValue placeholder="Type">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs">{typeFilter === "all" ? "All Types" : typeFilter.charAt(0).toUpperCase() + typeFilter.slice(1)}</span>
                      </div>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="contractor">Contractor</SelectItem>
                    <SelectItem value="supplier">Supplier</SelectItem>
                    <SelectItem value="consultant">Consultant</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Add Contact */}
              <Button
                variant="ghost"
                className="bg-slate-600 hover:bg-slate-700 text-white font-medium h-8 px-3 sm:px-4 rounded-md shadow-sm text-xs"
                onClick={() => setIsCreateContactOpen(true)}
                size="sm"
              >
                <Plus className="h-3.5 w-3.5 sm:mr-1.5" />
                <span className="hidden sm:inline">Add Contact</span>
              </Button>
            </div>
          </div>

          {/* Hover dropdown: projects in selected folder */}
          {hoveredFolderId !== null && (() => {
            const folderProjects = hoveredFolderId === -1
              ? projects.filter((p: any) => !p.folderId)
              : projects.filter((p: any) => p.folderId === hoveredFolderId);
            if (folderProjects.length === 0) return null;
            return (
              <div className="px-3 sm:px-4 pb-3 flex items-center gap-1.5 flex-wrap border-t border-slate-100 pt-2">
                {folderProjects.map((project: any) => {
                  const isSelected = projectFilter === project.id.toString();
                  return (
                    <button
                      key={project.id}
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-slate-600 text-white border-slate-600'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-600 hover:text-slate-600'
                      }`}
                      onClick={() => setProjectFilter(project.id.toString())}
                    >
                      {project.name}
                    </button>
                  );
                })}
              </div>
            );
          })()}
        </div>

        {/* Create Contact Dialog */}
        <CreateContactDialog
          open={isCreateContactOpen}
          onOpenChange={setIsCreateContactOpen}
          projectId={projectFilter !== "all" ? Number(projectFilter) : undefined}
        />

        {/* View Mode Tabs */}
        <Tabs defaultValue={(() => {
          // Check for tab parameter in URL
          const urlParams = new URLSearchParams(window.location.search);
          const tabParam = urlParams.get('tab');
          return tabParam || "categories";
        })()}>
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
            {/* View Bar Header */}
            <div className="p-3 sm:p-4 border-b border-slate-200">
              <div className="flex items-center gap-3 mb-3">
                <List className="h-5 w-5 text-slate-600" />
                <span className="text-sm font-medium text-slate-700">View</span>
              </div>
              <TabsList className="grid w-full grid-cols-4 bg-slate-100 p-1 rounded-lg h-auto">
                <TabsTrigger
                  value="categories"
                  className="data-[state=active]:bg-white data-[state=active]:text-slate-800 data-[state=active]:shadow-sm text-slate-600 rounded-md py-2 text-sm font-medium transition-all"
                >
                  Category
                </TabsTrigger>
                <TabsTrigger
                  value="list"
                  className="data-[state=active]:bg-white data-[state=active]:text-slate-800 data-[state=active]:shadow-sm text-slate-600 rounded-md py-2 text-sm font-medium transition-all"
                >
                  List
                </TabsTrigger>
                <TabsTrigger
                  value="projects"
                  className="data-[state=active]:bg-white data-[state=active]:text-slate-800 data-[state=active]:shadow-sm text-slate-600 rounded-md py-2 text-sm font-medium transition-all"
                >
                  Project
                </TabsTrigger>
                <TabsTrigger
                  value="labor"
                  className="data-[state=active]:bg-white data-[state=active]:text-slate-800 data-[state=active]:shadow-sm text-slate-600 rounded-md py-2 text-sm font-medium transition-all"
                >
                  Labor
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Contact Filters */}
            <div className="p-3 sm:p-4 bg-slate-50">
              <div className="flex items-center gap-3 mb-3">
                <Filter className="h-4 w-4 text-slate-500" />
                <span className="text-sm font-medium text-slate-600">Filters</span>
              </div>
              <div className="flex gap-2 items-center overflow-x-auto">
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="bg-white border border-slate-300 rounded-lg focus:ring-slate-500 focus:border-slate-500">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="contractor">Contractors</SelectItem>
                    <SelectItem value="supplier">Suppliers</SelectItem>
                    <SelectItem value="consultant">Consultants</SelectItem>
                  </SelectContent>
                </Select>

                {/* Only show contractor specialty filter when contractor is selected */}
                {(typeFilter === 'contractor' || selectedCategory === 'contractor') && (
                  <Select value={contractorSpecialty} onValueChange={setContractorSpecialty}>
                    <SelectTrigger className="bg-white border border-slate-300 rounded-lg focus:ring-slate-500 focus:border-slate-500">
                      <SelectValue placeholder="Specialty" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Specialties</SelectItem>
                      <SelectItem value="electrical">Electrical</SelectItem>
                      <SelectItem value="plumbing">Plumbing</SelectItem>
                      <SelectItem value="carpentry">Carpentry</SelectItem>
                      <SelectItem value="masonry">Masonry</SelectItem>
                      <SelectItem value="roofing">Roofing</SelectItem>
                      <SelectItem value="hvac">HVAC</SelectItem>
                    </SelectContent>
                  </Select>
                )}

                <Select value={sortOrder} onValueChange={setSortOrder}>
                  <SelectTrigger className="bg-white border border-slate-300 rounded-lg focus:ring-slate-500 focus:border-slate-500">
                    <SelectValue placeholder="Sort By" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recent">Most Recent</SelectItem>
                    <SelectItem value="name_asc">Name: A-Z</SelectItem>
                    <SelectItem value="name_desc">Name: Z-A</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          <TabsContent value="categories" className="space-y-4 mt-4">
            {/* Category Cards or Selected Category Contacts */}
            {!selectedCategory ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(contactsByType || {}).map(([type, contacts]) => {
                  return (
                    <Card 
                      key={type} 
                      className="rounded-lg bg-card text-card-foreground shadow-sm h-full transition-all hover:shadow-md cursor-pointer overflow-hidden border border-slate-300"
                      onClick={() => setSelectedCategory(type)}
                    >
                      <div className={`flex flex-col space-y-1.5 p-6 rounded-t-lg ${getTypeIconBackground(type)}`}>
                        <div className="flex justify-center py-4">
                          <div className="p-2 rounded-full bg-white bg-opacity-70">
                            {getTypeIcon(type, "h-8 w-8 text-slate-600")}
                          </div>
                        </div>
                      </div>
                      <div className="p-6 pt-6">
                        <h3 className="text-2xl font-semibold leading-none tracking-tight">
                          {formatTypeName(type)}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-2">
                          {getTypeDescription(type)}
                        </p>
                        <div className="mt-4 text-sm text-muted-foreground">
                          <div className="flex justify-between mb-1">
                            <span>{contacts.length} contacts</span>
                          </div>
                          {contacts.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {contacts.slice(0, 3).map(contact => (
                                <div 
                                  key={contact.id} 
                                  className="px-2 py-1 bg-white rounded-full text-xs font-medium shadow-sm"
                                >
                                  {contact.name}
                                </div>
                              ))}
                              {contacts.length > 3 && (
                                <div className="px-2 py-1 bg-white rounded-full text-xs font-medium shadow-sm">
                                  +{contacts.length - 3} more
                                </div>
                              )}
                            </div>
                          )}
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
                    className="flex items-center gap-1 text-slate-600 hover:text-slate-700 hover:bg-slate-100"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-left">
                      <path d="m15 18-6-6 6-6"/>
                    </svg>
                    Back to categories
                  </Button>
                  <div className="px-2 py-1 bg-slate-200 text-slate-700 rounded-full text-sm font-medium flex items-center gap-1">
                    {selectedCategory && getTypeIcon(selectedCategory, "h-4 w-4")}
                    {selectedCategory && formatTypeName(selectedCategory)}
                  </div>
                </div>

                {sortedContacts?.length === 0 ? (
                  <div className="text-center py-12">
                    <User className="mx-auto h-12 w-12 text-slate-300" />
                    <h3 className="mt-4 text-lg font-medium text-slate-900">No contacts found</h3>
                    <p className="mt-2 text-sm text-slate-500">Try changing your search or filters</p>
                    <Button 
                      className="mt-4 bg-slate-600 hover:bg-slate-700"
                      onClick={() => setIsCreateContactOpen(true)}
                    >
                      <Plus className="mr-1 h-4 w-4" />
                      Add New Contact
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {sortedContacts?.map(contact => (
                      <div key={contact.id} className="space-y-2">
                        <ContactCard 
                          contact={contact} 
                          isExpanded={expandedContactId === contact.id}
                          onToggleExpand={setExpandedContactId}
                        />
                        
                        {/* Expandable Labor Records Section */}
                        {expandedContactId === contact.id && contact.type === "contractor" && (
                          <ContactLaborSection contactId={contact.id} />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </TabsContent>
          
          <TabsContent value="list" className="space-y-4 mt-4">
            {sortedContacts?.length === 0 ? (
              <div className="text-center py-12">
                <User className="mx-auto h-12 w-12 text-slate-300" />
                <h3 className="mt-4 text-lg font-medium text-slate-900">No contacts found</h3>
                <p className="mt-2 text-sm text-slate-500">Try changing your search or filters</p>
                <Button 
                  className="mt-4 bg-slate-600 hover:bg-slate-700"
                  onClick={() => setIsCreateContactOpen(true)}
                >
                  <Plus className="mr-1 h-4 w-4" />
                  Add New Contact
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {sortedContacts?.map(contact => (
                  <div key={contact.id} className="space-y-2">
                    <ContactCard 
                      contact={contact} 
                      isExpanded={expandedContactId === contact.id}
                      onToggleExpand={setExpandedContactId}
                    />
                    
                    {/* Expandable Labor Records Section */}
                    {expandedContactId === contact.id && contact.type === "contractor" && (
                      <ContactLaborSection contactId={contact.id} />
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="projects" className="space-y-4 mt-4">
            <ProjectLaborView />
          </TabsContent>
          
          <TabsContent value="labor" className="space-y-4 mt-4">
            <LaborManagement />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
