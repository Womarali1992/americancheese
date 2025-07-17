import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency, formatDate } from "@/lib/utils";
import { 
  Search,
  Plus,
  Users,
  Phone,
  Mail,
  MapPin,
  Building,
  Eye,
  Edit,
  Trash2,
  MoreHorizontal,
  User,
  Briefcase,
  Clock
} from "lucide-react";
import { CreateContactDialog } from "@/pages/contacts/CreateContactDialog";
import { EditContactDialog } from "@/pages/contacts/EditContactDialog";
import ContactLaborPage from "@/pages/contacts/ContactLaborPage";
import { SuppliersView } from "@/pages/contacts/SuppliersView";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export function ContactsSection() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [projectFilter, setProjectFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("contacts");
  const [createContactOpen, setCreateContactOpen] = useState(false);
  const [editContactOpen, setEditContactOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<any | null>(null);

  // Fetch contacts
  const { data: contacts = [], isLoading: isContactsLoading } = useQuery({
    queryKey: ['/api/contacts'],
    queryFn: () => apiRequest('/api/contacts'),
  });

  // Fetch projects
  const { data: projects = [], isLoading: isProjectsLoading } = useQuery({
    queryKey: ['/api/projects'],
    queryFn: () => apiRequest('/api/projects'),
  });

  // Filter contacts based on current filters
  const filteredContacts = contacts.filter((contact: any) => {
    const matchesSearch = contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contact.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contact.phone?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesProject = projectFilter === "all" || contact.projectId === parseInt(projectFilter);
    const matchesType = typeFilter === "all" || contact.type === typeFilter;
    
    return matchesSearch && matchesProject && matchesType;
  });

  // Calculate totals
  const totalContacts = filteredContacts.length;
  const contractors = filteredContacts.filter((contact: any) => contact.type === 'contractor').length;
  const suppliers = filteredContacts.filter((contact: any) => contact.type === 'supplier').length;
  const clients = filteredContacts.filter((contact: any) => contact.type === 'client').length;

  const getProjectName = (projectId: number) => {
    const project = projects.find((p: any) => p.id === projectId);
    return project?.name || 'Unknown Project';
  };

  const handleEditContact = (contact: any) => {
    setSelectedContact(contact);
    setEditContactOpen(true);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'contractor': return 'bg-blue-100 text-blue-800';
      case 'supplier': return 'bg-green-100 text-green-800';
      case 'client': return 'bg-purple-100 text-purple-800';
      case 'employee': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'contractor': return <Briefcase className="h-4 w-4" />;
      case 'supplier': return <Building className="h-4 w-4" />;
      case 'client': return <User className="h-4 w-4" />;
      case 'employee': return <Users className="h-4 w-4" />;
      default: return <User className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Contacts</h1>
          <p className="text-muted-foreground">
            Manage your contacts, labor, and suppliers
          </p>
        </div>
        <Button onClick={() => setCreateContactOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Contact
        </Button>
      </div>

      {/* Tabs for different sections */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="contacts">Contacts</TabsTrigger>
          <TabsTrigger value="labor">Labor Management</TabsTrigger>
          <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
        </TabsList>

        <TabsContent value="contacts" className="space-y-6">
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search contacts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={projectFilter} onValueChange={setProjectFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Projects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Projects</SelectItem>
                {projects.map((project: any) => (
                  <SelectItem key={project.id} value={project.id.toString()}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="contractor">Contractor</SelectItem>
                <SelectItem value="supplier">Supplier</SelectItem>
                <SelectItem value="client">Client</SelectItem>
                <SelectItem value="employee">Employee</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Contact Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Contacts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalContacts}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Contractors</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{contractors}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Suppliers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{suppliers}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Clients</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">{clients}</div>
              </CardContent>
            </Card>
          </div>

          {/* Contacts List */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Contacts</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredContacts.map((contact: any) => (
                <Card key={contact.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {getTypeIcon(contact.type)}
                        <CardTitle className="text-lg">{contact.name}</CardTitle>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditContact(contact)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <Badge className={getTypeColor(contact.type)}>
                      {contact.type}
                    </Badge>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {contact.email && (
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Mail className="h-4 w-4 mr-2" />
                          {contact.email}
                        </div>
                      )}
                      
                      {contact.phone && (
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Phone className="h-4 w-4 mr-2" />
                          {contact.phone}
                        </div>
                      )}
                      
                      {contact.address && (
                        <div className="flex items-center text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4 mr-2" />
                          {contact.address}
                        </div>
                      )}
                      
                      {contact.company && (
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Building className="h-4 w-4 mr-2" />
                          {contact.company}
                        </div>
                      )}
                      
                      {projectFilter === "all" && (
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Building className="h-4 w-4 mr-2" />
                          {getProjectName(contact.projectId)}
                        </div>
                      )}
                      
                      {contact.notes && (
                        <p className="text-sm text-muted-foreground mt-2">
                          {contact.notes}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredContacts.length === 0 && (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground">No contacts found</h3>
                <p className="text-muted-foreground">Try adjusting your filters or create a new contact</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="labor" className="space-y-6">
          <ContactLaborPage />
        </TabsContent>

        <TabsContent value="suppliers" className="space-y-6">
          <SuppliersView />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <CreateContactDialog 
        open={createContactOpen} 
        onOpenChange={setCreateContactOpen}
        projectId={projectFilter !== "all" ? parseInt(projectFilter) : undefined}
      />
      {selectedContact && (
        <EditContactDialog 
          open={editContactOpen} 
          onOpenChange={setEditContactOpen} 
          contact={selectedContact} 
        />
      )}
    </div>
  );
}