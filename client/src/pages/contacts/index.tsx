import React, { useState, useMemo } from "react";
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
  Folder
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { CreateContactDialog } from "./CreateContactDialog";

// Project Labor View Component
function ProjectLaborView() {
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  
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
          backgroundColor: 'var(--tier1-structural)',
          borderColor: 'var(--tier1-structural)',
        };
      case 'systems':
        return {
          backgroundColor: 'var(--tier1-systems)',
          borderColor: 'var(--tier1-systems)',
        };
      case 'sheathing':
        return {
          backgroundColor: 'var(--tier1-sheathing)',
          borderColor: 'var(--tier1-sheathing)',
        };
      case 'finishings':
        return {
          backgroundColor: 'var(--tier1-finishings)',
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
        backgroundColor: `var(${cssVar})`,
        borderColor: `var(${cssVar})`,
      };
    }
    
    // Default fallback
    return {
      backgroundColor: '#64748b',
      borderColor: '#64748b',
    };
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
                className="cursor-pointer hover:shadow-md transition-all border-blue-200"
                onClick={() => setSelectedProject(project.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <FolderOpen className="h-5 w-5 text-blue-600" />
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
          className="flex items-center gap-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
        >
          <ChevronRight className="h-4 w-4 rotate-180" />
          Back to Projects
        </Button>
        <div className="flex items-center gap-2">
          <Folder className="h-5 w-5 text-blue-600" />
          <h2 className="text-xl font-semibold">{selectedProjectData?.name}</h2>
          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
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
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Construction className="h-5 w-5" />
                  {formatCategoryName(tier1)}
                </h3>
              </div>

              {/* Tier 2 Sections */}
              {Object.entries(tier2Groups).map(([tier2, laborItems]) => (
                <div key={tier2} className="ml-6 space-y-3">
                  {/* Tier 2 Header */}
                  <div 
                    className={`p-3 rounded-md ${getTier2Color(tier2)}`}
                    style={getTier2Style(tier2)}
                  >
                    <h4 className="font-medium flex items-center gap-2">
                      <Briefcase className="h-4 w-4" />
                      {formatCategoryName(tier2)}
                      <span className="text-xs bg-white bg-opacity-20 px-2 py-1 rounded-full">
                        {laborItems.length} {laborItems.length === 1 ? 'record' : 'records'}
                      </span>
                    </h4>
                  </div>

                  {/* Labor Cards */}
                  <div className="ml-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {laborItems.map(labor => (
                      <Card key={labor.id} className="border-slate-200 hover:shadow-sm transition-shadow">
                        <CardHeader className="pb-3">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">
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
                          {labor.description && (
                            <div className="text-xs text-gray-600 border-t pt-2">
                              <p className="line-clamp-2">{labor.description}</p>
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
        <span className="text-xs px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">
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
          <ChevronRight className="h-4 w-4 text-blue-500" />
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
      <div className="ml-6 border-l-2 border-blue-200 pl-4 py-2 space-y-2">
        <div className="animate-pulse bg-slate-200 h-16 rounded"></div>
        <div className="animate-pulse bg-slate-200 h-16 rounded"></div>
      </div>
    );
  }

  return (
    <>
      <div className="ml-6 border-l-2 border-blue-200 pl-4 py-2 space-y-2">
        {/* Section Header */}
        <div className="flex justify-between items-center mb-2">
          <div className="text-sm font-medium text-blue-600 flex items-center">
            <ClipboardList className="mr-1 h-4 w-4" />
            Labor Records
          </div>
          <div className="flex gap-1">
            <Button 
              size="sm" 
              variant="outline" 
              className="h-8 text-xs bg-blue-50 text-blue-600 hover:bg-blue-100"
              onClick={handleAddLaborClick}
            >
              <Plus className="mr-1 h-3 w-3" /> Add
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              className="h-8 text-xs bg-blue-50 text-blue-600 hover:bg-blue-100"
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
                  className="text-xs text-blue-600 hover:text-blue-800 p-0 h-auto"
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
        return "bg-blue-100 text-blue-600";
      case "supplier":
        return "bg-green-100 text-green-600";
      case "consultant":
        return "bg-purple-100 text-purple-600";
      default:
        return "bg-contact text-white";
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
      bgColor = "bg-yellow-100";
      textColor = "text-yellow-700";
      icon = <Construction className="h-3 w-3 mr-1 text-orange-500" />;
    } else if (specialty.includes("plumbing")) {
      bgColor = "bg-blue-100";
      textColor = "text-blue-700";
      icon = <Construction className="h-3 w-3 mr-1 text-orange-500" />;
    } else if (specialty.includes("carpentry")) {
      bgColor = "bg-amber-100";
      textColor = "text-amber-700";
      icon = <Construction className="h-3 w-3 mr-1 text-orange-500" />;
    } else if (specialty.includes("masonry")) {
      bgColor = "bg-stone-100";
      textColor = "text-stone-700";
      icon = <Construction className="h-3 w-3 mr-1 text-orange-500" />;
    } else if (specialty.includes("roofing")) {
      bgColor = "bg-red-100";
      textColor = "text-red-700";
      icon = <Construction className="h-3 w-3 mr-1 text-orange-500" />;
    } else if (specialty.includes("hvac")) {
      bgColor = "bg-cyan-100";
      textColor = "text-cyan-700";
      icon = <Construction className="h-3 w-3 mr-1 text-orange-500" />;
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
        className={`bg-white shadow-sm overflow-hidden hover:shadow-md transition-shadow ${contact.type === "contractor" ? 'border-l-4 border-l-blue-500 hover:bg-blue-50 cursor-pointer' : ''}`}
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
                  className="flex items-center px-3 py-1.5 rounded-md text-blue-600 hover:text-blue-800 hover:bg-blue-50 border border-blue-200 break-all w-full"
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
                  className="flex items-center px-3 py-1.5 rounded-md text-blue-600 hover:text-blue-800 hover:bg-blue-50 border border-blue-200 break-all w-full"
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
                  className="w-full bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200"
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
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: contacts = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/contacts"],
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
        return 'bg-blue-100';
      case 'supplier':
        return 'bg-green-100';
      case 'consultant':
        return 'bg-purple-100';
      case 'architect':
        return 'bg-yellow-100';
      case 'engineer':
        return 'bg-orange-100';
      case 'project_manager':
        return 'bg-indigo-100';
      case 'client':
        return 'bg-pink-100';
      case 'vendor':
        return 'bg-gray-100';
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
                className="bg-contact hover:bg-blue-600"
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
      <div className="space-y-6 p-4">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-3 sm:p-4 rounded-lg shadow-sm">
          {/* First row with title and buttons */}
          <div className="flex justify-between items-center">
            <h1 className="text-xl sm:text-2xl font-bold text-white">Contacts</h1>
            <div className="hidden sm:flex items-center gap-2">
              {/* Project selector on desktop */}
              <div className="w-[180px]">
                <ProjectSelector
                  selectedProjectId={projectFilter !== "all" ? Number(projectFilter) : undefined}
                  onChange={(projectId) => setProjectFilter(projectId)}
                  className="bg-white border-none rounded-lg focus:ring-blue-500"
                />
              </div>
              
              <Button 
                className="bg-white text-blue-600 hover:bg-gray-100 font-medium shadow-sm h-9 px-4"
                onClick={() => setIsCreateContactOpen(true)}
                size="sm"
              >
                <Plus className="mr-2 h-4 w-4 text-blue-600" /> 
                Add Contact
              </Button>
            </div>
            
            {/* Add Contact button on mobile */}
            <div className="sm:hidden flex items-center">
              <Button 
                className="bg-white text-blue-600 hover:bg-gray-100 font-medium shadow-sm h-9 px-3"
                onClick={() => setIsCreateContactOpen(true)}
                size="sm"
              >
                <Plus className="h-4 w-4 text-blue-600" /> 
              </Button>
            </div>
          </div>
          
          {/* Project selector on mobile */}
          <div className="mt-3 sm:hidden">
            <ProjectSelector
              selectedProjectId={projectFilter !== "all" ? Number(projectFilter) : undefined}
              onChange={(projectId) => setProjectFilter(projectId)}
              className="w-full bg-white border-none rounded-lg focus:ring-blue-500"
            />
          </div>
        </div>
        
        {/* Create Contact Dialog */}
        <CreateContactDialog 
          open={isCreateContactOpen} 
          onOpenChange={setIsCreateContactOpen}
        />

        {/* Contact Filters */}
        <Card className="bg-white">
          <CardContent className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-2.5 text-slate-400 h-4 w-4" />
              <Input
                placeholder="Search contacts..."
                className="pl-9 pr-4 py-2 border border-blue-300 focus-visible:ring-blue-500 rounded-lg w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="border border-blue-300 rounded-lg focus:ring-blue-500">
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
                  <SelectTrigger className="border border-blue-300 rounded-lg focus:ring-blue-500">
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
                <SelectTrigger className="border border-blue-300 rounded-lg focus:ring-blue-500">
                  <SelectValue placeholder="Sort By" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Most Recent</SelectItem>
                  <SelectItem value="name_asc">Name: A-Z</SelectItem>
                  <SelectItem value="name_desc">Name: Z-A</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* View Mode Tabs */}
        <Tabs defaultValue="categories">
          <TabsList className="grid w-full grid-cols-3 border-blue-500">
            <TabsTrigger 
              value="categories" 
              className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700"
            >
              Category View
            </TabsTrigger>
            <TabsTrigger 
              value="list" 
              className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700"
            >
              List View
            </TabsTrigger>
            <TabsTrigger 
              value="projects" 
              className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700"
            >
              Project View
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="categories" className="space-y-4 mt-4">
            {/* Category Cards or Selected Category Contacts */}
            {!selectedCategory ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(contactsByType || {}).map(([type, contacts]) => {
                  return (
                    <Card 
                      key={type} 
                      className="rounded-lg bg-card text-card-foreground shadow-sm h-full transition-all hover:shadow-md cursor-pointer overflow-hidden"
                      onClick={() => setSelectedCategory(type)}
                      style={{ 
                        border: type === 'contractor' ? '1px solid #dbeafe' : 
                               type === 'supplier' ? '1px solid #dcfce7' :
                               type === 'consultant' ? '1px solid #f3e8ff' :
                               type === 'architect' ? '1px solid #fef9c3' :
                               type === 'engineer' ? '1px solid #ffedd5' :
                               type === 'project_manager' ? '1px solid #e0e7ff' :
                               type === 'client' ? '1px solid #fce7f3' :
                               type === 'vendor' ? '1px solid #f3f4f6' :
                               '1px solid #f1f5f9'
                      }}
                    >
                      <div className={`flex flex-col space-y-1.5 p-6 rounded-t-lg ${getTypeIconBackground(type)}`}>
                        <div className="flex justify-center py-4">
                          <div className="p-2 rounded-full bg-white bg-opacity-70">
                            {getTypeIcon(type, "h-8 w-8 text-orange-500")}
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
                    className="flex items-center gap-1 text-orange-500 hover:text-orange-600 hover:bg-orange-50"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-left">
                      <path d="m15 18-6-6 6-6"/>
                    </svg>
                    Back to categories
                  </Button>
                  <div className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium flex items-center gap-1">
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
                      className="mt-4 bg-contact hover:bg-blue-600"
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
                  className="mt-4 bg-contact hover:bg-blue-600"
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
        </Tabs>
      </div>
    </Layout>
  );
}
