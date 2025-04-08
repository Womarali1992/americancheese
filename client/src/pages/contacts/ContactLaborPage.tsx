import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useLocation, Link } from "wouter";
import { 
  Construction, 
  Plus, 
  ArrowLeft, 
  Phone, 
  Mail, 
  Building,
  Clock,
  Calendar,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { LaborCard } from "@/components/labor/LaborCard";
import { Contact, Labor } from "@shared/schema";
import { AddLaborFromContactDialog } from "./AddLaborFromContactDialog";
import { StatusBadge } from "@/components/ui/status-badge";
import { EditLaborDialog } from "../labor/EditLaborDialog";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export default function ContactLaborPage() {
  const { contactId } = useParams<{ contactId: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddLaborOpen, setIsAddLaborOpen] = useState(false);
  const numericContactId = parseInt(contactId);
  
  // Fetch contact details
  const { data: contact, isLoading: isLoadingContact } = useQuery<Contact>({
    queryKey: [`/api/contacts/${contactId}`],
    enabled: numericContactId > 0,
  });
  
  // Fetch labor entries for this contact
  const { data: laborRecords = [], isLoading: isLoadingLabor } = useQuery<Labor[]>({
    queryKey: [`/api/contacts/${contactId}/labor`],
    enabled: numericContactId > 0,
  });

  // State for edit dialog
  const [editingLaborId, setEditingLaborId] = useState<number | null>(null);

  // Handle edit click
  const handleEditLabor = (labor: Labor | any) => {
    setEditingLaborId(labor.id);
  };

  // Handle delete click
  const handleDeleteLabor = (laborId: number) => {
    // We would implement delete functionality here 
    toast({
      title: "Delete Labor",
      description: "Delete functionality will be implemented soon.",
    });
  };

  // Loading state
  if (isLoadingContact || isLoadingLabor) {
    return (
      <Layout>
        <div className="container mx-auto p-4 space-y-6">
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              onClick={() => navigate("/contacts")}
              className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
            >
              <ArrowLeft className="mr-1 h-4 w-4" /> Back to Contacts
            </Button>
          </div>
          
          <div className="animate-pulse bg-gray-100 rounded-lg p-6 mb-6">
            <div className="h-7 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="flex items-center gap-4 mb-6">
              <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
              <div className="space-y-2">
                <div className="h-5 bg-gray-200 rounded w-40"></div>
                <div className="h-4 bg-gray-200 rounded w-24"></div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
            </div>
          </div>
          
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700 mx-auto"></div>
            <p className="mt-4 text-lg text-muted-foreground">Loading data...</p>
          </div>
        </div>
      </Layout>
    );
  }

  // Error state
  if (!contact) {
    return (
      <Layout>
        <div className="container mx-auto p-4 space-y-6">
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              onClick={() => navigate("/contacts")}
              className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
            >
              <ArrowLeft className="mr-1 h-4 w-4" /> Back to Contacts
            </Button>
          </div>
          
          <div className="text-center py-12">
            <div className="bg-red-100 text-red-800 p-4 rounded-lg inline-block mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p>Contact Not Found</p>
            </div>
            <p className="text-gray-500 mb-4">The contact you're looking for doesn't exist or has been removed.</p>
            <Button 
              onClick={() => navigate("/contacts")}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Return to Contacts
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  // Type assertion to help TypeScript
  const contactData = contact as Contact;
  
  return (
    <Layout>
      <div className="container mx-auto p-4 space-y-6">
        {/* Breadcrumb navigation */}
        <div className="mb-6">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/contacts">Contacts</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href={`/contacts/${contactId}`}>{contactData.name}</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Labor Records</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        
        {/* Page header with title and action buttons */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/contacts")}
            className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
          >
            <ArrowLeft className="mr-1 h-4 w-4" /> Back to Contacts
          </Button>
          
          <Button 
            onClick={() => setIsAddLaborOpen(true)} 
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="mr-1 h-4 w-4" /> Add Labor
          </Button>
        </div>
        
        {/* Contact info card */}
        <Card className="bg-white shadow-md border-l-4 border-l-blue-500 mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center">
                <div className="h-14 w-14 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xl font-medium">
                  {contactData.initials || contactData.name.charAt(0)}
                </div>
                <div className="ml-4">
                  <h1 className="text-2xl font-bold">{contactData.name}</h1>
                  <div className="flex items-center space-x-2 mt-1">
                    <p className="text-gray-600">{contactData.role}</p>
                    <StatusBadge status={contactData.type} />
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 text-sm mt-4 md:mt-0">
                {contactData.phone && (
                  <div className="flex items-center">
                    <Phone className="text-gray-400 h-4 w-4 mr-2" />
                    <span>{contactData.phone}</span>
                  </div>
                )}
                {contactData.email && (
                  <div className="flex items-center">
                    <Mail className="text-gray-400 h-4 w-4 mr-2" />
                    <span>{contactData.email}</span>
                  </div>
                )}
                {contactData.company && (
                  <div className="flex items-center">
                    <Building className="text-gray-400 h-4 w-4 mr-2" />
                    <span>{contactData.company}</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Labor records section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Construction className="h-5 w-5 text-blue-500" />
              <h2 className="text-xl font-semibold">Labor Records</h2>
              <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-sm">
                {laborRecords.length} {laborRecords.length === 1 ? 'Record' : 'Records'}
              </span>
            </div>
            {/* Additional filters or view options could go here */}
          </div>
          
          {/* Labor records grid */}
          {laborRecords.length === 0 ? (
            <div className="text-center py-8 border rounded-lg bg-gray-50">
              <Construction className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <h3 className="text-lg font-medium mb-1">No labor records found</h3>
              <p className="text-gray-500 mb-4">
                This contractor doesn't have any labor records yet.
              </p>
              <Button onClick={() => setIsAddLaborOpen(true)} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="mr-1 h-4 w-4" /> Add Labor Record
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
              {laborRecords.map((labor) => (
                <LaborCard
                  key={labor.id}
                  labor={labor}
                  onEdit={handleEditLabor}
                  onDelete={handleDeleteLabor}
                />
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Add Labor Dialog */}
      <AddLaborFromContactDialog
        open={isAddLaborOpen}
        onOpenChange={(open) => {
          setIsAddLaborOpen(open);
          // Refresh labor records when dialog closes
          if (!open) {
            queryClient.invalidateQueries({ queryKey: [`/api/contacts/${contactId}/labor`] });
          }
        }}
        contactId={numericContactId}
      />

      {/* Edit Labor Dialog */}
      {editingLaborId && (
        <EditLaborDialog
          laborId={editingLaborId}
          open={editingLaborId !== null}
          onOpenChange={(open) => {
            if (!open) {
              setEditingLaborId(null);
              queryClient.invalidateQueries({ queryKey: [`/api/contacts/${contactId}/labor`] });
            }
          }}
        />
      )}
    </Layout>
  );
}