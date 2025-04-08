import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useLocation, Link } from "wouter";
import { 
  Construction, 
  Edit,
  ArrowLeft, 
  Phone, 
  Mail, 
  Building,
  Clock,
  Calendar,
  ChevronRight,
  Briefcase
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Labor, Contact } from "@shared/schema";
import { AddLaborFromContactDialog } from "./AddLaborFromContactDialog";
import { StatusBadge } from "@/components/ui/status-badge";
import { EditLaborDialog } from "@/pages/labor/EditLaborDialog";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { formatDate } from "@/lib/utils";

export default function ContactLaborDetailPage() {
  const { contactId, laborId } = useParams<{ contactId: string; laborId: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  
  const numericContactId = parseInt(contactId);
  const numericLaborId = parseInt(laborId);
  
  // Fetch contact details
  const { data: contact, isLoading: isLoadingContact } = useQuery<Contact>({
    queryKey: [`/api/contacts/${contactId}`],
    enabled: numericContactId > 0,
  });
  
  // Fetch labor record details
  const { data: labor, isLoading: isLoadingLabor } = useQuery<Labor>({
    queryKey: [`/api/labor/${laborId}`],
    enabled: numericLaborId > 0,
  });
  
  // Handle edit click
  const handleEditLabor = () => {
    setIsEditDialogOpen(true);
  };

  // Handle edit success
  const handleEditSuccess = () => {
    // Refresh labor data after successful edit
    queryClient.invalidateQueries({ queryKey: [`/api/labor/${laborId}`] });
    
    // Show success toast
    toast({
      title: "Labor record updated",
      description: "Labor record has been successfully updated.",
    });
  };

  // Handle delete click
  const handleDeleteLabor = () => {
    if (window.confirm(`Are you sure you want to delete this labor record?`)) {
      // We would implement delete functionality here 
      toast({
        title: "Delete Labor",
        description: "Delete functionality will be implemented soon.",
      });
    }
  };

  // Loading state
  if (isLoadingContact || isLoadingLabor) {
    return (
      <Layout>
        <div className="container mx-auto p-4 space-y-6">
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              onClick={() => navigate(`/contacts/${contactId}/labor`)}
              className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
            >
              <ArrowLeft className="mr-1 h-4 w-4" /> Back
            </Button>
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
  if (!contact || !labor) {
    return (
      <Layout>
        <div className="container mx-auto p-4 space-y-6">
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              onClick={() => navigate(`/contacts/${contactId}/labor`)}
              className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
            >
              <ArrowLeft className="mr-1 h-4 w-4" /> Back
            </Button>
          </div>
          
          <div className="text-center py-12">
            <div className="bg-red-100 text-red-800 p-4 rounded-lg inline-block mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p>Record Not Found</p>
            </div>
            <p className="text-gray-500 mb-4">The labor record you're looking for doesn't exist or has been removed.</p>
            <Button 
              onClick={() => navigate(`/contacts/${contactId}/labor`)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Return to Labor Records
            </Button>
          </div>
        </div>
      </Layout>
    );
  }
  
  // Type assertion for TypeScript
  const contactData = contact as Contact;
  const laborData = labor as Labor;

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
                <BreadcrumbLink asChild>
                  <Link href={`/contacts/${contactId}/labor`}>Labor Records</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{laborData.fullName}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        
        {/* Page header with title and action buttons */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate(`/contacts/${contactId}/labor`)}
            className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
          >
            <ArrowLeft className="mr-1 h-4 w-4" /> Back to Labor Records
          </Button>
          
          <div className="flex space-x-2">
            <Button 
              variant="outline"
              onClick={handleEditLabor}
              className="text-blue-600 border-blue-200 hover:bg-blue-50"
            >
              <Edit className="mr-1 h-4 w-4" /> Edit Record
            </Button>
          </div>
        </div>
        
        {/* Labor details card */}
        <Card className="bg-white shadow-md border-t-4 border-t-blue-500 mb-6">
          <CardHeader className="pb-2">
            <div className="flex items-center">
              <div className="h-14 w-14 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xl font-medium">
                <Briefcase className="h-7 w-7" />
              </div>
              <div className="ml-4">
                <CardTitle className="text-2xl">{laborData.fullName}</CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-gray-600">{laborData.company || "Independent"}</span>
                  <StatusBadge status={laborData.status} />
                </div>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="pt-4">
            {/* Classification section */}
            <div className="mb-6 border-b pb-4">
              <h3 className="font-medium text-gray-700 mb-3">Classification</h3>
              <div className="flex flex-wrap gap-2">
                {laborData.tier1Category && (
                  <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-sm">
                    {laborData.tier1Category}
                  </span>
                )}
                {laborData.tier2Category && (
                  <span className="px-3 py-1 rounded-full bg-purple-100 text-purple-800 text-sm">
                    {laborData.tier2Category}
                  </span>
                )}
              </div>
            </div>
            
            {/* Work details section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 mb-6 border-b pb-4">
              <div>
                <h3 className="font-medium text-gray-700 mb-3">Work Details</h3>
                <dl className="grid grid-cols-1 gap-3">
                  <div>
                    <dt className="text-sm text-gray-500">Work Date</dt>
                    <dd className="font-medium flex items-center mt-1">
                      <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                      {formatDate(laborData.workDate)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-500">Area of Work</dt>
                    <dd className="font-medium mt-1">{laborData.areaOfWork || "Not specified"}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-500">Time Period</dt>
                    <dd className="font-medium mt-1">
                      {formatDate(laborData.startDate)} - {formatDate(laborData.endDate)}
                    </dd>
                  </div>
                </dl>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-700 mb-3">Time & Productivity</h3>
                <dl className="grid grid-cols-1 gap-3">
                  <div>
                    <dt className="text-sm text-gray-500">Total Hours</dt>
                    <dd className="font-medium flex items-center mt-1 text-blue-700">
                      <Clock className="h-4 w-4 text-gray-400 mr-2" />
                      {laborData.totalHours ?? "N/A"} hrs
                    </dd>
                  </div>
                  {laborData.startTime && laborData.endTime && (
                    <div>
                      <dt className="text-sm text-gray-500">Working Hours</dt>
                      <dd className="font-medium mt-1">
                        {laborData.startTime} - {laborData.endTime}
                      </dd>
                    </div>
                  )}
                  {laborData.unitsCompleted && (
                    <div>
                      <dt className="text-sm text-gray-500">Units Completed</dt>
                      <dd className="font-medium mt-1">{laborData.unitsCompleted}</dd>
                    </div>
                  )}
                </dl>
              </div>
            </div>
            
            {/* Task description */}
            {laborData.taskDescription && (
              <div className="mb-6 border-b pb-4">
                <h3 className="font-medium text-gray-700 mb-3">Task Description</h3>
                <p className="text-gray-700 whitespace-pre-line">{laborData.taskDescription}</p>
              </div>
            )}
            
            {/* Contact information */}
            <div>
              <h3 className="font-medium text-gray-700 mb-3">Contact Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {laborData.phone && (
                  <div className="flex items-center">
                    <Phone className="text-gray-400 h-4 w-4 mr-2" />
                    <span>{laborData.phone}</span>
                  </div>
                )}
                {laborData.email && (
                  <div className="flex items-center">
                    <Mail className="text-gray-400 h-4 w-4 mr-2" />
                    <span>{laborData.email}</span>
                  </div>
                )}
                {laborData.company && (
                  <div className="flex items-center">
                    <Building className="text-gray-400 h-4 w-4 mr-2" />
                    <span>{laborData.company}</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Actions section */}
        <div className="flex justify-end space-x-2">
          <Button 
            variant="outline" 
            onClick={() => navigate(`/contacts/${contactId}/labor`)}
          >
            Cancel
          </Button>
          <Button 
            variant="destructive"
            onClick={handleDeleteLabor}
          >
            Delete Record
          </Button>
        </div>

        {/* Edit Labor Dialog */}
        {numericLaborId > 0 && (
          <EditLaborDialog
            open={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
            laborId={numericLaborId}
            onSuccess={handleEditSuccess}
          />
        )}
      </div>
    </Layout>
  );
}