import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
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
} from "lucide-react";

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

  return (
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
        <div>
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
        </div>
        
        <div className="mt-4 flex gap-2">
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
        </div>
      </CardContent>
    </Card>
  );
}

export default function ContactsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("recent");
  const { toast } = useToast();

  const { data: contacts, isLoading } = useQuery({
    queryKey: ["/api/contacts"],
  });

  // Filter contacts based on search query and type
  const filteredContacts = contacts?.filter(contact => {
    const matchesSearch = contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          contact.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (contact.company && contact.company.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesType = typeFilter === "all" || contact.type === typeFilter;
    
    return matchesSearch && matchesType;
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

  if (isLoading) {
    return (
      <Layout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold hidden md:block">Contacts</h2>
            <Button className="bg-contact hover:bg-blue-600">
              <Plus className="mr-1 h-4 w-4" />
              Add Contact
            </Button>
          </div>

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
          <Button className="bg-contact hover:bg-blue-600">
            <Plus className="mr-1 h-4 w-4" />
            Add Contact
          </Button>
        </div>

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

        {sortedContacts?.length === 0 ? (
          <div className="text-center py-12">
            <User className="mx-auto h-12 w-12 text-slate-300" />
            <h3 className="mt-4 text-lg font-medium text-slate-900">No contacts found</h3>
            <p className="mt-2 text-sm text-slate-500">Try changing your search or filters</p>
            <Button className="mt-4 bg-contact hover:bg-blue-600">
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
      </div>
    </Layout>
  );
}
