import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Plus, Construction, Calendar, Clock, Tag, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { LaborCard } from "@/components/labor/LaborCard";
import { Labor } from "@shared/schema";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AddLaborFromContactDialog } from "./AddLaborFromContactDialog";

interface ViewContactLaborDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contactId: number;
  contactName?: string;
}

export function ViewContactLaborDialog({
  open,
  onOpenChange,
  contactId,
  contactName
}: ViewContactLaborDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddLaborOpen, setIsAddLaborOpen] = useState(false);
  
  // Fetch contact details
  const { data: contact } = useQuery({
    queryKey: [`/api/contacts/${contactId}`],
    enabled: contactId > 0 && open,
  });
  
  // Fetch labor entries for this contact
  const { data: laborRecords = [], isLoading: isLoadingLabor } = useQuery<Labor[]>({
    queryKey: [`/api/contacts/${contactId}/labor`],
    enabled: contactId > 0 && open,
  });

  // Handle edit click
  const handleEditLabor = (labor: Labor | any) => {
    // We would implement edit functionality here
    toast({
      title: "Edit Labor",
      description: "Edit functionality will be implemented soon.",
    });
  };

  // Handle delete click
  const handleDeleteLabor = (laborId: number) => {
    // We would implement delete functionality here 
    toast({
      title: "Delete Labor",
      description: "Delete functionality will be implemented soon.",
    });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <div className="flex justify-between items-center">
              <DialogTitle>
                Labor Records for {contact?.name || contactName || "Contractor"}
              </DialogTitle>
              <Button
                variant="ghost"
                className="h-8 w-8 p-0 rounded-full"
                onClick={() => onOpenChange(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <DialogDescription>
              View and manage labor records for this contractor
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <Construction className="h-5 w-5 text-blue-500" />
              <span className="font-medium">
                {laborRecords.length} Labor {laborRecords.length === 1 ? "Record" : "Records"}
              </span>
            </div>
            <Button 
              onClick={() => setIsAddLaborOpen(true)} 
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="mr-1 h-4 w-4" /> Add Labor
            </Button>
          </div>
          
          <ScrollArea className="flex-1 pr-4">
            {isLoadingLabor ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700 mx-auto"></div>
                <p className="mt-4 text-lg text-muted-foreground">Loading labor records...</p>
              </div>
            ) : laborRecords.length === 0 ? (
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
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
          </ScrollArea>
          
          <DialogFooter className="pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
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
        contactId={contactId}
      />
    </>
  );
}