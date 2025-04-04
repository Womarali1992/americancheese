import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
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
  FileText
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreateContactDialog } from "./CreateContactDialog";
import { EditContactDialog } from "./EditContactDialog";
import { SuppliersView, SupplierQuotes } from "./SuppliersView";


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
}

function ContactCard({ contact }: ContactCardProps) {
  const [isEditContactOpen, setIsEditContactOpen] = useState(false);
  const [isViewingQuotes, setIsViewingQuotes] = useState(false);
  
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
      <Card className="bg-white shadow-sm overflow-hidden hover:shadow-md transition-shadow">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center">
          <div className="flex items-center">
            <div className={`h-10 w-10 rounded-full ${getInitialsColor(contact.type)} flex items-center justify-center font-medium`}>
              {contact.initials || contact.name.charAt(0)}
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-medium">{contact.name}</h3>
              <p className="text-sm text-slate-500">{contact.role}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-slate-500 hover:text-slate-700"
              onClick={handleEditClick}
            >
              <PenSquare className="h-4 w-4" />
            </Button>
            <StatusBadge status={contact.type} />
          </div>
        </div>
        <CardContent className="p-4">
          <div className="flex flex-col gap-2 text-sm">
            {contact.phone && (
              <div className="flex items-center">
                <Phone className="text-slate-400 w-5 h-4 mr-1" />
                <span>{contact.phone}</span>
              </div>
            )}
            {contact.email && (
              <div className="flex items-center">
                <Mail className="text-slate-400 w-5 h-4 mr-1" />
                <span>{contact.email}</span>
              </div>
            )}
            {contact.company && (
              <div className="flex items-center">
                <Building className="text-slate-400 w-5 h-4 mr-1" />
                <span>{contact.company}</span>
              </div>
            )}
            
            {/* Display specialty badge for contractors */}
            {contact.type === "contractor" && getSpecialtyBadge(contact.role)}
          </div>
          
          <div className="mt-4 flex gap-2">
            {contact.type === "supplier" ? (
              <>
                <Button 
                  variant="outline"
                  className="flex-1 bg-green-50 text-green-700 hover:bg-green-100 border-green-200"
                  onClick={() => setIsViewingQuotes(true)}
                >
                  <FileText className="mr-1 h-4 w-4" /> View Quotes
                </Button>
                <Button 
                  variant="outline"
                  className="flex-1 bg-slate-100 text-slate-600 hover:bg-slate-200"
                >
                  <Phone className="mr-1 h-4 w-4" /> Contact
                </Button>
              </>
            ) : (
              <>
                <Button 
                  variant="outline"
                  className="flex-1 bg-contact bg-opacity-10 text-contact hover:bg-opacity-20"
                >
                  <MessageSquare className="mr-1 h-4 w-4" /> Message
                </Button>
                <Button 
                  variant="outline"
                  className="flex-1 bg-slate-100 text-slate-600 hover:bg-slate-200"
                >
                  <Phone className="mr-1 h-4 w-4" /> Call
                </Button>
              </>
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
    </>
  );
}

export default function ContactsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("recent");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "categories">("categories");
  const [contractorSpecialty, setContractorSpecialty] = useState("all");
  const [isCreateContactOpen, setIsCreateContactOpen] = useState(false);
  const { toast } = useToast();

  const { data: contacts, isLoading } = useQuery({
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

  // Filter contacts based on search query and type
  const filteredContacts = contacts?.filter(contact => {
    // If we have a selected category, only show contacts from that category
    if (selectedCategory && contact.type !== selectedCategory) {
      return false;
    }

    const matchesSearch = contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          contact.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (contact.company && contact.company.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesType = typeFilter === "all" || contact.type === typeFilter;
    
    // Only apply contractor specialty filter when type is contractor or typeFilter is specifically contractor
    const isContractorView = contact.type === 'contractor' || typeFilter === 'contractor';
    const matchesSpecialty = contractorSpecialty === "all" || 
                            !isContractorView || 
                            (contact.role && contact.role.toLowerCase().includes(contractorSpecialty.toLowerCase()));
    
    return matchesSearch && matchesType && matchesSpecialty;
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
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold hidden md:block">Contacts</h2>
            <Button 
              className="bg-contact hover:bg-blue-600"
              onClick={() => setIsCreateContactOpen(true)}
            >
              <Plus className="mr-1 h-4 w-4" />
              Add Contact
            </Button>
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
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-semibold hidden md:block">Contacts</h2>
          <Button 
            className="bg-contact hover:bg-blue-600"
            onClick={() => setIsCreateContactOpen(true)}
          >
            <Plus className="mr-1 h-4 w-4" />
            Add Contact
          </Button>
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
                className="pl-9 pr-4 py-2 border border-slate-300 rounded-lg w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="border border-slate-300 rounded-lg">
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
                  <SelectTrigger className="border border-slate-300 rounded-lg">
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
                <SelectTrigger className="border border-slate-300 rounded-lg">
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
          <TabsList className="grid w-full grid-cols-2 bg-slate-100">
            <TabsTrigger value="categories" className="data-[state=active]:bg-white">Category View</TabsTrigger>
            <TabsTrigger value="list" className="data-[state=active]:bg-white">List View</TabsTrigger>
          </TabsList>
          
          <TabsContent value="categories" className="space-y-4 mt-4">
            {/* Category Cards or Selected Category Contacts */}
            {!selectedCategory ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(contactsByType || {}).map(([type, contacts]) => {
                  return (
                    <Card 
                      key={type} 
                      className="rounded-lg border bg-card text-card-foreground shadow-sm h-full transition-all hover:shadow-md cursor-pointer"
                      onClick={() => setSelectedCategory(type)}
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
                      <ContactCard key={contact.id} contact={contact} />
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sortedContacts?.map(contact => (
                  <ContactCard key={contact.id} contact={contact} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
